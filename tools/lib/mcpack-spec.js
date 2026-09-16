'use strict';
/**
 * mcpack-spec.js — validates Bedrock skin packs against the official spec:
 * learn.microsoft.com/en-us/minecraft/creator/documents/packagingaskinpack
 *
 * Two entry points:
 *   validatePackFiles(files, opts)  — in-memory [{name,data}] BEFORE zipping
 *   validateMcpack(zipBuf, opts)    — a finished .mcpack buffer AFTER zipping
 * Both throw an Error listing EVERY deviation (not just the first) so a build
 * fails loudly. exportValidMcpack() wraps write+validate for exporters.
 */
const fs = require('fs');
const path = require('path');

const GEO_STEVE = 'geometry.humanoid.custom';
const GEO_ALEX = 'geometry.humanoid.customSlim';
const GEOMETRIES = [GEO_STEVE, GEO_ALEX];
const LANG_CODE = /^[a-z]{2,3}_[A-Z]{2}$/;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

function isPng(data) {
  return Buffer.isBuffer(data) && data.length > 8 && data.compare(PNG_SIG, 0, 4, 0, 4) === 0;
}

function parseJson(name, data, errs) {
  try { return JSON.parse(Buffer.from(data).toString('utf8')); }
  catch (e) { errs.push(`${name}: not valid JSON (${e.message})`); return null; }
}

/** Parse a .lang body into { key: value } — ignores # comments and blank lines. */
function parseLang(data) {
  const map = {};
  for (const raw of Buffer.from(data).toString('utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq > 0) map[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return map;
}

/**
 * Validate the in-memory file set of a skin pack.
 * files: [{ name: 'manifest.json', data: Buffer }] (same shape as the zip writers take)
 * opts:  { locName } — expected serialize_name/localization_name (optional but checked when given)
 */
function validatePackFiles(files, opts = {}) {
  const errs = [];
  const byName = new Map();
  for (const f of files) {
    if (byName.has(f.name)) errs.push(`duplicate zip entry: ${f.name}`);
    byName.set(f.name, f.data);
  }
  const get = n => byName.get(n);

  // ---- manifest.json (doc template: format_version 1, header.name "pack.name", skin_pack module)
  const manifest = get('manifest.json')
    ? parseJson('manifest.json', get('manifest.json'), errs) : (errs.push('missing manifest.json'), null);
  if (manifest) {
    const h = manifest.header || {};
    if (h.name !== 'pack.name')
      errs.push(`manifest.header.name must be "pack.name" (localized via texts) — got "${h.name}"`);
    if (!UUID_V4.test(String(h.uuid || '')))
      errs.push(`manifest.header.uuid is not a v4 UUID: "${h.uuid}"`);
    const mods = Array.isArray(manifest.modules) ? manifest.modules : [];
    if (mods.length !== 1) errs.push('manifest.modules must contain exactly one module');
    else {
      if (mods[0].type !== 'skin_pack') errs.push(`manifest module type must be "skin_pack" — got "${mods[0].type}"`);
      if (!UUID_V4.test(String(mods[0].uuid || ''))) errs.push(`manifest module uuid is not a v4 UUID: "${mods[0].uuid}"`);
      if (String(mods[0].uuid) === String(h.uuid)) errs.push('header.uuid and module uuid must be two DIFFERENT UUIDs (per the doc)');
    }
    if (!Array.isArray(h.version) || h.version.length !== 3) errs.push('manifest.header.version must be [major, minor, patch]');
  }

  // ---- skins.json (doc: serialize_name + localization_name + skins[])
  const skinsJson = get('skins.json')
    ? parseJson('skins.json', get('skins.json'), errs) : (errs.push('missing skins.json'), null);
  let skins = [];
  let locName = null;
  if (skinsJson) {
    locName = skinsJson.localization_name;
    if (!locName) errs.push('skins.json: missing localization_name');
    if (skinsJson.serialize_name !== locName)
      errs.push(`skins.json: serialize_name ("${skinsJson.serialize_name}") and localization_name ("${locName}") must be equal`);
    if (opts.locName && locName !== opts.locName)
      errs.push(`skins.json: localization_name is "${locName}", expected "${opts.locName}"`);
    skins = Array.isArray(skinsJson.skins) ? skinsJson.skins : (errs.push('skins.json: missing "skins" array'), []);
    if (skins.length === 0) errs.push('skins.json: "skins" array is empty');
    const seenLoc = new Set();
    skins.forEach((s, i) => {
      const label = `skins.json skins[${i}]`;
      const ln = s.localization_name;
      if (!ln) errs.push(`${label}: missing localization_name`);
      else if (seenLoc.has(ln)) errs.push(`${label}: duplicate localization_name "${ln}"`);
      else seenLoc.add(ln);
      if (!GEOMETRIES.includes(s.geometry))
        errs.push(`${label}: geometry must be "${GEO_STEVE}" or "${GEO_ALEX}" — got "${s.geometry}"`);
      if (!s.texture) errs.push(`${label}: missing texture`);
      if (s.type !== 'free' && s.type !== 'paid')
        errs.push(`${label}: type must be "free" or "paid" — got "${s.type}"`);
    });
  }

  // ---- textures live at the ROOT of the pack and every referenced file must exist
  const rootPngs = [...byName.keys()].filter(n => !n.includes('/') && n.endsWith('.png'));
  if (skinsJson) {
    for (let i = 0; i < skins.length; i++) {
      const tex = skins[i].texture;
      if (!tex) continue;
      if (tex.includes('/')) errs.push(`skins[${i}].texture "${tex}" must be a root-level file name (no folders)`);
      if (!get(tex)) errs.push(`skins[${i}].texture "${tex}" is not present in the pack`);
      else if (!isPng(get(tex))) errs.push(`skins[${i}].texture "${tex}" is not a PNG`);
    }
  }
  // stray skins that exist but are never referenced
  const referenced = new Set((skinsJson ? skins : []).map(s => s.texture).filter(Boolean));
  const loose = rootPngs.filter(n => n !== 'pack_icon.png' && !referenced.has(n));
  if (loose.length) errs.push(`unreferenced root PNGs (add to skins.json or remove): ${loose.join(', ')}`);

  // ---- texts folder: languages.json + one .lang per listed language
  const languages = get('texts/languages.json')
    ? parseJson('texts/languages.json', get('texts/languages.json'), errs)
    : (errs.push('missing texts/languages.json'), null);
  const langCodes = [];
  if (Array.isArray(languages)) {
    if (languages.length === 0) errs.push('texts/languages.json is empty');
    for (const l of languages) {
      if (!LANG_CODE.test(String(l))) errs.push(`texts/languages.json: "${l}" is not a language code (ll_CC)`);
      else langCodes.push(String(l));
    }
  }
  for (const code of langCodes) {
    if (!get(`texts/${code}.lang`)) errs.push(`texts/languages.json lists "${code}" but texts/${code}.lang is missing`);
  }
  if (langCodes.length && !langCodes.includes('en_US'))
    errs.push('texts/languages.json must include en_US (the fallback language)');

  // ---- every .lang file: skinpack.<locName>= and skin.<locName>.<skin>= for each skin
  if (skinsJson && locName) {
    const langFiles = [...byName.keys()].filter(n => n.startsWith('texts/') && n.endsWith('.lang'));
    if (langFiles.length === 0) errs.push('no texts/*.lang files present');
    for (const lf of langFiles) {
      const map = parseLang(get(lf));
      const packKey = `skinpack.${locName}`;
      if (!(packKey in map)) errs.push(`${lf}: missing pack title key "${packKey}=<Pack Name>"`);
      else if (!map[packKey]) errs.push(`${lf}: "${packKey}" has an empty value`);
      for (let i = 0; i < skins.length; i++) {
        const ln = skins[i].localization_name;
        if (!ln) continue;
        const key = `skin.${locName}.${ln}`;
        if (!(key in map)) errs.push(`${lf}: missing skin name key "${key}=<name>"`);
        else if (!map[key]) errs.push(`${lf}: "${key}" has an empty value`);
      }
      const expectedSkinKeys = skins.length + 1;
      const actualSkinKeys = Object.keys(map).filter(k => k.startsWith(`skin.${locName}.`) || k === packKey).length;
      if (actualSkinKeys !== expectedSkinKeys)
        errs.push(`${lf}: expected ${expectedSkinKeys} ${locName} keys, found ${actualSkinKeys} (stale or extra keys?)`);
    }
  }

  // ---- pack icon
  if (!get('pack_icon.png')) errs.push('missing pack_icon.png');
  else if (!isPng(get('pack_icon.png'))) errs.push('pack_icon.png is not a PNG');

  if (errs.length) {
    const err = new Error(
      `Bedrock skin pack FAILS the Microsoft spec (${errs.length} deviation${errs.length > 1 ? 's' : ''}):\n` +
      errs.map(e => `  ✗ ${e}`).join('\n'));
    err.violations = errs;
    throw err;
  }
  return { skins: skins.length, languages: langCodes, files: files.length };
}

/**
 * Parse a store-only zip (what our exporters emit) into [{name, data}] by
 * walking the central directory. Throws on deflated entries — our writers
 * never produce them, so that's a build bug worth failing on.
 */
function parseStoreZip(buf) {
  // find EOCD
  let eocd = -1;
  const floor = Math.max(0, buf.length - 66000);
  for (let i = buf.length - 22; i >= floor; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip: end-of-central-directory not found');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = [];
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`corrupt central directory at entry ${i}`);
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    if (method !== 0) throw new Error(`entry "${name}" is deflated — validator only handles our store-only zips`);
    const lnLen = buf.readUInt16LE(localOff + 26);
    const leLen = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lnLen + leLen;
    files.push({ name, data: buf.subarray(dataStart, dataStart + csize) });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

/** Validate a finished .mcpack buffer (parse + spec check). */
function validateMcpack(zipBuf, opts) {
  return validatePackFiles(parseStoreZip(zipBuf), opts);
}

/**
 * Write a .mcpack and verify the WRITTEN BYTES against the spec.
 * Throws (exit non-zero) on any deviation — use in exporters right before logging success.
 */
function exportValidMcpack(zipBuf, outPath, opts) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, zipBuf);
  const info = validateMcpack(zipBuf, opts);
  console.log(`spec check ✓ Microsoft skin-pack spec compliant — ${info.skins} skins, languages: ${info.languages.join(', ')}`);
  return info;
}

module.exports = { validatePackFiles, validateMcpack, exportValidMcpack, parseStoreZip, GEOMETRIES, GEO_STEVE, GEO_ALEX };
