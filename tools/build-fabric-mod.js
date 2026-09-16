#!/usr/bin/env node
/**
 * build-fabric-mod.js — packages VOXEL CYBER-STREET as a Java Edition (Fabric) mod.
 *
 * LOCKSTEP: resources are NOT generated here. Run `node tools/sync-fabric-resources.js`
 * first (npm run pack does) — it copies pack/pack.json + skins + capes + Bedrock-format
 * skins.json + 4-language .lang files into tools/fabric-mod/src/main/resources, which is
 * the exact tree Gradle compiles. This script zips that same tree (plus the Java sources
 * and gradle files into the src zip), so the zip-builder and the compiled 1.21 jar can
 * never drift.
 *
 * The mod applies the pack's skins + glowing capes to NPCs so buyers see them in-world:
 *   • ZombieVillager conversion → infected cyber-teen ("Corrupted Skin") + glowing cape
 *     (CorruptedSkinTextureMixin swaps the texture, CorruptedCapeFeatureRenderer draws it)
 *   • PlayerEntity skin hook (SkinApplierMixin) — NPC platforms spawning fake players
 *     named cyber_01.. resolve pack skins
 *
 * Outputs:
 *   dist/voxel-cyber-street-fabric-1.0.0.jar   resources jar (metadata/artifact)
 *   dist/voxel-cyber-street-fabric-src.zip     full gradle-ready source tree
 *   dist/voxel-cyber-street-fabric-1.21.jar    copied by compile-fabric-mod.sh after
 *                                              `npm run fabric:compile` (the real jar)
 */
const path = require('path');
const fs = require('fs');
const { makeZip } = require('./lib/zip');

const root = path.resolve(__dirname, '..');
const MOD_ID = 'voxelcyberstreet';
const VERSION = '1.0.0';

const resDir = path.join(__dirname, 'fabric-mod', 'src', 'main', 'resources');

if (!fs.existsSync(path.join(resDir, 'assets', MOD_ID, 'skins.json'))) {
  console.error('No synced resources found — run: node tools/sync-fabric-resources.js');
  process.exit(1);
}

(async () => {
  const files = [];

  // ---------- resources: copy the synced tree verbatim (jar root layout)
  addDir(resDir, '');
  function addDir(dir, prefix) {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${f.name}` : f.name;
      if (f.isDirectory()) addDir(path.join(dir, f.name), rel);
      else files.push({ name: rel, data: fs.readFileSync(path.join(dir, f.name)) });
    }
  }

  // ---------- Java sources — the project that actually compiles with Gradle
  const javaRoot = path.join(__dirname, 'fabric-mod', 'src', 'main', 'java');
  const JAVA_FILES = [
    'com/voxelcyberstreet/VoxelCyberStreet.java',
    'com/voxelcyberstreet/VoxelCyberStreetClient.java',
    'com/voxelcyberstreet/SkinRegistry.java',
    'com/voxelcyberstreet/CorruptedSkins.java',
    'com/voxelcyberstreet/CorruptedCapeFeatureRenderer.java',
    'com/voxelcyberstreet/mixin/SkinApplierMixin.java',
    'com/voxelcyberstreet/mixin/ZombieVillagerMixin.java',
    'com/voxelcyberstreet/mixin/CorruptedSkinTextureMixin.java',
  ];
  for (const rel of JAVA_FILES) {
    add(`src/main/java/${rel}`, fs.readFileSync(path.join(javaRoot, rel)));
  }
  function add(name, data) { files.push({ name, data }); }

  // ---------- gradle files — mirror tools/fabric-mod (Loom 1.7.4, verified build)
  for (const g of ['build.gradle', 'settings.gradle', 'gradle.properties']) {
    add(g, fs.readFileSync(path.join(__dirname, 'fabric-mod', g)));
  }

  // ---------- build the two zips
  const resNames = new Set(
    [...walk(resDir)].map(p => path.relative(resDir, p).replace(/\\/g, '/')));
  const jar = makeZip(files.filter(f => resNames.has(f.name)));
  const srcZip = makeZip(files);

  const dist = path.join(root, 'dist');
  fs.mkdirSync(dist, { recursive: true });
  const jarPath = path.join(dist, `voxel-cyber-street-fabric-${VERSION}.jar`);
  const srcPath = path.join(dist, 'voxel-cyber-street-fabric-src.zip');
  fs.writeFileSync(jarPath, jar);
  fs.writeFileSync(srcPath, srcZip);

  console.log(`fabric jar  → ${jarPath}  (${(jar.length/1024).toFixed(1)} KB, ${jar.length && resNames.size} resource entries)`);
  console.log(`fabric src  → ${srcPath}  (${(srcZip.length/1024).toFixed(1)} KB)`);
})().catch(e => { console.error(e); process.exit(1); });

function* walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) yield* walk(p);
    else yield p;
  }
}
