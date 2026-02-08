/**
 * Home Assistant Configuration Detection
 * Single source of truth for HA URL and token resolution.
 * Used by both ha-websocket.js and ha-rest.js.
 *
 * With v2.0.12, we simplified this to ALWAYS return the configured URL:
 * - Add-on mode: returns "http://supervisor/core" (injected by run.sh)
 * - Dev mode: returns VITE_HA_URL from .env
 *
 * The app's JavaScript makes fetch() and WebSocket requests directly to this URL.
 * The browser handles the actual HTTP request, which goes through HA's ingress
 * system when accessed via ingress.
 */

/**
 * Detect HA environment and return { url, token } config.
 * @returns {{ url: string, token: string|null }}
 */
export function getHAConfig() {
  // Add-on mode: window.HA_CONFIG injected by run.sh
  if (window.HA_CONFIG && window.HA_CONFIG.url) {
    const token = window.HA_CONFIG.token || window.HA_CONFIG.supervisorToken;
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
