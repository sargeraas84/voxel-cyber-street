# Changelog — VOXEL CYBER-STREET

All notable changes to the pack, the Bedrock exports, the Fabric mod and the
store tooling. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.2.0] — 2026-09-16

### Pack #2 — NEON HERITAGE
- Second themed skin line: 36 skins (10 ember/jade/brass accent pairs × 6 heritage
  hair looks × 6 fits: haori-wrap, mandarin-jacket, silk-hood, obi-bomber,
  dragon-ma1, qipao-hood), same procedural pipeline, seed base 5000.
- `skin-gen-core.js` is now theme-aware (`THEMES`, behavior-alias map so heritage
  garments keep hoods/drape/hem treatments); pack #1 renders byte-identical.
- `npm run heritage` → `pack-heritage/`; `node tools/export-mcpack.js pack-heritage
  --out VOXEL-NEON-HERITAGE.mcpack` → spec-validated Bedrock pack; fully localized
  display names (EN/DE/FR/JA) via the shared i18n builder.
- `heritage.html` — live 3D gallery for the new line (QA'd headless: loader hides,
  zero console errors); served by the new `npm run serve` static server.
- Pack added to `tools/validate-packs.js` and attached to every GitHub release.

### Gameplay capture
- `tools/craft-demo-world.js` — builds the NeonDistrict singleplayer save with a
  real vanilla 1.21 server (pre-seeded datapack, scene built from console; fixed
  two vanilla-only parse bugs in the datapack: unquoted name selector, `pink` →
  `light_purple`).
- `tools/record-demo.sh` — unattended `--quickPlaySingleplayer` boot with the
  autopilot director (pre-seeds `onboardAccessibility:false`, fixed window).
- Voxel director creates frame dirs before recording (first run's screenshots
  silently failed on `NoSuchFileException`); encoder auto-detects the first frame
  and defaults to real-time 20 fps.
- `dist/voxel-cyber-street-gameplay-demo-tour.mp4` — 2:00 real-time 1440p capture
  (2399 frames) of the in-game tour route.

## [2.2.0] — 2026-09-16

### Collection expansion
- Added **AURORA CIRCUIT**, a third 36-skin themed line with polar, mint,
  violet and comet accents, expedition-tech fits, its own seed range, gallery,
  four-language Bedrock metadata, and a spec-validated `.mcpack`.
- Added `dual-store.html`, a Marketplace-style cross-sell page for CYBER-STREET
  and NEON HERITAGE with a complete 72-skin bundle pricing plan.
- Release automation now builds and publishes all three full packs plus the
  dual-pack store asset.

## [2.1.0] — 2026-09-16

### Fabric mod
- `/vconfig` — every buyer-facing setting controllable in-game and persisted to
  `config/voxelcyberstreet.json`: `corruptionRate` (0–1000), `capes`, `glow`,
  `spawnEgg`, `hideEggNames`, `eggPoseMode`, plus `reload`. Localized feedback in
  EN/DE/FR/JA.
- Localized config guides ship beside the JSON:
  `voxelcyberstreet.README.txt` (EN) + `.de_DE/.fr_FR/.ja_JP.txt`, rewritten on
  every save so they can never drift from the actual fields.
- `/vdirector route <name>` — four selectable capture routes: `tour` (the
  original 2-minute overview), `race` (low, fast night-street pass, 90 s),
  `chase` (orbit-and-push around one corrupted villager's cape, 75 s), `crowd`
  (wide crane moves across the zombie horde + cast, 105 s). Frames land in
  `run/screenshots/director/<route>/`; `npm run encode` now encodes per-route
  (pass the route name).

### Store submission
- `dist/voxel-cyber-street-submission.zip` — portal-ordered bundle (59 files):
  legal, localized listing copy, `.mcpack`s, store icons, screenshots, trailer
  exports, datapack — with a self-verifying `docs/MANIFEST.txt` checklist
  (0 missing).
- `npm run submission` / `npm run encode` scripts; release workflow builds and
  attaches the bundle.

## [2.0.0] — 2026-09-16

### Pack
- 36 procedural cyber-street skins (10 neon accent pairs × 6 hair × 6 fits,
  Steve + Alex models) + matching glowing tech capes, seed-stable.
- 5-skin Starter bundle for smaller Marketplace slots.
- Both `.mcpack`s machine-validated against the official Microsoft skin-pack
  spec, localized in en_US / de_DE / fr_FR / ja_JP.

### Bedrock
- `skins.json` is the single metadata source for both editions (Fabric mod
  loads it verbatim + a Fabric-only `textures.json` sidecar).
- Spec validator fails the build on any deviation (`tools/lib/mcpack-spec.js`).

### Java (Fabric, MC 1.21)
- Corrupted Skins: ~1-in-3 zombie villagers render as cyber-teens (rate
  configurable).
- Glowing tech capes and an emissive neon-accents pass (in-world glow).
- Corrupted Skin spawn egg (Spawn Eggs tab): place or convert-in-place.
- Forced skins via `cyber_NN` custom names (deterministic shots).
- Buyer config: `config/voxelcyberstreet.json` + `/vconfig reload`.
- Screenshot tool: `/vshot`, `/vshot burst <n>`, `/vshot orbit <n>`.
- Voxel Director: `/vdirector start` films a scripted 2-minute camera path and
  dumps lossless frames for `tools/encode-director.js`.

### Store tooling
- Lockstep `npm run pack`: skins → Bedrock pack → Fabric sync → 1.21 jar.
- One-command build `npm run trailer` (clean-room verified), incl. automated
  trailer recording (headless Chromium + real GPU) and MP4 exports
  (720p/1080p/square/vertical).
- Language QA page, seed-search page, press-kit page, submission guide,
  store-listing draft, partner cover letter, compliance checklist.

## [1.0.0] — 2026-09-15
- Initial 12-skin pack, reference sheet with UnrealBloom, Bedrock export,
  gallery, icons, A3 poster, trailer capture prototype.
