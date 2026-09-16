'use strict';
/** probe-heritage.js — headless QA of heritage.html (canvases painted, no console errors). */
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--use-gl=angle', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', r => errors.push('requestfailed: ' + r.url()));
  page.on('response', r => { if (r.status() === 404) errors.push('404: ' + r.url()); });

  await page.goto('http://localhost:8321/heritage.html', { waitUntil: 'load', timeout: 60000 });
  // give the 36 rigs time to build and paint a few frames
  await new Promise(r => setTimeout(r, 12000));

  const state = await page.evaluate(() => ({
    loaderHidden: document.getElementById('loader')?.classList.contains('hide'),
    canvasCount: document.querySelectorAll('canvas').length,
    title: document.title,
    hasCore: !!window.SkinGenCore,
    rafMs: window.__rafMs || 0,
  }));
  await page.screenshot({ path: '.heritage-qa.png' });
  console.log(JSON.stringify(state, null, 2));
  console.log('console issues:', errors.length ? errors.slice(0, 5) : 'none');
  await browser.close();
})().catch(e => { console.error('PROBE FAILED:', e.message); process.exit(1); });
