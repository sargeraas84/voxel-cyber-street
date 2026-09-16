#!/usr/bin/env node
/**
 * render-icons.js — renders one 512x512 portrait icon per skin for store
 * listings, plus a contact-sheet grid of all of them.
 *
 * Output:
 *   icons/icon-01.png ... icon-36.png   (512x512)
 *   icons/contact-sheet.png             (2048x1536)
 * Usage: node tools/render-icons.js [outDir=icons]
 */
const path = require('path');
const fs = require('fs');
const { createCanvas } = require('canvas');
const core = require(path.join(__dirname, '..', 'skin-gen-core.js'));
const { paintBust, glowSpot } = require('./blocky-painter');

const SIZE = 512;
const N = 36;
const outDir = path.resolve(process.argv[2] || path.join(__dirname, '..', 'icons'));
fs.mkdirSync(outDir, { recursive: true });
const env = { createCanvas: (w, h) => createCanvas(w, h) };

function renderIcon(cfg){
  const { canvas: skin, glowCanvas, desc } = core.createSkin({ ...cfg, cape: true }, env);
  const cv = createCanvas(SIZE, SIZE);
  const ctx = cv.getContext('2d');

  // background: dark radial + accent tint corner glows
  const bg = ctx.createRadialGradient(SIZE/2, SIZE*0.42, 40, SIZE/2, SIZE*0.5, SIZE*0.75);
  bg.addColorStop(0, '#26282f');
  bg.addColorStop(1, '#131418');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, SIZE, SIZE);
  const acc = core.ACCENTS[cfg.accent];
  glowSpot(ctx, SIZE*0.5, SIZE*0.30, 300, acc.a + '22');
  glowSpot(ctx, SIZE*0.18, SIZE*0.85, 240, acc.b + '18');

  // pedestal ring
  ctx.strokeStyle = acc.a + '66';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.ellipse(SIZE/2, SIZE*0.86, 150, 34, 0, 0, Math.PI*2); ctx.stroke();
  ctx.strokeStyle = acc.b + '44';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(SIZE/2, SIZE*0.87, 170, 40, 0, 0, Math.PI*2); ctx.stroke();

  // bust
  paintBust(ctx, skin, glowCanvas, SIZE/2, SIZE*0.42, 30, { glowPass: true });

  // bottom accent bar + name plate
  const g = ctx.createLinearGradient(0, SIZE-86, SIZE, SIZE-86);
  g.addColorStop(0, acc.a); g.addColorStop(1, acc.b);
  ctx.fillStyle = g;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(0, SIZE-10, SIZE, 10);
  ctx.globalAlpha = 1;

  ctx.fillStyle = 'rgba(10,11,14,0.72)';
  ctx.fillRect(0, SIZE-86, SIZE, 76);
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.font = '700 30px Segoe UI, Arial';
  ctx.fillStyle = '#f2f4f8';
  ctx.fillText(`#${String(cfg.index).padStart(2,'0')} ${cfg.accent}`, 24, SIZE-78);
  ctx.font = '500 20px Segoe UI, Arial';
  ctx.fillStyle = '#9aa0aa';
  ctx.fillText(`${cfg.hair} · ${cfg.fit} · seed ${cfg.seed}`, 24, SIZE-44);
  // corner badge
  ctx.textAlign = 'right';
  ctx.font = '700 17px Segoe UI, Arial';
  ctx.fillStyle = acc.b;
  ctx.fillText('CYBER-STREET', SIZE-20, SIZE-76);

  return cv;
}

const ACC = Object.keys(core.ACCENTS), HAIR = Object.keys(core.HAIRS), FIT = core.FITS;
const files = [];
for(let i=0;i<N;i++){
  const cfg = {
    index: i+1,
    accent: ACC[i % ACC.length],
    hair:   HAIR[i % HAIR.length],
    fit:    FIT[i % FIT.length],
    seed:   2000 + i,
  };
  const cv = renderIcon(cfg);
  const f = path.join(outDir, `icon-${String(i+1).padStart(2,'0')}.png`);
  fs.writeFileSync(f, cv.toBuffer('image/png'));
  files.push(f);
  console.log('  ✓', path.basename(f), `#${cfg.index} ${cfg.accent}/${cfg.hair}/${cfg.fit}`);
}

// ---- contact sheet 8 cols x 5 rows (36 icons + margin)
const COLS = 8, ROWS = Math.ceil(N / COLS), CELL = 240, PAD = 8;
const sheet = createCanvas(COLS*(CELL+PAD)+PAD, ROWS*(CELL+PAD)+PAD);
const sctx = sheet.getContext('2d');
sctx.fillStyle = '#1f2023'; sctx.fillRect(0,0,sheet.width,sheet.height);
files.forEach((f, i)=>{
  const img = (()=>{ const { loadImage } = require('canvas'); return loadImage(f); })();
  const col = i % COLS, row = Math.floor(i / COLS);
  img.then(im => {
    sctx.drawImage(im, PAD + col*(CELL+PAD), PAD + row*(CELL+PAD), CELL, CELL);
    if(i === N-1){
      const out = path.join(outDir, 'contact-sheet.png');
      fs.writeFileSync(out, sheet.toBuffer('image/png'));
      console.log('\nwrote', out, `(${sheet.width}x${sheet.height})`);
    }
  });
});
console.log(`wrote ${files.length} icons to ${outDir}`);
