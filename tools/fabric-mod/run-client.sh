#!/usr/bin/env bash
# run-client.sh — boot a REAL Minecraft 1.21 client with the mod (Gradle runClient).
# Logs to tools/fabric-mod/runclient.log; poll for:
#   "Backend library: LWJGL"  → client boot started
#   "Sound engine started"    → title screen reached
#   "voxelcyberstreet" lines / mixin errors → mod load status
# Usage: run-client.sh [--fresh]   (--fresh wipes run/ so assets re-download cleanly)
set -e
cd "$(dirname "$0")"
TOOLCHAIN="$(cd ../../.toolchain && pwd)"
export JAVA_HOME="$TOOLCHAIN/jdk-21.0.12.1+1"
export PATH="$JAVA_HOME/bin:$PATH"
if [ "$1" = "--fresh" ]; then rm -rf run; fi
"$TOOLCHAIN/gradle-8.9/bin/gradle" runClient --no-daemon -g "$TOOLCHAIN/gradle-home" --console=plain > runclient.log 2>&1
