#!/usr/bin/env bash
# compile-fabric-mod.sh — real Gradle compile of tools/fabric-mod against MC 1.21.
# Uses the portable toolchain in .toolchain (JDK 21 + Gradle 8.9, Loom 1.7.4).
# On Linux CI (no .toolchain), a Gradle+JDK is bootstrapped into .toolchain automatically.
# On success the remapped jar is published to dist/voxel-cyber-street-fabric-1.21.jar.
set -e
cd "$(dirname "$0")"
ROOT="$(cd .. && pwd)"
TOOLCHAIN="$ROOT/.toolchain"

# ---- Linux/CI bootstrap: portable JDK 21 + Gradle 8.9 when .toolchain is absent
if [ ! -d "$TOOLCHAIN/jdk-21.0.12.1+1" ] && [ "$(uname -s)" = "Linux" ]; then
  echo "bootstrapping toolchain for CI…"
  mkdir -p "$TOOLCHAIN"
  curl -sL -o jdk.tar.gz "https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jdk/hotspot/normal/eclipse"
  tar -xzf jdk.tar.gz -C "$TOOLCHAIN"
  curl -sL -o gradle.zip "https://services.gradle.org/distributions/gradle-8.9-bin.zip"
  unzip -q gradle.zip -d "$TOOLCHAIN"
  rm -f jdk.tar.gz gradle.zip
fi
JDK_DIR="$(ls -d "$TOOLCHAIN"/jdk-21* 2>/dev/null | head -1)"
GRADLE_BIN="$TOOLCHAIN/gradle-8.9/bin/gradle"
[ -x "$GRADLE_BIN" ] || GRADLE_BIN="gradle"   # fall back to a system gradle if present

export JAVA_HOME="$JDK_DIR"
export PATH="$JAVA_HOME/bin:$PATH"
cd fabric-mod
"$GRADLE_BIN" build --no-daemon -g "$TOOLCHAIN/gradle-home" --console=plain
JAR="$(ls -t build/libs/*.jar | head -1)"
if [ -z "$JAR" ]; then echo "no jar produced"; exit 1; fi
mkdir -p ../../dist
cp "$JAR" ../../dist/voxel-cyber-street-fabric-1.21.jar
echo "published dist/voxel-cyber-street-fabric-1.21.jar ($(du -h "../../dist/voxel-cyber-street-fabric-1.21.jar" | cut -f1))"
