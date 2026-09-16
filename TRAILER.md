# VOXEL CYBER-STREET — Trailer Kit

Marketing trailer for the 36-skin pack. Two ways to produce it:

1. **Auto-capture (one click):** `gallery.html?trailer=1` records the live gallery
   as `voxel-cyber-street-trailer.webm` (~18 s, VP9, 60 fps, 1280×720).
   Add `&dry=1` to preview the shot list without recording.
2. **Manual record:** open the same URL in OBS/Studio and record the window while
   the auto-capture drives the shots — gives you a lossless master.

---

## Shot list (auto-captured)

| # | Dur | Shot        | On-screen title                        | Subtitle | Gallery state |
|---|-----|-------------|----------------------------------------|----------|---------------|
| 1 | 3.0s | Title card | `VOXEL // CYBER-STREET`                | 36 procedurally generated cyber-teens | top of grid, static |
| 2 | 3.0s | Sweep      | `THE PACK`                             | every skin ships with a glowing tech cape | full spin, top row |
| 3 | 2.5s | Sweep      | `EVERY FIT, EVERY ACCENT`              | 12 accent pairs · 6 hair looks · 6 fits | scroll → row 2 |
| 4 | 2.5s | Slow       | `LIVE IN 3D`                           | idle · walk · wave · dance | row 1 spotlight (hover pose) |
| 5 | 2.5s | Spin       | `SKINS + CAPES`                        | 64×64 base + overlay · 64×32 cape slot | full spin, row 3 |
| 6 | 2.0s | End card   | `DROPS TODAY`                          | Bedrock .mcpack · Java mod · reference sheets | top of grid |

Captions fade in/out 0.4 s; underline is the pack's pink→cyan gradient.

## Voice-over script (~17 s at natural pace)

1. *(0:00–0:03)* "Thirty-six cyber-teens. Zero repeats."
2. *(0:03–0:06)* "Every skin drops with its own glowing tech cape."
3. *(0:06–0:09)* "Twelve accent pairs. Six hair looks. Six fits. Seeded, so every roll is yours."
4. *(0:09–0:11)* "And they move — idle, walk, wave, dance."
5. *(0:11–0:14)* "Skins and capes in the standard sixty-four-by-sixty-four slots. Drops in clean."
6. *(0:14–0:16)* "VOXEL CYBER-STREET. Live on the Marketplace now."

Suggested delivery: low, confident, slight filter/echo. Music: 100 BPM synthwave,
side-chained under VO, duck -6 dB on captions.

## Recording guide (manual pass)

- **Resolution:** record the browser window at 1280×720 or 1920×1080 (the stage
  letterboxes itself; never crop the grid).
- **FPS:** 60. The capture loop runs on rAF, so keep the tab **visible** —
  backgrounded tabs throttle to 0 fps and the recording stalls.
- **In OBS:** add Window Capture → `gallery.html?trailer=1`, set canvas 1920×1080,
  record CQP 15 or CRF 18. The on-page captions bake into the frame, so no text
  overlay needed.
- **Master:** `ffmpeg -i raw.mkv -c:v libvpx-vp9 -crf 24 -b:v 0 -row-mt 1 trailer.webm`
- **Poster frame:** grab 0.5 s into shot 2 (full spin, capes lit) for the thumbnail.

## Assets recap

- `trailer-capture.js` — capture module (auto-loaded by gallery when `?trailer=1`)
- `gallery.html?trailer=1&dry=1` — dry-run shot list in console
- `cover/voxel-cyber-street-cover-2048x1152.png` — store cover (see `npm run cover`)
- `icons/icon-01..36.png` — per-skin store portraits
