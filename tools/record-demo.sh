#!/usr/bin/env bash
# record-demo.sh — one command: craft the NeonDistrict world (if needed), boot
# an unattended capture client (real GPU, no UI), film a Voxel Director route,
# and wait for the frames.
#
# Usage: bash tools/record-demo.sh [tour|race|chase|crowd] [--world-only]
#
# Frames:  tools/fabric-mod/run/screenshots/director/<route>/frame-*.png
# Next:    node tools/encode-director.js <route>   → gameplay demo MP4
set -e
cd "$(dirname "$0")/.."
ROUTE="${1:-tour}"
WORLD="NeonDistrict"
RUN="tools/fabric-mod/run"
DONE_FILE="$RUN/screenshots/director/vcs-autopilot.done"

if [ "$2" = "--world-only" ]; then
  node tools/craft-demo-world.js
  exit 0
fi

# 1. jar with the autopilot (skip compile if a fresh one is already published)
bash tools/compile-fabric-mod.sh build >/dev/null

# 2. world save with the pre-built scene (re-craft only when missing)
if [ ! -d "$RUN/saves/$WORLD" ]; then
  node tools/craft-demo-world.js
fi

# 3. fresh marker, fresh frames
rm -f "$DONE_FILE"
rm -rf "$RUN/screenshots/director/$ROUTE"

# 3b. a fresh dev run shows the accessibility-onboarding screen, which blocks
#     quick-play — pre-seed the option so the client goes straight to the world
OPT="$RUN/options.txt"
touch "$OPT"
grep -q '^onboardAccessibility:' "$OPT" || echo 'onboardAccessibility:false' >> "$OPT"

# 4. boot the capture client: --quickPlaySingleplayer drops us straight into
#    the world; the autopilot JVM flag arms the scene+director driver.
echo "[record-demo] launching unattended capture client (route: $ROUTE)…"
cd tools/fabric-mod
TOOLCHAIN="$(cd ../../.toolchain && pwd)"
export JAVA_HOME="$TOOLCHAIN/jdk-21.0.12.1+1"
export PATH="$JAVA_HOME/bin:$PATH"
"$TOOLCHAIN/gradle-8.9/bin/gradle" runClient \
  -Pvcs.quickPlay="$WORLD" -Pvcs.route="$ROUTE" \
  --no-daemon -g "$TOOLCHAIN/gradle-home" --console=plain \
  > ../../.record-demo.log 2>&1 &
GRADLE_PID=$!
cd ../..

# 5. wait for the autopilot's done marker (world load + scene + route)
echo "[record-demo] waiting for capture to finish (marker: $DONE_FILE)…"
for i in $(seq 1 720); do            # 12 min ceiling
  if [ -f "$DONE_FILE" ]; then
    echo "[record-demo] autopilot marker found: $(cat "$DONE_FILE")"
    if grep -q "^OK" "$DONE_FILE"; then
      echo "[record-demo] capture OK"
    else
      echo "[record-demo] autopilot FAILED — log tail:"
      tail -30 .record-demo.log
      exit 1
    fi
    break
  fi
  if ! kill -0 $GRADLE_PID 2>/dev/null; then
    echo "[record-demo] client exited before the marker appeared — log tail:"
    tail -40 .record-demo.log
    exit 1
  fi
  sleep 1
done
[ -f "$DONE_FILE" ] || { echo "[record-demo] timed out after 12 min"; tail -40 .record-demo.log; exit 1; }

FRAMES=$(ls "$RUN/screenshots/director/$ROUTE"/frame-*.png 2>/dev/null | wc -l)
echo "[record-demo] frames captured: $FRAMES"
echo "[record-demo] encode with: node tools/encode-director.js $ROUTE"
