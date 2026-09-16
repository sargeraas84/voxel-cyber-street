#!/usr/bin/env node
/**
 * craft-demo-world.js — builds the "NeonDistrict" singleplayer save the
 * unattended autopilot boots into (bash tools/record-demo.sh <route>).
 *
 * Strategy: never hand-write level.dat. A real vanilla 1.21 server creates a
 * perfectly valid flat world; the Neon District datapack is pre-seeded into
 * world/datapacks (auto-enabled on load), the scene is built from the server
 * console with an explicit `execute positioned 0.5 64 0.5` anchor (console
 * commands run at the world spawn, which we set first), and the resulting
 * save is copied into the client's saves folder. The capture client then
 * only has to teleport to the anchor and roll camera.
 *
 * Server jar: reused from .toolchain when present, otherwise downloaded from
 * Mojang's official piston-data CDN (pinned 1.21 + sha1 check).
 *
 * Usage: node tools/craft-demo-world.js
 * Output: tools/fabric-mod/run/saves/NeonDistrict/
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const MOD_RUN = path.join(ROOT, 'tools', 'fabric-mod', 'run');
const SAVES = path.join(MOD_RUN, 'saves');
const WORK = path.join(ROOT, '.toolchain', 'server-work');
const WORLD_NAME = 'NeonDistrict';
const MC = '1.21';
const ANCHOR = '0.5 64 0.5';           // scene anchor the routes are authored for
const JAVA = path.join(ROOT, '.toolchain', 'jdk-21.0.12.1+1', 'bin',
  process.platform === 'win32' ? 'java.exe' : 'java');

const log = m => console.log('[craft-world] ' + m);
function fail(msg) { console.error('[craft-world] FATAL: ' + msg); process.exit(1); }

// --- locate or fetch the server jar ----------------------------------------
function findServerJar() {
  const cached = path.join(ROOT, '.toolchain', `server-${MC}.jar`);
  if (fs.existsSync(cached)) return cached;

  fs.mkdirSync(path.dirname(cached), { recursive: true });
  log('fetching server jar from piston-meta (pinned ' + MC + ')…');
  spawnSync('node', ['-e', `
    const https=require('https'),fs=require('fs'),crypto=require('crypto');
    const get=u=>new Promise((res,rej)=>https.get(u,r=>{
      if(r.statusCode>=300&&r.headers.location) return res(get(r.headers.location));
      const c=[];r.on('data',d=>c.push(d));r.on('end',()=>res(Buffer.concat(c)));
    }).on('error',rej));
    (async()=>{
      const man=JSON.parse((await get('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json')).toString());
      const v=man.versions.find(v=>v.id==='${MC}');
      const meta=JSON.parse((await get(v.url)).toString());
      const dl=meta.downloads.server;
      const jar=await get(dl.url);
      const sha=crypto.createHash('sha1').update(jar).digest('hex');
      if(sha!==dl.sha1) throw new Error('sha1 mismatch: '+sha+' != '+dl.sha1);
      fs.writeFileSync(process.argv[1],jar);
      console.log('downloaded',jar.length,'bytes; sha1 verified');
    })().catch(e=>{console.error(e);process.exit(1)});
  `, cached], { stdio: 'inherit' });
  if (!fs.existsSync(cached)) fail('server jar download failed');
  return cached;
}

// --- run the server, feed console commands, wait for clean exit ------------
function runServer(jar, commands) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    let buffer = '';
    let idx = 0;
    let sent = false;
    const proc = spawn(JAVA, ['-jar', jar, 'nogui'], { cwd: WORK, stdio: ['pipe', 'pipe', 'pipe'] });

    const send = () => {
      if (idx < commands.length) {
        const c = commands[idx++];
        log('console> ' + c);
        proc.stdin.write(c + '\n');
        setTimeout(send, 2200);
      } else {
        setTimeout(() => { log('console> stop'); proc.stdin.write('stop\n'); }, 2500);
      }
    };

    proc.stdout.on('data', d => {
      const s = d.toString();
      process.stdout.write(s.split('\n').join('\n') /* passthrough */);
      buffer += s;
      if (!sent && /Done \(/.test(buffer)) { sent = true; setTimeout(send, 800); }
    });
    proc.stderr.on('data', d => process.stdout.write(d.toString()));
    proc.on('exit', code => {
      if (Date.now() - t0 < 25000) return reject(new Error('server died after ' + (Date.now() - t0) + 'ms (code ' + code + ') — likely a bad command or missing eula'));
      resolve(code);
    });
    proc.on('error', reject);
    setTimeout(() => { try { proc.kill(); } catch (_) {} }, 4 * 60 * 1000); // never hang the pipeline
  });
}

async function main() {
  if (!fs.existsSync(JAVA)) fail('portable JDK not found — run the toolchain bootstrap first');

  // fresh datapack, fresh server work dir
  spawnSync('node', [path.join(__dirname, 'build-datapack.js')], { stdio: 'inherit', cwd: ROOT });
  const datapackZip = path.join(ROOT, 'dist', 'vcsdemo-neon-district.zip');
  if (!fs.existsSync(datapackZip)) fail('datapack was not produced');

  const jar = findServerJar();
  log('server jar: ' + jar);
  fs.mkdirSync(WORK, { recursive: true });
  fs.writeFileSync(path.join(WORK, 'eula.txt'), 'eula=true\n');
  fs.writeFileSync(path.join(WORK, 'server.properties'), [
    `level-name=${WORLD_NAME}`,
    'level-type=minecraft\\:flat',
    'generate-structures=false',
    'online-mode=false',
    'spawn-protection=0',
    'view-distance=8',
    'motd=VCS world craft',
    '',
  ].join('\n'));

  // clean world every run
  fs.rmSync(path.join(WORK, WORLD_NAME), { recursive: true, force: true });

  // pre-seed the datapack so it's enabled on first world load
  const worldDir = path.join(WORK, WORLD_NAME);
  fs.mkdirSync(path.join(worldDir, 'datapacks'), { recursive: true });
  fs.copyFileSync(datapackZip, path.join(worldDir, 'datapacks', path.basename(datapackZip)));

  log('booting vanilla server to craft the world…');
  await runServer(jar, [
    'datapack list',                                        // confirm enabled
    'setworldspawn 0 64 0',                                 // anchor = scene origin
    // The default flat preset puts ground at y=-60; the scene (and every
    // camera route) is authored for a street slab at y=63. Lay a solid
    // foundation and clear the sky volume first:
    'fill -24 -60 -24 24 62 40 minecraft:smooth_stone',
    'fill -24 64 -24 24 100 40 minecraft:air',
    // 1.21 quirk: setworldspawn applies on the next tick; teleport the console
    // execution position first, and place a platform slab under the scene
    'execute positioned 0.5 64 0.5 run function vcsdemo:scene',
    'time set midnight',
    'gamerule doDaylightCycle false',
    'gamerule doWeatherCycle false',
    'weather clear 1000000',
    'save-all',
    'stop',
  ]);

  // install into the client saves dir
  fs.mkdirSync(SAVES, { recursive: true });
  const dest = path.join(SAVES, WORLD_NAME);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(worldDir, dest, { recursive: true });
  log('installed: ' + dest);
  log('NEXT: bash tools/record-demo.sh tour');
}

main().catch(e => { fail(e.message); });
