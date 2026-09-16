#!/usr/bin/env node
/**
 * lockstep-pack.js — `npm run pack` orchestration:
 *   1. build-pack.js        — regenerate pack/ (36 skins, capes, glow variants)
 *   2. export-mcpack.js     — Bedrock .mcpack, spec-validated, 4 languages
 *   3. sync-fabric-resources.js — copy pack + Bedrock skins.json + langs → Fabric tree
 *   4. compile-fabric-mod.sh — real Gradle rebuild of the 1.21 jar
 * One command keeps Bedrock and Java edition metadata/artifacts in lockstep.
 * `--no-gradle` skips step 4 (fast metadata-only refresh).
 */
const { spawnSync } = require('child_process');
const path = require('path');

const step = (name, cmd, args) => {
  console.log(`\n━━ ${name} ━━`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  if (r.status !== 0) {
    console.error(`\n✗ ${name} failed (${r.status}) — pipeline aborted.`);
    process.exit(r.status || 1);
  }
};

const noGradle = process.argv.includes('--no-gradle');

step('bedrock pack', 'node', ['tools/build-pack.js']);
step('mcpack export', 'node', ['tools/export-mcpack.js']);
step('fabric sync', 'node', ['tools/sync-fabric-resources.js']);
step('fabric resources jar', 'node', ['tools/build-fabric-mod.js']);
if (!noGradle) step('fabric 1.21 jar', 'bash', ['tools/compile-fabric-mod.sh', 'build']);

console.log('\n✓ lockstep complete — Bedrock mcpack + Fabric 1.21 jar carry the same skins.json');
