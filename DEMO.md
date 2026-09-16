# DEMO — Corrupted Skins in-game tour (under 2 minutes)

A scripted walkthrough that shows the pack's Corrupted Skin zombie villagers and
glowing tech capes in a real Minecraft 1.21 client, ending with marketing shots
on disk. Works with the dev client (`npm run runclient`) or the released jar in
a normal Fabric install.

## One-time setup (2 min)

1. **Client with the mod**: `npm run runclient` (dev) — or drop
   `dist/voxel-cyber-street-fabric-1.21.jar` into `.minecraft/mods/` with
   Fabric Loader + Fabric API installed.
2. **Create a world** — any Creative world, *flat* recommended, cheats ON.
3. **Install the demo datapack** — copy `dist/vcsdemo-neon-district.zip` into
   `<world folder>/datapacks/`, then in game `/reload` (or restart the world).
   Chat confirms: `[Neon District] loaded`.

## The tour (~90 seconds)

Stand roughly in the middle of where you want the street, facing north, then run:

```minecraftcommands
/function vcsdemo:scene
```

That builds the neon street, spawns **12 forced Corrupted Skins** (named
`cyber_01`–`cyber_12`, so every one shows a *specific, repeatable* pack skin
with a glowing cape), a crowd of ambient zombies (~⅓ convert naturally),
five beacon camera stops, sets night, and gives you night vision.

Then fly the camera route — each stop matches a beacon (white → cyan → magenta →
pink → light blue):

| stop | where | what to frame | shot command |
|------|-------|---------------|--------------|
| 1 — white | hover ~15 blocks above the street's south end, look down the strip | full neon street + beacons | `/vshot 01-overview` |
| 2 — cyan | street level at the mid beacon, face north | first pair of corrupted villagers face-on | `/vshot 02-street` |
| 3 — magenta | center crossing, look along the pink edge strips | two rows of capes receding into glow | `/vshot 03-capeline` |
| 4 — pink | 3 blocks behind a corrupted villager, crouch | the glowing tech cape up close | `/vshot 04-cape-close` |
| 5 — light blue | end of the street, look back | the whole cast + storefront signage | `/vshot 05-cast` |

Between stops 3 and 4, run the turntable:

```minecraftcommands
/vshot orbit 12
```

— it slowly rotates the camera and saves 12 shots (one per second) for a
spin-loop GIF or the trailer's hero shot.

Finish with:

```minecraftcommands
/vshot burst 6
```

and walk/fly along the street while it shoots — 6 candid marketing frames.

## Self-guided tour (hands-free)

Don't want to drive? Run:

```minecraftcommands
/function vcsdemo:tour
```

A repeating narration walks every online player through the six stops: a chat
headline at each stop and a persistent actionbar wayfinder telling you which
beacon to follow (① white → ② cyan → ③ magenta → ④ pink → ⑤ light-blue →
⑥ capture). One lap is ~64 seconds and loops until you stop it:

```minecraftcommands
/function vcsdemo:tour_off
```

`/function vcsdemo:clear` also stops the tour when it tears the scene down.

## Where the shots land

`tools/fabric-mod/run/screenshots/vcs-*.png` (dev client) — or
`.minecraft/screenshots/` for the released-jar install. Feed the best ones to
`store-listing.html` or the press kit.

## Real-gameplay trailer (Voxel Director)

Want actual gameplay footage instead of the web-render trailer? After
`/function vcsdemo:scene`:

```minecraftcommands
/vdirector start            # 'tour' route — the classic 2-minute walkthrough
/vdirector start race       # 90s night street race — low, fast, kinetic
/vdirector start chase      # 75s cape chase — orbit and push-in on one skin
/vdirector start crowd      # 105s mob-crowd crane moves
/vdirector route            # list routes
```

The mod flies the scripted camera route, hides the HUD, and dumps one lossless
PNG per tick to `tools/fabric-mod/run/screenshots/director/<route>/`.
`/vdirector stop` cuts early. Encode at real time (60 fps):

```bash
npm run encode             # tour → voxel-cyber-street-gameplay-demo-tour.mp4
npm run encode -- race     # → voxel-cyber-street-gameplay-demo-race.mp4
```

## Spawn egg alternative

No datapack? The mod itself ships a **Corrupted Skin Spawn Egg** (Creative →
Spawn Eggs tab): right-click a block to place a corrupted cyber-teen villager,
or right-click an existing zombie villager to corrupt it in place.

## Teardown

```minecraftcommands
/function vcsdemo:clear
```

removes the scene and all demo entities.

## Troubleshooting

- **A villager shows a vanilla texture** — it wasn't named before the client
  saw it; re-run `/function vcsdemo:spawn` (the forced path re-resolves every
  frame, so renames apply instantly).
- **Everything is too bright/dark** — the scene sets night + night vision;
  re-run `time set night` after long sessions.
- **The tour chat is spammy** — it repeats by design (viewer-facing); stop it
  with `/function vcsdemo:tour_off`.
- **Shots are black** — keep the game window focused while shooting (the
  renderer pauses in unfocused clients); check `run/screenshots/` timestamps.
