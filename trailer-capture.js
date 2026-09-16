/* ============================================================================
   TRAILER CAPTURE — records the gallery turntable as a marketing webm.
   Activated with gallery.html?trailer=1 (needs window.__galleryCtl from the
   gallery page). Composites the live WebGL canvas into a fixed 1280x720
   16:9 frame with baked title cards, then records via MediaRecorder.

   Output: voxel-cyber-street-trailer.webm (VP9, ~18s)
   Add &dry=1 to preview the shot list without recording.
   ========================================================================== */
(function () {
  'use strict';

  const SHOTS = [
    { dur: 3.0, label: 'VOXEL // CYBER-STREET', sub: '36 procedurally generated cyber-teens',  kind: 'title',   scroll: 0 },
    { dur: 3.0, label: 'THE PACK',              sub: 'every skin ships with a glowing tech cape', kind: 'sweep', scroll: 0 },
    { dur: 2.5, label: 'EVERY FIT, EVERY ACCENT', sub: '12 accent pairs · 6 hair looks · 6 fits', kind: 'sweep', scroll: 1.0 },
    { dur: 2.5, label: 'LIVE IN 3D',            sub: 'idle · walk · wave · dance',             kind: 'slow',  scroll: 0.5 },
    { dur: 2.5, label: 'SKINS + CAPES',         sub: '64×64 base + overlay · 64×32 cape slot', kind: 'spin',  scroll: 1.8 },
    { dur: 2.0, label: 'DROPS TODAY',           sub: 'Bedrock .mcpack · Java mod · reference sheets', kind: 'endcard', scroll: 0 },
  ];
  const TRAILER_W = 1280, TRAILER_H = 720;

  function createTrailer() {
    const ctl = window.__galleryCtl;
    if (!ctl) { console.warn('[trailer] gallery controller missing'); return null; }

    // composite canvas — MUST be in the DOM: captureStream only yields frames
    // for canvases the compositor actually paints. In trailer mode it doubles
    // as the live preview of what's being recorded.
    const stage = document.createElement('canvas');
    stage.width = TRAILER_W; stage.height = TRAILER_H;
    Object.assign(stage.style, {
      position: 'fixed', inset: '0', width: '100vw', height: '100vh',
      zIndex: 9999, background: '#131418', objectFit: 'fill',
    });
    document.body.appendChild(stage);
    const sctx = stage.getContext('2d');
    sctx.fillStyle = '#131418'; sctx.fillRect(0, 0, TRAILER_W, TRAILER_H);

    // hidden video mirror: captureStream needs a live video source; we draw
    // the WebGL canvas into `stage` every frame via requestAnimationFrame.
    const srcCanvas = ctl.getCanvas();

    let recording = false, rafId = 0, t0 = 0, recorder = null, chunks = [];
    window.__recordingState = { recording: false, done: false, downloaded: false, bytes: 0 };

    // ---------- title-card overlay painting
    function paintCard(shot, alpha) {
      sctx.save();
      sctx.globalAlpha = alpha;
      const kx = shot.kind === 'endcard' ? TRAILER_H - 150 : TRAILER_H * 0.62;
      sctx.fillStyle = 'rgba(10,11,14,0.55)';
      sctx.fillRect(0, kx - 84, TRAILER_W, 168);

      sctx.textAlign = 'center'; sctx.textBaseline = 'middle';
      sctx.font = '700 56px Segoe UI, Arial';
      sctx.fillStyle = '#f2f4f8';
      sctx.fillText(shot.label, TRAILER_W / 2, kx - 26);
      sctx.font = '500 26px Segoe UI, Arial';
      sctx.fillStyle = '#19e3ff';
      sctx.fillText(shot.sub, TRAILER_W / 2, kx + 30);

      // gradient underline
      const ug = sctx.createLinearGradient(TRAILER_W/2 - 260, 0, TRAILER_W/2 + 260, 0);
      ug.addColorStop(0, '#ff2d95'); ug.addColorStop(1, '#19e3ff');
      sctx.fillStyle = ug;
      sctx.fillRect(TRAILER_W/2 - 260, kx + 56, 520, 4);
      sctx.restore();
    }

    // ---------- the composite loop (runs while recording)
    // Frame clock: requestAnimationFrame, with a watchdog fallback to
    // setTimeout(60fps) when the host throttles rAF to 0 (hidden/backgrounded
    // webviews). Keeps captions+scroll moving even without compositing.
    let useTimeout = false;
    function next(fn) {
      if (useTimeout) { setTimeout(fn, 1000 / 60); return; }
      let done = false;
      requestAnimationFrame(ts => { if (!done) { done = true; fn(ts); } });
      setTimeout(() => { if (!done) { done = true; useTimeout = true; fn(performance.now()); } }, 250);
    }

    let heartbeat = 0, lastPaint = -1;
    function loop(ts) {
      if (!recording) return;
      window.__loopN = (window.__loopN || 0) + 1;
      // wall-clock timing (heartbeat setInterval passes no timestamp) +
      // repaint throttle at 24 fps: heavy WebGL frames block the thread, so we
      // paint on a timer and let captureStream(30) sample between paints.
      const t = ((ts || performance.now()) - t0) / 1000;
      if (t - lastPaint < 1 / 24) return;
      lastPaint = t;
      let elapsed = 0, shot = null, localT = 0;
      for (const s of SHOTS) { if (t < elapsed + s.dur) { shot = s; localT = t - elapsed; break; } elapsed += s.dur; }
      if (!shot) { finish(); return; }

      // drive the gallery: scroll, spin, spotlight one cell per shot
      ctl.setScroll(shot.scroll);           // 0..1 normalized scroll target
      ctl.setSpinAll(shot.kind === 'spin' || shot.kind === 'sweep');
      ctl.setHover(shot.kind === 'slow' ? 2 : -1);
      if (ctl.setPerf) ctl.setPerf(true);   // cheap render mode while recording

      // letterbox the live WebGL canvas into the stage
      const sc = Math.max(TRAILER_W / srcCanvas.width, TRAILER_H / srcCanvas.height);
      const dw = srcCanvas.width * sc, dh = srcCanvas.height * sc;
      sctx.fillStyle = '#131418';
      sctx.fillRect(0, 0, TRAILER_W, TRAILER_H);
      sctx.drawImage(srcCanvas, (TRAILER_W - dw) / 2, (TRAILER_H - dh) / 2, dw, dh);

      // caption card with fade in/out
      const fade = Math.min(1, localT / 0.4, (shot.dur - localT) / 0.4);
      paintCard(shot, Math.max(0, fade));
    }

    // ---------- recorder plumbing
    function pickMime() {
      for (const m of ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'])
        if (MediaRecorder.isTypeSupported(m)) return m;
      return '';
    }

    function start() {
      if (recording) return;
      const mime = pickMime();
      if (!mime || !stage.captureStream) { console.error('[trailer] MediaRecorder/captureStream unavailable'); return; }
      recording = true;
      chunks = [];
      window.__recordingState = { recording: true, done: false, downloaded: false, bytes: 0 };
      if (ctl.setPerf) ctl.setPerf(true);
      const stream = stage.captureStream(30);
      recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 });
      recorder.ondataavailable = e => { if (e.data.size) { chunks.push(e.data); window.__chunkN = (window.__chunkN || 0) + 1; } };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        console.log('[trailer] recorded ' + (blob.size / 1024 / 1024).toFixed(1) + ' MB — loop frames: ' + (window.__loopN || 0) + ', chunks: ' + (window.__chunkN || 0));
        // Automated capture (record-trailer.js) consumes the blob via base64;
        // interactive runs keep the familiar click-to-download.
        if (window.__trailerAuto) {
          const fr = new FileReader();
          fr.onload = () => {
            window.__trailerB64 = String(fr.result).split(',')[1];
            window.__recordingState = { recording: false, done: true, downloaded: true, bytes: blob.size };
            console.log('[trailer] payload ready for automated capture (' + (blob.size / 1024 / 1024).toFixed(1) + ' MB)');
          };
          fr.readAsDataURL(blob);
        } else {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'voxel-cyber-street-trailer.webm';
          a.click();
          window.__recordingState = { recording: false, done: true, downloaded: true, bytes: blob.size };
          console.log('[trailer] saved voxel-cyber-street-trailer.webm (' + (blob.size / 1024 / 1024).toFixed(1) + ' MB)');
        }
      };
      recorder.start(250);
      t0 = performance.now();
      lastPaint = 0;
      heartbeat = setInterval(loop, 41);    // starvation-proof clock at 24fps
      requestAnimationFrame(loop);
      console.log('[trailer] recording — ' + SHOTS.reduce((a, s) => a + s.dur, 0).toFixed(1) + 's, ' + mime);
    }

    function finish() {
      recording = false;
      if (heartbeat) { clearInterval(heartbeat); heartbeat = 0; }
      if (ctl.setPerf) ctl.setPerf(false);
      if (recorder && recorder.state !== 'inactive') recorder.stop();
    }

    return { start, finish, SHOTS, stage };
  }

  // ---------- entry: ?trailer=1 boots after the gallery controller exists
  const params = new URLSearchParams(location.search);
  if (params.get('trailer') !== '1') return;

  function boot() {
    const t = createTrailer();
    if (!t) return;
    window.__trailerCtl = t;   // debug/test handle
    if (params.get('dry') === '1') {
      console.log('[trailer] dry run — shot list:');
      t.SHOTS.forEach((s, i) => console.log(`  ${i + 1}. [${s.kind}] ${s.label} — ${s.sub} (${s.dur}s)`));
      return;
    }
    // automated capture mode (record-trailer.js): blob → base64 → Node, no download UI
    if (params.get('auto') === '1') window.__trailerAuto = true;
    // small delay so the first frames aren't loader-tinted
    setTimeout(() => t.start(), 600);
  }

  if (window.__galleryCtl) boot();
  else window.addEventListener('__galleryReady', boot);
})();
