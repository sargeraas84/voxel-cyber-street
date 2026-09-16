#!/usr/bin/env node
/**
 * build-starter-pack.js — 5-skin starter bundle for smaller Marketplace slots.
 * Deterministic curated picks from the same generator; ships its own
 * Bedrock .mcpack, cover, and 512×512 store icons.
 *
 * Usage: node tools/build-starter-pack.js
 */
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const core = require(path.join(__dirname, '..', 'skin-gen-core.js'));
const { paintBust, paintCharacter, glowSpot } = require('./blocky-painter');
const { canvasToPng } = require('./canvas-io');
const { makeZip } = require('./lib/zip');
const { exportValidMcpack } = require('./lib/mcpack-spec');
const { buildLangs, STARTER_TITLES } = require('./lib/mcpack-i18n');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'starter-pack');
const distDir = path.join(root, 'dist');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(distDir, { recursive: true });
const env = { createCanvas: (w, h) => createCanvas(w, h) };

// curated 5: hero pink first, then a spread across accents/hair/fits
const PICKS = [
  { accent: 'pink-cyan',   hair: 'white-messy',   fit: 'bomber',       seed: 42 },
  { accent: 'cyan-pink',   hair: 'ice-blue',      fit: 'kimono-tech',  seed: 77 },
  { accent: 'lime-cyan',   hair: 'platinum-pink', fit: 'longline',     seed: 13 },
  { accent: 'orange-cyan', hair: 'smoke-teal',    fit: 'bomber-hood',  seed: 5 },
  { accent: 'gold-cyan',   hair: 'white-messy',   fit: 'tech-hood',    seed: 99 },
];

(async () => {
  const files = [];
  const manifest = [];

  for (let i = 0; i < PICKS.length; i++) {
    const cfg = { ...PICKS[i], index: i + 1, cape: true };
    const { canvas: skinCv, glowCanvas, capeCanvas, desc } = core.createSkin(cfg, env);
    const slug = `starter_${i + 1}_${cfg.accent}`;
    files.push({ name: `skin_${i + 1}.png`, data: canvasToPng(skinCv) });
    files.push({ name: `cape_${i + 1}.png`, data: canvasToPng(capeCanvas) });
    fs.writeFileSync(path.join(outDir, `skin_${i + 1}_${cfg.accent}.png`), canvasToPng(skinCv));
    fs.writeFileSync(path.join(outDir, `cape_${i + 1}_${cfg.accent}.png`), canvasToPng(capeCanvas));
    manifest.push({ id: slug, index: i + 1, ...cfg, skin: `skin_${i + 1}.png`, cape: `cape_${i + 1}.png` });
  }

  fs.writeFileSync(path.join(outDir, 'pack.json'),
    JSON.stringify({ pack: 'starter', count: PICKS.length, skins: manifest }, null, 2));

  // ---------- Bedrock .mcpack (per learn.microsoft.com packagingaskinpack)
  const LOC_NAME = 'VoxelCyberStreetStarter';
  const langBodies = buildLangs({
    locName: LOC_NAME,
    packTitles: STARTER_TITLES,
    skins: manifest.map(m => ({ localizationName: m.id, title: { accent: m.accent, hair: m.hair, fit: m.fit } })),
  });
  const mcpack = [];
  mcpack.push({ name: 'manifest.json', data: Buffer.from(JSON.stringify({
    format_version: 1,
    header: {
      name: 'pack.name',   // localized via skinpack.<locName> in texts/*.lang (per the doc)
      description: '5-skin starter bundle: cyber-street skins with glowing tech capes.',
      uuid: 'e6a9c3f2-7b14-4c8e-9a2d-3f5b1c6d8e01',
      version: [1, 0, 0],
      min_engine_version: [1, 20, 0],
    },
    modules: [{ type: 'skin_pack', uuid: 'b8d4f2a6-3c19-4e57-8b0e-2a7d9c4f6e12', version: [1, 0, 0] }],
  }, null, 2)) });
  mcpack.push({ name: 'skins.json', data: Buffer.from(JSON.stringify({
    serialize_name: LOC_NAME,
    localization_name: LOC_NAME,
    skins: manifest.map(m => ({
      localization_name: m.id,
      geometry: m.index % 2 === 1 ? 'geometry.humanoid.custom' : 'geometry.humanoid.customSlim',
      texture: m.skin,
      type: 'free',
    })),
  }, null, 2)) });
  for (const [code, body] of Object.entries(langBodies))
    mcpack.push({ name: `texts/${code}.lang`, data: Buffer.from(body, 'utf8') });
  mcpack.push({ name: 'texts/languages.json', data: Buffer.from(JSON.stringify(Object.keys(langBodies)), 'utf8') });

  // pack icon: bust of skin #1
  const first = await loadImage(files[0].data);
  const glow1 = await loadImage(files[1].data);   // cape png sits at index 1
  const iconCv = createCanvas(128, 128);
  const ictx = iconCv.getContext('2d');
  ictx.fillStyle = '#26282f'; ictx.fillRect(0, 0, 128, 128);
  paintBust(ictx, first, glow1, 64, 58, 7, { glowPass: true });
  const iconPng = canvasToPng(iconCv);
  mcpack.push({ name: 'pack_icon.png', data: iconPng });
  // skins only — the spec gives skin packs no way to reference capes, so cape
  // PNGs stay out of the .mcpack (they live in starter-pack/ and the Fabric mod)
  for (const f of files) if (!f.name.startsWith('cape_')) mcpack.push({ name: f.name, data: f.data });

  const zip = makeZip(mcpack);
  const mcpackPath = path.join(distDir, 'VOXEL-CYBER-STREET-STARTER.mcpack');
  exportValidMcpack(zip, mcpackPath, { locName: LOC_NAME });

  // ---------- cover 1280×720
  const cv = createCanvas(1280, 720);
  const ctx = cv.getContext('2d');
  const bg = ctx.createLinearGradient(0, 0, 0, 720);
  bg.addColorStop(0, '#1b1c22'); bg.addColorStop(1, '#111216');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1280, 720);
  glowSpot(ctx, 640, 620, 560, 'rgba(255,45,149,0.14)');
  glowSpot(ctx, 180, 120, 320, 'rgba(25,227,255,0.10)');
  glowSpot(ctx, 1100, 140, 320, 'rgba(255,45,149,0.10)');

  const skins = [], capes = [], glows = [];
  for (const f of files) {
    if (f.name.startsWith('skin_')) skins.push(await loadImage(f.data));
    else capes.push(await loadImage(f.data));
  }
  for (let i = 0; i < PICKS.length; i++) {
    const { glowCanvas } = core.createSkin({ ...PICKS[i], index: i + 1, cape: true }, env);
    glows.push(glowCanvas);
  }
  // hero center, two flankers
  paintCharacter(ctx, skins[0], glows[0], capes[0], 640, 640, 21, 0.4, { glowPass: true });
  paintCharacter(ctx, skins[1], glows[1], capes[1], 330, 620, 13, 1.1, { glowPass: false });
  paintCharacter(ctx, skins[2], glows[2], capes[2], 950, 620, 13, 2.0, { glowPass: false });

  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.font = '700 64px Segoe UI, Arial';
  ctx.fillStyle = '#f2f4f8';
  ctx.fillText('VOXEL CYBER-STREET', 60, 52);
  ctx.font = '600 28px Segoe UI, Arial';
  ctx.fillStyle = '#19e3ff';
  ctx.fillText('STARTER PACK · 5 SKINS + GLOWING CAPES', 62, 126);
  const ug = ctx.createLinearGradient(60, 0, 620, 0);
  ug.addColorStop(0, '#ff2d95'); ug.addColorStop(1, '#19e3ff');
  ctx.fillStyle = ug; ctx.fillRect(60, 168, 560, 8);

  const coverPath = path.join(outDir, 'starter-cover-1280x720.png');
  fs.writeFileSync(coverPath, canvasToPng(cv));
  console.log(`cover   → ${coverPath}`);

  // ---------- 512×512 icons
  const iconDir = path.join(outDir, 'icons');
  fs.mkdirSync(iconDir, { recursive: true });
  for (let i = 0; i < PICKS.length; i++) {
    const cfg = { ...PICKS[i], index: i + 1 };
    const acc = core.ACCENTS[cfg.accent];
    const icv = createCanvas(512, 512);
    const x = icv.getContext('2d');
    const bgr = x.createRadialGradient(256, 215, 40, 256, 256, 384);
    bgr.addColorStop(0, '#26282f'); bgr.addColorStop(1, '#131418');
    x.fillStyle = bgr; x.fillRect(0, 0, 512, 512);
    glowSpot(x, 256, 154, 300, acc.a + '22');
    paintBust(x, skins[i], glows[i], 256, 215, 30, { glowPass: true });
    const g = x.createLinearGradient(0, 0, 512, 0);
    g.addColorStop(0, acc.a); g.addColorStop(1, acc.b);
    x.fillStyle = g; x.globalAlpha = 0.9; x.fillRect(0, 502, 512, 10); x.globalAlpha = 1;
    x.fillStyle = 'rgba(10,11,14,0.72)'; x.fillRect(0, 426, 512, 76);
    x.textBaseline = 'top'; x.textAlign = 'left';
    x.font = '700 30px Segoe UI, Arial'; x.fillStyle = '#f2f4f8';
    x.fillText(`#${i + 1} ${cfg.accent}`, 24, 434);
    x.font = '500 20px Segoe UI, Arial'; x.fillStyle = '#9aa0aa';
    x.fillText(`${cfg.hair} · ${cfg.fit} · seed ${cfg.seed}`, 24, 468);
    fs.writeFileSync(path.join(iconDir, `starter-icon-${i + 1}.png`), canvasToPng(icv));
  }
  console.log(`icons   → ${iconDir}/starter-icon-1..5.png`);
  console.log(`skins   → ${outDir}/skin_*.png + cape_*.png + pack.json`);
})().catch(e => { console.error(e); process.exit(1); });
