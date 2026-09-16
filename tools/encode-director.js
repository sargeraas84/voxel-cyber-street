#!/usr/bin/env node
/**
 * encode-director.js — encodes the VoxelDirector frame dump into a 60 fps
 * gameplay-demo MP4 (H.264 yuv420p, faststart) at 2× the capture resolution.
 *
 * Frames: tools/fabric-mod/run/screenshots/director/<route>/frame-%06d.png
 * Output: voxel-cyber-street-gameplay-demo-<route>.mp4
 * Usage: node tools/encode-director.js [tour|race|chase|crowd] [--fps 60]
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const argRoute = process.argv.find((a, i) => i >= 2 && !a.startsWith('--')) || 'tour';
const FRAMES = path.join(root, 'tools', 'fabric-mod', 'run', 'screenshots', 'director', argRoute);
const OUT = path.join(root, `voxel-cyber-street-gameplay-demo-${argRoute}.mp4`);
const fps = process.argv.includes('--fps') ? process.argv[process.argv.indexOf('--fps') + 1] : '60';

const frame = path.join(FRAMES, 'frame-000001.png');
if (!fs.existsSync(frame)) {
  console.error(`no frames at ${path.relative(root, FRAMES)} — run /vdirector start in the demo world first`);
  process.exit(1);
}

// sample the first frame for the encode size (2× upscale, even dimensions)
const b = fs.readFileSync(frame);
const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
const ow = Math.round(w * 2 / 2) * 2, oh = Math.round(h * 2 / 2) * 2;

console.log(`encoding ${FRAMES} frames (${w}×${h}) → ${path.basename(OUT)} at ${fps} fps (${ow}×${oh})`);
execFileSync('ffmpeg', [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-framerate', String(fps),
  '-i', path.join(FRAMES, 'frame-%06d.png'),
  '-vf', `scale=${ow}:${oh}:flags=lanczos`,
  '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  OUT,
]);
console.log(`saved ${path.relative(root, OUT)} (${(fs.statSync(OUT).size / 1024 / 1024).toFixed(1)} MB)`);
