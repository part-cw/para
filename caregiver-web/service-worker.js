/*
 * Offline service worker for the standalone caregiver-video player.
 *
 * On the first (online) visit it precaches the app shell and every video listed in
 * video-metadata.json (~41MB). After that the whole player — including video playback — works
 * fully offline. Video responses are served with HTTP Range support (206 Partial Content) so
 * <video> seeking works, which iOS Safari requires and Android Chrome tolerates.
 *
 * CACHE_VERSION is bumped by scripts/build-caregiver-web.js whenever the content changes, so
 * already-provisioned tablets refresh their cache on their next online visit.
 */

const CACHE_VERSION = 'ad6bf1ac';
const CACHE_NAME = `caregiver-videos-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './video-metadata.json',
  './img/play.svg',
  './img/videocam-off.svg',
  './img/back.svg',
  './icons/icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);

    // Precache every available video from the metadata so playback works offline.
    try {
      const res = await fetch('./video-metadata.json', { cache: 'no-cache' });
      const metadata = await res.json();
      const videoUrls = metadata
        .filter(v => v && v.file)
        .map(v => `./videos/${v.file}`);
      await cache.addAll(videoUrls);
    } catch {
      // If metadata/videos can't be fetched now, they'll be cached lazily on first request.
    }

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k.startsWith('caregiver-videos-') && k !== CACHE_NAME)
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations (e.g. /?ids=...) always resolve to the cached app shell.
  if (request.mode === 'navigate') {
    event.respondWith(caches.match('./index.html').then(r => r || fetch(request)));
    return;
  }

  // Videos: serve from cache with Range support so seeking works offline.
  if (url.pathname.includes('/videos/')) {
    event.respondWith(serveVideo(request, url));
    return;
  }

  // Everything else: cache-first, falling back to the network.
  event.respondWith(caches.match(request).then(r => r || fetch(request)));
});

/** Serve a (cached) video, honouring a byte Range request with a 206 response when present. */
async function serveVideo(request, url) {
  const cache = await caches.open(CACHE_NAME);
  let response = await cache.match(url.pathname) || await cache.match(request);

  if (!response) {
    // Not cached yet (first online visit): fetch, cache the full file, then continue.
    try {
      response = await fetch(url.pathname);
      if (response.ok) cache.put(url.pathname, response.clone());
    } catch {
      return new Response('', { status: 504, statusText: 'Video unavailable offline' });
    }
  }

  const rangeHeader = request.headers.get('range');
  if (!rangeHeader) return response;

  const buffer = await response.arrayBuffer();
  const total = buffer.byteLength;
  const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
  const start = match ? Number(match[1]) : 0;
  const end = match && match[2] ? Number(match[2]) : total - 1;

  if (start >= total || start > end) {
    return new Response('', {
      status: 416,
      headers: { 'Content-Range': `bytes */${total}` },
    });
  }

  const chunk = buffer.slice(start, end + 1);
  return new Response(chunk, {
    status: 206,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(chunk.byteLength),
    },
  });
}
