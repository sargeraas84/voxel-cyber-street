#!/usr/bin/env node
/**
 * export-mcpack.js — builds a valid Bedrock skin-pack .mcpack from ./pack.
 * Structure (Bedrock skin pack):
 *   manifest.json   (format_version 2, type "skin_pack", uuid v4 pair)
 *   skins.json      (skin entries with localization keys)
 *   texts/en_US.lang + texts/languages.json
 *   skin-*.png      (64x64 classic layout)
 *   pack_icon.png   (128x128)
 * Output: dist/VOXEL-CYBER-STREET.mcpack (plain zip)
 *
 * Usage: node tools/export-mcpack.js [--name "Pack Name"] [--out dist]
 */
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const { createCanvas, loadImage } = require('canvas');
const { exportValidMcpack } = require('./lib/mcpack-spec');
const { buildLangs, PACK_TITLES } = require('./lib/mcpack-i18n');

const root = path.resolve(__dirname, '..');
const packDir = path.resolve(root, process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'pack');
const outDir = path.resolve(root, 'dist');
const PACK_NAME = 'VOXEL CYBER-STREET Pack';

fs.mkdirSync(outDir, { recursive: true });
if (!fs.existsSync(path.join(packDir, 'pack.json'))) {
  console.error('No pack.json found — run: node tools/build-pack.js');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(path.join(packDir, 'pack.json'), 'utf8'));

// ---------------- uuids (v4, random per export — fine for personal packs)
function uuid() {
  const b = require('crypto').randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.toString('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
const headerUuid = uuid();
const moduleUuid = uuid();

// ---------------- collect skin files
const LOC_NAME = 'VoxelCyberStreet';   // serialize_name + localization_name (no spaces)
const skins = manifest.skins.map(s => s.file);   // e.g. skins/skin-01-....png
const skinNames = manifest.skins.map(s =>
  s.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase());

// display metadata for the shared localization builder
const skinsMeta = manifest.skins.map((s, i) => ({
  localizationName: skinNames[i],
  title: { accent: s.accent, hair: s.hair, fit: s.fit },
}));

// ---------------- skins.json (per learn.microsoft.com packagingaskinpack)
// top level: serialize_name + localization_name; per skin: localization_name,
// geometry (custom=Steve, customSlim=Alex), texture (file at pack root), type.
const skinsJson = {
  serialize_name: LOC_NAME,
  localization_name: LOC_NAME,
  skins: manifest.skins.map((s, i) => ({
    localization_name: skinNames[i],
    geometry: i % 2 === 0 ? 'geometry.humanoid.custom' : 'geometry.humanoid.customSlim',
    texture: path.basename(s.file),
    type: 'free',
  })),
};
// ---------------- localization (en_US, de_DE, fr_FR, ja_JP — shared builder)
const langBodies = buildLangs({ locName: LOC_NAME, packTitles: PACK_TITLES, skins: skinsMeta });

// ---------------- pack_icon.png (128x128 from skin #1, upscaled nearest)
async function makeIcon() {
  const src = await loadImage(path.join(packDir, manifest.skins[0].file));
  const c = createCanvas(128, 128);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  // fill dark bg then draw the face region upscaled (head front is at 8,8 8x8)
  ctx.fillStyle = '#1f2023'; ctx.fillRect(0, 0, 128, 128);
  ctx.drawImage(src, 8, 8, 8, 8, 16, 16, 96, 96);
  return c.toBuffer('image/png');
}

// ---------------- zip writer (store-only, no deps)
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  return (crc ^ -1) >>> 0;
}
function buildZip(files) {
  const chunks = [], central = [];
  let offset = 0;
  for (const f of files) {
    const nameBuf = Buffer.from(f.name, 'utf8');
    const data = f.data;
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);          // version needed
    local.writeUInt16LE(0x0800, 6);      // UTF-8 flag
    local.writeUInt16LE(0, 8);           // method: store
    local.writeUInt16LE(0, 10); local.writeUInt16LE(0, 12); // time/date
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nameBuf, data);
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0x0800, 8); cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(0, 12); cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(data.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt32LE(offset, 42);
    central.push(Buffer.concat([cd, nameBuf]));
    offset += local.length + nameBuf.length + data.length;
  }
  const cdBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cdBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, cdBuf, end]);
}

(async () => {
  const files = [];
  // manifest.json
  files.push({
    name: 'manifest.json',
    data: Buffer.from(JSON.stringify({
      format_version: 2,
      header: {
        name: 'pack.name',   // localized via skinpack.<locName> in texts/*.lang (per the doc)
        description: '12 procedural cyber-street skins — neon pink/cyan, messy white hair, tech mask, high-tops.',
        uuid: headerUuid,
        version: [1, 0, 0],
        min_engine_version: [1, 16, 0],
      },
      modules: [{ type: 'skin_pack', uuid: moduleUuid, version: [1, 0, 0] }],
    }, null, 2), 'utf8'),
  });
  // skins.json
  files.push({ name: 'skins.json', data: Buffer.from(JSON.stringify(skinsJson, null, 2), 'utf8') });
  // texts — one .lang per supported language + languages.json
  for (const [code, body] of Object.entries(langBodies))
    files.push({ name: `texts/${code}.lang`, data: Buffer.from(body, 'utf8') });
  files.push({ name: 'texts/languages.json', data: Buffer.from(JSON.stringify(Object.keys(langBodies)), 'utf8') });
  // skins (flatten to pack root)
  for (let i = 0; i < manifest.skins.length; i++) {
    const buf = fs.readFileSync(path.join(packDir, manifest.skins[i].file));
    // PNG must be 64x64+; ours are 64x64 — Bedrock accepts classic 64x64 skins
    files.push({ name: path.basename(manifest.skins[i].file), data: buf });
  }
  // icon
  files.push({ name: 'pack_icon.png', data: await makeIcon() });

  // write + validate the written bytes against the Microsoft spec (throws on deviation)
  const out = path.join(outDir, 'VOXEL-CYBER-STREET.mcpack');
  exportValidMcpack(buildZip(files), out, { locName: LOC_NAME });
  console.log(`Wrote ${out} (${(fs.statSync(out).size / 1024).toFixed(1)} KB, ${files.length} entries)`);
  console.log('Skins:', manifest.skins.length, '| manifest uuid:', headerUuid);
})();
