# Changelog — VOXEL CYBER-STREET

All notable changes to the pack, the Bedrock exports, the Fabric mod and the
store tooling. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
