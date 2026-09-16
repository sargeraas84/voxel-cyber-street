#!/usr/bin/env node
/**
 * render-poster.js — renders an A3 (300 DPI) trading-card poster:
 * 3x2 grid of the first 6 skins with stat cards + seed barcodes.
 *
 * Output: poster/voxel-cyber-street-poster-a3.png  (3508x4961)
 * Usage: node tools/render-poster.js [outPath]
 */
const path = require('path');
const fs = require('fs');
const { createCanvas } = require('canvas');
const core = require(path.join(__dirname, '..', 'skin-gen-core.js'));
const { paintBust, glowSpot } = require('./blocky-painter');

const W = 3508, H = 4961;   // A3 @ 300dpi
const outDir = path.resolve(__dirname, '..', 'poster');
fs.mkdirSync(outDir, { recursive: true });
const env = { createCanvas: (w, h) => createCanvas(w, h) };

// deterministic barcode from seed: 24 bars
function drawBarcode(ctx, x, y, w, h, seed, color){
  let s = seed >>> 0;
  const rnd = () => { s ^= s<<13; s>>>=0; s^=s>>17; s^=s<<5; s>>>=0; return s/4294967296; };
  ctx.fillStyle = color;
  let cx = x;
  const bars = 24, bw = w / bars;
  for(let i=0;i<bars;i++){
    const v = rnd();
    const bh = h * (0.45 + v*0.55);
    ctx.fillRect(cx, y + (h-bh), Math.max(1.5, bw*0.55), bh);
    cx += bw;
  }
}

(async () => {
  const cv = createCanvas(W, H);
  const ctx = cv.getContext('2d');

  // background
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#191a1f'); bg.addColorStop(0.5,'#151619'); bg.addColorStop(1,'#101114');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
  glowSpot(ctx, W*0.5, 420, 1400, 'rgba(255,45,149,0.10)');
  glowSpot(ctx, W*0.5, H-300, 1600, 'rgba(25,227,255,0.08)');

  // ---------- header
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.font = '600 64px Segoe UI, Arial';
  ctx.fillStyle = '#19e3ff';
  ctx.fillText('M I N E C R A F T - S T Y L E   S K I N   P A C K', 160, 150);
  ctx.font = '700 220px Segoe UI, Arial';
  ctx.fillStyle = '#f2f4f8';
  ctx.fillText('VOXEL CYBER-STREET', 150, 240);
  const ug = ctx.createLinearGradient(160,0,1900,0);
  ug.addColorStop(0,'#ff2d95'); ug.addColorStop(1,'#19e3ff');
  ctx.fillStyle = ug;
  ctx.shadowColor = '#ff2d95'; ctx.shadowBlur = 40;
  ctx.fillRect(160, 520, 1800, 14);
  ctx.shadowBlur = 0;
  ctx.font = '600 52px Segoe UI, Arial';
  ctx.fillStyle = '#c9cdd6';
  ctx.fillText('TRADING CARDS · SERIES 01 · 36 SKINS · GLOWING TECH CAPES', 160, 580);

  // ---------- 3x2 card grid
  const ACC = Object.keys(core.ACCENTS), HAIR = Object.keys(core.HAIRS), FIT = core.FITS;
  const COLS = 3, ROWS = 2;
  const GX = 160, GY = 800;
  const CW = (W - GX*2 - 120*(COLS-1)) / COLS;   // ~1050
  const CH = 1780;

  for(let i=0;i<COLS*ROWS;i++){
    const col = i % COLS, row = Math.floor(i / COLS);
    const x = GX + col*(CW+120), y = GY + row*(CH+140);
    const cfg = {
      index: i+1,
      accent: ACC[i % ACC.length],
      hair:   HAIR[i % HAIR.length],
      fit:    FIT[i % FIT.length],
      seed:   2000 + i,
    };
    const acc = core.ACCENTS[cfg.accent];
    const { canvas: skin, glowCanvas, capeCanvas } = core.createSkin({ ...cfg, cape: true }, env);

    // card frame
    ctx.fillStyle = '#1c1e24';
    ctx.fillRect(x, y, CW, CH);
    const border = ctx.createLinearGradient(x, y, x+CW, y+CH);
    border.addColorStop(0, acc.a); border.addColorStop(1, acc.b);
    ctx.strokeStyle = border; ctx.lineWidth = 10;
    ctx.strokeRect(x+5, y+5, CW-10, CH-10);

    // top ribbon
    ctx.fillStyle = 'rgba(10,11,14,0.85)';
    ctx.fillRect(x+10, y+10, CW-20, 120);
    ctx.textAlign = 'left';
    ctx.font = '700 64px Segoe UI, Arial';
    ctx.fillStyle = '#f2f4f8';
    ctx.fillText(`#${String(cfg.index).padStart(2,'0')}`, x+50, y+34);
    ctx.font = '600 40px Segoe UI, Arial';
    ctx.fillStyle = acc.a;
    ctx.fillText(cfg.accent.toUpperCase(), x+230, y+44);

    // bust art area
    ctx.save();
    ctx.beginPath(); ctx.rect(x+10, y+130, CW-20, 880); ctx.clip();
    const abg = ctx.createRadialGradient(x+CW/2, y+560, 60, x+CW/2, y+560, 620);
    abg.addColorStop(0, '#26282f'); abg.addColorStop(1, '#15161a');
    ctx.fillStyle = abg; ctx.fillRect(x+10, y+130, CW-20, 880);
    glowSpot(ctx, x+CW/2, y+400, 380, acc.a + '26');
    paintBust(ctx, skin, glowCanvas, x+CW/2, y+520, 62, { glowPass: true });
    ctx.restore();

    // stats block
    ctx.fillStyle = 'rgba(10,11,14,0.75)';
    ctx.fillRect(x+10, y+1010, CW-20, 420);
    ctx.textAlign = 'left';
    const statY = y+1046, lineH = 78;
    const rows = [
      ['HAIR',   cfg.hair],
      ['FIT',    cfg.fit],
      ['ACCENT', cfg.accent],
    ];
    ctx.font = '600 34px Segoe UI, Arial';
    rows.forEach((r, k)=>{
      const yy = statY + k*lineH;
      ctx.fillStyle = '#8f949c';
      ctx.fillText(r[0].padEnd(8,' '), x+56, yy);
      ctx.fillStyle = '#e8ebee';
      ctx.font = '500 40px Segoe UI, Arial';
      ctx.fillText(r[1], x+330, yy-8);
      ctx.font = '600 34px Segoe UI, Arial';
    });
    // seed + barcode
    const bY = y+1300;
    ctx.fillStyle = '#8f949c';
    ctx.fillText('SEED', x+56, bY);
    ctx.fillStyle = acc.b;
    ctx.font = '700 42px Consolas, monospace';
    ctx.fillText(String(cfg.seed), x+330, bY-10);
    drawBarcode(ctx, x+56, bY+70, CW-112, 60, cfg.seed, '#c9cdd3');

    // cape chip
    ctx.fillStyle = '#0d0f13';
    ctx.fillRect(x+56, y+1450, CW-112, 120);
    ctx.drawImage(capeCanvas, 12,1,10,16, x+80, y+1462, 60, 96);
    ctx.textAlign = 'left';
    ctx.font = '600 32px Segoe UI, Arial';
    ctx.fillStyle = '#c9cdd6';
    ctx.fillText('GLOWING TECH CAPE', x+170, y+1490);
    ctx.font = '400 26px Segoe UI, Arial';
    ctx.fillStyle = '#8f949c';
    ctx.fillText('emissive trim · 64x32 slot', x+170, y+1530);

    // bottom accent strip
    const sg = ctx.createLinearGradient(x, 0, x+CW, 0);
    sg.addColorStop(0, acc.a); sg.addColorStop(1, acc.b);
    ctx.fillStyle = sg;
    ctx.fillRect(x+10, y+CH-24, CW-20, 14);
  }

  // ---------- footer
  const fy = GY + 2*(CH+140) + 60;
  ctx.textAlign = 'center';
  ctx.font = '600 44px Segoe UI, Arial';
  ctx.fillStyle = '#8f949c';
  ctx.fillText('VOXEL // CYBER-STREET  ·  PROCEDURAL EDITION  ·  64×64 BASE+OVERLAY  ·  BEDROCK .MCPACK + JAVA CAPE FILES', W/2, fy);

  const out = path.resolve(process.argv[2] || path.join(outDir, 'voxel-cyber-street-poster-a3.png'));
  fs.writeFileSync(out, cv.toBuffer('image/png'));
  console.log('wrote', out, `(${W}x${H} — A3 @ 300dpi)`);
})();
