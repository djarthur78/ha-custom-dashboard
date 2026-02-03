/**
 * Mock Home Assistant WebSocket Service
 * Provides a controllable mock for testing components that use haWebSocket
 */

import { vi } from 'vitest';

export function createMockHAWebSocket() {
  const stateSubscribers = new Map();
  const connectionListeners = new Set();
  let currentStatus = 'disconnected';
  let isAuthenticated = false;
  let states = new Map();

  const mock = {
    // State tracking
    ws: null,
    messageId: 1,
    listeners: new Map(),
    stateSubscribers,
    connectionListeners,
    isAuthenticated,
    isConnecting: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 10,

    // Core methods
    connect: vi.fn().mockImplementation(() => {
      currentStatus = 'connected';
      isAuthenticated = true;
      mock.isAuthenticated = true;
      connectionListeners.forEach(cb => cb('connected'));
      return Promise.resolve();
    }),

    disconnect: vi.fn().mockImplementation(() => {
      currentStatus = 'disconnected';
      isAuthenticated = false;
      mock.isAuthenticated = false;
      stateSubscribers.clear();
      connectionListeners.forEach(cb => cb('disconnected'));
    }),

    send: vi.fn().mockImplementation((message) => {
      return Promise.resolve({ success: true });
    }),

    getState: vi.fn().mockImplementation((entityId) => {
      const state = states.get(entityId);
      return Promise.resolve(state || null);
    }),

    getStates: vi.fn().mockImplementation(() => {
      return Promise.resolve(Array.from(states.values()));
    }),

    callService: vi.fn().mockImplementation((domain, service, serviceData) => {
      return Promise.resolve({ success: true });
    }),

    subscribeToEntity: vi.fn().mockImplementation((entityId, callback) => {
      if (!stateSubscribers.has(entityId)) {
        stateSubscribers.set(entityId, new Set());
      }
      stateSubscribers.get(entityId).add(callback);

      return () => {
        const subscribers = stateSubscribers.get(entityId);
        if (subscribers) {
          subscribers.delete(callback);
          if (subscribers.size === 0) {
            stateSubscribers.delete(entityId);
          }
        }
      };
    }),

    onConnectionChange: vi.fn().mockImplementation((callback) => {
      connectionListeners.add(callback);
      return () => {
        connectionListeners.delete(callback);
      };
    }),

    getStatus: vi.fn().mockImplementation(() => currentStatus),

    // Test helpers
    _setStatus: (status) => {
      currentStatus = status;
      mock.isAuthenticated = status === 'connected';
      connectionListeners.forEach(cb => cb(status));
    },

    _setState: (entityId, state) => {
      states.set(entityId, state);
    },

    _notifyStateChange: (entityId, newState) => {
      const subscribers = stateSubscribers.get(entityId);
      if (subscribers) {
        subscribers.forEach(cb => cb(newState));
      }
    },

    _reset: () => {
      currentStatus = 'disconnected';
      isAuthenticated = false;
      mock.isAuthenticated = false;
      mock.isConnecting = false;
      mock.reconnectAttempts = 0;
      states.clear();
      stateSubscribers.clear();
      connectionListeners.clear();
      vi.clearAllMocks();
    },
  };

  return mock;
}

// Default mock instance
export const mockHAWebSocket = createMockHAWebSocket();

export default mockHAWebSocket;
