#!/usr/bin/env node
/**
 * build-pack.js — generates a themed cyber-street skin pack:
 *   <outDir>/skins/*.png  (36 skins + 36 capes, glow baked in at 85%)
 *   <outDir>/pack.json    (manifest describing every variant)
 * Layout matches gallery.html exactly (within a theme):
 *   accent = <theme accents>[i % n], hair = [i % 6], fit = [i % 6], seed = seedBase+i
 *
 * Usage: node tools/build-pack.js [outDir=pack] [--theme core|heritage]
 */
const path = require('path');
const fs = require('fs');
const { createCanvas } = require('canvas');

const root = path.resolve(__dirname, '..');
const core = require(path.join(root, 'skin-gen-core.js'));

// theme selection: --theme heritage (default: core — byte-identical pack #1)
const themeArgIdx = process.argv.indexOf('--theme');
const themeKey = themeArgIdx >= 0 ? process.argv[themeArgIdx + 1] : 'core';
const theme = core.THEMES[themeKey];
if (!theme) {
  console.error('unknown theme: ' + themeKey + ' (valid: ' + Object.keys(core.THEMES).join(', ') + ')');
  process.exit(1);
}
const { accents: ACCENTS, hairs: HAIRS, fits: FITS } = theme;

const outDir = path.resolve(process.argv[2] || path.join(root, 'pack'));
const skinsDir = path.join(outDir, 'skins');
fs.mkdirSync(skinsDir, { recursive: true });

// browser-like canvas factory for createSkin
const env = { createCanvas: (w, h) => createCanvas(w, h) };

const entries = [];
const N = 36;
for (let i = 0; i < N; i++) {
  const accent = Object.keys(ACCENTS)[i % Object.keys(ACCENTS).length];
  const hair   = Object.keys(HAIRS)[i % Object.keys(HAIRS).length];
  const fit    = FITS[i % FITS.length];
  const seed   = theme.seedBase + i;
  const name   = `skin-${String(i + 1).padStart(2, '0')}-${accent}-${hair}-${fit}`;

  const { canvas, glowCanvas, capeCanvas, capeGlowCanvas, desc } =
    core.createSkin({ theme: themeKey, accent, hair, fit, seed, cape: true }, env);

  // bake glow (85%) so the PNG reads in vanilla Minecraft
  const ctx = canvas.getContext('2d');
  ctx.globalAlpha = 0.85;
  ctx.drawImage(glowCanvas, 0, 0);
  ctx.globalAlpha = 1;
  const cctx = capeCanvas.getContext('2d');
  cctx.globalAlpha = 0.85;
  cctx.drawImage(capeGlowCanvas, 0, 0);
  cctx.globalAlpha = 1;

  const file = path.join(skinsDir, `${name}.png`);
  fs.writeFileSync(file, canvas.toBuffer('image/png'));
  const capeFile = path.join(skinsDir, `${name}-cape.png`);
  fs.writeFileSync(capeFile, capeCanvas.toBuffer('image/png'));

  entries.push({
    id: i + 1,
    name,
    accent, hair, fit, seed,
    desc: `${accent} / ${hair} / ${fit}`,
    file: path.relative(outDir, file).replace(/\\/g, '/'),
    cape: path.relative(outDir, capeFile).replace(/\\/g, '/'),
  });
  console.log(`  ✓ ${name}.png (+cape)  (seed ${seed})`);
}

const manifest = {
  pack: theme.packId,
  theme: themeKey,
  version: '2.1.0',
  generator: 'skin-gen-core.js (procedural, seed-stable)',
  size: '64x64 classic (base+overlay in one canvas) + 64x32 cape',
  count: entries.length,
  skins: entries,
};
fs.writeFileSync(path.join(outDir, 'pack.json'), JSON.stringify(manifest, null, 2));
console.log(`\nWrote ${entries.length} skins + pack.json to ${outDir}`);
