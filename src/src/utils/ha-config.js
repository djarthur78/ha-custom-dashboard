/**
 * Home Assistant Configuration Detection
 * Single source of truth for HA URL and token resolution.
 * Used by both ha-websocket.js and ha-rest.js.
 *
 * Priority order:
 * 1. window.HA_CONFIG.url (add-on runtime with explicit URL)
 * 2. window.HA_CONFIG.useIngress (add-on with ingress proxy)
 * 3. import.meta.env.VITE_HA_URL (development)
 * 4. Fallback to current host (last resort)
 */

/**
 * Detect HA environment and return { url, token } config.
 * @param {Object} [options]
 * @param {boolean} [options.useProxy] - In dev mode, return empty URL so requests go through Vite proxy (for REST API CORS avoidance)
 * @returns {{ url: string, token: string|null }}
 */
export function getHAConfig({ useProxy = false } = {}) {
  if (window.HA_CONFIG && window.HA_CONFIG.url) {
    const token = window.HA_CONFIG.token || window.HA_CONFIG.supervisorToken;
    const proxyAvailable = window.HA_CONFIG.useProxy;
    const isSecure = window.location.protocol === 'https:';

    // REST with proxy: use relative URL (nginx proxy handles routing locally,
    // HA's own /api/ is on the same origin when accessed via Cloudflare/ingress)
    if (useProxy && proxyAvailable) {
      return { url: '', token };
    }

    // HTTPS context (Cloudflare tunnel / ingress): use current origin
    // to avoid mixed content (browser blocks http:// in https:// pages)
    if (isSecure) {
      return { url: window.location.origin, token };
    }

    // Local HTTP: use configured HA URL directly
    return { url: window.HA_CONFIG.url, token };
  }

  if (window.HA_CONFIG && window.HA_CONFIG.useIngress) {
    const protocol = window.location.protocol;
    const host = window.location.host;
    return {
      url: `${protocol}//${host}`,
      token: window.HA_CONFIG.supervisorToken || window.HA_CONFIG.token,
    };
  }

  if (import.meta.env.VITE_HA_URL) {
    return {
      url: (useProxy && import.meta.env.DEV) ? '' : import.meta.env.VITE_HA_URL,
      token: import.meta.env.VITE_HA_TOKEN,
    };
  }

  // Fallback: current host, no token
  return {
    url: window.location.origin,
    token: null,
  };
}
