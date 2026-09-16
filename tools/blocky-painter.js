'use strict';
/**
 * blocky-painter.js — shared canvas painter for headless renders
 * (cover, icons, poster). Paints Minecraft-style blocky front views
 * from skin/cape canvases produced by skin-gen-core.js.
 */
function glowSpot(ctx, x, y, r, color){
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/**
 * paintCharacter — full-body blocky front view.
 * ctx, skin+glow (64x64 canvases), cape (64x32 or null), ground position,
 * u = screen px per skin px, t = pose time, opts { glowPass, armPose }
 */
function paintCharacter(ctx, skin, glow, cape, cx, groundY, u, t, opts){
  const o = opts || {};
  const bw = 8 * u, bh = 12 * u;
  const armW = 4 * u;
  const headS = 8 * u, hatS = 9.6 * u;
  const sway = Math.sin(t * 1.4) * 0.35 * u;
  const armSwR = Math.sin(t * 1.1) * 0.5 * u;
  const armSwL = Math.sin(t * 1.1 + 1.2) * 0.5 * u;

  ctx.imageSmoothingEnabled = false;
  const px = (x) => cx + x;
  const topY = groundY - (12 * u) * 2 - headS;

  // cape behind body
  if (cape) {
    const capeW = 10 * u, capeH = 16 * u;
    const cSway = Math.sin(t * 1.2) * 1.2 * u;
    ctx.drawImage(cape, 12, 1, 10, 16, px(-capeW / 2) + cSway, topY + hatS * 0.55, capeW, capeH);
    if (o.glowPass) {
      ctx.globalAlpha = 0.55;
      ctx.drawImage(cape, 12, 1, 10, 16, px(-capeW / 2) + cSway - 1.5 * u, topY + hatS * 0.55 - 1.5 * u, capeW + 3 * u, capeH + 3 * u);
      ctx.globalAlpha = 1;
    }
  }

  // legs (gap between: spans [-6.05,-2.05] and [2.05,6.05])
  ctx.drawImage(skin, 4, 20, 4, 12, px(-6.05 * u), groundY - 12 * u, 4 * u, 12 * u);
  ctx.drawImage(skin, 20, 52, 4, 12, px(2.05 * u), groundY - 12 * u, 4 * u, 12 * u);

  // torso
  ctx.drawImage(skin, 20, 20, 8, 12, px(-bw / 2), groundY - 24 * u, bw, bh);

  // arms
  ctx.drawImage(skin, 44, 20, 4, 12, px(-bw / 2 - armW) + armSwR, groundY - 22.5 * u, armW, 12 * u);
  ctx.drawImage(skin, 36, 52, 4, 12, px(bw / 2) + armSwL, groundY - 22.5 * u, armW, 12 * u);

  // head + hat layer
  ctx.drawImage(skin, 8, 8, 8, 8, px(-headS / 2) + sway, topY, headS, headS);
  ctx.drawImage(skin, 40, 8, 8, 8, px(-hatS / 2) + sway, topY - 0.8 * u, hatS, hatS);

  // neon glow pass
  if (glow && o.glowPass) {
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.75;
    const k = 2.2 * u;
    ctx.drawImage(glow, 4, 20, 4, 12, px(-6.05 * u) - k / 2, groundY - 12 * u - k / 2, 4 * u + k, 12 * u + k);
    ctx.drawImage(glow, 20, 52, 4, 12, px(2.05 * u) - k / 2, groundY - 12 * u - k / 2, 4 * u + k, 12 * u + k);
    ctx.drawImage(glow, 20, 20, 8, 12, px(-bw / 2) - k / 2, groundY - 24 * u - k / 2, bw + k, bh + k);
    ctx.drawImage(glow, 44, 20, 4, 12, px(-bw / 2 - armW) + armSwR - k / 2, groundY - 22.5 * u - k / 2, armW + k, 12 * u + k);
    ctx.drawImage(glow, 36, 52, 4, 12, px(bw / 2) + armSwL - k / 2, groundY - 22.5 * u - k / 2, armW + k, 12 * u + k);
    ctx.drawImage(glow, 40, 8, 8, 8, px(-hatS / 2) + sway - k / 2, topY - 0.8 * u - k / 2, hatS + k, hatS + k);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
}

/**
 * paintBust — head/shoulders portrait for icons.
 * head 8x8 + hat 9.6x9.6 + shoulder stubs, centered.
 */
function paintBust(ctx, skin, glow, cx, cy, u, opts){
  const o = opts || {};
  const headS = 8 * u, hatS = 9.6 * u;
  ctx.imageSmoothingEnabled = false;

  // shoulders behind head
  ctx.drawImage(skin, 44, 20, 4, 3, cx - 7.4 * u, cy + 2.6 * u, 6.4 * u, 4.2 * u);  // R shoulder
  ctx.drawImage(skin, 36, 52, 4, 3, cx + 1.0 * u, cy + 2.6 * u, 6.4 * u, 4.2 * u);  // L shoulder
  ctx.drawImage(skin, 20, 20, 8, 3, cx - 4 * u, cy + 2.2 * u, 8 * u, 4.6 * u);      // collar

  // head + hat
  ctx.drawImage(skin, 8, 8, 8, 8, cx - headS / 2, cy - headS / 2, headS, headS);
  ctx.drawImage(skin, 40, 8, 8, 8, cx - hatS / 2, cy - hatS / 2 - 0.35 * u, hatS, hatS);

  if (glow && o.glowPass) {
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.8;
    const k = 2.4 * u;
    ctx.drawImage(glow, 40, 8, 8, 8, cx - hatS / 2 - k / 2, cy - hatS / 2 - 0.35 * u - k / 2, hatS + k, hatS + k);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
}

module.exports = { paintCharacter, paintBust, glowSpot };
