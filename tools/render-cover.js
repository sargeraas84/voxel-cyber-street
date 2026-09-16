#!/usr/bin/env node
/**
 * render-cover.js — renders the Marketplace-style cover to PNG (headless).
 * Same composition as cover.html: hero + 3 supporting skins + typography.
 * Paints a proper blocky front view from the skin (+glow bloom + cape).
 *
 * Output: cover/voxel-cyber-street-cover-2048x1152.png
 * Usage: node tools/render-cover.js [outPath]
 */
const path = require('path');
const fs = require('fs');
const { createCanvas } = require('canvas');

const root = path.resolve(__dirname, '..');
const core = require(path.join(root, 'skin-gen-core.js'));

const W = 2048, H = 1152;

// blocky front view painter (units: skin pixels at scale u)
function paintCharacter(ctx, skin, glow, cape, cx, groundY, u, t, opts){
  const o = opts || {};
  const bw = 8*u, bh = 12*u;                 // torso 8x12
  const armW = 4*u, legW = 4*u;
  const headS = 8*u, hatS = 9.6*u;
  const sway = Math.sin(t*1.4)*0.35*u;
  const armSwR = Math.sin(t*1.1)*0.5*u;
  const armSwL = Math.sin(t*1.1+1.2)*0.5*u;

  ctx.imageSmoothingEnabled = false;

  const px = (x)=> cx + x;                    // x offset helper (center-based)
  const topY = groundY - (12*u)*2 - headS;    // head top y

  // ---- CAPE behind body (its own sway)
  if(cape){
    const capeW = 10*u, capeH = 16*u;
    const cSway = Math.sin(t*1.2)*1.2*u;
    ctx.drawImage(cape, 12,1,10,16, px(-capeW/2)+cSway, topY + hatS*0.55, capeW, capeH);
    if(o.glowPass){
      ctx.globalAlpha = 0.55;
      ctx.drawImage(cape, 12,1,10,16, px(-capeW/2)+cSway - 1.5*u, topY + hatS*0.55 - 1.5*u, capeW+3*u, capeH+3*u);
      ctx.globalAlpha = 1;
    }
  }

  // ---- legs (gap between them: legs at x=±2.05..2.05+4 → span [-6.05,-2.05] and [2.05,6.05])
  ctx.drawImage(skin, 4,20,4,12,  px(-6.05*u), groundY-12*u, 4*u, 12*u);   // right leg (char's right = viewer left)
  ctx.drawImage(skin, 20,52,4,12, px(2.05*u),  groundY-12*u, 4*u, 12*u);   // left leg

  // ---- torso
  ctx.drawImage(skin, 20,20,8,12, px(-bw/2), groundY-24*u, bw, bh);

  // ---- arms (pivot at shoulder 22.5; slight swing)
  ctx.drawImage(skin, 44,20,4,12, px(-bw/2-armW)+armSwR, groundY-22.5*u, armW, 12*u);
  ctx.drawImage(skin, 36,52,4,12, px(bw/2)+armSwL,       groundY-22.5*u, armW, 12*u);

  // ---- head + hat layer
  ctx.drawImage(skin, 8,8,8,8, px(-headS/2)+sway, topY, headS, headS);
  ctx.drawImage(skin, 40,8,8,8, px(-hatS/2)+sway, topY-0.8*u, hatS, hatS);

  // ---- neon glow pass (screen blend, offset halo)
  if(glow && o.glowPass){
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.75;
    const k = 2.2*u; // halo grow
    ctx.drawImage(glow, 4,20,4,12,  px(-6.05*u)-k/2, groundY-12*u-k/2, 4*u+k, 12*u+k);
    ctx.drawImage(glow, 20,52,4,12, px(2.05*u)-k/2,  groundY-12*u-k/2, 4*u+k, 12*u+k);
    ctx.drawImage(glow, 20,20,8,12, px(-bw/2)-k/2,   groundY-24*u-k/2, bw+k, bh+k);
    ctx.drawImage(glow, 44,20,4,12, px(-bw/2-armW)+armSwR-k/2, groundY-22.5*u-k/2, armW+k, 12*u+k);
    ctx.drawImage(glow, 36,52,4,12, px(bw/2)+armSwL-k/2,       groundY-22.5*u-k/2, armW+k, 12*u+k);
    ctx.drawImage(glow, 40,8,8,8,   px(-hatS/2)+sway-k/2, topY-0.8*u-k/2, hatS+k, hatS+k);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
}

function glowSpot(ctx, x, y, r, color){
  const g = ctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x-r,y-r,r*2,r*2);
}

(async () => {
  const cv = createCanvas(W, H);
  const ctx = cv.getContext('2d');

  // ---- background
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#17181c'); bg.addColorStop(1,'#101114');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  const GROUND = 920;
  // ground line + reflection hint
  ctx.fillStyle = '#1b1c21';
  ctx.fillRect(0, GROUND, W, H-GROUND);
  const rl = ctx.createLinearGradient(0,GROUND,0,H);
  rl.addColorStop(0,'rgba(25,227,255,0.05)'); rl.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle = rl; ctx.fillRect(0,GROUND,W,H-GROUND);

  // ambient neon glows
  glowSpot(ctx, 560, 940, 460, 'rgba(255,45,149,0.16)');
  glowSpot(ctx, 1520, 920, 420, 'rgba(25,227,255,0.13)');

  // ---- cast
  const CAST = [
    { accent:'pink-cyan',   hair:'white-messy',   fit:'bomber',      seed:2000, cape:true,  x:560,  u:15.5, t:0.0 },
    { accent:'cyan-pink',   hair:'ice-blue',      fit:'vest-hood',   seed:2006, cape:true,  x:1180, u:8.6,  t:1.1 },
    { accent:'violet-pink', hair:'platinum-pink', fit:'longline',    seed:2011, cape:true,  x:1470, u:8.6,  t:2.2 },
    { accent:'gold-cyan',   hair:'smoke-teal',    fit:'kimono-tech', seed:2017, cape:false, x:1740, u:8.6,  t:3.3 },
  ];
  const env = { createCanvas:(w,h)=>createCanvas(w,h) };

  // pass 1: soft glow halos (behind), pass 2: solid bodies
  for(const pass of ['glow','solid']){
    for(const c of CAST){
      const { canvas, glowCanvas, capeCanvas } = core.createSkin({ ...c, cape:true }, env);
      paintCharacter(ctx, canvas, glowCanvas, capeCanvas, c.x, GROUND, c.u, c.t,
        { glowPass: pass==='glow' });
    }
  }

  // ---- typography
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  const g2 = ctx.createLinearGradient(0,0,0,320);
  g2.addColorStop(0,'rgba(10,11,14,0.88)'); g2.addColorStop(1,'rgba(10,11,14,0)');
  ctx.fillStyle = g2; ctx.fillRect(0,0,W,320);

  ctx.font = '600 30px Segoe UI, Arial';
  ctx.fillStyle = '#19e3ff';
  ctx.fillText('M I N E C R A F T - S T Y L E   S K I N   P A C K', 90, 74);

  ctx.font = '700 118px Segoe UI, Arial';
  ctx.fillStyle = '#f2f4f8';
  ctx.fillText('VOXEL CYBER-STREET', 84, 124);

  const ug = ctx.createLinearGradient(90,0,1160,0);
  ug.addColorStop(0,'#ff2d95'); ug.addColorStop(1,'#19e3ff');
  ctx.fillStyle = ug;
  ctx.shadowColor = '#ff2d95'; ctx.shadowBlur = 26;
  ctx.fillRect(90, 268, 1060, 8);
  ctx.shadowBlur = 0;

  ctx.font = '600 34px Segoe UI, Arial';
  ctx.fillStyle = '#c9cdd6';
  ctx.fillText('3 6   S K I N S   ·   G L O W I N G   T E C H   C A P E S   ·   B E D R O C K   R E A D Y', 90, 310);

  ctx.textAlign = 'right';
  ctx.font = '700 26px Segoe UI, Arial';
  ctx.fillStyle = '#ff2d95';
  ctx.fillText('P R O C E D U R A L   E D I T I O N', W-84, 84);
  ctx.font = '500 20px Segoe UI, Arial';
  ctx.fillStyle = '#8f949c';
  ctx.fillText('6 4 × 6 4   ·   B A S E   +   O V E R L A Y   ·   S E E D - S T A B L E', W-84, 120);

  const out = path.resolve(process.argv[2] || path.join(root, 'cover', 'voxel-cyber-street-cover-2048x1152.png'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, cv.toBuffer('image/png'));
  console.log('wrote', out, `(${W}x${H})`);
})();
