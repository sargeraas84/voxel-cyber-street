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

const maskName = k => (ACCENT_NAMES[k] && ACCENT_NAMES[k].en_US) || k;

/** Localized display name for one skin. */
function skinTitle(lang, desc) {
  const acc = (ACCENT_NAMES[desc.accent] && ACCENT_NAMES[desc.accent][lang]) || desc.accent;
  const hair = (HAIR_NAMES[desc.hair] && HAIR_NAMES[desc.hair][lang]) || desc.hair;
  const fit = (FIT_NAMES[desc.fit] && FIT_NAMES[desc.fit][lang]) || desc.fit;
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

module.exports = { PACK_TITLES, STARTER_TITLES, ACCENT_NAMES, HAIR_NAMES, FIT_NAMES, skinTitle, buildLangs };
