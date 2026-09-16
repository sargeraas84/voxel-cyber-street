#!/usr/bin/env node
/**
 * build-store-listing.js — generates store-listing.html: a Marketplace submission
 * draft with every form field (title in 4 languages, short + long description,
 * feature bullets, tags, pricing/type notes) as copy-to-clipboard cards, the full
 * icon grid, a trailer slot (embeds the webm when it exists, placeholder otherwise),
 * and an asset manifest measured from the real files on disk (PNG dimensions read
 * from the IHDR header, sizes from stat) so nothing drifts from what you'd upload.
 *
 * Usage: node tools/build-store-listing.js
 */
const fs = require('fs');
const path = require('path');
const { ACCENT_NAMES, HAIR_NAMES, FIT_NAMES } = require('./lib/mcpack-i18n');

const root = path.resolve(__dirname, '..');
const pack = JSON.parse(fs.readFileSync(path.join(root, 'pack', 'pack.json'), 'utf8'));
const starter = JSON.parse(fs.readFileSync(path.join(root, 'starter-pack', 'pack.json'), 'utf8'));

// ---------------- copy-ready field content (the submission form text)
const FIELDS = [
  {
    id: 'title-en', label: 'Title (en_US)', mono: false,
    text: 'VOXEL CYBER-STREET — Neon Cyberpunk Skins',
  },
  {
    id: 'title-de', label: 'Titel (de_DE)', mono: false,
    text: 'VOXEL CYBER-STREET — Neon-Cyberpunk-Skins',
  },
  {
    id: 'title-fr', label: 'Titre (fr_FR)', mono: false,
    text: 'VOXEL CYBER-STREET — Skins Cyberpunk Néon',
  },
  {
    id: 'title-ja', label: 'タイトル (ja_JP)', mono: false,
    text: 'VOXEL CYBER-STREET — ネオン・サイバーパンクスキン',
  },
  {
    id: 'short-desc', label: 'Short description (≤ 100 chars recommended)', mono: false,
    text: '36 neon cyber-street skins: glowing accents, tech masks, chunky high-tops + glow capes.',
  },
  {
    id: 'long-desc', label: 'Long description', mono: false,
    text: [
      'VOXEL CYBER-STREET drops 36 full-body cyberpunk skins built on real Minecraft-style voxel geometry: oversized futuristic streetwear with glowing neon accent pairs, a tech-wear mask over the lower face, messy hair in 6 colors, and chunky high-top sneakers.',
      '',
      'WHAT YOU GET',
      '• 36 skins — 10 neon accent pairs × 6 hairstyles × 6 streetwear fits, Steve + Alex models',
      '• Every skin ships with a matching glowing tech cape',
      '• Works on Bedrock (skin pack) and Java (Fabric mod applies skins to NPCs)',
      '• Fully localized: English, German, French, Japanese',
      '',
      'STYLE',
      'Procedurally generated and seed-stable, so every skin is repeatable and consistent. Flat dynamic lighting, clean solid colors, blocky geometry — a character-reference-sheet aesthetic straight from the concept board.',
      '',
      'Starter bundle available: 5 curated skins for smaller bundle slots (VOXEL CYBER-STREET — Starter).',
    ].join('\n'),
  },
  {
    id: 'short-desc-de', label: 'Kurzbeschreibung (de_DE)', mono: false,
    text: '36 Neon-Cyberstreet-Skins: leuchtende Akzente, Tech-Masken, chunkige High-Tops + Leuchtcapes.',
  },
  {
    id: 'long-desc-de', label: 'Langbeschreibung (de_DE)', mono: false,
    text: [
      'VOXEL CYBER-STREET liefert 36 Ganzkörper-Cyberpunk-Skins auf echter Minecraft-Voxel-Geometrie: oversize futuristische Streetwear mit leuchtenden Neon-Akzentpaaren, eine Tech-Maske über der unteren Gesichtshälfte, messy Hair in 6 Farben und chunkige High-Top-Sneaker.',
      '',
      'WAS DU BEKOMMST',
      '• 36 Skins — 10 Neon-Akzentpaare × 6 Frisuren × 6 Streetwear-Outfits, Steve- und Alex-Modelle',
      '• Jeder Skin kommt mit passendem leuchtendem Tech-Cape',
      '• Läuft auf Bedrock (Skin-Pack) und Java (der Fabric-Mod zieht die Skins auf NPCs)',
      '• Vollständig lokalisiert: Deutsch, Englisch, Französisch, Japanisch',
      '',
      'STIL',
      'Prozedural generiert und seed-stabil — jeder Skin ist reproduzierbar und konsistent. Flat Dynamic Lighting, klare Flächen, blockige Geometrie: die Ästhetik eines Character-Reference-Sheets direkt vom Conceptboard.',
      '',
      'Als Starterpaket verfügbar: 5 kuratierte Skins für kleinere Bundle-Slots (VOXEL CYBER-STREET — Starter).',
    ].join('\n'),
  },
  {
    id: 'short-desc-fr', label: 'Description courte (fr_FR)', mono: false,
    text: '36 skins cyber-street néon : accents lumineux, masques tech, grosses baskets montantes + capes lumineuses.',
  },
  {
    id: 'long-desc-fr', label: 'Description longue (fr_FR)', mono: false,
    text: [
      'VOXEL CYBER-STREET propose 36 skins cyberpunk à corps entier sur une vraie géométrie voxel façon Minecraft : streetwear futuriste oversize aux paires d\'accents néon lumineux, un masque tech couvrant le bas du visage, des cheveux décoiffés en 6 couleurs et de grosses baskets montantes.',
      '',
      'CE QUE VOUS OBTENEZ',
      '• 36 skins — 10 paires d\'accents néon × 6 coiffures × 6 tenues streetwear, modèles Steve et Alex',
      '• Chaque skin est livré avec sa cape tech lumineuse assortie',
      '• Fonctionne sur Bedrock (skin pack) et Java (le mod Fabric applique les skins aux PNJ)',
      '• Entièrement localisé : anglais, allemand, français, japonais',
      '',
      'STYLE',
      'Générés de façon procédurale avec des graines stables : chaque skin est reproductible et cohérent. Éclairage plat dynamique, couleurs unies nettes, géométrie cubique — l\'esthétique d\'une planche de référence de personnage sortie tout droit du concept board.',
      '',
      'Bundle de démarrage disponible : 5 skins sélectionnés pour les emplacements de bundle compacts (VOXEL CYBER-STREET — Starter).',
    ].join('\n'),
  },
  {
    id: 'short-desc-ja', label: '簡単な説明 (ja_JP)', mono: false,
    text: 'ネオン・サイバーストリートスキン36体：発光アクセント、テックマスク、ハイカットスニーカー、光るケープ付き。',
  },
  {
    id: 'long-desc-ja', label: '詳細説明 (ja_JP)', mono: false,
    text: [
      '「VOXEL CYBER-STREET」は、本格的なマインクラフト風ボクセルジオメトリで作られた36体のフルボディ・サイバーパンクスキンです。大きめのフューチャー系ストリートウェアに光るネオンのアクセントカラー、顔の下半分を覆うテックマスク、6色のヘアスタイル、そしてごついハイカットスニーカー。',
      '',
      '内容',
      '• スキン36体 — ネオンアクセント10組 × ヘア6種 × ストリートウェア6型、スティーブ＋アレックス両モデル対応',
      '• 全スキンに専属の光るテックケープ付き',
      '• Bedrock（スキンパック）とJava（Fabric MODでNPCに適用）の両エディションで動作',
      '• 完全ローカライズ：日本語・英語・ドイツ語・フランス語',
      '',
      'スタイル',
      '手続き的に生成されシードで固定 — どのスキンも再現可能で一貫性があります。フラットでダイナミックなライティング、クリーンな単色、ブロック状のジオメトリ。コンセプトボードからそのまま抜け出したキャラクター設定画の美学。',
      '',
      'スターターバンドルも同時販売：厳選5スキンの小容量パック（VOXEL CYBER-STREET — Starter）。',
    ].join('\n'),
  },
  {
    id: 'bullets', label: 'Feature bullets (store listing)', mono: false,
    text: [
      '✔ 36 skins × matching glow capes — one complete street collection',
      '✔ Neon accent pairs (pink/cyan, gold/cyan, violet/pink +7 more)',
      '✔ 6 hairstyles, 6 streetwear fits, tech mask + chunky high-tops on every skin',
      '✔ Steve AND Alex body models (18 + 18)',
      '✔ Glowing tech cape toggle via the included Fabric mod on Java',
      '✔ EN · DE · FR · JA localized pack titles and skin names',
      '✔ Bedrock .mcpack + Java Fabric jar + press kit included',
    ].join('\n'),
  },
  {
    id: 'tags', label: 'Tags / keywords', mono: true,
    text: 'cyberpunk, neon, streetwear, voxel, techwear, glowing, skins, capes, mask, high-tops, city, futuristic',
  },
  {
    id: 'pricing', label: 'Pricing & type notes', mono: true,
    text: [
      'Pack type: skin pack (Bedrock) / cosmetic mod (Java Fabric)',
      'Skins: type "free" (non-partner). Flip to "paid" only as an approved Marketplace partner.',
      'Starter bundle: 5 skins — sized for smaller bundle slots.',
    ].join('\n'),
  },
  {
    id: 'versions', label: 'Version / engine targets', mono: true,
    text: [
      'Bedrock: min_engine_version 1.16.0 — skins.json per learn.microsoft.com packagingaskinpack',
      'Java: Fabric, MC 1.21, Loom 1.7.4, yarn 1.21+build.9',
    ].join('\n'),
  },
];

// ---------------- asset manifest measured from disk (real bytes, real dimensions)
function pngSize(p) {
  const b = fs.readFileSync(p);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
const fmtKB = n => (n / 1024).toFixed(1) + ' KB';
function manifestRow(label, p) {
  if (!fs.existsSync(path.join(root, p))) return { label, missing: true, path: p };
  const st = fs.statSync(path.join(root, p));
  const row = { label, path: p, kb: fmtKB(st.size) };
  if (p.endsWith('.png')) { const d = pngSize(path.join(root, p)); row.dims = `${d.w}×${d.h}`; }
  return row;
}
const assets = [
  manifestRow('Cover (Marketplace hero)', 'cover/voxel-cyber-street-cover-2048x1152.png'),
  manifestRow('Poster (A3 300 dpi)', 'poster/voxel-cyber-street-poster-a3.png'),
  manifestRow('Bedrock pack (36 skins)', 'dist/VOXEL-CYBER-STREET.mcpack'),
  manifestRow('Starter Bedrock pack (5)', 'dist/VOXEL-CYBER-STREET-STARTER.mcpack'),
  manifestRow('Fabric jar (MC 1.21)', 'dist/voxel-cyber-street-fabric-1.21.jar'),
  manifestRow('Fabric jar (resources)', 'dist/voxel-cyber-street-fabric-1.0.0.jar'),
  manifestRow('Fabric source zip', 'dist/voxel-cyber-street-fabric-src.zip'),
  manifestRow('Trailer (webm master)', 'voxel-cyber-street-trailer.webm'),
  manifestRow('Trailer MP4 (store upload)', 'trailer/voxel-cyber-street-trailer.mp4'),
  manifestRow('Trailer MP4 (1080p)', 'trailer/voxel-cyber-street-trailer-1080p.mp4'),
  manifestRow('Trailer MP4 (square 1:1)', 'trailer/voxel-cyber-street-trailer-square.mp4'),
  manifestRow('Trailer MP4 (vertical 9:16)', 'trailer/voxel-cyber-street-trailer-vertical.mp4'),
  manifestRow('Demo datapack (Neon District)', 'dist/vcsdemo-neon-district.zip'),
];
const icons = pack.skins.map(s => `icons/icon-${String(s.id).padStart(2, '0')}.png`);

const trailerExists = fs.existsSync(path.join(root, 'voxel-cyber-street-trailer.webm'));

// ---------------- breakdown tables (for the description's "what you get")
const accList = Object.keys(ACCENT_NAMES).map(a => ACCENT_NAMES[a].en_US).join(', ');
const hairList = Object.keys(HAIR_NAMES).map(h => HAIR_NAMES[h].en_US).join(', ');
const fitList = Object.keys(FIT_NAMES).map(f => FIT_NAMES[f].en_US).join(', ');

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fieldHtml = FIELDS.map(f => `
  <section class="card">
    <header><h3>${esc(f.label)}</h3><button class="copy" data-target="${f.id}">copy</button></header>
    <pre id="${f.id}" class="${f.mono ? 'mono' : 'prose'}">${esc(f.text)}</pre>
  </section>`).join('\n');

const assetHtml = assets.map(a => a.missing
  ? `<tr class="miss"><td>${esc(a.label)}</td><td colspan="3">missing — ${esc(a.path)} <span class="note">(build it: see README)</span></td></tr>`
  : `<tr><td>${esc(a.label)}</td><td class="mono">${esc(a.path)}</td><td>${esc(a.dims || '—')}</td><td>${esc(a.kb)}</td></tr>`).join('\n');

const iconHtml = icons.map(p => `
  <figure><img src="${p}" alt="${esc(path.basename(p))}" loading="lazy"><figcaption>${esc(path.basename(p).replace('icon-', '').replace('.png', ''))}</figcaption></figure>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>VOXEL // CYBER-STREET — Store Listing Draft</title>
<link rel="icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#1f2023; color:#cfd3d9; font:14px/1.5 'Segoe UI',Arial,sans-serif; padding:28px; }
  h1 { color:#ff2e95; font-size:22px; letter-spacing:1px; margin-bottom:4px; }
  h2 { color:#22e5ee; font-size:16px; margin:28px 0 10px; }
  .sub { color:#8a9099; margin-bottom:18px; }
  .note { color:#8a9099; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; align-items:start; }
  @media (max-width:1100px){ .grid2 { grid-template-columns:1fr; } }
  .card { background:#26282d; border:1px solid #3a3d44; border-radius:10px; overflow:hidden; }
  .card header { display:flex; justify-content:space-between; align-items:center; padding:8px 14px; border-bottom:1px solid #3a3d44; }
  .card h3 { color:#22e5ee; font-size:12px; letter-spacing:1px; text-transform:uppercase; }
  .copy { background:#ff2e95; color:#fff; border:0; border-radius:6px; padding:4px 12px; cursor:pointer; font-size:12px; }
  .copy:hover { background:#ff5cab; }
  .copy.ok { background:#3ddc84; }
  pre { padding:12px 14px; white-space:pre-wrap; font-size:13px; }
  pre.mono { font-family:Consolas,monospace; font-size:12px; color:#aab0b8; }
  .icons { display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:12px; }
  figure { background:#26282d; border:1px solid #3a3d44; border-radius:8px; padding:8px; text-align:center; }
  figure img { width:100%; image-rendering:auto; border-radius:4px; }
  figcaption { color:#8a9099; font-size:11px; margin-top:4px; font-family:Consolas,monospace; }
  table { border-collapse:collapse; width:100%; margin:10px 0 26px; }
  th, td { border:1px solid #3a3d44; padding:6px 10px; text-align:left; font-size:12px; }
  th { background:#26282d; color:#22e5ee; letter-spacing:1px; }
  tr.miss td { background:#3a2028; color:#ffb020; }
  .mono { font-family:Consolas,monospace; }
  .trailer { background:#26282d; border:1px dashed #4a4d55; border-radius:10px; padding:26px; text-align:center; }
  .trailer video { max-width:100%; border-radius:8px; }
  .ph { padding:60px 20px; color:#8a9099; }
  .ph b { display:block; color:#cfd3d9; font-size:16px; margin-bottom:6px; }
  a { color:#22e5ee; }
  .breaker { margin-top:20px; display:inline-block; background:#26282d; border:1px solid #3a3d44; border-radius:8px; padding:8px 14px; }
</style>
</head>
<body>
<h1>VOXEL // CYBER-STREET — STORE LISTING DRAFT</h1>
<div class="sub">Every field below is copy-paste ready for the Marketplace submission form · generated by tools/build-store-listing.js · assets measured from disk</div>

<h2>1 · Submission form fields</h2>
<div class="grid2">
${fieldHtml}
</div>

<h2>2 · Icon grid — ${icons.length} store portraits (512×512)</h2>
<div class="icons">
${iconHtml}
</div>

<h2>3 · Trailer slot</h2>
<div class="trailer">
${trailerExists
    ? `<video controls src="voxel-cyber-street-trailer.webm"></video><div class="note" style="margin-top:8px">voxel-cyber-street-trailer.webm — recorded via gallery.html?trailer=1</div>`
    : `<div class="ph"><b>No trailer recorded yet</b>Open gallery.html?trailer=1 (or press the ● Trailer button) to record the 15.5s turntable.
It saves as voxel-cyber-street-trailer.webm next to this page and embeds here automatically.<br><br>
MP4 conversion for submission: ffmpeg -i voxel-cyber-street-trailer.webm -c:v libx264 -crf 18 -pix_fmt yuv420p trailer.mp4</div>`}
</div>

<h2>4 · Asset manifest (measured from disk)</h2>
<table>
  <tr><th>asset</th><th>file</th><th>dimensions</th><th>size</th></tr>
${assetHtml}
</table>

<h2>5 · Style coverage (for the description claims)</h2>
<div class="card"><pre class="mono">accent pairs (${Object.keys(ACCENT_NAMES).length}): ${esc(accList)}
hairstyles  (${Object.keys(HAIR_NAMES).length}): ${esc(hairList)}
fits        (${Object.keys(FIT_NAMES).length}): ${esc(fitList)}
total space: ${Object.keys(ACCENT_NAMES).length} × ${Object.keys(HAIR_NAMES).length} × ${Object.keys(FIT_NAMES).length} = ${Object.keys(ACCENT_NAMES).length * Object.keys(HAIR_NAMES).length * Object.keys(FIT_NAMES).length} combos — ${pack.skins.length} shipped + ${starter.skins.length} starter</pre></div>

<div class="breaker">Next steps: <a href="presskit.html">press-kit zip →</a> · <a href="guide.html">submission guide →</a> · <a href="langqa.html">language QA →</a></div>

<script>
function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (_) {}
  ta.remove();
  return ok;
}
document.querySelectorAll('.copy').forEach(btn => btn.addEventListener('click', () => {
  const el = document.getElementById(btn.dataset.target);
  const done = () => {
    btn.textContent = 'copied ✓'; btn.classList.add('ok');
    setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('ok'); }, 1400);
  };
  const fail = () => { btn.textContent = '⚠ select + Ctrl+C'; setTimeout(() => { btn.textContent = 'copy'; }, 2200); };
  (navigator.clipboard && navigator.clipboard.writeText
    ? navigator.clipboard.writeText(el.textContent)
    : Promise.reject(new Error('no clipboard'))
  ).then(done).catch(() => legacyCopy(el.textContent) ? done() : fail());
}));
</script>
</body>
</html>`;

const out = path.join(root, 'store-listing.html');
fs.writeFileSync(out, html);
console.log(`store listing → ${out} (${icons.length} icons, ${assets.filter(a => !a.missing).length}/${assets.length} assets on disk, ${(html.length / 1024).toFixed(0)} KB)`);

// shared with tools/build-cover-letter.js (single source for submission copy)
module.exports = { FIELDS, assets, trailerExists, pack, starter };
