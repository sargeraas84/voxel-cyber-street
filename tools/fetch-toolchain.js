#!/usr/bin/env node
/** Detached toolchain downloader: portable JDK 21 (Adoptium) + Gradle 8.9 → .toolchain/ */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, '..', '.toolchain');
fs.mkdirSync(dir, { recursive: true });
const log = m => fs.appendFileSync(path.join(dir, 'dl.log'), m + '\n');

function dl(url, out, label) {
  const t0 = Date.now();
  log(`start ${label}`);
  try {
    execFileSync('curl', ['-sL', '-o', out, url], { stdio: 'pipe', timeout: 480000 });
    const sz = fs.statSync(out).size;
    log(`done ${label}: ${sz} bytes in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    return sz > 10000000;
  } catch (e) {
    log(`FAIL ${label}: ${e.message}`);
    return false;
  }
}

const okJdk = dl('https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk',
  path.join(dir, 'jdk21.zip'), 'jdk21');
const okGradle = dl('https://services.gradle.org/distributions/gradle-8.9-bin.zip',
  path.join(dir, 'gradle-8.9-bin.zip'), 'gradle');
log(okJdk && okGradle ? 'ALL-DOWNLOADS-OK' : 'DOWNLOADS-INCOMPLETE');
