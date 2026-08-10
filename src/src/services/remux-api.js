const REMUX_API_BASE = '/remux-api/api';

async function request(path, options = {}) {
  const response = await fetch(`${REMUX_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.detail || payload?.message || response.statusText || 'Request failed';
    throw new Error(message);
  }
  return payload;
}

export function searchMedia(query, type = 'all') {
  const params = new URLSearchParams({ q: query, type });
  return request(`/media/search?${params.toString()}`);
}

export function collectMedia(item) {
  return request('/media/collect', {
    method: 'POST',
    body: JSON.stringify({
      mediaType: item.mediaType,
      title: item.title,
      year: item.year ?? null,
      tmdbId: item.tmdbId,
      imdbId: item.imdbId,
    }),
  });
}

