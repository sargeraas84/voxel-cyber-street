#!/usr/bin/env node
/**
 * export-trailer-formats.js — converts the recorded webm trailer into store-ready
 * MP4 exports (ffmpeg stream-copy where possible, H.264 yuv420p otherwise):
 *
 *   trailer/voxel-cyber-street-trailer.mp4         1280×720 H.264 (universal store upload)
 *   trailer/voxel-cyber-street-trailer-1080p.mp4   1920×1080 upscaled (YouTube/press)
 *   trailer/voxel-cyber-street-trailer-square.mp4  1080×1080 (Instagram feed)
 *   trailer/voxel-cyber-street-trailer-vertical.mp4 1080×1920 (Shorts/TikTok/Reels)
 *
 * Requires ffmpeg on PATH. Usage: node tools/export-trailer-formats.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const SRC = path.join(root, 'voxel-cyber-street-trailer.webm');
const OUT = path.join(root, 'trailer');
fs.mkdirSync(OUT, { recursive: true });

if (!fs.existsSync(SRC)) {
  console.error('no voxel-cyber-street-trailer.webm — run: npm run record');
  process.exit(1);
}

const jobs = [
  { name: 'voxel-cyber-street-trailer.mp4', args: ['-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an'] },
  { name: 'voxel-cyber-street-trailer-1080p.mp4', args: ['-vf', 'scale=1920:1080:flags=lanczos', '-c:v', 'libx264', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an'] },
  { name: 'voxel-cyber-street-trailer-square.mp4', args: ['-vf', "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:color=0x131418,setsar=1", '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an'] },
  { name: 'voxel-cyber-street-trailer-vertical.mp4', args: ['-vf', "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x131418,setsar=1", '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an'] },
];

const results = [];
for (const j of jobs) {
  const out = path.join(OUT, j.name);
  try {
    execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', SRC, ...j.args, out], { stdio: 'pipe' });
    const kb = fs.statSync(out).size;
    results.push({ name: j.name, kb });
    console.log(`  ✓ ${j.name} (${(kb / 1024 / 1024).toFixed(2)} MB)`);
  } catch (e) {
    console.error(`  ✗ ${j.name} failed — is ffmpeg on PATH?`);
    process.exit(1);
  }
}
console.log(`trailer exports → ${path.relative(root, OUT)}/ (${results.length} formats)`);
module.exports = { results };
