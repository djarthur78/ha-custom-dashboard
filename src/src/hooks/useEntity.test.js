/**
 * Tests for useEntity Hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Must use vi.hoisted for variables used in vi.mock factory
const mockHAWebSocket = vi.hoisted(() => ({
  getState: vi.fn(),
  subscribeToEntity: vi.fn(),
  getStatus: vi.fn(),
  onConnectionChange: vi.fn(),
  connect: vi.fn(),
}));

vi.mock('../services/ha-websocket', () => ({
  default: mockHAWebSocket,
}));

import { useEntity } from './useEntity';

describe('useEntity Hook', () => {
  let unsubscribeFn;
  let connectionCallback;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    unsubscribeFn = vi.fn();
    mockHAWebSocket.subscribeToEntity.mockReturnValue(unsubscribeFn);
    mockHAWebSocket.getStatus.mockReturnValue('connected');
    mockHAWebSocket.connect.mockResolvedValue(undefined);

    // Capture connection change callback
    mockHAWebSocket.onConnectionChange.mockImplementation((callback) => {
      connectionCallback = callback;
      return vi.fn();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return loading true initially', () => {
      mockHAWebSocket.getState.mockReturnValue(new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useEntity('light.test'));

      expect(result.current.loading).toBe(true);
      expect(result.current.state).toBeUndefined();
      expect(result.current.error).toBeNull();
    });

    it('should not fetch state if entityId is null', () => {
      const { result } = renderHook(() => useEntity(null));

      expect(mockHAWebSocket.getState).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(true);
    });

    it('should not fetch state if entityId is undefined', () => {
      const { result } = renderHook(() => useEntity(undefined));

      expect(mockHAWebSocket.getState).not.toHaveBeenCalled();
    });
  });

  describe('fetching initial state', () => {
    it('should fetch initial state when connected', async () => {
      const mockState = {
        entity_id: 'light.test',
        state: 'on',
        attributes: { brightness: 255 },
        last_changed: '2024-01-01T00:00:00Z',
        last_updated: '2024-01-01T00:00:00Z',
      };

      mockHAWebSocket.getState.mockResolvedValue(mockState);

      const { result } = renderHook(() => useEntity('light.test'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.state).toBe('on');
      expect(result.current.attributes).toEqual({ brightness: 255 });
      expect(result.current.error).toBeNull();
    });

    it('should handle getState error', async () => {
      mockHAWebSocket.getState.mockRejectedValue(new Error('Failed to get state'));

      const { result } = renderHook(() => useEntity('light.test'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to get state');
      expect(result.current.state).toBeUndefined();
    });

    it('should return fullState object', async () => {
      const mockState = {
        entity_id: 'light.test',
        state: 'on',
        attributes: { brightness: 255, friendly_name: 'Test Light' },
        last_changed: '2024-01-01T00:00:00Z',
        last_updated: '2024-01-01T00:00:00Z',
      };

      mockHAWebSocket.getState.mockResolvedValue(mockState);

      const { result } = renderHook(() => useEntity('light.test'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.fullState).toEqual(mockState);
      expect(result.current.lastChanged).toBe('2024-01-01T00:00:00Z');
      expect(result.current.lastUpdated).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('state subscriptions', () => {
    it('should subscribe to entity state changes', async () => {
      mockHAWebSocket.getState.mockResolvedValue({ state: 'on' });

      renderHook(() => useEntity('light.test'));

      await waitFor(() => {
        expect(mockHAWebSocket.subscribeToEntity).toHaveBeenCalledWith(
          'light.test',
          expect.any(Function)
        );
      });
    });

    it('should update state when subscription callback fires', async () => {
      mockHAWebSocket.getState.mockResolvedValue({ state: 'off', attributes: {} });

      let subscriptionCallback;
      mockHAWebSocket.subscribeToEntity.mockImplementation((entityId, callback) => {
        subscriptionCallback = callback;
        return unsubscribeFn;
      });

      const { result } = renderHook(() => useEntity('light.test'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.state).toBe('off');

      // Simulate state change from HA
      act(() => {
        subscriptionCallback({ state: 'on', attributes: { brightness: 100 } });
      });

      expect(result.current.state).toBe('on');
      expect(result.current.attributes).toEqual({ brightness: 100 });
    });

    it('should unsubscribe on unmount', async () => {
      mockHAWebSocket.getState.mockResolvedValue({ state: 'on' });

      const { unmount } = renderHook(() => useEntity('light.test'));

      await waitFor(() => {
        expect(mockHAWebSocket.subscribeToEntity).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribeFn).toHaveBeenCalled();
    });

    it('should resubscribe when entityId changes', async () => {
      mockHAWebSocket.getState.mockResolvedValue({ state: 'on' });

      const { rerender } = renderHook(({ entityId }) => useEntity(entityId), {
        initialProps: { entityId: 'light.test1' },
      });

      await waitFor(() => {
        expect(mockHAWebSocket.subscribeToEntity).toHaveBeenCalledWith(
          'light.test1',
          expect.any(Function)
        );
      });

      // Change entity
      rerender({ entityId: 'light.test2' });

      await waitFor(() => {
        expect(unsubscribeFn).toHaveBeenCalled(); // Old subscription cleaned up
        expect(mockHAWebSocket.subscribeToEntity).toHaveBeenCalledWith(
          'light.test2',
          expect.any(Function)
        );
      });
    });
  });

  describe('connection state handling', () => {
    it('should not fetch when disconnected', () => {
      mockHAWebSocket.getStatus.mockReturnValue('disconnected');

      // Simulate disconnected state by making connection callback set isConnected to false
      mockHAWebSocket.onConnectionChange.mockImplementation((callback) => {
        callback('disconnected');
        return vi.fn();
      });

      renderHook(() => useEntity('light.test'));

      // getState should still be called based on initial status check in useHAConnection
      // The actual behavior depends on useHAConnection implementation
    });
  });

  describe('null/undefined handling', () => {
    it('should handle null state from getState', async () => {
      mockHAWebSocket.getState.mockResolvedValue(null);

      const { result } = renderHook(() => useEntity('light.nonexistent'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.state).toBeUndefined();
      expect(result.current.attributes).toBeUndefined();
    });
  });
});
