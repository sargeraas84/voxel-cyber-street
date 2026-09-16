#!/usr/bin/env node
/**
 * validate-packs.js — re-checks the built .mcpacks in dist/ against the
 * Microsoft skin-pack spec (learn.microsoft.com packagingaskinpack).
 * Exit 1 with the full violation list on any deviation.
 *
 * Usage: node tools/validate-packs.js
 */
const fs = require('fs');
const path = require('path');
const { validateMcpack } = require('./lib/mcpack-spec');

const root = path.resolve(__dirname, '..');
const PACKS = [
  { file: 'dist/VOXEL-CYBER-STREET.mcpack', locName: 'VoxelCyberStreet' },
  { file: 'dist/VOXEL-CYBER-STREET-STARTER.mcpack', locName: 'VoxelCyberStreetStarter' },
];

let failed = false;
for (const p of PACKS) {
  const abs = path.join(root, p.file);
  if (!fs.existsSync(abs)) {
    console.error(`✗ ${p.file}: missing — run the exporter first`);
    failed = true;
    continue;
  }
  try {
    const info = validateMcpack(fs.readFileSync(abs), { locName: p.locName });
    console.log(`✓ ${p.file} — spec compliant: ${info.skins} skins, ${info.languages.join(', ')}, ${info.files} files`);
  } catch (e) {
    console.error(`✗ ${p.file}:\n${e.message}`);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
