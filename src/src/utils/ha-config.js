/** Browser-visible paths for server-side HA read and control boundaries. */

const DEFAULT_API_BASE = '/ha-read';
const DEFAULT_CONTROL_API_BASE = '/ha-control';

export function getHAConfig() {
  const runtime = window.HA_CONFIG || {};
  const apiBase = runtime.apiBase || DEFAULT_API_BASE;
  const controlApiBase = runtime.controlApiBase || DEFAULT_CONTROL_API_BASE;
  return { url: apiBase, apiBase, controlApiBase, readOnly: false, token: null };
}

export function isReadOnlyDashboard() {
  return getHAConfig().readOnly;
}
