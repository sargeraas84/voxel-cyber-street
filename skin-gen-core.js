/* ============================================================================
   SKIN GEN CORE — shared between browser (index/gallery) and Node (CLI).
   Paints a 64x64 Minecraft skin (base + overlay) plus an emissive glow layer.
   Exports: createSkin(options) -> { canvas, glowCanvas, desc }
   ========================================================================== */
(function (root) {
'use strict';

const PAL = {
  skinLight:'#e8b08a', skinMid:'#d99b72', skinShade:'#9c6647',
  hairLight:'#f4f6fa', hairMid:'#dfe4ec', hairDark:'#b9c1cf', hairShade:'#8f99ab',
  denimBase:'#262a33', denimMid:'#2f3440', denimDark:'#1b1e25', denimPan:'#383e4a',
  maskDark:'#141519', maskMid:'#1e2026',
  jacket:'#2f3340', jacketHi:'#3f4553', jacketLo:'#20242c',
  sock:'#101114',
  shoeBase:'#101216', shoeSole:'#08090b', shoeTrim:'#23262e',
  visor:'#0e1013',
};

// 6 accent pairs (lead, counter)
const ACCENTS = {
  'pink-cyan':  { a:'#ff2d95', b:'#19e3ff', aLo:'#8f1650', bLo:'#0f7f92' },
  'cyan-pink':  { a:'#19e3ff', b:'#ff2d95', aLo:'#0f7f92', bLo:'#8f1650' },
  'magenta-lime':{ a:'#ff2d95', b:'#aaff2d', aLo:'#8f1650', bLo:'#5c9c0f' },
  'lime-cyan':  { a:'#aaff2d', b:'#19e3ff', aLo:'#5c9c0f', bLo:'#0f7f92' },
  'orange-cyan':{ a:'#ff9e2d', b:'#19e3ff', aLo:'#9c5c0f', bLo:'#0f7f92' },
  'violet-pink':{ a:'#b04dff', b:'#ff2d95', aLo:'#5c1c8f', bLo:'#8f1650' },
  'red-cyan':   { a:'#ff3b57', b:'#19e3ff', aLo:'#9c1226', bLo:'#0f7f92' },
  'gold-cyan':  { a:'#ffb02d', b:'#19e3ff', aLo:'#9c6a0f', bLo:'#0f7f92' },
  'ice-violet': { a:'#7ac7ff', b:'#b04dff', aLo:'#3f7fa8', bLo:'#5c1c8f' },
  'mint-pink':  { a:'#4dffce', b:'#ff2d95', aLo:'#1c9c7c', bLo:'#8f1650' },
};

// 4 hair looks
const HAIRS = {
  'white-messy':  { light:'#f4f6fa', mid:'#dfe4ec', dark:'#b9c1cf', shade:'#8f99ab' },
  'ash-grey':     { light:'#d8dde6', mid:'#b9c1cf', dark:'#8f99ab', shade:'#6b7484' },
  'ice-blue':     { light:'#dceeff', mid:'#b4d9f0', dark:'#84b4d4', shade:'#5c8aa8' },
  'candy-mint':   { light:'#e8fff4', mid:'#b9f0d8', dark:'#84c9ab', shade:'#5c9c84' },
  'platinum-pink':{ light:'#fdf2f8', mid:'#f2d4e8', dark:'#cf9cc0', shade:'#9c6b8f' },
  'smoke-teal':   { light:'#e2fbf6', mid:'#b9e8dd', dark:'#84c2b4', shade:'#5c8f84' },
};

// 4 fits (torso/limb shell silhouettes in 3D; texture patterns differ)
const FITS = ['bomber', 'longline', 'vest-hood', 'tech-hood', 'kimono-tech', 'bomber-hood'];

function mulberry32(seed){
  let s = seed >>> 0;
  return function(){
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// classic 64x64 UV regions
const UV = {
  head: {
    base:{ front:[8,8,8,8], back:[24,8,8,8], right:[0,8,8,8], left:[16,8,8,8], top:[8,0,8,8], bottom:[16,0,8,8] },
    hat: { front:[40,8,8,8], back:[56,8,8,8], right:[32,8,8,8], left:[48,8,8,8], top:[40,0,8,8], bottom:[48,0,8,8] },
  },
  body: {
    base:{ front:[20,20,8,12], back:[32,20,8,12], right:[16,20,4,12], left:[28,20,4,12], top:[20,16,8,4], bottom:[28,16,8,4] },
    outer:{ front:[20,36,8,12], back:[32,36,8,12], right:[16,36,4,12], left:[28,36,4,12], top:[20,32,8,4], bottom:[28,32,8,4] },
  },
  armR: {
    base:{ front:[44,20,4,12], back:[52,20,4,12], right:[40,20,4,12], left:[48,20,4,12], top:[44,16,4,4], bottom:[48,16,4,4] },
    outer:{ front:[44,36,4,12], back:[52,36,4,12], right:[40,36,4,12], left:[48,36,4,12], top:[44,32,4,4], bottom:[48,32,4,4] },
  },
  legR: {
    base:{ front:[4,20,4,12], back:[12,20,4,12], right:[0,20,4,12], left:[8,20,4,12], top:[4,16,4,4], bottom:[8,16,4,4] },
    outer:{ front:[4,36,4,12], back:[12,36,4,12], right:[0,36,4,12], left:[8,36,4,12], top:[4,32,4,4], bottom:[8,32,4,4] },
  },
  armL: {
    base:{ front:[36,52,4,12], back:[44,52,4,12], right:[40,52,4,12], left:[32,52,4,12], top:[44,48,4,4], bottom:[40,48,4,4] },
    outer:{ front:[52,52,4,12], back:[60,52,4,12], right:[56,52,4,12], left:[48,52,4,12], top:[52,48,4,4], bottom:[56,48,4,4] },
  },
  legL: {
    base:{ front:[20,52,4,12], back:[28,52,4,12], right:[16,52,4,12], left:[24,52,4,12], top:[20,48,4,4], bottom:[24,48,4,4] },
    outer:{ front:[4,52,4,12], back:[12,52,4,12], right:[0,52,4,12], left:[8,52,4,12], top:[4,48,4,4], bottom:[8,48,4,4] },
  },
};

/**
 * createSkin({ seed, accent, hair, fit })
 * Returns { canvas, glowCanvas, desc:{accent,hair,fit,seed} }.
 * In Node, pass a canvas factory: createSkin(opts, {createCanvas})
 */
function createSkin(opts, env){
  opts = opts || {};
  env = env || {};
  const mk = env.createCanvas || (typeof document !== 'undefined'
    ? (w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
    : null);
  if(!mk) throw new Error('no canvas factory');

  const seed  = (opts.seed >>> 0) || ((Math.random()*1e9)|0);
  const rnd   = mulberry32(seed);
  const V     = () => rnd();
  const accentKey = opts.accent && ACCENTS[opts.accent] ? opts.accent
                    : Object.keys(ACCENTS)[Math.floor(rnd()*6)];
  const hairKey   = opts.hair && HAIRS[opts.hair] ? opts.hair
                    : Object.keys(HAIRS)[Math.floor(rnd()*4)];
  const fitKey    = opts.fit && FITS.includes(opts.fit) ? opts.fit
                    : FITS[Math.floor(rnd()*4)];

  const A   = ACCENTS[accentKey].a,  B = ACCENTS[accentKey].b;
  const aLo = ACCENTS[accentKey].aLo, bLo = ACCENTS[accentKey].bLo;
  const HR  = HAIRS[hairKey];

  const skin = mk(64,64), s = skin.getContext('2d');
  const glow = mk(64,64), g = glow.getContext('2d');
  s.clearRect(0,0,64,64); g.clearRect(0,0,64,64);

  function px(ctx,x,y,c){ ctx.fillStyle=c; ctx.fillRect(x,y,1,1); }
  function face(ctx,reg,f){ const [u,v,w,h]=reg; for(let y=0;y<h;y++)for(let x=0;x<w;x++){ const c=f(x,y,w,h); if(c) px(ctx,u+x,v+y,c); } }

  const hair = (bias) => { const d=V(); const t = bias||0;
    if(d<0.10+t) return HR.light; if(d<0.45+t) return HR.mid; if(d<0.80+t) return HR.dark; return HR.shade; };

  // ---------------- HEAD base
  const H = UV.head.base;
  face(s,H.front,(x,y,w)=> (x===0||x===w-1) ? PAL.skinMid : PAL.skinLight);
  // brows + tech eyes
  face(s,H.front,(x,y)=>{
    if(y===2&&(x===1||x===2||x===5||x===6)) return HR.mid;
    if(y===3&&(x===1||x===2||x===5||x===6)) return PAL.visor;
    if(y===4&&(x===1||x===5)) return aLo;
    return null;
  });
  face(s,H.top,()=>hair());
  // short messy fringe: rows 0-1 full, sparse strands on row 2, brows stay clear
  face(s,H.front,(x,y)=>{
    if(y<2) return hair(0.1);
    if(y===2 && !(x===1||x===2||x===5||x===6) && rnd()<0.45) return hair();
    return null;
  });
  // sides + back hair
  face(s,H.right,(x)=>{ if(x<2) return V()<0.5?HR.mid:HR.dark; return null; });
  face(s,H.left, (x)=>{ if(x>5) return V()<0.5?HR.mid:HR.dark; return null; });
  face(s,H.back,(x,y)=>{
    if(y<5) return V()<0.3?HR.mid:(V()<0.6?HR.dark:HR.shade);
    if(y===5&&rnd()<0.5) return HR.shade;
    return null;
  });
  face(s,H.bottom,()=>PAL.skinShade);

  // ---------------- HAT layer (hair volume)
  const HT = UV.head.hat;
  face(s,HT.top, ()=> rnd()<0.28 ? (V()<0.4?HR.light:(rnd()<0.5?HR.mid:HR.dark)) : null);
  face(s,HT.front,(x,y)=> y<1&&rnd()<0.5 ? (V()<0.5?HR.mid:HR.dark) : null);
  face(s,HT.back, (x,y)=> y<4&&rnd()<0.45 ? (V()<0.5?HR.dark:HR.shade) : null);
  face(s,HT.right,(x,y)=> y<3&&rnd()<0.35 ? HR.dark : null);
  face(s,HT.left, (x,y)=> y<3&&rnd()<0.35 ? HR.dark : null);
  // glowing undercut line
  face(g,HT.right,(x,y)=>(y===5&&x>4)?B:null);
  face(g,HT.left, (x,y)=>(y===5&&x<3)?B:null);
  face(s,HT.right,(x,y)=>(y===5&&x>4)?bLo:null);
  face(s,HT.left, (x,y)=>(y===5&&x<3)?bLo:null);

  // ---------------- MASK (lower face) — varies slightly by fit
  face(s,H.front,(x,y)=>{ if(y>=5) return y===5?PAL.maskMid:PAL.maskDark; return null; });
  face(s,H.right,(x,y)=>{ if(y>=5) return y===5?PAL.maskMid:PAL.maskDark; return null; });
  face(s,H.left, (x,y)=>{ if(y>=5) return y===5?PAL.maskMid:PAL.maskDark; return null; });
  face(s,H.bottom,()=>PAL.maskDark);
  face(s,H.front,(x,y)=>{ if(y===6&&(x===2||x===5)) return PAL.maskMid; return null; });
  // neon mask trim: thin strip across the mask top edge only
  face(g,H.front,(x,y)=> y===5 ? A : null);
  face(g,H.right,(x,y)=> y===5&&x===7 ? A : null);
  face(g,H.left, (x,y)=> y===5&&x===0 ? A : null);
  face(g,H.bottom,(x,y)=> (y===7||x===0||x===7) ? A : null);
  face(s,H.front,(x,y)=> y===5 ? aLo : null);
  face(s,H.right,(x,y)=> y===5&&x===7 ? aLo : null);
  face(s,H.left, (x,y)=> y===5&&x===0 ? aLo : null);
  face(s,H.bottom,(x,y)=> (y===7||x===0||x===7) ? aLo : null);
  // eye glow
  face(g,H.front,(x,y)=>{ if(y===3&&(x===1||x===2)) return A; if(y===3&&(x===5||x===6)) return B; return null; });

  // ---------------- BODY base per fit
  const Bd = UV.body.base;
  const panelC = fitKey==='vest-hood' ? PAL.denimPan : PAL.jacketHi;
  face(s,Bd.front,(x,y,w,h)=>{
    if(y>=h-2) return PAL.jacketLo;
    if(y===0)  return PAL.jacketHi;
    if(fitKey==='longline' && y>=h-4) return PAL.jacketLo;      // long hem
    if(x===Math.floor((y-1)*0.9)) return PAL.denimMid;          // zipper
    if(y>=2&&y<=5&&x>=2&&x<=5) return panelC;
    const d=V(); return d<0.12?PAL.jacketLo:(d<0.9?PAL.jacket:PAL.jacketHi);
  });
  face(s,Bd.back,(x,y,w,h)=>{
    if(y>=h-2) return PAL.jacketLo;
    if(y===0)  return PAL.jacketHi;
    if(fitKey==='longline' && y>=h-4) return PAL.jacketLo;
    if(fitKey==='tech-hood' && y>=3&&y<=6&&Math.abs(x-3.5)<(7-y)) return PAL.jacketHi;
    const d=V(); return d<0.15?PAL.jacketLo:PAL.jacket;
  });
  face(s,Bd.right,(x,y,w,h)=> (y>=h-2)?PAL.jacketLo:PAL.jacket);
  face(s,Bd.left, (x,y,w,h)=> (y>=h-2)?PAL.jacketLo:PAL.jacket);
  face(s,Bd.top,()=>PAL.jacketHi);
  face(s,Bd.bottom,()=>PAL.jacketLo);
  // chest neon: strap clips + 2px core
  face(g,Bd.front,(x,y,w,h)=>{
    if(y===2&&(x===1||x===6)) return A;
    if(y===h-2&&(x===0||x===7)) return A;
    if(y===4&&x>=3&&x<=4) return B;
    return null;
  });
  face(s,Bd.front,(x,y,w,h)=>{
    if(y===2&&(x===1||x===6)) return aLo;
    if(y===h-2&&(x===0||x===7)) return aLo;
    if(y===4&&x>=3&&x<=4) return bLo;
    return null;
  });
  face(g,Bd.back,(x,y,w,h)=>{
    if(y===2&&(x===1||x===6)) return A;
    if(y===h-2&&(x===0||x===7)) return A;
    return null;
  });
  face(s,Bd.back,(x,y,w,h)=>{
    if(y===2&&(x===1||x===6)) return aLo;
    if(y===h-2&&(x===0||x===7)) return aLo;
    return null;
  });

  // ---------------- BODY outer per fit
  const BO = UV.body.outer;
  const shellEdge = PAL.jacketLo;
  face(s,BO.front,(x,y,w,h)=>{
    if(x===0||x===7||y===0||y===h-1) return shellEdge;
    if(fitKey==='vest-hood' && y>=4) return PAL.denimBase;      // vest: lower half = under-layer
    if(fitKey==='longline' && y===h-2) return PAL.jacketHi;     // hem stripe
    const d=V(); return d<0.1?PAL.jacketLo:(d<0.85?PAL.jacket:PAL.jacketHi);
  });
  face(s,BO.back,(x,y)=>{
    if(x===0||x===7||y===0||y===11) return shellEdge;
    if(fitKey==='vest-hood' && y>=4) return PAL.denimBase;
    const d=V(); return d<0.85?PAL.jacket:PAL.jacketHi;
  });
  face(s,BO.right,(x,y)=> (x===0||y===0||y===11) ? shellEdge : (fitKey==='vest-hood'&&y>=4?PAL.denimBase:PAL.jacket));
  face(s,BO.left, (x,y)=> (x===3||y===0||y===11) ? shellEdge : (fitKey==='vest-hood'&&y>=4?PAL.denimBase:PAL.jacket));
  face(s,BO.top,()=>PAL.jacketHi);
  face(s,BO.bottom,()=>PAL.jacketLo);
  // shell piping (front + back)
  face(g,BO.front,(x,y)=> (y===1&&x>0&&x<7) ? A : null);
  face(s,BO.front,(x,y)=> (y===1&&x>0&&x<7) ? aLo : null);
  face(g,BO.back, (x,y)=> (y===1&&x>0&&x<7) ? A : null);
  face(s,BO.back, (x,y)=> (y===1&&x>0&&x<7) ? aLo : null);
  // vest-hood: hood roll on hat back top
  if(fitKey==='vest-hood' || fitKey==='tech-hood' || fitKey==='bomber-hood'){
    face(s,HT.top,(x,y)=> (y<2||y>5) ? PAL.jacketHi : null);
    face(s,HT.back,(x,y)=> y<2 ? PAL.jacket : null);
  }

  // kimono-tech: crossing lapels + obi band
  if(fitKey==='kimono-tech'){
    face(s,Bd.front,(x,y)=>{
      if(y>=1&&y<=6&&Math.abs(x-(3.5+(y-1)*0.8))<0.9) return PAL.jacketHi;
      if(y>=1&&y<=6&&Math.abs(x-(3.5-(y-1)*0.8))<0.9) return PAL.jacketHi;
      if(y===7||y===8) return PAL.maskMid;
      return null;
    });
    face(s,Bd.back,(x,y)=>{ if(y===7||y===8) return PAL.maskMid; return null; });
    face(g,Bd.front,(x,y)=> (y===7&&(x===1||x===6)) ? A : null);
    face(s,Bd.front,(x,y)=> (y===7&&(x===1||x===6)) ? aLo : null);
  }

  // ---------------- ARMS (sleeve length varies by fit)
  const cuffRow = fitKey==='longline' ? 8 : 7;   // where the glow band sits
  function paintArm(AB, AO){
    const sleeveEnd = fitKey==='vest-hood' ? 7 : 8; // skin shows below vest sleeve
    face(s,AB.front,(x,y,w,h)=>{
      if(y>sleeveEnd){ if(y===9) return PAL.maskMid; return PAL.maskDark; }
      if(fitKey==='vest-hood' && y>=6 && y<=sleeveEnd) return PAL.skinMid; // exposed forearm
      if(y===0) return PAL.jacketHi;
      if(x===0) return PAL.jacketLo;
      const d=V(); return d<0.15?PAL.jacketLo:(d<0.9?PAL.jacket:PAL.jacketHi);
    });
    face(s,AB.back,(x,y,w,h)=>{
      if(y>sleeveEnd){ if(y===9) return PAL.maskMid; return PAL.maskDark; }
      if(fitKey==='vest-hood' && y>=6 && y<=sleeveEnd) return PAL.skinMid;
      if(y===0) return PAL.jacketHi;
      if(x===3) return PAL.jacketLo;
      const d=V(); return d<0.15?PAL.jacketLo:(d<0.9?PAL.jacket:PAL.jacketHi);
    });
    face(s,AB.right,(x,y,w,h)=>{
      if(y>sleeveEnd){ if(y===9) return PAL.maskMid; return PAL.maskDark; }
      if(fitKey==='vest-hood' && y>=6 && y<=sleeveEnd) return PAL.skinMid;
      if(y===0||x===0) return PAL.jacketLo;
      return PAL.jacket;
    });
    face(s,AB.left,(x,y,w,h)=>{
      if(y>sleeveEnd){ if(y===9) return PAL.maskMid; return PAL.maskDark; }
      if(fitKey==='vest-hood' && y>=6 && y<=sleeveEnd) return PAL.skinMid;
      if(y===0||x===3) return PAL.jacketLo;
      return PAL.jacket;
    });
    face(s,AB.top,()=>PAL.jacketHi);
    face(s,AB.bottom,()=>PAL.maskDark);
    // cuff glow band
    for(const k of ['front','back','right','left']){
      face(g,AB[k],(x,y)=> y===cuffRow ? A : null);
      face(s,AB[k],(x,y)=> y===cuffRow ? aLo : null);
    }
    // outer shell
    face(s,AO.front,(x,y,w,h)=>{
      if(y>=9) return PAL.maskMid;
      if(x===0||y===0||y===h-1) return PAL.jacketLo;
      const d=V(); return d<0.85?PAL.jacket:PAL.jacketHi;
    });
    face(s,AO.back,(x,y,w,h)=>{
      if(y>=9) return PAL.maskMid;
      if(x===3||y===0||y===h-1) return PAL.jacketLo;
      const d=V(); return d<0.85?PAL.jacket:PAL.jacketHi;
    });
    face(s,AO.right,(x,y,w,h)=>{ if(y>=9) return PAL.maskMid; if(x===0||y===0||y===h-1) return PAL.jacketLo; return PAL.jacket; });
    face(s,AO.left, (x,y,w,h)=>{ if(y>=9) return PAL.maskMid; if(x===3||y===0||y===h-1) return PAL.jacketLo; return PAL.jacket; });
    face(s,AO.top,()=>PAL.jacketHi);
    face(s,AO.bottom,()=>PAL.maskDark);
    // knuckle glow
    face(g,AO.front,(x,y)=> (y>=9&&y<=10) ? A : null);
    face(g,AO.back, (x,y)=> (y>=9&&y<=10) ? A : null);
    face(s,AO.front,(x,y)=> (y>=9&&y<=10) ? aLo : null);
    face(s,AO.back, (x,y)=> (y>=9&&y<=10) ? aLo : null);
  }
  paintArm(UV.armR.base, UV.armR.outer);
  paintArm(UV.armL.base, UV.armL.outer);

  // ---------------- LEGS
  function paintLeg(LB, LO){
    face(s,LB.front,(x,y,w,h)=>{
      if(y>=10) return PAL.shoeBase;
      if(y>=8)  return PAL.denimDark;
      if(y===0) return PAL.denimPan;
      const d=V(); return d<0.2?PAL.denimDark:(d<0.9?PAL.denimBase:PAL.denimMid);
    });
    face(s,LB.back,(x,y,w,h)=>{
      if(y>=10) return PAL.shoeBase;
      if(y>=8)  return PAL.denimDark;
      const d=V(); return d<0.2?PAL.denimDark:(d<0.9?PAL.denimBase:PAL.denimMid);
    });
    face(s,LB.right,(x,y,w,h)=>{ if(y>=10) return PAL.shoeBase; if(y>=8) return PAL.denimDark; return PAL.denimBase; });
    face(s,LB.left, (x,y,w,h)=>{ if(y>=10) return PAL.shoeBase; if(y>=8) return PAL.denimDark; return PAL.denimBase; });
    face(s,LB.top,()=>PAL.denimPan);
    face(s,LB.bottom,()=>PAL.shoeSole);
    // neon side stripes
    face(g,LB.right,(x,y)=> (y>=1&&y<=7&&x===2) ? A : null);
    face(g,LB.left, (x,y)=> (y>=1&&y<=7&&x===1) ? A : null);
    face(s,LB.right,(x,y)=> (y>=1&&y<=7&&x===2) ? aLo : null);
    face(s,LB.left, (x,y)=> (y>=1&&y<=7&&x===1) ? aLo : null);
    // knee chip
    face(g,LB.front,(x,y)=> (y===4&&x>=1&&x<=2) ? B : null);
    face(s,LB.front,(x,y)=> (y===4&&x>=1&&x<=2) ? bLo : null);
    // outer strap + panel
    face(s,LO.front,(x,y,w,h)=>{
      if(y>=10) return PAL.shoeTrim;
      if(y===2) return PAL.maskMid;
      if(y>=8) return PAL.denimDark;
      return PAL.denimBase;
    });
    face(s,LO.back,(x,y,w,h)=>{ if(y>=10) return PAL.shoeTrim; if(y>=8) return PAL.denimDark; return PAL.denimBase; });
    face(s,LO.right,(x,y,w,h)=>{ if(y>=10) return PAL.shoeTrim; if(y===2) return PAL.maskMid; if(y>=8) return PAL.denimDark; return PAL.denimBase; });
    face(s,LO.left, (x,y,w,h)=>{ if(y>=10) return PAL.shoeTrim; if(y===2) return PAL.maskMid; if(y>=8) return PAL.denimDark; return PAL.denimBase; });
    face(s,LO.top,()=>PAL.denimPan);
    face(s,LO.bottom,()=>PAL.shoeSole);
    // heel glow tab
    face(g,LO.back,(x,y)=> y===10 ? A : null);
    face(s,LO.back,(x,y)=> y===10 ? aLo : null);
  }
  paintLeg(UV.legR.base, UV.legR.outer);
  paintLeg(UV.legL.base, UV.legL.outer);

  // ---------------- CAPE (standard 64x32 cape layout, pixel-art neon tech)
  let capeCanvas = null, capeGlow = null;
  if(opts.cape){
    capeCanvas = mk(64,32); const c = capeCanvas.getContext('2d');
    capeGlow   = mk(64,32); const cgx = capeGlow.getContext('2d');
    const CR = { front:[1,1,10,16], back:[12,1,10,16], left:[0,1,1,16], right:[11,1,1,16], top:[1,0,10,1], bottom:[11,0,10,1] };
    const base='#16181d', edge='#0d0f13';
    const put=(ctx,reg,f)=>{ const [u,v,w,h]=reg; for(let y=0;y<h;y++)for(let x=0;x<w;x++){ const col=f(x,y,w,h); if(col){ ctx.fillStyle=col; ctx.fillRect(u+x,v+y,1,1); } } };
    // BACK: diamond emblem + diagonal stripes + glowing hem
    put(c,CR.back,(x,y,w,h)=>{
      if(x===0||x===w-1||y===h-1) return edge;
      if(y>=h-2) return aLo;
      if(y>=3&&y<=9&&Math.abs(x-4.5)+Math.abs(y-6)<=3.4) return bLo;
      if(y>=10&&(x+y*2)%6<2) return aLo;
      return base;
    });
    put(cgx,CR.back,(x,y)=>{
      if(y>=3&&y<=9&&Math.abs(x-4.5)+Math.abs(y-6)<=2.2) return B;
      if(y>=10&&(x+y*2)%6<2) return A;
      if(y>=14) return A;
      return null;
    });
    // FRONT: circuit lines with node dots
    put(c,CR.front,(x,y,w,h)=>{
      if(x===0||x===w-1||y===h-1) return edge;
      if(y>=h-2) return aLo;
      if(x===2||x===7) return bLo;
      if((y===4||y===10)&&(x===2||x===7)) return aLo;
      return base;
    });
    put(cgx,CR.front,(x,y)=>{
      if(x===2||x===7) return B;
      if((y===4||y===10)&&(x===2||x===7)) return A;
      if(y>=14) return A;
      return null;
    });
    put(c,CR.left,()=>base); put(c,CR.right,()=>base); put(c,CR.top,()=>base); put(c,CR.bottom,()=>edge);
    put(cgx,CR.right,(x,y)=> y===5 ? A : null);
    put(cgx,CR.left,(x,y)=> y===5 ? A : null);
  }

  return { canvas:skin, glowCanvas:glow, capeCanvas, capeGlowCanvas:capeGlow, desc:{ accent:accentKey, hair:hairKey, fit:fitKey, seed, cape:!!opts.cape } };
}

root.SkinGenCore = { PAL, ACCENTS, HAIRS, FITS, UV, createSkin, mulberry32 };
if (typeof module !== 'undefined' && module.exports) module.exports = root.SkinGenCore;
})(typeof window !== 'undefined' ? window : globalThis);
