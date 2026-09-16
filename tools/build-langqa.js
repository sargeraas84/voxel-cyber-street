#!/usr/bin/env node
/**
 * build-langqa.js — generates langqa.html: every skin's localized name in all four
 * pack languages (en_US / de_DE / fr_FR / ja_JP) side by side, exactly as the .lang
 * files render them in Bedrock. Uses the SAME mcpack-i18n module as the exporters,
 * so what you QA here is what ships. Missing translations (a title falling back to
 * the raw accent/hair/fit slug) are flagged in red — the page doubles as a coverage
 * check across the whole 4,320-combo style space, plus the real .lang output for the
 * shipped 36-pack and starter pack.
 *
 * Usage: node tools/build-langqa.js
 */
const fs = require('fs');
const path = require('path');
const { ACCENT_NAMES, HAIR_NAMES, FIT_NAMES, skinTitle, PACK_TITLES, STARTER_TITLES, buildLangs } = require('./lib/mcpack-i18n');

const root = path.resolve(__dirname, '..');
const LANGS = Object.keys(PACK_TITLES);
const pack = JSON.parse(fs.readFileSync(path.join(root, 'pack', 'pack.json'), 'utf8'));

// ---- combinatorial coverage: every accent × hair × fit the generator can produce
const combos = [];
for (const accent of Object.keys(ACCENT_NAMES))
  for (const hair of Object.keys(HAIR_NAMES))
    for (const fit of Object.keys(FIT_NAMES))
      combos.push({ accent, hair, fit });

const rawSlugs = [...new Set([...Object.keys(ACCENT_NAMES), ...Object.keys(HAIR_NAMES), ...Object.keys(FIT_NAMES)])];
// Mirrors skinTitle's internal lookup: a language "falls back" when any of the
// three parts has no dictionary entry for that language.
const fallbackLangs = (desc, langs) => langs.filter(l =>
  !(ACCENT_NAMES[desc.accent] && ACCENT_NAMES[desc.accent][l]) ||
  !(HAIR_NAMES[desc.hair] && HAIR_NAMES[desc.hair][l]) ||
  !(FIT_NAMES[desc.fit] && FIT_NAMES[desc.fit][l]));
const isFallback = undefined; // (removed — see fallbackLangs)

// ---- rows: the 36 shipped skins, flagged when they appear in the pack
const shipped = new Set(pack.skins.map(s => `${s.accent}|${s.hair}|${s.fit}`));

const comboRows = combos.map(c => {
  const titles = LANGS.map(l => skinTitle(l, c));
  const missing = fallbackLangs(c, LANGS);
  return { c, titles, missing, shipped: shipped.has(`${c.accent}|${c.hair}|${c.fit}`) };
});
const fallbackCount = comboRows.filter(r => r.missing.length).length;

const starterManifest = JSON.parse(fs.readFileSync(path.join(root, 'starter-pack', 'pack.json'), 'utf8'));

// ---- shipped packs must be fully translated (this is what actually fails the build)
const allShipped = [
  ...pack.skins.map(s => ({ src: '36-pack', ...s })),
  ...starterManifest.skins.map(s => ({ src: 'starter', ...s })),
];
const shippedGaps = allShipped.filter(s => fallbackLangs(s, LANGS).length);
for (const g of shippedGaps)
  console.error(`✗ UNTRANSLATED: ${g.src} #${g.id} — ${g.accent}/${g.hair}/${g.fit} missing in: ${fallbackLangs(g, LANGS).join(', ')} (add to tools/lib/mcpack-i18n.js)`);

// ---- actual .lang output for the shipped packs (what Bedrock really loads)
const shippedRows = pack.skins.map(s => ({
  n: s.id,
  titles: LANGS.map(l => skinTitle(l, s)),
}));
const starterRows = starterManifest.skins.map(s => ({
  n: s.id,
  titles: LANGS.map(l => skinTitle(l, s)),
}));
const lang36 = buildLangs({
  locName: 'VoxelCyberStreet', packTitles: PACK_TITLES,
  skins: pack.skins.map(s => ({ localizationName: s.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase(), title: s })),
});
const langStarter = buildLangs({
  locName: 'VoxelCyberStreetStarter', packTitles: STARTER_TITLES,
  skins: starterManifest.skins.map(s => ({ localizationName: s.id.replace(/[^a-z0-9]+/gi, '_').toLowerCase(), title: s })),
});

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const langLabel = { en_US: 'EN', de_DE: 'DE', fr_FR: 'FR', ja_JP: 'JA' };

const comboHtml = comboRows.map(r => `
    <tr class="${r.missing.length ? 'bad' : ''}${r.shipped ? ' ship' : ''}">
      <td class="slug">${esc(r.c.accent)}<br>${esc(r.c.hair)}<br>${esc(r.c.fit)}</td>
      ${r.titles.map((t, i) => `<td lang="${LANGS[i]}">${esc(t)}</td>`).join('')}
      <td class="flag">${r.missing.length ? '⚠ fallback' : (r.shipped ? '● in pack' : '')}</td>
    </tr>`).join('\n');

const shippedHtml = shippedRows.map(r => `
    <tr><td class="num">#${String(r.n).padStart(2, '0')}</td>${r.titles.map((t, i) => `<td lang="${LANGS[i]}">${esc(t)}</td>`).join('')}</tr>`).join('\n');
const starterHtml = starterRows.map(r => `
    <tr><td class="num">#${String(r.n).padStart(2, '0')}</td>${r.titles.map((t, i) => `<td lang="${LANGS[i]}">${esc(t)}</td>`).join('')}</tr>`).join('\n');

const langTabs = l => `
  <details ${l === 'en_US' ? 'open' : ''}><summary>texts/${l}.lang — 36-pack</summary><pre>${esc(lang36[l])}</pre></details>
  <details><summary>texts/${l}.lang — starter</summary><pre>${esc(langStarter[l])}</pre></details>`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>VOXEL // CYBER-STREET — Language QA</title>
<link rel="icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#1f2023; color:#cfd3d9; font:14px/1.5 'Segoe UI',Arial,sans-serif; padding:28px; }
  h1 { color:#ff2e95; font-size:22px; letter-spacing:1px; margin-bottom:4px; }
  h2 { color:#22e5ee; font-size:16px; margin:26px 0 10px; }
  .sub { color:#8a9099; margin-bottom:18px; }
  .stats { display:flex; gap:14px; margin:14px 0 8px; flex-wrap:wrap; }
  .stat { background:#26282d; border:1px solid #3a3d44; border-radius:8px; padding:10px 16px; }
  .stat b { color:#fff; font-size:18px; display:block; }
  .ok b { color:#3ddc84; } .warn b { color:#ffb020; }
  table { border-collapse:collapse; width:100%; margin:10px 0 26px; }
  th, td { border:1px solid #3a3d44; padding:6px 10px; text-align:left; vertical-align:top; }
  th { background:#26282d; color:#22e5ee; font-size:12px; letter-spacing:1px; }
  td[lang=ja_JP] { font-family:'Yu Gothic','Meiryo',sans-serif; }
  tr.bad td { background:#3a2028; }
  tr.ship td.slug { border-left:3px solid #ff2e95; }
  td.slug { color:#8a9099; font-size:11px; font-family:Consolas,monospace; }
  td.flag { color:#ffb020; font-size:11px; white-space:nowrap; }
  tr.ship .flag { color:#ff2e95; }
  td.num { color:#8a9099; font-family:Consolas,monospace; }
  details { background:#26282d; border:1px solid #3a3d44; border-radius:8px; margin:8px 0; }
  summary { cursor:pointer; padding:8px 12px; color:#22e5ee; font-family:Consolas,monospace; font-size:12px; }
  pre { padding:4px 14px 12px; font-size:11px; color:#aab0b8; max-height:260px; overflow:auto; }
  a { color:#22e5ee; }
</style>
</head>
<body>
<h1>VOXEL // CYBER-STREET — LANGUAGE QA</h1>
<div class="sub">Every skin name as Bedrock renders it, in all four pack languages · generated by tools/build-langqa.js from the shared mcpack-i18n module</div>

<div class="stats">
  <div class="stat ok"><b>${combos.length}</b>style combos checked</div>
  <div class="stat ok"><b>4</b>languages (en_US · de_DE · fr_FR · ja_JP)</div>
  <div class="stat ${fallbackCount || shippedGaps.length ? 'warn' : 'ok'}"><b>${fallbackCount + shippedGaps.length}</b>fallback gaps</div>
  <div class="stat ok"><b>${pack.skins.length + starterRows.length}</b>shipped skins (36 + ${starterRows.length})</div>
</div>

<h2>1 · Full style space — ${combos.length} combos × 4 languages</h2>
<div class="sub">Red rows have missing translations (raw slug fallback). Pink slug bar = shipped in the 36-pack. <a href="search.html">Browse in 3D →</a></div>
<table>
  <tr><th>combo (slug)</th>${LANGS.map(l => `<th>${langLabel[l]} · ${l}</th>`).join('')}<th>status</th></tr>
  ${comboHtml}
</table>

<h2>2 · Shipped skins as Bedrock shows them</h2>
<h2 style="font-size:13px;color:#8a9099">36-pack</h2>
<table>
  <tr><th>#</th>${LANGS.map(l => `<th>${langLabel[l]}</th>`).join('')}</tr>
  ${shippedHtml}
</table>
<h2 style="font-size:13px;color:#8a9099">Starter pack</h2>
<table>
  <tr><th>#</th>${LANGS.map(l => `<th>${langLabel[l]}</th>`).join('')}</tr>
  ${starterHtml}
</table>

<h2>3 · Real .lang output (what ships in the .mcpack)</h2>
${LANGS.map(langTabs).join('\n')}

<div class="sub" style="margin-top:26px">Sources: pack/pack.json (36) · starter-pack/starter-manifest.json (${starterRows.length}) · tools/lib/mcpack-i18n.js · validate with <b>npm run validate</b></div>
</body>
</html>`;

const out = path.join(root, 'langqa.html');
fs.writeFileSync(out, html);
console.log(`langqa → ${out} (${combos.length} combos × ${LANGS.length} langs, ${fallbackCount} fallback gaps, ${(html.length / 1024).toFixed(0)} KB)`);
if (fallbackCount) { console.error(`✗ ${fallbackCount} style combos have missing translations`); process.exit(1); }
if (shippedGaps.length) process.exit(1);
