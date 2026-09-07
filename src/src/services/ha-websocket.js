/**
 * Compatibility service backed by server-side HA boundaries.
 * State changes are polled. Reads use the read identity; dashboard controls
 * use the server-side control identity without exposing either bearer.
 */

import { getHAConfig } from '../utils/ha-config';
import haRest from './ha-rest';
import createLogger from '../utils/logger';

const log = createLogger('HA Boundary');
const POLL_INTERVAL_MS = 10000;
const READ_COMMANDS = new Set([
  'history/history_during_period',
  'media_player/browse_media',
  'todo/item/list',
  'weather/subscribe_forecast',
]);
const CONTROL_COMMANDS = new Set([
  'calendar/event/delete',
  'config_entries/reload',
]);

class HAReadBoundary {
  constructor() {
    this.stateSubscribers = new Map();
    this.connectionListeners = new Set();
    this.stateCache = new Map();
    this.stateCacheReady = false;
    this.stateCacheReadyCallbacks = [];
    this.status = 'disconnected';
    this.connectPromise = null;
    this.pollTimer = null;
  }

  async refreshStates() {
    const states = await haRest.getStates();
    const next = new Map(states.map((state) => [state.entity_id, state]));
    for (const [entityId, newState] of next) {
      const previous = this.stateCache.get(entityId);
      if (previous?.last_updated !== newState.last_updated || previous?.state !== newState.state) {
        this.stateSubscribers.get(entityId)?.forEach((callback) => callback(newState));
      }
    }
    this.stateCache = next;
    if (!this.stateCacheReady) {
      this.stateCacheReady = true;
      this.stateCacheReadyCallbacks.forEach((callback) => callback());
      this.stateCacheReadyCallbacks = [];
    }
    return states;
  }

  connect() {
    if (this.status === 'connected') return Promise.resolve();
    if (this.connectPromise) return this.connectPromise;
    this.status = 'connecting';
    this.notifyConnectionListeners('connecting');
    this.connectPromise = this.refreshStates()
      .then(() => {
        this.status = 'connected';
        this.notifyConnectionListeners('connected');
        this.pollTimer = window.setInterval(() => {
          this.refreshStates().catch((error) => {
            log.warn('State refresh failed:', error.message);
            this.status = 'error';
            this.notifyConnectionListeners('error', error);
          });
        }, POLL_INTERVAL_MS);
      })
      .catch((error) => {
        this.status = 'error';
        this.notifyConnectionListeners('error', error);
        throw error;
      })
      .finally(() => { this.connectPromise = null; });
    return this.connectPromise;
  }

  async send(message) {
    if (message?.type === 'get_states') return this.getStates();
    if (message?.type === 'call_service') {
      return this.callService(message.domain, message.service, message.service_data || {});
    }
    const { apiBase, controlApiBase } = getHAConfig();
    const boundaryBase = READ_COMMANDS.has(message?.type)
      ? apiBase
      : CONTROL_COMMANDS.has(message?.type) ? controlApiBase : null;
    if (!boundaryBase) throw new Error(`Unsupported Home Assistant command: ${message?.type || 'missing type'}`);
    const response = await fetch(`${boundaryBase}/ws-command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(message),
    });
    if (!response.ok) throw new Error(`HA command boundary error: ${response.status}`);
    return response.json();
  }

  callService(domain, service, serviceData = {}) {
    return haRest.callService(domain, service, serviceData);
  }

  async getState(entityId) {
    if (this.stateCacheReady && this.stateCache.has(entityId)) return this.stateCache.get(entityId);
    return haRest.getState(entityId);
  }

  getCachedState(entityId) { return this.stateCache.get(entityId) || null; }
  onStateCacheReady(callback) {
    if (this.stateCacheReady) callback();
    else this.stateCacheReadyCallbacks.push(callback);
  }
  async getStates() {
    if (this.stateCacheReady) return [...this.stateCache.values()];
    return this.refreshStates();
  }
  subscribeToEntity(entityId, callback) {
    if (!this.stateSubscribers.has(entityId)) this.stateSubscribers.set(entityId, new Set());
    this.stateSubscribers.get(entityId).add(callback);
    return () => {
      const subscribers = this.stateSubscribers.get(entityId);
      subscribers?.delete(callback);
      if (subscribers?.size === 0) this.stateSubscribers.delete(entityId);
    };
  }
  async subscribeToWeatherForecast(entityId, forecastType = 'daily', callback) {
    let active = true;
    const update = async () => {
      const forecast = await this.send({ type: 'weather/subscribe_forecast', entity_id: entityId, forecast_type: forecastType });
      if (active) callback(forecast);
    };
    await update();
    const timer = window.setInterval(() => update().catch(() => {}), 30 * 60 * 1000);
    return () => { active = false; window.clearInterval(timer); };
  }
  onConnectionChange(callback) {
    this.connectionListeners.add(callback);
    return () => this.connectionListeners.delete(callback);
  }
  notifyConnectionListeners(status, error = null) {
    this.connectionListeners.forEach((callback) => callback(status, error));
  }
  disconnect() {
    if (this.pollTimer) window.clearInterval(this.pollTimer);
    this.pollTimer = null;
    this.status = 'disconnected';
    this.stateCache.clear();
    this.stateCacheReady = false;
    this.stateCacheReadyCallbacks = [];
    this.stateSubscribers.clear();
  }
  waitForConnection(timeout = 5000) {
    if (this.status === 'connected') return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => { unsubscribe(); reject(new Error('Connection timeout')); }, timeout);
      const unsubscribe = this.onConnectionChange((status) => {
        if (status === 'connected') { window.clearTimeout(timer); unsubscribe(); resolve(); }
      });
    });
  }
  getStatus() { return this.status; }
}

export const READ_ONLY_COMMAND_TYPES = READ_COMMANDS;
export const CONTROL_COMMAND_TYPES = CONTROL_COMMANDS;
export default new HAReadBoundary();
