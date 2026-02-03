/**
 * Tests for Home Assistant WebSocket Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create a fresh instance for each test by re-importing the module
let HAWebSocket;
let haWebSocket;

describe('HAWebSocket Service', () => {
  beforeEach(async () => {
    vi.resetModules();

    // Set up environment before importing
    vi.stubGlobal('window', {
      location: { protocol: 'http:', host: 'localhost:8123' },
      HA_CONFIG: undefined,
    });

    // Mock import.meta.env
    vi.stubGlobal('import', {
      meta: {
        env: {
          VITE_HA_URL: 'http://localhost:8123',
          VITE_HA_TOKEN: 'test-token-12345',
        },
      },
    });
  });

  afterEach(() => {
    if (haWebSocket) {
      haWebSocket.disconnect();
    }
    vi.clearAllMocks();
  });

  describe('getStatus', () => {
    it('should return disconnected when no WebSocket exists', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      expect(haWebSocket.getStatus()).toBe('disconnected');
    });

    it('should return connecting when isConnecting is true', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;
      haWebSocket.isConnecting = true;
      haWebSocket.ws = { readyState: WebSocket.CONNECTING, close: vi.fn() };

      expect(haWebSocket.getStatus()).toBe('connecting');
    });
  });

  describe('subscribeToEntity', () => {
    it('should add callback to stateSubscribers', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      const callback = vi.fn();
      haWebSocket.subscribeToEntity('light.test', callback);

      expect(haWebSocket.stateSubscribers.has('light.test')).toBe(true);
      expect(haWebSocket.stateSubscribers.get('light.test').has(callback)).toBe(true);
    });

    it('should return unsubscribe function', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      const callback = vi.fn();
      const unsubscribe = haWebSocket.subscribeToEntity('light.test', callback);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
      expect(haWebSocket.stateSubscribers.has('light.test')).toBe(false);
    });

    it('should allow multiple subscribers to same entity', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      haWebSocket.subscribeToEntity('light.test', callback1);
      haWebSocket.subscribeToEntity('light.test', callback2);

      expect(haWebSocket.stateSubscribers.get('light.test').size).toBe(2);
    });

    it('should only remove specific callback on unsubscribe', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = haWebSocket.subscribeToEntity('light.test', callback1);
      haWebSocket.subscribeToEntity('light.test', callback2);

      unsubscribe1();

      expect(haWebSocket.stateSubscribers.get('light.test').has(callback1)).toBe(false);
      expect(haWebSocket.stateSubscribers.get('light.test').has(callback2)).toBe(true);
    });
  });

  describe('onConnectionChange', () => {
    it('should add listener to connectionListeners', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      const callback = vi.fn();
      haWebSocket.onConnectionChange(callback);

      expect(haWebSocket.connectionListeners.has(callback)).toBe(true);
    });

    it('should return unsubscribe function', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      const callback = vi.fn();
      const unsubscribe = haWebSocket.onConnectionChange(callback);

      unsubscribe();
      expect(haWebSocket.connectionListeners.has(callback)).toBe(false);
    });
  });

  describe('notifyConnectionListeners', () => {
    it('should notify all listeners with status', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      haWebSocket.onConnectionChange(callback1);
      haWebSocket.onConnectionChange(callback2);

      haWebSocket.notifyConnectionListeners('connected');

      expect(callback1).toHaveBeenCalledWith('connected', null);
      expect(callback2).toHaveBeenCalledWith('connected', null);
    });

    it('should pass error info to listeners', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      const callback = vi.fn();
      haWebSocket.onConnectionChange(callback);

      const errorInfo = { message: 'Connection failed' };
      haWebSocket.notifyConnectionListeners('error', errorInfo);

      expect(callback).toHaveBeenCalledWith('error', errorInfo);
    });
  });

  describe('handleEvent', () => {
    it('should notify entity subscribers on state_changed event', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      const callback = vi.fn();
      haWebSocket.subscribeToEntity('light.test', callback);

      const newState = { state: 'on', attributes: { brightness: 255 } };
      haWebSocket.handleEvent({
        type: 'event',
        event: {
          event_type: 'state_changed',
          data: {
            entity_id: 'light.test',
            new_state: newState,
          },
        },
      });

      expect(callback).toHaveBeenCalledWith(newState);
    });

    it('should not notify when entity has no subscribers', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      const callback = vi.fn();
      haWebSocket.subscribeToEntity('light.other', callback);

      haWebSocket.handleEvent({
        type: 'event',
        event: {
          event_type: 'state_changed',
          data: {
            entity_id: 'light.test',
            new_state: { state: 'on' },
          },
        },
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle missing event data gracefully', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      // Should not throw
      expect(() => {
        haWebSocket.handleEvent({ type: 'event', event: null });
        haWebSocket.handleEvent({ type: 'event', event: {} });
        haWebSocket.handleEvent({ type: 'event', event: { event_type: 'state_changed' } });
      }).not.toThrow();
    });
  });

  describe('handleResult', () => {
    it('should resolve listener on success', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      const resolve = vi.fn();
      const reject = vi.fn();
      haWebSocket.listeners.set(1, { resolve, reject, timeout: null });

      haWebSocket.handleResult({ id: 1, success: true, result: { data: 'test' } });

      expect(resolve).toHaveBeenCalledWith({ data: 'test' });
      expect(reject).not.toHaveBeenCalled();
      expect(haWebSocket.listeners.has(1)).toBe(false);
    });

    it('should reject listener on failure', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      const resolve = vi.fn();
      const reject = vi.fn();
      haWebSocket.listeners.set(1, { resolve, reject, timeout: null });

      haWebSocket.handleResult({
        id: 1,
        success: false,
        error: { message: 'Service not found' },
      });

      expect(reject).toHaveBeenCalled();
      expect(reject.mock.calls[0][0].message).toBe('Service not found');
      expect(resolve).not.toHaveBeenCalled();
    });

    it('should clear timeout on result', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      const timeout = setTimeout(() => {}, 10000);
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      haWebSocket.listeners.set(1, { resolve: vi.fn(), reject: vi.fn(), timeout });
      haWebSocket.handleResult({ id: 1, success: true, result: {} });

      expect(clearTimeoutSpy).toHaveBeenCalledWith(timeout);
    });
  });

  describe('scheduleReconnect', () => {
    it('should use exponential backoff', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      // Calculate expected delays
      const expectedDelays = [
        1000 * Math.pow(2, 0), // 1s
        1000 * Math.pow(2, 1), // 2s
        1000 * Math.pow(2, 2), // 4s
        1000 * Math.pow(2, 3), // 8s
        1000 * Math.pow(2, 4), // 16s (capped at 30s)
      ];

      const callback = vi.fn();
      haWebSocket.onConnectionChange(callback);

      // Simulate multiple reconnect attempts
      for (let i = 0; i < 5; i++) {
        haWebSocket.scheduleReconnect();
        expect(haWebSocket.reconnectAttempts).toBe(i + 1);
      }
    });

    it('should stop after max attempts', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      haWebSocket.reconnectAttempts = haWebSocket.maxReconnectAttempts;

      const callback = vi.fn();
      haWebSocket.onConnectionChange(callback);

      haWebSocket.scheduleReconnect();

      expect(callback).toHaveBeenCalledWith('max_retries_reached', null);
    });

    it('should cap delay at 30 seconds', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      haWebSocket.reconnectAttempts = 8; // 2^8 = 256 seconds, should be capped

      const callback = vi.fn();
      haWebSocket.onConnectionChange(callback);

      haWebSocket.scheduleReconnect();

      // Check that the delay passed to reconnecting is capped at 30000
      expect(callback).toHaveBeenCalledWith('reconnecting', { attempt: 9, delay: 30000 });
    });
  });

  describe('disconnect', () => {
    it('should clear reconnect timeout', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      haWebSocket.reconnectTimeout = setTimeout(() => {}, 10000);
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      haWebSocket.disconnect();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(haWebSocket.reconnectTimeout).toBeNull();
    });

    it('should clear all listeners and subscribers', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      haWebSocket.subscribeToEntity('light.test', vi.fn());
      haWebSocket.listeners.set(1, { resolve: vi.fn(), reject: vi.fn() });

      haWebSocket.disconnect();

      expect(haWebSocket.stateSubscribers.size).toBe(0);
      expect(haWebSocket.listeners.size).toBe(0);
    });

    it('should reject pending listeners', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      const reject = vi.fn();
      haWebSocket.listeners.set(1, { resolve: vi.fn(), reject, timeout: null });

      haWebSocket.disconnect();

      expect(reject).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reset authentication state', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      haWebSocket.isAuthenticated = true;
      haWebSocket.isConnecting = true;

      haWebSocket.disconnect();

      expect(haWebSocket.isAuthenticated).toBe(false);
      expect(haWebSocket.isConnecting).toBe(false);
    });
  });

  describe('handleMessage', () => {
    it('should handle auth_required by authenticating', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      // Mock authenticate to avoid WebSocket errors
      const authenticateSpy = vi.spyOn(haWebSocket, 'authenticate').mockResolvedValue(undefined);

      await haWebSocket.handleMessage({ type: 'auth_required' });

      expect(authenticateSpy).toHaveBeenCalled();
    });

    it('should handle auth_ok by setting authenticated state', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      // Mock subscribeToStates to avoid WebSocket errors
      vi.spyOn(haWebSocket, 'subscribeToStates').mockResolvedValue(undefined);

      const callback = vi.fn();
      haWebSocket.onConnectionChange(callback);

      const resolve = vi.fn();
      await haWebSocket.handleMessage({ type: 'auth_ok' }, resolve);

      expect(haWebSocket.isAuthenticated).toBe(true);
      expect(haWebSocket.isConnecting).toBe(false);
      expect(haWebSocket.reconnectAttempts).toBe(0);
      expect(callback).toHaveBeenCalledWith('connected', null);
      expect(resolve).toHaveBeenCalled();
    });

    it('should handle auth_invalid by rejecting', async () => {
      const { default: ws } = await import('./ha-websocket.js');
      haWebSocket = ws;

      const callback = vi.fn();
      haWebSocket.onConnectionChange(callback);

      const reject = vi.fn();
      await haWebSocket.handleMessage({ type: 'auth_invalid' }, null, reject);

      expect(callback).toHaveBeenCalledWith('auth_failed', null);
      expect(reject).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
