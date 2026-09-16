#!/usr/bin/env node
/**
 * build-submission-bundle.js — generates the ACTUAL Marketplace submission zip:
 * only the files the partner portal asks for, named and ordered the way you
 * fill in the form (assets → build → media → docs), plus a MANIFEST.txt that
 * doubles as a fill-in checklist while you paste values into the portal.
 *
 * Output: dist/voxel-cyber-street-submission.zip
 * Usage: node tools/build-submission-bundle.js
 */
const fs = require('fs');
const path = require('path');
const { makeZip } = require('./lib/zip');

const root = path.resolve(__dirname, '..');
const fmt = n => (n / 1024 / 1024).toFixed(2) + ' MB';

// portal form order: what you get asked for, top to bottom
const SECTIONS = [
  {
    section: '1. IDENTITY',
    note: 'Copy these values into the portal text fields.',
    files: [],
    fields: [
      'Product title:            VOXEL CYBER-STREET — Neon Cyberpunk Skins',
      'Publisher/author:         <your name or studio>',
      'Contact e-mail:           <you@example.com>',
      'Short description:        (see listing/short-description.txt)',
      'Full description:         (see listing/description-en.txt)',
    ],
  },
  {
    section: '2. LOCALIZED METADATA',
    note: 'DE/FR/JA versions of the listing copy.',
    files: ['listing/short-description.txt', 'listing/title-de.txt', 'listing/title-fr.txt', 'listing/title-ja.txt',
            'listing/description-de.txt', 'listing/description-fr.txt', 'listing/description-ja.txt'],
  },
  {
    section: '3. STORE ART',
    note: 'Upload in this order; check each portal size limit before upload.',
    files: ['store/cover-2048x1152.png', 'store/pack-icon-128.png', 'store/poster-a3-300dpi.png'],
  },
  {
    section: '4. ICONS',
    note: '512x512 portraits, one per skin (36 pack + 5 starter).',
    files: ['store/icons/icon-NN.png', 'store/icons/starter-icon-N.png'],
  },
  {
    section: '5. BUILDS',
    note: 'The installable packages themselves.',
    files: ['build/VOXEL-CYBER-STREET.mcpack', 'build/VOXEL-CYBER-STREET-STARTER.mcpack',
            'build/voxel-cyber-street-fabric-1.21.jar'],
  },
  {
    section: '6. TRAILER',
    note: '720p store upload; 1080p and social cuts are extras reviewers appreciate.',
    files: ['trailer/voxel-cyber-street-trailer.mp4', 'trailer/voxel-cyber-street-trailer-1080p.mp4'],
  },
  {
    section: '7. COMPLIANCE & DOCS',
    note: 'Attach on request or where the portal offers an "additional docs" slot.',
    files: ['docs/CREDITS.md', 'docs/LICENSE'],
  },
];

// ---------- source files on disk → bundle paths
const SRC = {
  'listing/title-de.txt':       () => text('VOXEL CYBER-STREET — Neon-Cyberpunk-Skins'),
  'listing/title-fr.txt':       () => text('VOXEL CYBER-STREET — Skins Cyberpunk Néon'),
  'listing/title-ja.txt':       () => text('VOXEL CYBER-STREET — ネオン・サイバーパンクスキン'),
  'listing/description-en.txt': () => listingField('long-desc'),
  'listing/short-description.txt': () => listingField('short-desc'),
  'listing/description-de.txt': () => listingField('long-desc-de'),
  'listing/description-fr.txt': () => listingField('long-desc-fr'),
  'listing/description-ja.txt': () => listingField('long-desc-ja'),
  'store/cover-2048x1152.png':  () => disk('cover/voxel-cyber-street-cover-2048x1152.png'),
  'store/pack-icon-128.png':    () => packIconFromMcpack(),
  'store/poster-a3-300dpi.png': () => disk('poster/voxel-cyber-street-poster-a3.png'),
  'store/icons/icon-NN.png':    'icons',
  'store/icons/starter-icon-N.png': 'starter-icons',
  'build/VOXEL-CYBER-STREET.mcpack':          () => disk('dist/VOXEL-CYBER-STREET.mcpack'),
  'build/VOXEL-CYBER-STREET-STARTER.mcpack':  () => disk('dist/VOXEL-CYBER-STREET-STARTER.mcpack'),
  'build/voxel-cyber-street-fabric-1.21.jar': () => disk('dist/voxel-cyber-street-fabric-1.21.jar'),
  'trailer/voxel-cyber-street-trailer.mp4':        () => disk('trailer/voxel-cyber-street-trailer.mp4'),
  'trailer/voxel-cyber-street-trailer-1080p.mp4':  () => disk('trailer/voxel-cyber-street-trailer-1080p.mp4'),
  'docs/CREDITS.md': () => disk('CREDITS.md'),
  'docs/LICENSE':    () => disk('LICENSE'),
};

// ---------- resolve listing copy from the generator (single source of truth)
function listingField(id) {
  const listing = require('./build-store-listing.js');
  const f = listing.FIELDS.find(x => x.id === id);
  return Buffer.from(f.text, 'utf8');
}
function disk(p) {
  const full = path.join(root, p);
  return fs.existsSync(full) ? fs.readFileSync(full) : null;
}
/** The pack icon EXACTLY as it ships inside the Bedrock pack (128×128). */
function packIconFromMcpack() {
  const pack = disk('dist/VOXEL-CYBER-STREET.mcpack');
  if (!pack) return null;
  const { parseStoreZip } = require('./lib/mcpack-spec');
  const entry = parseStoreZip(pack).find(f => f.name === 'pack_icon.png');
  return entry ? Buffer.from(entry.data) : null;
}
function text(s) { return Buffer.from(s, 'utf8'); }

// ---------- assemble
const files = [];
const manifest = [];
let missing = 0;

for (const s of SECTIONS) {
  manifest.push('');
  manifest.push('='.repeat(64));
  manifest.push(s.section);
  manifest.push('='.repeat(64));
  manifest.push(`// ${s.note}`);
  for (const field of s.fields || []) manifest.push('[ ] ' + field);
  for (const bundlePath of s.files) {
    let data = null;
    if (bundlePath === 'store/icons/icon-NN.png') {
      for (let i = 1; i <= 36; i++) {
        const p = `store/icons/icon-${String(i).padStart(2, '0')}.png`;
        const d = disk(`icons/icon-${String(i).padStart(2, '0')}.png`);
        if (d) files.push({ name: p, data: d }); else { missing++; manifest.push(`[ ] MISSING  ${p}`); continue; }
        manifest.push(`[x] ${p} (${fmt(d.length)})`);
      }
      continue;
    }
    if (bundlePath === 'store/icons/starter-icon-N.png') {
      for (let i = 1; i <= 5; i++) {
        const p = `store/icons/starter-icon-${i}.png`;
        const d = disk(`starter-pack/icons/starter-icon-${i}.png`);
        if (d) files.push({ name: p, data: d }); else { missing++; manifest.push(`[ ] MISSING  ${p}`); continue; }
        manifest.push(`[x] ${p} (${fmt(d.length)})`);
      }
      continue;
    }
    const gen = SRC[bundlePath];
    data = typeof gen === 'function' ? gen() : null;
    if (data) {
      files.push({ name: bundlePath, data });
      manifest.push(`[x] ${bundlePath} (${fmt(data.length)})`);
    } else {
      missing++;
      manifest.push(`[ ] MISSING  ${bundlePath} — build it first (see README)`);
    }
  }
}

const manifestTxt = [
  'VOXEL CYBER-STREET — MARKETPLACE SUBMISSION MANIFEST',
  '=====================================================',
  `Generated ${new Date().toISOString()}`,
  '',
  'This file doubles as your portal checklist: work top-to-bottom and tick',
  'items off as you paste/upload them into the partner portal.',
  'Bundle total: ' + files.length + ' files (including this MANIFEST).',
  ...manifest,
].join('\n');

files.push({ name: 'MANIFEST.txt', data: Buffer.from(manifestTxt, 'utf8') });

const zip = makeZip(files);
const outDir = path.join(root, 'dist');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'voxel-cyber-street-submission.zip');
fs.writeFileSync(out, zip);
console.log(`submission bundle → ${out} (${files.length} files, ${(zip.length / 1024 / 1024).toFixed(1)} MB, ${missing} missing)`);
if (missing) console.log(`  ⚠ ${missing} file(s) missing — build them, then re-run this script`);
