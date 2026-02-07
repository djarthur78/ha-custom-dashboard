import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock getHAConfig and createLogger before the module is loaded
vi.mock('../../utils/ha-config', () => ({
  getHAConfig: () => ({ url: 'http://localhost:8123', token: 'test-token' }),
}));

vi.mock('../../utils/logger', () => ({
  default: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// We can't use the singleton directly (it connects on import),
// so we import the class pattern by re-importing each test
describe('HAWebSocket', () => {
  let HAWebSocket;

  beforeEach(async () => {
    vi.resetModules();

    // Re-import to get fresh module
    const mod = await import('../ha-websocket.js');
    // The default export is the singleton instance
    HAWebSocket = mod.default;
  });

  describe('getStatus', () => {
    it('returns "disconnected" when no WebSocket exists', () => {
      // Fresh instance: ws is null
      expect(HAWebSocket.getStatus()).toBe('disconnected');
    });

    it('returns "connecting" when isConnecting is true', () => {
      HAWebSocket.isConnecting = true;
      HAWebSocket.ws = {}; // fake ws object
      expect(HAWebSocket.getStatus()).toBe('connecting');
    });

    it('returns "disconnected" when ws is closed', () => {
      HAWebSocket.ws = { readyState: 3 }; // WebSocket.CLOSED = 3
      HAWebSocket.isConnecting = false;
      HAWebSocket.isAuthenticated = false;
      expect(HAWebSocket.getStatus()).toBe('disconnected');
    });
  });

  describe('subscribeToEntity', () => {
    it('adds a subscriber and returns an unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = HAWebSocket.subscribeToEntity('light.bedroom', callback);

      expect(typeof unsubscribe).toBe('function');
      expect(HAWebSocket.stateSubscribers.has('light.bedroom')).toBe(true);
      expect(HAWebSocket.stateSubscribers.get('light.bedroom').size).toBe(1);
    });

    it('calls subscribers when handleEvent receives state_changed', () => {
      const callback = vi.fn();
      HAWebSocket.subscribeToEntity('light.bedroom', callback);

      const newState = { entity_id: 'light.bedroom', state: 'on', attributes: {} };

      // Simulate a state_changed event
      HAWebSocket.handleEvent({
        event: {
          event_type: 'state_changed',
          data: {
            entity_id: 'light.bedroom',
            new_state: newState,
          },
        },
      });

      expect(callback).toHaveBeenCalledWith(newState);
    });

    it('unsubscribe removes the subscriber', () => {
      const callback = vi.fn();
      const unsubscribe = HAWebSocket.subscribeToEntity('light.bedroom', callback);

      unsubscribe();

      expect(HAWebSocket.stateSubscribers.has('light.bedroom')).toBe(false);
    });

    it('supports multiple subscribers for the same entity', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      HAWebSocket.subscribeToEntity('light.bedroom', cb1);
      HAWebSocket.subscribeToEntity('light.bedroom', cb2);

      expect(HAWebSocket.stateSubscribers.get('light.bedroom').size).toBe(2);

      const newState = { entity_id: 'light.bedroom', state: 'off', attributes: {} };
      HAWebSocket.handleEvent({
        event: {
          event_type: 'state_changed',
          data: { entity_id: 'light.bedroom', new_state: newState },
        },
      });

      expect(cb1).toHaveBeenCalledWith(newState);
      expect(cb2).toHaveBeenCalledWith(newState);
    });
  });

  describe('state cache', () => {
    it('getCachedState returns null for uncached entity', () => {
      expect(HAWebSocket.getCachedState('sensor.unknown')).toBeNull();
    });

    it('getCachedState returns cached state after handleEvent updates it', () => {
      const newState = { entity_id: 'sensor.temp', state: '22', attributes: { unit: '°C' } };

      HAWebSocket.handleEvent({
        event: {
          event_type: 'state_changed',
          data: { entity_id: 'sensor.temp', new_state: newState },
        },
      });

      expect(HAWebSocket.getCachedState('sensor.temp')).toEqual(newState);
    });
  });

  describe('onConnectionChange', () => {
    it('adds a connection listener and returns unsubscribe', () => {
      const callback = vi.fn();
      const unsubscribe = HAWebSocket.onConnectionChange(callback);

      expect(typeof unsubscribe).toBe('function');
      expect(HAWebSocket.connectionListeners.size).toBeGreaterThanOrEqual(1);
    });

    it('notifies listeners on connection status change', () => {
      const callback = vi.fn();
      HAWebSocket.onConnectionChange(callback);

      HAWebSocket.notifyConnectionListeners('connected');

      expect(callback).toHaveBeenCalledWith('connected', null);
    });

    it('unsubscribe removes the listener', () => {
      const callback = vi.fn();
      const unsubscribe = HAWebSocket.onConnectionChange(callback);
      const initialSize = HAWebSocket.connectionListeners.size;

      unsubscribe();

      expect(HAWebSocket.connectionListeners.size).toBe(initialSize - 1);
    });
  });

  describe('disconnect', () => {
    it('clears state cache on disconnect', () => {
      // Add something to the cache
      HAWebSocket.stateCache.set('light.test', { state: 'on' });
      HAWebSocket.stateCacheReady = true;

      HAWebSocket.disconnect();

      expect(HAWebSocket.stateCache.size).toBe(0);
      expect(HAWebSocket.stateCacheReady).toBe(false);
    });

    it('clears subscribers on disconnect', () => {
      HAWebSocket.subscribeToEntity('light.test', vi.fn());
      expect(HAWebSocket.stateSubscribers.size).toBe(1);

      HAWebSocket.disconnect();

      expect(HAWebSocket.stateSubscribers.size).toBe(0);
    });

    it('resets authentication state', () => {
      HAWebSocket.isAuthenticated = true;
      HAWebSocket.isConnecting = true;

      HAWebSocket.disconnect();

      expect(HAWebSocket.isAuthenticated).toBe(false);
      expect(HAWebSocket.isConnecting).toBe(false);
    });
  });
});
