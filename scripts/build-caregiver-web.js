#!/usr/bin/env node
/*
 * Builds/refreshes the standalone caregiver-video PWA under caregiver-web/ so it stays in step
 * with the app's single source of truth (src/data/careContent.json + the bundled videos).
 *
 * It:
 *   1. Generates caregiver-web/video-metadata.json from careContent.json (file
 *      is only set when the matching .mp4 exists, mirroring src/assets/videos/videoAssets.ts).
 *   2. Copies the available .mp4 files into caregiver-web/videos/.
 *   3. Copies an app logo into caregiver-web/icons/icon.png for the PWA icon.
 *   4. Bumps CACHE_VERSION in service-worker.js (content hash) so provisioned tablets refresh
 *      their offline cache on their next online visit.
 *
 * Run: npm run build:caregiver-web
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const VIDEOS_SRC = path.join(ROOT, 'src/assets/videos');
const CARE_CONTENT = path.join(ROOT, 'src/data/careContent.json');
const ICON_SRC = path.join(ROOT, 'src/assets/images/icon_sd-logo_noscript.png');

const WEB_DIR = path.join(ROOT, 'caregiver-web');
const WEB_VIDEOS = path.join(WEB_DIR, 'videos');
const WEB_ICONS = path.join(WEB_DIR, 'icons');
const METADATA_OUT = path.join(WEB_DIR, 'video-metadata.json');
const SW_FILE = path.join(WEB_DIR, 'service-worker.js');

/** Distinct video metadata from careContent.json (generic first, then conditions). */
function collectVideos() {
  const care = JSON.parse(fs.readFileSync(CARE_CONTENT, 'utf8'));
  const keys = Object.keys(care);
  const ordered = ['generic', ...keys.filter(k => k !== 'generic')];

  const seen = new Set();
  const videos = [];
  for (const key of ordered) {
    for (const meta of (care[key] && care[key].videos) || []) {
      if (seen.has(meta.id)) continue;
      seen.add(meta.id);

      const fileName = `${meta.id}.mp4`;
      const hasFile = fs.existsSync(path.join(VIDEOS_SRC, fileName));
      const entry = { id: meta.id, title: meta.title };
      if (meta.description) entry.description = meta.description;
      if (hasFile) entry.file = fileName;
      videos.push(entry);
    }
  }
  return videos;
}

function resetDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyVideos(videos) {
  resetDir(WEB_VIDEOS);
  let copied = 0;
  for (const v of videos) {
    if (!v.file) continue;
    fs.copyFileSync(path.join(VIDEOS_SRC, v.file), path.join(WEB_VIDEOS, v.file));
    copied += 1;
  }
  return copied;
}

function copyIcon() {
  fs.mkdirSync(WEB_ICONS, { recursive: true });
  if (fs.existsSync(ICON_SRC)) {
    fs.copyFileSync(ICON_SRC, path.join(WEB_ICONS, 'icon.png'));
  } else {
    console.warn(`! Icon not found at ${ICON_SRC} — PWA will use no icon.`);
  }
}

/** Content hash of the metadata + each video's size, used as the offline cache version. */
function computeVersion(videos) {
  const hash = crypto.createHash('sha1');
  hash.update(JSON.stringify(videos));
  for (const v of videos) {
    if (!v.file) continue;
    const { size } = fs.statSync(path.join(VIDEOS_SRC, v.file));
    hash.update(`${v.file}:${size}`);
  }
  return hash.digest('hex').slice(0, 8);
}

function bumpServiceWorkerVersion(version) {
  const sw = fs.readFileSync(SW_FILE, 'utf8');
  const updated = sw.replace(/const CACHE_VERSION = '[^']*';/, `const CACHE_VERSION = '${version}';`);
  if (updated === sw && !sw.includes(`'${version}'`)) {
    console.warn('! Could not find CACHE_VERSION to bump in service-worker.js');
  }
  fs.writeFileSync(SW_FILE, updated);
}

function main() {
  const videos = collectVideos();
  fs.mkdirSync(WEB_DIR, { recursive: true });
  fs.writeFileSync(METADATA_OUT, JSON.stringify(videos, null, 2) + '\n');

  const copied = copyVideos(videos);
  copyIcon();
  const version = computeVersion(videos);
  bumpServiceWorkerVersion(version);

  const missing = videos.filter(v => !v.file).map(v => v.id);
  console.log(`✓ caregiver-web built: ${videos.length} videos in metadata, ${copied} .mp4 copied, cache ${version}`);
  if (missing.length) {
    console.log(`  (no local file yet, shown as "not yet available"): ${missing.join(', ')}`);
  }
}

main();
