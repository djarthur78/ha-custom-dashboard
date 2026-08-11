function getRemuxApiBase() {
  const pathname = window.location?.pathname || '';
  const ingressMatch = pathname.match(/^\/api\/hassio_ingress\/[^/]+/);
  if (ingressMatch) {
    return `${ingressMatch[0]}/remux-api/api`;
  }

  return '/remux-api/api';
}

async function request(path, options = {}) {
  const response = await fetch(`${getRemuxApiBase()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload?.detail ||
      payload?.message ||
      (response.status === 504 ? 'IMDb lookup timed out' : '') ||
      response.statusText ||
      'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export function searchMedia(query, type = 'all', requestOptions = {}) {
  const params = new URLSearchParams({ q: query, type });
  return request(`/media/search?${params.toString()}`, requestOptions);
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
