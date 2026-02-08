/**
 * Home Assistant Configuration Detection
 * Single source of truth for HA URL and token resolution.
 * Used by both ha-websocket.js and ha-rest.js.
 *
 * Architecture (v2.0.16):
 * - WebSocket: Uses supervisor API directly (http://supervisor/core/api/websocket)
 * - REST API: Uses nginx proxy (empty URL → /api/* → proxied to supervisor API)
 *
 * This hybrid approach works because:
 * - WebSocket connections can go directly to supervisor API
 * - REST API calls need nginx proxy to avoid CORS issues when accessed via port 8099
 */

/**
 * Detect HA environment and return { url, token } config.
 * @param {Object} [options]
 * @param {boolean} [options.useProxy] - For REST API calls, return empty URL to use nginx proxy
 * @returns {{ url: string, token: string|null }}
 */
export function getHAConfig({ useProxy = false } = {}) {
  // Add-on mode: window.HA_CONFIG injected by run.sh
  if (window.HA_CONFIG && window.HA_CONFIG.url) {
    const token = window.HA_CONFIG.token || window.HA_CONFIG.supervisorToken;

    // REST API with proxy: return empty URL so requests go to /api/* (proxied by nginx)
    if (useProxy && window.HA_CONFIG.useProxy) {
      return { url: '', token };
    }

    // WebSocket: return supervisor API URL
    return { url: window.HA_CONFIG.url, token };
  }

  // Development mode: use .env variables
  if (import.meta.env.VITE_HA_URL) {
    return {
      url: import.meta.env.VITE_HA_URL,
      token: import.meta.env.VITE_HA_TOKEN,
    };
  }

  // Fallback: local HA instance (last resort)
  return {
    url: 'http://192.168.1.2:8123',
    token: null,
  };
}
