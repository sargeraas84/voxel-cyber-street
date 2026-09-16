/** gen-egg-texture.js — 16×16 spawn-egg texture for the Corrupted Skin egg. */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 16, H = 16;
const cv = createCanvas(W, H), ctx = cv.getContext('2d');
const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); };

// classic vanilla egg silhouette (10 wide, 12 tall)
const EGG = [
  '....######....',
  '..##########..',
  '.############.',
  '.############.',
  '##############',
  '##############',
  '##############',
  '##############',
  '.############.',
  '.############.',
  '..##########..',
  '....######....',
];
const PK = '#ff2e95', PK2 = '#d81f7c', PK3 = '#ff6fb5';
const CY = '#19e3ff', CY2 = '#0fb6cd';
const DARK = '#2a1530';

EGG.forEach((row, y) => {
  for (let x = 0; x < row.length; x++) {
    if (row[x] !== '#') continue;
    // pink base with shading on the left edge, highlight on the upper right
    let c = PK;
    if (x < 3) c = PK2;
    if (x > 9 && y < 6) c = PK3;
    // cyan speckle bands (like vanilla eggs' spots)
    if ((x + y * 2) % 7 === 0) c = CY;
    if ((x * 3 + y) % 11 === 0) c = CY2;
    if ((x + y) % 13 === 0) c = DARK;
    px(x + 1, y + 2, c);
  }
});

const out = path.join(__dirname, 'fabric-mod', 'src', 'main', 'resources', 'assets', 'voxelcyberstreet', 'textures', 'item');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'corrupted_skin_spawn_egg.png'), cv.toBuffer('image/png'));
console.log('egg texture →', path.relative(__dirname, path.join(out, 'corrupted_skin_spawn_egg.png')));
