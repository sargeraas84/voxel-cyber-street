# VOXEL // CYBER-TEEN

A full-body 3D voxel character design of a stylish teenager in the Minecraft style — oversized futuristic cyberpunk streetwear, glowing neon **pink + cyan** accents, messy **white** hair, a **tech-wear mask** over the lower face, and **chunky high-top sneakers**. Built as a procedural, Minecraft-ready **64×64 skin (base + overlay)** plus a live **character reference sheet** (hero ¾, front, side, rear) rendered in Three.js on a dark grey studio background with flat dynamic lighting.

## Files

| File | Purpose |
|---|---|
| `index.html` | Reference sheet: 4 viewports, real UnrealBloom neon, idle/walk/wave/dance animations, toggleable glowing tech cape |
| `gallery.html` | 36-skin pack gallery — scrollable 4-column grid of live 3D characters with bloom |
| `cover.html` | Live Marketplace cover compositor (2048×1152) |
| `cover/voxel-cyber-street-cover-2048x1152.png` | Rendered cover image (also via `npm run cover`) |
| `skin-gen-core.js` | Shared procedural painter: 6 accent pairs × 4 hair looks × 4 fits, seed-stable |
| `character-rig.js` | Shared Three.js voxel rig + animation state machine |
| `tools/generate-skin.js` | CLI: one skin PNG with `--accent --hair --fit --seed` |
| `tools/build-pack.js` | CLI: generates the 12-skin pack into `pack/` + `pack.json` |
| `tools/export-mcpack.js` | CLI: zips `pack/` into a spec-validated Bedrock `.mcpack` (4 languages) |
| `tools/lib/mcpack-spec.js` | Microsoft skin-pack spec validator (build fails on any deviation) |
| `tools/lib/mcpack-i18n.js` | Shared localization: en_US / de_DE / fr_FR / ja_JP .lang builder |
| `guide.html` | Step-by-step submission guide: press kit → Marketplace partner application |
| `tools/render-cover.js` | CLI: headless-renders the Marketplace cover PNG |
| `tools/render-icons.js` | CLI: 36× 512×512 store portrait icons + contact sheet |
| `tools/render-poster.js` | CLI: A3 (3508×4961 @ 300dpi) trading-card poster, 3×2 stat cards |
| `tools/build-fabric-mod.js` | CLI: Java Edition Fabric mod — applies skins + capes to NPCs |
| `tools/validate-packs.js` | CLI: re-validate both dist `.mcpack`s against the Microsoft spec |
| `trailer-capture.js` | Gallery trailer mode: records `gallery.html?trailer=1` to webm |
| `TRAILER.md` | Shot list, VO script, OBS recording guide |
| `cyber-teen-skin.png` | Latest generated single skin |
| `dist/VOXEL-CYBER-STREET.mcpack` | Installable Bedrock skin pack (36 skins) |
| `icons/` | Store icons: `icon-01..36.png` (512²) + `contact-sheet.png` |
| `poster/voxel-cyber-street-poster-a3.png` | Printable A3 poster (300 dpi) |
| `dist/voxel-cyber-street-fabric-1.0.0.jar` | Fabric mod jar (skins+cape resources) |
| `dist/voxel-cyber-street-fabric-1.21.jar` | Compiled Fabric mod (remapped vs MC 1.21, Loom 1.7.4) |
| `dist/voxel-cyber-street-fabric-src.zip` | Full Fabric source tree (gradle-ready) |

The Fabric mod reads the **same Bedrock-format `skins.json`** as the `.mcpacks` (single
metadata source), merging Fabric-only texture paths from a `textures.json` sidecar in
`SkinRegistry` at load time.
| `starter-pack/` | 5-skin starter bundle: skins, capes, cover, icons |
| `search.html` | Seed search: filter 4,320 style combos, live 3D results |
| `presskit.html` | One-click press-kit.zip builder for store submissions |

## Run the reference sheet

```bash
# any static server, e.g.
npx serve .
# open http://localhost:3000
```

Controls:
- **Drag** the hero view to orbit, **scroll** to zoom.
- **Spin** — turntable the hero view.
- **Re-roll** — regenerate outfit accents/patterns with a new seed.
- **Cape** — toggle the glowing tech cape (emissive, sways with the animation).
- **Idle / Walk / Wave / Dance** — animation showcase.
- **⬇ PNG** — download the current 64×64 skin **+** its 64×32 cape.
- Deep-link any variant: `index.html?accent=violet-pink&hair=ice-blue&fit=longline&seed=42&cape=1&anim=dance`

Gallery (36 skins): scroll the grid (wheel or drag), hover to zoom/spin a character,
click to open its reference sheet, **⬇ All PNGs** to download the pack, **⬇ Cover** for the cover compositor.

## Generate everything with one command

```bash
npm install          # provides the `canvas` package
npm run gallery      # pack/ (36 skins + 36 capes + pack.json) + dist/.mcpack + cover PNG
npm run icons        # icons/icon-01..36.png + contact-sheet.png
npm run poster       # poster/voxel-cyber-street-poster-a3.png
npm run pack         # LOCKSTEP: regenerate pack/ → Bedrock .mcpack → sync Fabric resources → recompile 1.21 jar
npm run pack:fast    # same, minus the Gradle compile (metadata-only refresh)
npm run langqa       # langqa.html — every skin name in EN/DE/FR/JA side by side (fails on gaps)
npm run listing      # store-listing.html — Marketplace submission draft w/ copy-ready fields
npm run fabric       # dist/voxel-cyber-street-fabric-1.0.0.jar + -src.zip (from synced resources)
npm run fabric:compile  # real Gradle compile vs MC 1.21 → dist/voxel-cyber-street-fabric-1.21.jar
npm run starter      # starter-pack/: 5 skins + .mcpack + cover + icons
npm run trailer      # everything above + langqa + store listing + demo datapack, in dependency order
npm run datapack     # dist/vcsdemo-neon-district.zip — neon street scene + self-guided tour (DEMO.md)
npm run runclient    # boot a REAL Minecraft 1.21 client with the mod (see below)
npm run record       # headless-Chromium trailer capture → voxel-cyber-street-trailer.webm
npm run formats      # MP4 exports: store 720p, 1080p, square 1:1, vertical 9:16 → trailer/
npm run letter       # cover-letter.html — printable partner-application cover letter
npm run compliance   # compliance.html — partner-requirements audit + per-region checklist
npm run submission   # dist/voxel-cyber-street-submission.zip — portal-order zip + MANIFEST
npm run skin         # single skin → cyber-teen-skin.png (+ -cape.png)
npm run cover        # Marketplace cover → cover/voxel-cyber-street-cover-2048x1152.png

## Record the trailer

```bash
npm run record       # automated: headless Chromium + real GPU → voxel-cyber-street-trailer.webm
```

(One-time: `npx puppeteer browsers install chrome`.) Or open `gallery.html?trailer=1`
to record interactively with the click-to-download flow (`&dry=1` previews the shot
list). Full VO script + OBS master-guide in `TRAILER.md`. The recorded file is picked
up by the store listing's trailer slot, the press kit and the cover letter
automatically.

## See the mod in-game (runClient)

```bash
npm run runclient    # Gradle runClient — boots Minecraft 1.21 with the mod loaded
```

First launch downloads the client assets (~5 min with the portable toolchain); later
runs are fast. In the title screen, **Mods** must list VOXEL CYBER-STREET. In a world:
- **Neon District demo (recommended)**: install `dist/vcsdemo-neon-district.zip` in the
  world's `datapacks/` folder and run `/function vcsdemo:scene` — a neon-lit street
  with 12 posed Corrupted Skins (`cyber_01`–`cyber_12`, deterministic skins via the
  forced-name path), beacon camera stops and night lighting. Full tour + camera
  route in **DEMO.md**.
- **Corrupted Skins**: or spawn zombie villagers (`/summon minecraft:zombie_villager`)
  — roughly 1 in 3 wears a cyber-teen skin with a glowing cape and emissive neon
  accents (the *_glow texture renders fullbright on top of the base skin). Naming any
  zombie villager `cyber_NN` forces pack skin #NN (repeatable screenshots).
- **Marketing shots**: `/vshot` (single), `/vshot burst 10` (one per second while
  you fly), `/vshot orbit 12` (turntable) — saves to the client's screenshots folder.
- **Spawn egg (Creative → Spawn Eggs)**: "Corrupted Skin Spawn Egg" places a
  guaranteed corrupted cyber-teen villager (random skin, glowing cape, NoAI, persistent);
  right-click an existing zombie villager to corrupt it in place.
- **Buyer config**: `config/voxelcyberstreet.json` (auto-created on first boot) —
  corruption rate, capes, glow, spawn egg, pose mode. `/vconfig` shows it,
  `/vconfig reload` re-reads it, `/vconfig set <n>` sets the 1-in-N conversion rate.
- **Real-gameplay trailer**: build `/function vcsdemo:scene`, then
  `/vdirector start [tour|race|chase|crowd]` — scripted camera flights dump
  lossless frames; `npm run encode [route]` turns them into gameplay MP4s.
- **Named fake players**: `/summon minecraft:player ~ ~ ~ {...}` via an NPC platform
  resolves `cyber_01`…`cyber_36` to pack skins (SkinApplierMixin).
```

Reproduce any exact look:

```bash
node tools/generate-skin.js out.png --accent=violet-pink --hair=ice-blue --fit=longline --seed=42
```

## Install the .mcpack (Bedrock)

Double-click `dist/VOXEL-CYBER-STREET.mcpack` (or import it via Settings → Storage → Import).
The skins appear under **Settings → Skin** in Minecraft Bedrock. Both `.mcpack`s follow the
official Microsoft skin-pack layout ([learn.microsoft.com — packaging a skin pack](https://learn.microsoft.com/en-us/minecraft/creator/documents/packagingaskinpack)):
`manifest.json` (`format_version 1`, `header.name: "pack.name"` localized via texts, `skin_pack`
module, two distinct v4 UUIDs), `skins.json` with `serialize_name`/`localization_name` plus
per-skin `geometry` (alternating `geometry.humanoid.custom` Steve / `customSlim` Alex),
`texture` and `type: free`, textures at the pack root, and `texts/*.lang` using the
`skinpack.<loc>=` / `skin.<loc>.<skin>=` key format with `languages.json`.
A 128×128 `pack_icon.png` is generated from skin #1.

**Machine-validated:** every export runs `tools/lib/mcpack-spec.js` against the written zip —
manifest shape, skins.json fields, root-level textures, .lang keys for every skin, languages
list and PNG integrity. Any deviation fails the build with the full violation list
(`npm run validate` re-checks existing packs).

**Localized in 4 languages:** `en_US`, `de_DE`, `fr_FR`, `ja_JP` (shared
`tools/lib/mcpack-i18n.js` vocabulary — pack title, accents, hair looks and fits are
translated; switch the game language to see it).

## The pack (36 skins)

12 accent pairs × 6 hair looks × 6 fits, laid out deterministically:
`accent = ACCENTS[i % 12]`, `hair = HAIRS[i % 6]`, `fit = FITS[i % 6]`, `seed = 2000+i`.
Every skin ships with a matching **tech cape** (64×32, diamond emblem + circuit traces,
glowing hem) exported separately for Java cape slots and included in the Bedrock pack art.

## Design notes

- **Palette**: near-black tech fabrics (`#1e2026`/`#2f3340`) with neon pink `#ff2d95` and cyan `#19e3ff` trims; white hair in muted 4-tone greys so it reads as messy, not a helmet.
- **Silhouette**: oversized — body shell 10px wide vs 8px base, sleeves +2px, joggers +1.6px — but every element stays Minecraft-blocky.
- **Glow**: a separate emissive channel drives a real postprocessing `BloomEffect` (mipmap blur,
  additive) in all pages; exported PNGs bake a dimmed version so they still read in vanilla Minecraft.
- **Cape**: standard 64×32 cape UVs; the rig renders it with dedicated materials and
  per-animation sway (idle flutter, walk billow, dance swing).

## Marketplace reality-check (read this)

The official **Minecraft Marketplace** (minecraft.net/en-us/marketplace) sells **worlds, skins packs, mash-ups and textures** — but only through **approved partners**. You cannot upload a single skin and start earning directly; the path is:

1. **Build a portfolio** — a pack of skins like this one (8–16 coherent designs beats one standalone).
2. **Apply to the Minecraft Marketplace Partner Program** when applications are open, or **partner through an established studio** (many accept freelance skin/textures artists).
3. Alternative routes that need no approval: **Planet Minecraft / NameMC contest wins**, **Minecraft Realms+ community spots**, or selling skin packs via **other storefronts that license your art**.

This repo gives you the asset pipeline (procedural variants via seed + instant PNG export) to produce a partner-quality pack quickly.
