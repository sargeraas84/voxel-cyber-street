#!/usr/bin/env node
/**
 * generate-skin.js — writes a 64x64 skin PNG (+ optional 64x32 cape) using the shared core.
 *
 * Usage:
 *   node tools/generate-skin.js [out.png]
 *   node tools/generate-skin.js out.png --accent=violet-pink --hair=ice-blue --fit=longline --seed=42 --cape
 */
const path = require('path');
const fs = require('fs');
const { createCanvas } = require('canvas');

const root = path.resolve(__dirname, '..');
const core = require(path.join(root, 'skin-gen-core.js'));

const args = process.argv.slice(2);
const outFile = args.find(a => !a.startsWith('--')) || 'cyber-teen-skin.png';
const opt = {};
for (const a of args) {
  const m = a.match(/^--(accent|hair|fit|seed)=(.+)$/);
  if (m) opt[m[1]] = m[2];
  if (a === '--cape') opt.cape = true;
}
if (opt.seed !== undefined) opt.seed = parseInt(opt.seed, 10) >>> 0;

const env = { createCanvas: (w, h) => createCanvas(w, h) };
const { canvas, glowCanvas, capeCanvas, capeGlowCanvas, desc } = core.createSkin(opt, env);

// bake glow (85%) so the file reads in vanilla Minecraft
const ctx = canvas.getContext('2d');
ctx.globalAlpha = 0.85;
ctx.drawImage(glowCanvas, 0, 0);
ctx.globalAlpha = 1;

const out = path.resolve(outFile);
fs.writeFileSync(out, canvas.toBuffer('image/png'));
console.log(`wrote ${out} (64x64) accent=${desc.accent} hair=${desc.hair} fit=${desc.fit} seed=${desc.seed}`);

if (opt.cape && capeCanvas) {
  const cctx = capeCanvas.getContext('2d');
  cctx.globalAlpha = 0.85;
  cctx.drawImage(capeGlowCanvas, 0, 0);
  cctx.globalAlpha = 1;
  const capeOut = out.replace(/\.png$/, '-cape.png');
  fs.writeFileSync(capeOut, capeCanvas.toBuffer('image/png'));
  console.log(`wrote ${capeOut} (64x32 cape)`);
}
