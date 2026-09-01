/** Browser-visible configuration for the server-side HA read boundary. */

const DEFAULT_API_BASE = '/ha-read';

export function getHAConfig() {
  const runtime = window.HA_CONFIG || {};
  const apiBase = runtime.apiBase || DEFAULT_API_BASE;
  return { url: apiBase, apiBase, readOnly: true, token: null };
}

export function isReadOnlyDashboard() {
  return getHAConfig().readOnly;
}
