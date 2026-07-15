/*
 * Standalone caregiver-video player script file.
 *
 * Reads the playlist from the `?ids=` query string (a comma-separated list of video ids that the
 * PARA app encodes into the QR code), looks each id up in video-metadata.json, and renders a
 * list -> detail/player experience that mirrors the in-app CaregiverVideosModal.
 *
 * All videos are served from ./videos/<file> and are cached for offline playback by the service
 * worker (service-worker.js). Ids with no local file show a "not yet available" placeholder.
 */

const app = document.getElementById('app');

/** Parse the requested video ids from the URL (`?ids=a,b,c`). */
function requestedIds() {
  const raw = new URLSearchParams(window.location.search).get('ids');
  if (!raw) return null;
  const seen = new Set();
  const ids = [];
  for (const part of raw.split(',')) {
    const id = part.trim();
    if (id && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

/**
 * Build the ordered playlist for this session. When ids are supplied use the order and
 * include only those (that exist in the metadata). With no ids fall back to the full library
 * so the page is still useful for browsing/testing.
 */
function buildPlaylist(metadata) {
  const byId = new Map(metadata.map(v => [v.id, v]));
  const ids = requestedIds();
  if (!ids) return metadata;
  const playlist = [];
  for (const id of ids) {
    const meta = byId.get(id);
    if (meta) playlist.push(meta);
  }
  return playlist;
}

function renderList(videos, onSelect) {
  app.innerHTML = '';
  if (videos.length === 0) {
    const p = document.createElement('p');
    p.className = 'info-text';
    p.textContent = "No videos are available for this patient's conditions.";
    app.appendChild(p);
    return;
  }

  const list = document.createElement('ul');
  list.className = 'video-list';
  for (const video of videos) {
    const item = document.createElement('li');
    const row = document.createElement('button');
    row.className = 'video-row';
    row.type = 'button';
    row.innerHTML =
      '<img class="play-icon" src="img/play.svg" alt="" />' +
      '<span class="row-text">' +
      `<span class="row-title">${escapeHtml(video.title)}</span>` +
      (video.description ? `<span class="row-description">${escapeHtml(video.description)}</span>` : '') +
      (video.file ? '' : '<span class="row-unavailable">Video not yet available</span>') +
      '</span>';
    row.addEventListener('click', () => onSelect(video));
    item.appendChild(row);
    list.appendChild(item);
  }
  app.appendChild(list);
}

function renderDetail(video, onBack) {
  app.innerHTML = '';

  if (video.file) {
    const el = document.createElement('video');
    el.className = 'video-frame';
    el.src = `videos/${video.file}`;
    el.controls = true;
    el.autoplay = true;
    el.playsInline = true;
    el.setAttribute('playsinline', '');
    app.appendChild(el);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'video-frame video-unavailable';
    placeholder.innerHTML =
      '<img class="unavailable-icon" src="img/videocam-off.svg" alt="" /><span>Video not yet available</span>';
    app.appendChild(placeholder);
  }

  const title = document.createElement('h2');
  title.className = 'detail-title';
  title.textContent = video.title;
  app.appendChild(title);

  if (video.description) {
    const desc = document.createElement('p');
    desc.className = 'detail-description';
    desc.textContent = video.description;
    app.appendChild(desc);
  }

  const back = document.createElement('button');
  back.className = 'back-button';
  back.type = 'button';
  back.innerHTML = '<img class="back-icon" src="img/back.svg" alt="" /><span>Back to videos</span>';
  back.addEventListener('click', onBack);
  app.appendChild(back);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function main() {
  let metadata;
  try {
    const res = await fetch('video-metadata.json', { cache: 'no-cache' });
    metadata = await res.json();
  } catch {
    app.innerHTML = '<p class="info-text">Could not load the video list. Please reconnect once to finish setup.</p>';
    return;
  }

  const playlist = buildPlaylist(metadata);

  const showList = () => renderList(playlist, video => renderDetail(video, showList));
  showList();
}

// Register the service worker so the app shell + videos are cached for offline use.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const status = document.getElementById('offline-status');
    navigator.serviceWorker.register('service-worker.js').then(() => {
      // If nothing is controlling the page yet, this is the first (online) visit and the SW is
      // busy caching the videos. Surface a brief hint until it takes control.
      if (status && !navigator.serviceWorker.controller) {
        status.hidden = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => { status.hidden = true; });
      }
    }).catch(() => { /* Offline-first is best-effort; the page still works while online. */ });
  });
}

main();
