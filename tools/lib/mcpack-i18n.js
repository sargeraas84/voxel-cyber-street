'use strict';
/**
 * mcpack-i18n.js — shared localization for both skin packs.
 * Builds a { langCode: { key: value } } map of .lang bodies from the pack's
 * skin metadata, so every exporter emits identical, complete translations.
 * Bedrock loads .lang files listed in texts/languages.json; en_US is the
 * fallback and must always be present.
 */

const PACK_TITLES = {
  en_US: 'VOXEL CYBER-STREET Pack',
  de_DE: 'VOXEL CYBER-STREET Paket',
  fr_FR: 'Pack VOXEL CYBER-STREET',
  ja_JP: 'VOXEL CYBER-STREET パック',
};

const STARTER_TITLES = {
  en_US: 'VOXEL CYBER-STREET — Starter',
  de_DE: 'VOXEL CYBER-STREET — Starter',
  fr_FR: 'VOXEL CYBER-STREET — Départ',
  ja_JP: 'VOXEL CYBER-STREET — スターター',
};

const ACCENT_NAMES = {
  'pink-cyan':    { en_US: 'pink / cyan',    de_DE: 'Pink / Cyan',     fr_FR: 'rose / cyan',      ja_JP: 'ピンク×シアン' },
  'cyan-pink':    { en_US: 'cyan / pink',    de_DE: 'Cyan / Pink',     fr_FR: 'cyan / rose',      ja_JP: 'シアン×ピンク' },
  'magenta-lime': { en_US: 'magenta / lime', de_DE: 'Magenta / Limette', fr_FR: 'magenta / lime', ja_JP: 'マゼンタ×ライム' },
  'lime-cyan':    { en_US: 'lime / cyan',    de_DE: 'Limette / Cyan',  fr_FR: 'lime / cyan',      ja_JP: 'ライム×シアン' },
  'orange-cyan':  { en_US: 'orange / cyan',  de_DE: 'Orange / Cyan',   fr_FR: 'orange / cyan',    ja_JP: 'オレンジ×シアン' },
  'violet-pink':  { en_US: 'violet / pink',  de_DE: 'Violett / Pink',  fr_FR: 'violet / rose',    ja_JP: 'バイオレット×ピンク' },
  'red-cyan':     { en_US: 'red / cyan',     de_DE: 'Rot / Cyan',      fr_FR: 'rouge / cyan',     ja_JP: 'レッド×シアン' },
  'gold-cyan':    { en_US: 'gold / cyan',    de_DE: 'Gold / Cyan',     fr_FR: 'or / cyan',        ja_JP: 'ゴールド×シアン' },
  'ice-violet':   { en_US: 'ice / violet',   de_DE: 'Eis / Violett',   fr_FR: 'glace / violet',   ja_JP: 'アイス×バイオレット' },
  'mint-pink':    { en_US: 'mint / pink',    de_DE: 'Mint / Pink',     fr_FR: 'menthe / rose',    ja_JP: 'ミント×ピンク' },
};

const HAIR_NAMES = {
  'white-messy':   { en_US: 'messy white',  de_DE: 'weiß, zerzaust',  fr_FR: 'blanc décoiffé',  ja_JP: '白のメッシー' },
  'ash-grey':      { en_US: 'ash grey',     de_DE: 'aschgrau',        fr_FR: 'gris cendré',     ja_JP: 'アッシュグレー' },
  'ice-blue':      { en_US: 'ice blue',     de_DE: 'eisblau',         fr_FR: 'bleu glacier',    ja_JP: 'アイスブルー' },
  'candy-mint':    { en_US: 'candy mint',   de_DE: 'Zuckermintze',    fr_FR: 'menthe sucrée',   ja_JP: 'キャンディミント' },
  'platinum-pink': { en_US: 'platinum pink',de_DE: 'platinrosa',      fr_FR: 'rose platine',    ja_JP: 'プラチナピンク' },
  'smoke-teal':    { en_US: 'smoke teal',   de_DE: 'rauchpetrol',     fr_FR: 'sarcelle fumée',  ja_JP: 'スモークティール' },
};

const FIT_NAMES = {
  'bomber':      { en_US: 'bomber jacket',  de_DE: 'Bomberjacke',     fr_FR: 'blouson bomber',   ja_JP: 'ブルゾン' },
  'longline':    { en_US: 'longline coat',  de_DE: 'Longline-Mantel', fr_FR: 'manteau long',     ja_JP: 'ロングコート' },
  'vest-hood':   { en_US: 'tech vest',      de_DE: 'Tech-Weste',      fr_FR: 'gilet tech',       ja_JP: 'テックベスト' },
  'tech-hood':   { en_US: 'tech hoodie',    de_DE: 'Tech-Hoodie',     fr_FR: 'hoodie tech',      ja_JP: 'テックフーディー' },
  'kimono-tech': { en_US: 'kimono tech',    de_DE: 'Kimono-Tech',     fr_FR: 'kimono tech',      ja_JP: 'テック着物' },
  'bomber-hood': { en_US: 'bomber + hood',  de_DE: 'Bomber + Kapuze', fr_FR: 'bomber + capuche', ja_JP: 'ブルゾン+フード' },
};

// ---- NEON HERITAGE (pack #2) display names -------------------------------
const HERITAGE_TITLES = {
  en_US: 'VOXEL NEON HERITAGE Pack',
  de_DE: 'VOXEL NEON HERITAGE Paket',
  fr_FR: 'Pack VOXEL NEON HERITAGE',
  ja_JP: 'VOXEL NEON HERITAGE パック',
};

const HERITAGE_ACCENT_NAMES = {
  'ember-gold':   { en_US: 'ember / gold',     de_DE: 'Glut / Gold',        fr_FR: 'braise / or',        ja_JP: '残り火×ゴールド' },
  'jade-brass':   { en_US: 'jade / brass',     de_DE: 'Jade / Messing',     fr_FR: 'jade / laiton',      ja_JP: '翡翠×真鍮' },
  'rose-copper':  { en_US: 'rose / copper',    de_DE: 'Rose / Kupfer',      fr_FR: 'rose / cuivre',      ja_JP: 'ローズ×銅' },
  'indigo-gold':  { en_US: 'indigo / gold',    de_DE: 'Indigo / Gold',      fr_FR: 'indigo / or',        ja_JP: '藍×ゴールド' },
  'plum-ember':   { en_US: 'plum / ember',     de_DE: 'Pflaume / Glut',     fr_FR: 'prune / braise',     ja_JP: 'プラム×残り火' },
  'teal-bronze':  { en_US: 'teal / bronze',    de_DE: 'Petrol / Bronze',    fr_FR: 'sarcelle / bronze',  ja_JP: 'ティール×ブロンズ' },
  'saffron-rose': { en_US: 'saffron / rose',   de_DE: 'Safran / Rose',      fr_FR: 'safran / rose',      ja_JP: 'サフラン×ローズ' },
  'moss-copper':  { en_US: 'moss / copper',    de_DE: 'Moos / Kupfer',      fr_FR: 'mousse / cuivre',    ja_JP: 'モス×銅' },
  'dusk-orchid':  { en_US: 'dusk / orchid',    de_DE: 'Dämmerung / Orchidee', fr_FR: 'crépuscule / orchidée', ja_JP: '黄昏×蘭' },
  'crimson-brass': { en_US: 'crimson / brass', de_DE: 'Purpur / Messing',   fr_FR: 'carmin / laiton',    ja_JP: 'クリムゾン×真鍮' },
};

const HERITAGE_HAIR_NAMES = {
  'ink-black': { en_US: 'ink black',  de_DE: 'tuschschwarz',  fr_FR: 'noir encre',    ja_JP: '墨黒' },
  'chestnut':  { en_US: 'chestnut',   de_DE: 'kastanie',      fr_FR: 'châtain',       ja_JP: '栗色' },
  'silver-fox':{ en_US: 'silver fox', de_DE: 'silberfuchs',   fr_FR: 'renard argenté', ja_JP: 'シルバーフォックス' },
  'auburn':    { en_US: 'auburn',     de_DE: 'rotbraun',      fr_FR: 'auburn',        ja_JP: '赤褐' },
  'moon-grey': { en_US: 'moon grey',  de_DE: 'mondgrau',      fr_FR: 'gris lunaire',  ja_JP: '月光グレー' },
  'espresso':  { en_US: 'espresso',   de_DE: 'espresso',      fr_FR: 'espresso',      ja_JP: 'エスプレッソ' },
};

const AURORA_TITLES = {
  en_US: 'VOXEL AURORA CIRCUIT Pack', de_DE: 'VOXEL AURORA CIRCUIT Paket',
  fr_FR: 'Pack VOXEL AURORA CIRCUIT', ja_JP: 'VOXEL AURORA CIRCUIT パック',
};
const AURORA_ACCENT_NAMES = {
  'aurora-mint': {en_US:'aurora / mint',de_DE:'Aurora / Mint',fr_FR:'aurore / menthe',ja_JP:'オーロラ×ミント'},
  'polar-blue': {en_US:'polar / blue',de_DE:'Polar / Blau',fr_FR:'polaire / bleu',ja_JP:'ポーラー×ブルー'},
  'violet-ice': {en_US:'violet / ice',de_DE:'Violett / Eis',fr_FR:'violet / glace',ja_JP:'バイオレット×アイス'},
  'glacier-rose': {en_US:'glacier / rose',de_DE:'Gletscher / Rose',fr_FR:'glacier / rose',ja_JP:'氷河×ローズ'},
  'solar-lime': {en_US:'solar / lime',de_DE:'Solar / Limette',fr_FR:'solaire / lime',ja_JP:'ソーラー×ライム'},
  'deep-space': {en_US:'deep space / violet',de_DE:'Weltraum / Violett',fr_FR:'espace / violet',ja_JP:'ディープスペース×紫'},
  'frost-orange': {en_US:'frost / orange',de_DE:'Frost / Orange',fr_FR:'givre / orange',ja_JP:'フロスト×オレンジ'},
  'nebula-pink': {en_US:'nebula / pink',de_DE:'Nebel / Pink',fr_FR:'nébuleuse / rose',ja_JP:'星雲×ピンク'},
  'comet-gold': {en_US:'comet / gold',de_DE:'Komet / Gold',fr_FR:'comète / or',ja_JP:'彗星×ゴールド'},
  'glow-lilac': {en_US:'glow / lilac',de_DE:'Glow / Flieder',fr_FR:'lueur / lilas',ja_JP:'グロー×ライラック'},
};
const AURORA_HAIR_NAMES = {
  'polar-white':{en_US:'polar white',de_DE:'Polarweiß',fr_FR:'blanc polaire',ja_JP:'ポーラーホワイト'},'holo-silver':{en_US:'holo silver',de_DE:'Holo-Silber',fr_FR:'argent holo',ja_JP:'ホロシルバー'},'arctic-blue':{en_US:'arctic blue',de_DE:'Arktisblau',fr_FR:'bleu arctique',ja_JP:'アークティックブルー'},'lavender-fade':{en_US:'lavender fade',de_DE:'Lavendel-Fade',fr_FR:'dégradé lavande',ja_JP:'ラベンダーフェード'},'mint-shadow':{en_US:'mint shadow',de_DE:'Mint-Schatten',fr_FR:'ombre menthe',ja_JP:'ミントシャドウ'},'solar-blonde':{en_US:'solar blonde',de_DE:'Solarblond',fr_FR:'blond solaire',ja_JP:'ソーラーブロンド'}
};
const AURORA_FIT_NAMES = {
  'puffer-shell':{en_US:'puffer shell',de_DE:'Puffer-Shell',fr_FR:'doudoune shell',ja_JP:'パファーシェル'},'orbit-coat':{en_US:'orbit coat',de_DE:'Orbit-Mantel',fr_FR:'manteau orbital',ja_JP:'オービットコート'},'holo-hood':{en_US:'holo hood',de_DE:'Holo-Kapuze',fr_FR:'capuche holo',ja_JP:'ホロフード'},'utility-vest':{en_US:'utility vest',de_DE:'Utility-Weste',fr_FR:'gilet utilitaire',ja_JP:'ユーティリティベスト'},'thermal-cape':{en_US:'thermal cape',de_DE:'Thermo-Cape',fr_FR:'cape thermique',ja_JP:'サーマルケープ'},'signal-bomber':{en_US:'signal bomber',de_DE:'Signal-Bomber',fr_FR:'bomber signal',ja_JP:'シグナルブルゾン'}
};

const HERITAGE_FIT_NAMES = {
  'haori-wrap':     { en_US: 'haori wrap',      de_DE: 'Haori-Mantel',      fr_FR: 'haori drapé',      ja_JP: '羽織ラップ' },
  'mandarin-jacket':{ en_US: 'mandarin jacket', de_DE: 'Mandarinenjacke',   fr_FR: 'veste mandarine',  ja_JP: 'マンダリンジャケット' },
  'silk-hood':      { en_US: 'silk hood',       de_DE: 'Seidenkapuze',      fr_FR: 'capuche de soie',  ja_JP: 'シルクフード' },
  'obi-bomber':     { en_US: 'obi bomber',      de_DE: 'Obi-Bomber',        fr_FR: 'bomber obi',       ja_JP: '帯ブルゾン' },
  'dragon-ma1':     { en_US: 'dragon MA-1',     de_DE: 'Drachen-MA-1',      fr_FR: 'MA-1 dragon',      ja_JP: 'ドラゴンMA-1' },
  'qipao-hood':     { en_US: 'qipao + hood',    de_DE: 'Qipao + Kapuze',    fr_FR: 'qipao + capuche',  ja_JP: 'チャイナフード' },
};

const maskName = k => (ACCENT_NAMES[k] && ACCENT_NAMES[k].en_US) || k;

/** Localized display name for one skin (theme-aware). */
function skinTitle(lang, desc) {
  const acc = ((AURORA_ACCENT_NAMES[desc.accent] || HERITAGE_ACCENT_NAMES[desc.accent] || ACCENT_NAMES[desc.accent]) || {})[lang] || desc.accent;
  const hair = ((AURORA_HAIR_NAMES[desc.hair] || HERITAGE_HAIR_NAMES[desc.hair] || HAIR_NAMES[desc.hair]) || {})[lang] || desc.hair;
  const fit = ((AURORA_FIT_NAMES[desc.fit] || HERITAGE_FIT_NAMES[desc.fit] || FIT_NAMES[desc.fit]) || {})[lang] || desc.fit;
  if (lang === 'ja_JP') return `${acc}／${hair}／${fit}`;
  if (lang === 'de_DE') return `${acc} — ${hair}, ${fit}`;
  return `${acc} · ${hair} · ${fit}`;
}

/**
 * Build .lang bodies for a pack.
 * skins: [{ localizationName, title: {accent,hair,fit} }] — display metadata per skin.
 * Returns { 'en_US': 'key=value\n...', 'de_DE': ..., ... } in the doc's key order.
 */
function buildLangs({ locName, packTitles, skins }) {
  const out = {};
  for (const lang of Object.keys(packTitles)) {
    const lines = [`skinpack.${locName}=${packTitles[lang]}`];
    for (const s of skins) {
      lines.push(`skin.${locName}.${s.localizationName}=${skinTitle(lang, s.title)}`);
    }
    out[lang] = lines.join('\n') + '\n';
  }
  return out;
}

module.exports = { PACK_TITLES, STARTER_TITLES, HERITAGE_TITLES, AURORA_TITLES, ACCENT_NAMES, HAIR_NAMES, FIT_NAMES, HERITAGE_ACCENT_NAMES, HERITAGE_HAIR_NAMES, HERITAGE_FIT_NAMES, skinTitle, buildLangs };
