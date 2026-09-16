#!/usr/bin/env node
/**
 * build-cover-letter.js — generates cover-letter.html: a ONE-PAGE printable
 * partner-application cover letter, assembled from the same submission data as
 * store-listing.html (module.exports there is the single source): the four
 * localized titles, the pitch summary, and the live asset manifest so the
 * reviewer sees exactly what ships. Print-to-PDF at A4 → attach to application.
 *
 * Usage: node tools/build-cover-letter.js
 */
const fs = require('fs');
const path = require('path');
const listing = require('./build-store-listing.js');   // runs the generator (idempotent)

const root = path.resolve(__dirname, '..');
const field = id => listing.FIELDS.find(f => f.id === id).text.trim();
const fmtKB = n => n;

const titles = {
  en: field('title-en'), de: field('title-de'), fr: field('title-fr'), ja: field('title-ja'),
};
const shortDesc = field('short-desc');
const bullets = field('bullets').split('\n').slice(0, 4);
const assets = listing.assets.filter(a => !a.missing);
const pending = listing.assets.filter(a => a.missing);

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>VOXEL CYBER-STREET — Partner Application Cover Letter</title>
<link rel="icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==">
<style>
  @page { size: A4; margin: 16mm 18mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#e8e9ec; color:#17181c; font:10.5pt/1.5 'Segoe UI', Georgia, serif; }
  .page { max-width: 210mm; margin: 0 auto; background:#fff; padding: 16mm 18mm; min-height: 297mm; }
  @media print { body { background:#fff; } .page { padding:0; } .noprint { display:none; } }
  header { display:flex; justify-content:space-between; align-items:baseline; border-bottom:3px solid #ff2e95; padding-bottom:8px; margin-bottom:14px; }
  header h1 { font-size:15pt; letter-spacing:2px; color:#17181c; }
  header .neon { color:#ff2e95; }
  header .neon2 { color:#0aa8b8; }
  .meta { font-size:8.5pt; color:#5a5e66; text-align:right; line-height:1.5; }
  h2 { font-size:10pt; letter-spacing:1.5px; text-transform:uppercase; color:#0aa8b8; margin:12px 0 6px; border-bottom:1px solid #d8dade; padding-bottom:3px; }
  p { margin: 6px 0; text-align: justify; }
  .titles { width:100%; border-collapse:collapse; margin:6px 0; font-size:9.5pt; }
  .titles td { padding:3px 8px; border:1px solid #d8dade; }
  .titles td:first-child { width:64px; font-weight:700; color:#0aa8b8; }
  ul { margin:4px 0 4px 18px; }
  li { margin:2px 0; }
  .assets { width:100%; border-collapse:collapse; font-size:8.5pt; margin:4px 0; }
  .assets th { background:#f2f3f5; text-align:left; padding:3px 8px; border:1px solid #d8dade; font-size:8pt; letter-spacing:1px; text-transform:uppercase; }
  .assets td { padding:3px 8px; border:1px solid #d8dade; }
  .assets td.num { text-align:right; }
  .sign { margin-top:22px; display:flex; justify-content:space-between; align-items:flex-end; }
  .sign .line { border-top:1px solid #17181c; width:200px; padding-top:4px; font-size:9pt; }
  .foot { margin-top:14px; font-size:7.5pt; color:#8a8e96; border-top:1px solid #d8dade; padding-top:6px; }
  .noprint { margin:12px auto; text-align:center; }
  .noprint button { background:#ff2e95; color:#fff; border:0; border-radius:6px; padding:8px 22px; font-size:12pt; cursor:pointer; }
</style>
</head>
<body>
<div class="noprint"><button onclick="window.print()">Print / Save as PDF</button></div>
<div class="page">
  <header>
    <h1>VOXEL <span class="neon">//</span> CYBER-<span class="neon2">STREET</span></h1>
    <div class="meta">Marketplace Partner Application<br>Skin Pack Submission · ${new Date().toISOString().slice(0, 10)}</div>
  </header>

  <p>Dear Minecraft Marketplace Partner Team,</p>

  <p>We are submitting <b>${esc(titles.en)}</b> for store review: a 36-skin cyber-street
  collection built on authentic voxel geometry — oversized futuristic streetwear with
  glowing neon accent pairs, a tech-wear mask, and chunky high-top sneakers, each skin
  shipping with a matching glowing tech cape. ${esc(shortDesc)}</p>

  <h2>Localized titles</h2>
  <table class="titles">
    <tr><td>EN</td><td>${esc(titles.en)}</td></tr>
    <tr><td>DE</td><td>${esc(titles.de)}</td></tr>
    <tr><td>FR</td><td>${esc(titles.fr)}</td></tr>
    <tr><td>JA</td><td>${esc(titles.ja)}</td></tr>
  </table>

  <h2>Highlights</h2>
  <ul>
    ${bullets.map(b => `<li>${esc(b.replace(/^✔ /, ''))}</li>`).join('\n    ')}
  </ul>

  <h2>Submission package</h2>
  <table class="assets">
    <tr><th>Asset</th><th>File</th><th>Dimensions</th><th>Size</th></tr>
    ${assets.map(a => `<tr><td>${esc(a.label)}</td><td>${esc(a.path)}</td><td>${esc(a.dims || '—')}</td><td class="num">${esc(a.kb)}</td></tr>`).join('\n    ')}
  </table>
  ${pending.length ? `<p style="font-size:8.5pt;color:#5a5e66">Note: ${pending.map(a => esc(a.label)).join(', ')} will be attached at final submission.</p>` : ''}

  <p style="margin-top:10px">Every artifact above is machine-validated against the official
  skin-pack specification before packaging, and the full pack is localized in English,
  German, French and Japanese — titles, skin names and descriptions. We would be glad to
  provide the source project, additional renders, or a live walkthrough on request.</p>

  <div class="sign">
    <div class="line">Author signature</div>
    <div class="line">Contact / portfolio</div>
  </div>

  <div class="foot">VOXEL CYBER-STREET · 36 skins + 5-skin starter · Bedrock skin pack + Java Fabric mod · en_US / de_DE / fr_FR / ja_JP</div>
</div>
</body>
</html>`;

const out = path.join(root, 'cover-letter.html');
fs.writeFileSync(out, html);
console.log(`cover letter → ${out} (${assets.length} assets listed, ${listing.pack.skins.length + listing.starter.skins.length} skins total, ${(html.length / 1024).toFixed(0)} KB)`);
