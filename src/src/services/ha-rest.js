/**
 * Home Assistant REST API Service
 * For operations that don't require WebSocket (config, services info, etc.)
 */

import { getHAConfig } from '../utils/ha-config';

const { url: HA_URL, token: HA_TOKEN } = getHAConfig({ useProxy: true });

/**
 * Make a request to Home Assistant REST API
 */
async function request(endpoint, options = {}) {
  const url = `${HA_URL}/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${HA_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HA API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get Home Assistant configuration
 */
export async function getConfig() {
  return request('/config');
}

/**
 * Get all states
 */
export async function getStates() {
  return request('/states');
}

/**
 * Get state of a specific entity
 */
export async function getState(entityId) {
  return request(`/states/${entityId}`);
}

/**
 * Call a service
 */
export async function callService(domain, service, data = {}) {
  return request(`/services/${domain}/${service}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get available services
 */
export async function getServices() {
  return request('/services');
}

/**
 * Get calendar events
 */
export async function getCalendarEvents(entityId, start, end) {
  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
  });
  return request(`/calendars/${entityId}?${params}`);
}

/**
 * Turn on an entity
 */
export async function turnOn(entityId, data = {}) {
  const [domain] = entityId.split('.');
  return callService(domain, 'turn_on', { entity_id: entityId, ...data });
}

/**
 * Turn off an entity
 */
export async function turnOff(entityId) {
  const [domain] = entityId.split('.');
  return callService(domain, 'turn_off', { entity_id: entityId });
}

/**
 * Toggle an entity
 */
export async function toggle(entityId) {
  const [domain] = entityId.split('.');
  return callService(domain, 'toggle', { entity_id: entityId });
}

/**
 * Check if HA is accessible
 */
export async function ping() {
  try {
    const response = await fetch(`${HA_URL}/api/`, {
      headers: {
        'Authorization': `Bearer ${HA_TOKEN}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default {
  getConfig,
  getStates,
  getState,
  callService,
  getServices,
  getCalendarEvents,
  turnOn,
  turnOff,
  toggle,
  ping,
};
