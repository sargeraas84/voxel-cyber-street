/* ============================================================================
   CHARACTER RIG — shared Three.js voxel character (Minecraft proportions,
   oversized streetwear shells) + animation state machine.
   Exports: window.CharacterRig = { createCharacter(THREE, opts), ANIMS }
   Requires three.js global + a texture pair (THREE.CanvasTexture or Texture).
   ========================================================================== */
(function (root) {
'use strict';

const ANIMS = ['idle', 'walk', 'wave', 'dance'];

function createCharacter(THREE, texSkin, texGlow, opts){
  opts = opts || {};
  const mkBox = (w,h,d,uvset,layer,texH) => {
    const g = new THREE.BoxGeometry(w,h,d);
    const uv = g.attributes.uv;
    // character faces +z: -x face is its RIGHT, +x face is its LEFT
    const regs = [uvset.left, uvset.right, uvset.top, uvset.bottom, uvset.front, uvset.back];
    const TS = 64, TH = texH || 64;
    for(let f=0;f<6;f++){
      const [u0,v0,rw,rh] = regs[f];
      const u00=u0/TS, u11=(u0+rw)/TS, v00=1-(v0+rh)/TH, v11=1-v0/TH;
      const i=f*4;
      uv.setXY(i+0,u00,v11); uv.setXY(i+1,u11,v11); uv.setXY(i+2,u00,v00); uv.setXY(i+3,u11,v00);
    }
    uv.needsUpdate = true;
    const mat = new THREE.MeshLambertMaterial({ map:texSkin, transparent:true, alphaTest:0.05 });
    const mesh = new THREE.Mesh(g,mat);
    mesh.renderOrder = layer==='outer' ? 2 : 1;
    return mesh;
  };
  const mkGlowBox = (w,h,d,uvset,texH) => {
    const g = new THREE.BoxGeometry(w,h,d);
    const uv = g.attributes.uv;
    const regs = [uvset.left, uvset.right, uvset.top, uvset.bottom, uvset.front, uvset.back];
    const TS = 64, TH = texH || 64;
    for(let f=0;f<6;f++){
      const [u0,v0,rw,rh] = regs[f];
      const u00=u0/TS, u11=(u0+rw)/TS, v00=1-(v0+rh)/TH, v11=1-v0/TH;
      const i=f*4;
      uv.setXY(i+0,u00,v11); uv.setXY(i+1,u11,v11); uv.setXY(i+2,u00,v00); uv.setXY(i+3,u11,v00);
    }
    uv.needsUpdate = true;
    const mat = new THREE.MeshBasicMaterial({
      map:texGlow, transparent:true, opacity:1.0, blending:THREE.AdditiveBlending,
      depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2
    });
    const mesh = new THREE.Mesh(g,mat);
    mesh.renderOrder = 3;
    return mesh;
  };

  const UV = root.SkinGenCore.UV;
  const root3 = new THREE.Group();
  const parts = {};
  const shells = opts.shells !== false; // oversized shells on/off

  // HEAD 23..31
  const headPivot = new THREE.Group();
  headPivot.position.y = 23;
  const head = new THREE.Group();
  head.position.y = 4;
  head.add(mkBox(8,8,8, UV.head.base, 'base'));
  head.add(mkBox(9.6,9.6,9.6, UV.head.hat, 'outer'));
  head.add(mkGlowBox(9.62,9.62,9.62, UV.head.hat));
  headPivot.add(head);
  root3.add(headPivot);
  parts.head = headPivot;

  // BODY 12..24
  const body = new THREE.Group();
  body.position.y = 18;
  body.add(mkBox(8,12,4, UV.body.base, 'base'));
  const bodyOuter = mkBox(10,12.4,5.6, UV.body.outer, 'outer');
  const bodyGlow  = mkGlowBox(10.06,12.46,5.66, UV.body.outer);
  bodyOuter.position.y = -0.5; bodyGlow.position.y = -0.5;
  if(!shells){ bodyOuter.visible = false; bodyGlow.visible = false; }
  body.add(bodyOuter, bodyGlow);
  root3.add(body);
  parts.body = body;
  parts.bodyOuter = bodyOuter;

  // ARMS shoulder 22.5
  function mkArm(side){
    const pivot = new THREE.Group();
    pivot.position.set(side*6.9, 22.5, 0);
    const uvset = side>0 ? UV.armR : UV.armL;
    const base  = mkBox(4,12,4, uvset.base, 'base');
    const outer = mkBox(6.4,12.6,6.4, uvset.outer, 'outer');
    const glow  = mkGlowBox(6.46,12.66,6.46, uvset.outer);
    base.position.y = -6; outer.position.y = -6.1; glow.position.y = -6.1;
    if(!shells){ outer.visible = false; glow.visible = false; }
    pivot.add(base, outer, glow);
    root3.add(pivot);
    return pivot;
  }
  parts.armR = mkArm(1);
  parts.armL = mkArm(-1);

  // LEGS hip 12
  function mkLeg(side){
    const pivot = new THREE.Group();
    pivot.position.set(side*2.05, 12, 0);
    const uvset = side>0 ? UV.legR : UV.legL;
    const base  = mkBox(4,12,4, uvset.base, 'base');
    const outer = mkBox(5.6,12.4,5.6, uvset.outer, 'outer');
    const glow  = mkGlowBox(5.66,12.46,5.66, uvset.outer);
    base.position.y = -6; outer.position.y = -6.0; glow.position.y = -6.0;
    if(!shells){ outer.visible = false; glow.visible = false; }
    pivot.add(base, outer, glow);
    root3.add(pivot);
    return pivot;
  }
  parts.legR = mkLeg(1);
  parts.legL = mkLeg(-1);

  // SNEAKERS
  function mkShoe(side){
    const g = new THREE.Group();
    const soleMat = new THREE.MeshLambertMaterial({ color:0x0a0b0e });
    const upMat   = new THREE.MeshLambertMaterial({ color:0x14161b });
    const trimMat = new THREE.MeshBasicMaterial({ color: side>0 ? 0xff2d95 : 0x19e3ff });
    const sole = new THREE.Mesh(new THREE.BoxGeometry(6.4,1.4,6.6), soleMat);
    sole.position.set(0,0.7,0.6);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(5.8,3.4,5.8), upMat);
    upper.position.set(0,3.0,0.3);
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(3.4,2.6,1.6), upMat);
    tongue.position.set(0,3.4,3.2);
    const collar = new THREE.Mesh(new THREE.BoxGeometry(6.2,1.2,4.2), upMat);
    collar.position.set(0,4.6,-0.7);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.3,1.4,4.6), trimMat);
    stripe.position.set(side*3.0,2.4,0.6);
    const heel = new THREE.Mesh(new THREE.BoxGeometry(1.6,0.6,0.3), trimMat);
    heel.position.set(0,4.4,-2.4);
    g.add(sole, upper, tongue, collar, stripe, heel);
    return g;
  }
  const shoeR = mkShoe(1);  shoeR.position.set(2.05,0,0);
  const shoeL = mkShoe(-1); shoeL.position.set(-2.05,0,0);
  root3.add(shoeR, shoeL);
  parts.shoeR = shoeR; parts.shoeL = shoeL;

  // CAPE (optional — 64x32 cape texture pair, dedicated materials)
  let capePivot = null;
  if(opts.texCape){
    const CAPE_UV = {
      front:[1,1,10,16], back:[12,1,10,16], left:[0,1,1,16], right:[11,1,1,16],
      top:[1,0,10,1], bottom:[11,0,10,1],
    };
    const capeUVBox = (w,h,d) => {
      const g = new THREE.BoxGeometry(w,h,d);
      const uv = g.attributes.uv;
      const regs = [CAPE_UV.left, CAPE_UV.right, CAPE_UV.top, CAPE_UV.bottom, CAPE_UV.front, CAPE_UV.back];
      for(let f=0;f<6;f++){
        const [u0,v0,rw,rh] = regs[f];
        const u00=u0/64, u11=(u0+rw)/64, v00=1-(v0+rh)/32, v11=1-v0/32;
        const i=f*4;
        uv.setXY(i+0,u00,v11); uv.setXY(i+1,u11,v11); uv.setXY(i+2,u00,v00); uv.setXY(i+3,u11,v00);
      }
      uv.needsUpdate = true;
      return g;
    };
    capePivot = new THREE.Group();
    capePivot.position.set(0, 24.4, -2.55);
    const capeMesh = new THREE.Mesh(capeUVBox(10.4,16.4,1.1),
      new THREE.MeshLambertMaterial({ map:opts.texCape, transparent:true, alphaTest:0.05 }));
    const capeGlowM = new THREE.Mesh(capeUVBox(10.46,16.46,1.16),
      new THREE.MeshBasicMaterial({ map:opts.texCapeGlow, transparent:true, opacity:1.0,
        blending:THREE.AdditiveBlending, depthWrite:false,
        polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2 }));
    capeMesh.renderOrder = 2; capeGlowM.renderOrder = 3;
    capeMesh.position.y = -8.2; capeGlowM.position.y = -8.2;
    capePivot.add(capeMesh, capeGlowM);
    root3.add(capePivot);
    parts.cape = capePivot;
  }

  // ---------------- animation state machine ----------------
  const state = { anim:'idle', t:0, speed:1 };
  const BASE = {
    head:{ x:0, y:0, z:0 }, body:{ y:18, x:0, y2:0.03, z:0 },
    armR:{ x:-0.14, z:-0.10 }, armL:{ x:0.08, z:0.14 },
    legR:{ x:0.10, z:0.04 },  legL:{ x:-0.06, z:-0.05 },
  };
  function applyBase(){
    parts.head.rotation.set(BASE.head.x,0,BASE.head.z);
    parts.body.rotation.set(0,BASE.body.y2,0);
    parts.body.position.y = 18;
    parts.armR.rotation.set(BASE.armR.x,0,BASE.armR.z);
    parts.armL.rotation.set(BASE.armL.x,0,BASE.armL.z);
    parts.legR.rotation.set(BASE.legR.x,0,BASE.legR.z);
    parts.legL.rotation.set(BASE.legL.x,0,BASE.legL.z);
    parts.body.rotation.x = 0;
    if(capePivot) capePivot.rotation.x = 0.10;
  }
  function poseIdle(t){
    applyBase();
    parts.body.position.y = 18 + Math.sin(t*1.6)*0.22;
    parts.head.rotation.y = Math.sin(t*0.5)*0.06;
    parts.armL.rotation.x = 0.08 + Math.sin(t*1.6)*0.03;
    parts.armR.rotation.x = -0.14 + Math.sin(t*1.6+1)*0.03;
  }
  function poseWalk(t){
    applyBase();
    const w = t*4.2;
    parts.legR.rotation.x = Math.sin(w)*0.55;
    parts.legL.rotation.x = Math.sin(w+Math.PI)*0.55;
    parts.armR.rotation.x = Math.sin(w+Math.PI)*0.45 - 0.05;
    parts.armL.rotation.x = Math.sin(w)*0.45 - 0.05;
    parts.body.position.y = 18 + Math.abs(Math.sin(w))*0.28;
    parts.body.rotation.y = Math.sin(w)*0.06;
    parts.head.rotation.y = Math.sin(w)*0.03;
  }
  function poseWave(t){
    applyBase();
    const w = t*5.0;
    parts.armR.rotation.z = -2.35;                        // raised
    parts.armR.rotation.x = Math.sin(w)*0.25;
    parts.head.rotation.z = 0.10;                         // cheeky tilt
    parts.head.rotation.y = -0.12;
    parts.armL.rotation.x = 0.08 + Math.sin(t*1.6)*0.03;
    parts.body.position.y = 18 + Math.sin(t*1.6)*0.15;
  }
  function poseDance(t){
    applyBase();
    const w = t*5.6;
    parts.body.position.y = 18 + Math.abs(Math.sin(w))*0.9;
    parts.body.rotation.y = Math.sin(w*0.5)*0.35;
    parts.armR.rotation.z = -0.9 + Math.sin(w)*0.8;
    parts.armL.rotation.z =  0.9 - Math.sin(w)*0.8;
    parts.armR.rotation.x = Math.sin(w*2)*0.3;
    parts.armL.rotation.x = Math.sin(w*2+1)*0.3;
    parts.legR.rotation.x = Math.sin(w)*0.18;
    parts.legL.rotation.x = Math.sin(w+Math.PI)*0.18;
    parts.legR.rotation.z = Math.cos(w)*0.10;
    parts.legL.rotation.z = -Math.cos(w)*0.10;
    parts.head.rotation.z = Math.sin(w*0.5)*0.16;
    parts.head.rotation.y = Math.sin(w)*0.12;
  }
  const POSES = { idle:poseIdle, walk:poseWalk, wave:poseWave, dance:poseDance };

  function tick(dt){
    state.t += dt * state.speed;
    (POSES[state.anim] || poseIdle)(state.t);
    // cape sway follows the animation
    if(capePivot){
      const t = state.t;
      let amp = 0.05, freq = 1.4, base = 0.10;
      if(state.anim==='walk'){ amp = 0.22; freq = 4.2; }
      else if(state.anim==='dance'){ amp = 0.30; freq = 5.6; base = 0.22; }
      else if(state.anim==='wave'){ amp = 0.08; freq = 2.0; }
      capePivot.rotation.x = base + Math.sin(t*freq)*amp;
    }
  }
  function setCape(on){ if(capePivot) capePivot.visible = !!on; }
  function hasCape(){ return !!capePivot; }
  function setAnim(name){
    if(!POSES[name]) return;
    if(state.anim === name) return;
    state.anim = name; state.t = 0;
  }
  function snapTo(name){ state.anim = name; state.t = 0; }

  return { root:root3, parts, state, tick, setAnim, snapTo, setCape, hasCape, ANIMS };
}

root.CharacterRig = { createCharacter, ANIMS };
})(typeof window !== 'undefined' ? window : globalThis);
