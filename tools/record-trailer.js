#!/usr/bin/env node
/**
 * record-trailer.js — records the gallery trailer in headless Chromium via
 * Puppeteer and saves the webm to the project root, so `npm run trailer` ends
 * with a real marketing asset instead of a manual browser step.
 *
 * Why headless Chromium (and not the desktop-app preview): the preview webview
 * reports zero rAF frames and never composites — MediaRecorder there produced
 * empty files. A real (headless) Chrome runs the full pipeline: WebGL gallery →
 * composite stage → captureStream → VP9 encode.
 *
 * Usage: node tools/record-trailer.js [--out voxel-cyber-street-trailer.webm]
 * Requires: npm run pack artifacts present + `npx puppeteer browsers install chrome`
 */
const path = require('path');
const fs = require('fs');
const http = require('http');

const root = path.resolve(__dirname, '..');
const PORT = 4199;
const OUT = path.join(root, process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1] : 'voxel-cyber-street-trailer.webm');

// serve the project root (gallery + import-map CDN access)
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0].replace(/\\/g, '/');
  let p = path.join(root, url === '/' ? 'gallery.html' : url.slice(1));
  if (!p.startsWith(root)) { res.writeHead(403); res.end(); return; }
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); res.end('nf'); return; }
    const ext = path.extname(p);
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.css': 'text/css' }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1');

(async () => {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({
    headless: 'new',
    // real GPU (default headless gets the D3D11 ANGLE path — SwiftShader only
    // when forced); software rendering can't keep 36 WebGL cells interactive.
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1560, height: 1000, deviceScaleFactor: 1 });
  page.on('console', m => {
    const t = m.text();
    if (/trailer|error|warn/i.test(t)) console.log('  [page]', t);
  });
  page.on('pageerror', e => console.error('  [pageerror]', e.message));

  console.log('loading gallery…');
  await page.goto(`http://127.0.0.1:${PORT}/gallery.html?trailer=1&auto=1`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction('window.__trailerCtl', { timeout: 90000 });

  // wait for the recording to start, then for it to finish
  await page.waitForFunction('window.__recordingState && window.__recordingState.recording', { timeout: 60000 });
  console.log('recording…');
  await page.waitForFunction('window.__recordingState && window.__recordingState.done', { timeout: 300000, polling: 500 });

  const state = await page.evaluate('window.__recordingState');
  if (!state.downloaded || !state.bytes) {
    console.error('recording finished but no file arrived:', JSON.stringify(state));
    process.exit(1);
  }
  console.log(`captured ${(state.bytes / 1024 / 1024).toFixed(2)} MB webm`);

  // the page's anchor-download lands in the browser's download dir; intercept the
  // blob instead — hand the bytes straight to Node via the console channel.
  const b64 = await page.evaluate(() => window.__trailerB64 || '');
  if (!b64) { console.error('no blob payload'); process.exit(1); }
  fs.writeFileSync(OUT, Buffer.from(b64, 'base64'));
  console.log(`saved ${path.relative(root, OUT)} (${(fs.statSync(OUT).size / 1024 / 1024).toFixed(2)} MB)`);

  await browser.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); }).finally(() => server.close());
