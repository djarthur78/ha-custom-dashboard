/** Same-origin Home Assistant read client. The browser never sends a bearer. */

import { getHAConfig } from '../utils/ha-config';

async function request(endpoint) {
  const { apiBase } = getHAConfig();
  const response = await fetch(`${apiBase}/api${endpoint}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`HA read boundary error: ${response.status}`);
  return response.json();
}

export const getConfig = () => request('/config');
export const getStates = () => request('/states');
export const getState = (entityId) => request(`/states/${encodeURIComponent(entityId)}`);
export const getServices = () => request('/services');

export function getCalendarEvents(entityId, start, end) {
  const params = new URLSearchParams({ start: start.toISOString(), end: end.toISOString() });
  return request(`/calendars/${encodeURIComponent(entityId)}?${params}`);
}

export function callService() {
  return Promise.reject(new Error('Dashboard is read-only; Home Assistant controls are disabled'));
}

export const turnOn = callService;
export const turnOff = callService;
export const toggle = callService;

export async function ping() {
  try {
    const { apiBase } = getHAConfig();
    const response = await fetch(`${apiBase}/api/`, { method: 'GET', headers: { Accept: 'application/json' } });
    return response.ok;
  } catch {
    return false;
  }
}

export async function getYesterdayState(entityId) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  const params = new URLSearchParams({
    filter_entity_id: entityId,
    end_time: end.toISOString(),
    minimal_response: '',
    no_attributes: '',
  });
  const rows = (await request(`/history/period/${start.toISOString()}?${params}`))?.[0] || [];
  return rows.length ? rows[rows.length - 1].state : null;
}

export async function getTriggerStats(entityId, hours = 24) {
  const now = new Date();
  const start = new Date(now.getTime() - hours * 60 * 60 * 1000);
  const params = new URLSearchParams({ filter_entity_id: entityId, end_time: now.toISOString(), no_attributes: '' });
  const states = (await request(`/history/period/${start.toISOString()}?${params}`))?.[0] || [];
  let count = 0;
  let lastTriggered = null;
  for (let index = 1; index < states.length; index += 1) {
    if (states[index].state === 'on' && states[index - 1].state === 'off') {
      count += 1;
      lastTriggered = states[index].last_changed;
    }
  }
  return { count, lastTriggered };
}

export default {
  getConfig, getStates, getState, callService, getServices, getCalendarEvents,
  getYesterdayState, getTriggerStats, turnOn, turnOff, toggle, ping,
};
