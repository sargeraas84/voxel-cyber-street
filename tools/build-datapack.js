#!/usr/bin/env node
/**
 * build-datapack.js — generates the "Neon District" demo datapack: a flat night
 * platform with a neon-lit street populated with FORCED Corrupted Skin zombie
 * villagers (custom names cyber_01..cyber_36 render exact pack skins via the
 * mod's forced-name path), glowstone signage, and a camera route of beacons.
 *
 * Datapack format: pack_format 48 (MC 1.21), functions under data/vcsdemo/function,
 * tags under data/minecraft/tags/function (load + tick). /function vcsdemo:build
 * raises the street; vcsdemo:spawn fills it with named corrupted villagers;
 * vcsdemo:route lays the beacon camera path; vcsdemo:clear wipes the scene.
 *
 * Output: dist/vcsdemo-neon-district.zip (drop into <world>/datapacks/)
 * Usage: node tools/build-datapack.js
 */
const fs = require('fs');
const path = require('path');
const { makeZip } = require('./lib/zip');

const root = path.resolve(__dirname, '..');

// ---------------- scene geometry (all coordinates deterministic)
const STREET_Y = 64;                 // ground level of the platform
const ROAD_LEN = 60;                 // street runs z = -20..39
const ROAD_W = 7;                    // x = -3..3
const LAMP_STEP = 10;                // lamp posts every 10 blocks
const CORRUPTED = 12;                // named corrupted villagers on the street
const CROWD = 14;                    // extra vanilla zombies for atmosphere

const f = [];
const fn = (name, lines) => f.push({ name: `data/vcsdemo/function/${name}.mcfunction`, data: Buffer.from(lines.join('\n') + '\n', 'utf8') });
const tag = (name, values) => f.push({ name: `data/minecraft/tags/function/${name}.json`, data: Buffer.from(JSON.stringify({ values }), 'utf8') });

// ---------------- pack metadata
f.push({
  name: 'pack.mcmeta',
  data: Buffer.from(JSON.stringify({
    pack: { pack_format: 48, description: 'VOXEL CYBER-STREET — Neon District demo (Corrupted Skins showcase)' },
  }, null, 2), 'utf8'),
});

// ================= build: raise the neon street =================
{
  const L = [];
  // base platform 41x61, night-proof (removes sky light concerns; street is open-air dark)
  L.push(`fill ~-20 ${STREET_Y - 1} ~-20 ~20 ${STREET_Y - 1} ~40 minecraft:smooth_stone`);
  // road strip: dark custom road look via polished basalt + deepslate tiles
  L.push(`fill ~-3 ${STREET_Y - 1} ~-20 ~3 ${STREET_Y - 1} ~39 minecraft:polished_basalt`);
  L.push(`fill ~-1 ${STREET_Y - 1} ~-20 ~1 ${STREET_Y - 1} ~39 minecraft:polished_deepslate`);
  // center neon strip (cyan) + edge strips (pink)
  L.push(`fill ~0 ${STREET_Y - 1} ~-20 ~0 ${STREET_Y - 1} ~39 minecraft:cyan_concrete_powder`);
  L.push(`fill ~-3 ${STREET_Y - 1} ~-20 ~-3 ${STREET_Y - 1} ~39 minecraft:pink_concrete_powder`);
  L.push(`fill ~3 ${STREET_Y - 1} ~-20 ~3 ${STREET_Y - 1} ~39 minecraft:pink_concrete_powder`);
  // sidewalks
  L.push(`fill ~-5 ${STREET_Y - 1} ~-20 ~-4 ${STREET_Y - 1} ~39 minecraft:gray_concrete`);
  L.push(`fill ~4 ${STREET_Y - 1} ~-20 ~5 ${STREET_Y - 1} ~39 minecraft:gray_concrete`);
  fn('build', L);
}

// lamp posts with glowstone heads + neon-underlit signs (part of build2)
{
  const L = [];
  for (let z = -20; z <= 39; z += LAMP_STEP) {
    for (const x of [-4, 4]) {
      L.push(`fill ~${x} ${STREET_Y} ~${z} ~${x} ${STREET_Y + 3} ~${z} minecraft:black_concrete`);
      L.push(`setblock ~${x} ${STREET_Y + 4} ~${z} minecraft:glowstone`);
      L.push(`setblock ~${x} ${STREET_Y + 3} ~${z} minecraft:sea_lantern`);
    }
  }
  // storefront backs: alternating concrete walls with glowstone signage bands
  for (let z = -18; z <= 38; z += 8) {
    for (const s of [-1, 1]) {
      const x = 7 * s;
      L.push(`fill ~${x} ${STREET_Y} ~${z} ~${x} ${STREET_Y + 5} ~${z + 5} minecraft:${s < 0 ? 'light_gray_concrete' : 'cyan_concrete'}`);
      L.push(`fill ~${6 * s} ${STREET_Y + 4} ~${z + 1} ~${6 * s} ${STREET_Y + 4} ~${z + 4} minecraft:glowstone`);
      L.push(`fill ~${6 * s} ${STREET_Y + 2} ~${z + 1} ~${6 * s} ${STREET_Y + 2} ~${z + 4} minecraft:magenta_glazed_terracotta`);
    }
  }
  fn('build2', L);
}

// ================= spawn: the cast =================
{
  const L = [];
  // 12 forced corrupted villagers — names cyber_01.. pin exact pack skins.
  // NoAI + persistent so they pose forever and never burn/despawn.
  const spots = [];
  for (let i = 0; i < CORRUPTED; i++) {
    const x = i % 2 === 0 ? -2 : 2;
    const z = -16 + Math.floor(i / 2) * 10 + (i % 2) * 4;
    spots.push([x, z]);
  }
  spots.forEach(([x, z], i) => {
    const nn = String(i + 1).padStart(2, '0');
    L.push(`summon minecraft:zombie_villager ~${x} ${STREET_Y} ~${z} {CustomName:'"cyber_${nn}"',CustomNameVisible:false,NoAI:1b,PersistenceRequired:1b,CanPickUpLoot:0b}`);
  });
  // a loose crowd of regular zombies shuffling behind the barriers of realism
  for (let i = 0; i < CROWD; i++) {
    const x = -6 + (i * 7) % 13;
    const z = -18 + ((i * 5) % 56);
    L.push(`summon minecraft:zombie ~${x} ${STREET_Y} ~${z} {NoAI:1b,PersistenceRequired:1b}`);
  }
  // ~1/3 of the crowd converts naturally via the mod's RNG — but on a fresh
  // client RNG(2000L) sequence, so the demo is reproducible too.
  fn('spawn', L);
}

// ================= route: beacon camera path =================
{
  const L = [];
  // glass pillars + colored beacons at the 5 camera stops along the street
  const stops = [
    [-14, 0, 'minecraft:white_concrete'],   // overview
    [-7, -2, 'minecraft:cyan_concrete'],    // mid street
    [0, 8, 'minecraft:magenta_concrete'],   // center crossing
    [7, 20, 'minecraft:pink_concrete'],     // south blocks
    [14, 34, 'minecraft:light_blue_concrete'], // end of street
  ];
  for (const [x, z, block] of stops) {
    L.push(`fill ~${x} ${STREET_Y} ~${z} ~${x} ${STREET_Y + 2} ~${z} minecraft:iron_bars`);
    L.push(`setblock ~${x} ${STREET_Y + 3} ~${z} ${block}`);
    L.push(`setblock ~${x} ${STREET_Y + 4} ~${z} minecraft:beacon`);
  }
  fn('route', L);
}

// ================= one-shot scene =================
fn('scene', [
  'function vcsdemo:build',
  'function vcsdemo:build2',
  'function vcsdemo:spawn',
  'function vcsdemo:route',
  'time set night',
  'effect give @a minecraft:night_vision infinite 0 true',
  `tellraw @a {"text":"[Neon District] street built, ${CORRUPTED} Corrupted Skins posed. Beacons mark camera stops. Run /function vcsdemo:tour for the self-guided narration, /vshot burst 10 for marketing shots.","color":"aqua"}`,
]);

// ================= self-guided walkthrough (repeating narration) =================
// A tick-driven scoreboard clock walks every online player through the 5 beacon
// stops with an actionbar guide + chat narration, then loops (~64s per lap).
fn('init', [
  'scoreboard objectives add vcs_state dummy',
  'scoreboard objectives add vcs_tour dummy',
  'tellraw @a {"text":"[Neon District] loaded — /function vcsdemo:scene (need ~40 free blocks around you)","color":"aqua"}',
]);
tag('tick', ['vcsdemo:tick']);
fn('tick', [
  'execute if score #tour vcs_state matches 1 run scoreboard players add @a vcs_tour 1',
  'execute if score #tour vcs_state matches 1 run scoreboard players set @a[scores={vcs_tour=1150..}] vcs_tour 0',
  // chat narration fires once at each stop boundary (8s windows)
  'execute if score #tour vcs_state matches 1 run tellraw @a[scores={vcs_tour=1}] {"text":"[TOUR 1/6] Overview — follow the WHITE beacon up and look down the strip. That is the whole Neon District.","color":"white"}',
  'execute if score #tour vcs_state matches 1 run tellraw @a[scores={vcs_tour=191}] {"text":"[TOUR 2/6] Street level — the CYAN beacon. Two Corrupted Skins wait ahead; check their masks.","color":"aqua"}',
  'execute if score #tour vcs_state matches 1 run tellraw @a[scores={vcs_tour=381}] {"text":"[TOUR 3/6] Cape line — MAGENTA beacon. Look north along the pink edge strips: the glowing tech capes.","color":"light_purple"}',
  'execute if score #tour vcs_state matches 1 run tellraw @a[scores={vcs_tour=571}] {"text":"[TOUR 4/6] Close-up — PINK beacon. Land 3 blocks behind a Corrupted Skin and study the cape.","color":"pink"}',
  'execute if score #tour vcs_state matches 1 run tellraw @a[scores={vcs_tour=761}] {"text":"[TOUR 5/6] The cast — LIGHT-BLUE beacon at the street end. Turn around for the group shot.","color":"blue"}',
  'execute if score #tour vcs_state matches 1 run tellraw @a[scores={vcs_tour=951}] {"text":"[TOUR 6/6] Capture it — /vshot orbit 12 for a turntable, /vshot burst 6 while flying. Loop restarts in a moment.","color":"yellow"}',
  // persistent actionbar wayfinder for the current stop window (160 ticks each)
  'execute if score #tour vcs_state matches 1 run title @a[scores={vcs_tour=2..190}] actionbar {"text":"① follow the WHITE beacon up","color":"white"}',
  'execute if score #tour vcs_state matches 1 run title @a[scores={vcs_tour=192..380}] actionbar {"text":"② CYAN beacon — street level","color":"aqua"}',
  'execute if score #tour vcs_state matches 1 run title @a[scores={vcs_tour=382..570}] actionbar {"text":"③ MAGENTA beacon — cape line","color":"light_purple"}',
  'execute if score #tour vcs_state matches 1 run title @a[scores={vcs_tour=572..760}] actionbar {"text":"④ PINK beacon — cape close-up","color":"pink"}',
  'execute if score #tour vcs_state matches 1 run title @a[scores={vcs_tour=762..950}] actionbar {"text":"⑤ LIGHT-BLUE beacon — the cast","color":"blue"}',
  'execute if score #tour vcs_state matches 1 run title @a[scores={vcs_tour=952..1149}] actionbar {"text":"⑥ /vshot orbit 12 · /vshot burst 6","color":"yellow"}',
]);
fn('tour', [
  'scoreboard objectives add vcs_state dummy',
  'scoreboard objectives add vcs_tour dummy',
  'scoreboard players set #tour vcs_state 1',
  'scoreboard players set @a vcs_tour 0',
  'tellraw @a {"text":"[Neon District] self-guided tour started — /function vcsdemo:tour_off to stop","color":"green"}',
]);
fn('tour_off', [
  'scoreboard players set #tour vcs_state 0',
  'title @a actionbar {"text":""}',
  'tellraw @a {"text":"[Neon District] tour stopped.","color":"gray"}',
]);

// ================= cleanup =================
fn('clear', [
  `fill ~-20 ${STREET_Y} ~-20 ~20 ${STREET_Y + 12} ~40 minecraft:air`,
  'kill @e[type=minecraft:zombie_villager,name=cyber_*]',
  'kill @e[type=minecraft:zombie_villager]',
  'kill @e[type=minecraft:zombie]',
  'function vcsdemo:tour_off',
  'tellraw @a {"text":"[Neon District] cleared.","color":"gray"}',
]);

// load/tick tags
tag('load', ['vcsdemo:init']);

// ================= zip it =================
const zip = makeZip(f);
const dist = path.join(root, 'dist');
fs.mkdirSync(dist, { recursive: true });
const out = path.join(dist, 'vcsdemo-neon-district.zip');
fs.writeFileSync(out, zip);
console.log(`datapack → ${out} (${f.length} files, ${(zip.length / 1024).toFixed(1)} KB)`);
console.log('install: copy into <world>/datapacks/, then /function vcsdemo:scene');
