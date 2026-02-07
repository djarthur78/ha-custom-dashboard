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
    // In the add-on, nginx proxies /api/ to HA, so use empty URL for REST calls
    const proxyAvailable = useProxy && window.HA_CONFIG.useProxy;
    return {
      url: proxyAvailable ? '' : window.HA_CONFIG.url,
      token: window.HA_CONFIG.token || window.HA_CONFIG.supervisorToken,
    };
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
