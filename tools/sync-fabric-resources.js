#!/usr/bin/env node
/**
 * sync-fabric-resources.js — copies the generated pack (pack/pack.json) into
 * the Fabric gradle tree (tools/fabric-mod/src/main/resources) so both editions
 * share ONE metadata source:
 *   assets/voxelcyberstreet/skins.json   Bedrock skin-pack format (+ accent/hair/fit)
 *   assets/voxelcyberstreet/textures.json  Fabric sidecar (namespaced ids, glow, cape, npcRole)
 *   assets/voxelcyberstreet/skins/*.png    36 skins
 *   assets/voxelcyberstreet/capes/*.png    36 glowing capes
 *   assets/voxelcyberstreet/texts/*.lang   en_US, de_DE, fr_FR, ja_JP
 *   fabric.mod.json + voxelcyberstreet.mixins.json  (client entrypoint + mixins)
 *
 * Run after every `npm run pack`, then `npm run fabric:compile` rebuilds the jar.
 *
 * Usage: node tools/sync-fabric-resources.js
 */
const path = require('path');
const fs = require('fs');
const core = require(path.join(__dirname, '..', 'skin-gen-core.js'));
const { buildLangs, PACK_TITLES } = require('./lib/mcpack-i18n');

const root = path.resolve(__dirname, '..');
const packMeta = JSON.parse(fs.readFileSync(path.join(root, 'pack', 'pack.json'), 'utf8'));
const resDir = path.join(__dirname, 'fabric-mod', 'src', 'main', 'resources');
const nsDir = path.join(resDir, 'assets', 'voxelcyberstreet');

const MOD_ID = 'voxelcyberstreet';
const LOC = 'VoxelCyberStreet';
const ACC = Object.keys(core.ACCENTS), HAIR = Object.keys(core.HAIRS), FIT = core.FITS;

// wipe only the dirs THIS script manages (stale skins from renamed packs would
// otherwise ship forever) — hand-authored files elsewhere in the namespace survive
for (const d of ['skins', 'capes', 'texts'])
  fs.rmSync(path.join(nsDir, d), { recursive: true, force: true });
fs.mkdirSync(path.join(nsDir, 'skins'), { recursive: true });
fs.mkdirSync(path.join(nsDir, 'capes'), { recursive: true });
fs.mkdirSync(path.join(nsDir, 'texts'), { recursive: true });

// ---------- textures — Fabric file names EQUAL the Bedrock `texture` values so the
// Bedrock skins.json ships verbatim and both editions resolve the same file names
const skins = [];
for (const s of packMeta.skins) {
  const i = s.id; // 1..36
  const tex = path.basename(s.file);            // skin-01-pink-cyan-....png
  const cape = path.basename(s.cape);           // skin-01-pink-cyan-...-cape.png
  const base = tex.replace(/\.png$/, '');
  fs.copyFileSync(path.join(root, 'pack', s.file), path.join(nsDir, 'skins', tex));
  fs.copyFileSync(path.join(root, 'pack', s.cape), path.join(nsDir, 'capes', cape));
  skins.push({
    tex, cape, base,
    loc: s.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase(),   // Bedrock localization_name
    accent: s.accent, hair: s.hair, fit: s.fit, seed: s.seed, index: i,
  });
}

// ---------- skins.json — VERBATIM Bedrock format (byte-identical with the .mcpack's)
fs.writeFileSync(path.join(nsDir, 'skins.json'), JSON.stringify({
  serialize_name: LOC,
  localization_name: LOC,
  skins: skins.map((s, idx) => ({
    localization_name: s.loc,
    geometry: idx % 2 === 0 ? 'geometry.humanoid.custom' : 'geometry.humanoid.customSlim',
    texture: s.tex,
    type: 'free',
  })),
}, null, 2));

// ---------- Fabric sidecar: Bedrock texture name → namespaced ids + metadata
// (accent/hair/fit/seed/npcRole live HERE, never inside skins.json — that file must
// stay byte-identical with the Bedrock pack)
fs.writeFileSync(path.join(nsDir, 'textures.json'), JSON.stringify({
  textures: skins.map(s => ({
    texture: s.tex,
    skin: `voxelcyberstreet:skins/${s.base}`,
    glow: `voxelcyberstreet:skins/${s.base}_glow`,
    cape: `voxelcyberstreet:capes/${s.cape.replace(/\.png$/, '')}`,
    accent: s.accent, hair: s.hair, fit: s.fit, seed: s.seed,
    npcRole: s.index % 2 === 0 ? 'corrupted' : 'roaming',
  })),
}, null, 2));

// ---------- localized texts (identical builder + identical keys as the .mcpacks)
const langBodies = buildLangs({
  locName: LOC,
  packTitles: PACK_TITLES,
  skins: skins.map(s => ({ localizationName: s.loc, title: { accent: s.accent, hair: s.hair, fit: s.fit } })),
});
for (const [code, body] of Object.entries(langBodies))
  fs.writeFileSync(path.join(nsDir, 'texts', `${code}.lang`), body, 'utf8');
fs.writeFileSync(path.join(nsDir, 'texts', 'languages.json'), JSON.stringify(Object.keys(langBodies)));

// ---------- glow layer variants (baked-85% style like the web sheets)
// Fabric renders these as a separate emissive pass at runtime, so ship raw glow.
const { createCanvas } = require('canvas');
const env = { createCanvas: (w, h) => createCanvas(w, h) };
for (const s of skins) {
  const { glowCanvas } = core.createSkin(
    { index: s.index, accent: s.accent, hair: s.hair, fit: s.fit, seed: s.seed, cape: true }, env);
  fs.writeFileSync(path.join(nsDir, 'skins', `${s.base}_glow.png`), glowCanvas.toBuffer('image/png'));
}

// ---------- report
const pngs = [...listPNG(path.join(nsDir, 'skins')), ...listPNG(path.join(nsDir, 'capes'))].length;
console.log(`synced → tools/fabric-mod/src/main/resources/assets/${MOD_ID}/`);
console.log(`  skins.json (Bedrock) + textures.json sidecar | ${skins.length} skins + ${pngs} PNGs`);
console.log(`  texts: ${Object.keys(langBodies).join(', ')}`);

function* listPNG(dir) {
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.png')) yield path.join(dir, f);
}
