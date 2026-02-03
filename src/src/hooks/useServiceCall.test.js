/**
 * Tests for useServiceCall Hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Must use vi.hoisted for variables used in vi.mock factory
const mockHAWebSocket = vi.hoisted(() => ({
  callService: vi.fn(),
}));

vi.mock('../services/ha-websocket', () => ({
  default: mockHAWebSocket,
}));

import { useServiceCall } from './useServiceCall';

describe('useServiceCall Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHAWebSocket.callService.mockResolvedValue({ success: true });
  });

  describe('initial state', () => {
    it('should return loading false initially', () => {
      const { result } = renderHook(() => useServiceCall());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should return callService, turnOn, turnOff, and toggle functions', () => {
      const { result } = renderHook(() => useServiceCall());

      expect(typeof result.current.callService).toBe('function');
      expect(typeof result.current.turnOn).toBe('function');
      expect(typeof result.current.turnOff).toBe('function');
      expect(typeof result.current.toggle).toBe('function');
    });
  });

  describe('callService', () => {
    it('should call haWebSocket.callService with correct arguments', async () => {
      const { result } = renderHook(() => useServiceCall());

      await act(async () => {
        await result.current.callService('light', 'turn_on', { brightness: 255 });
      });

      expect(mockHAWebSocket.callService).toHaveBeenCalledWith(
        'light',
        'turn_on',
        { brightness: 255 }
      );
    });

    it('should set loading true during call and false after', async () => {
      let resolvePromise;
      mockHAWebSocket.callService.mockImplementation(
        () => new Promise((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => useServiceCall());

      let callPromise;
      act(() => {
        callPromise = result.current.callService('light', 'turn_on', {});
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise({ success: true });
        await callPromise;
      });

      expect(result.current.loading).toBe(false);
    });

    it('should return result on success', async () => {
      const expectedResult = { success: true, data: 'test' };
      mockHAWebSocket.callService.mockResolvedValue(expectedResult);

      const { result } = renderHook(() => useServiceCall());

      let callResult;
      await act(async () => {
        callResult = await result.current.callService('light', 'turn_on', {});
      });

      expect(callResult).toEqual(expectedResult);
    });

    it('should set error on failure', async () => {
      mockHAWebSocket.callService.mockRejectedValue(new Error('Service failed'));

      const { result } = renderHook(() => useServiceCall());

      await act(async () => {
        try {
          await result.current.callService('light', 'turn_on', {});
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Service failed');
      expect(result.current.loading).toBe(false);
    });

    it('should throw error to caller', async () => {
      mockHAWebSocket.callService.mockRejectedValue(new Error('Service failed'));

      const { result } = renderHook(() => useServiceCall());

      await expect(
        act(async () => {
          await result.current.callService('light', 'turn_on', {});
        })
      ).rejects.toThrow('Service failed');
    });

    it('should clear previous error on new call', async () => {
      mockHAWebSocket.callService.mockRejectedValueOnce(new Error('First error'));
      mockHAWebSocket.callService.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useServiceCall());

      // First call fails
      await act(async () => {
        try {
          await result.current.callService('light', 'turn_on', {});
        } catch (e) {}
      });

      expect(result.current.error).toBe('First error');

      // Second call succeeds - error should be cleared
      await act(async () => {
        await result.current.callService('light', 'turn_off', {});
      });

      expect(result.current.error).toBeNull();
    });

    it('should use empty object for serviceData if not provided', async () => {
      const { result } = renderHook(() => useServiceCall());

      await act(async () => {
        await result.current.callService('homeassistant', 'restart');
      });

      expect(mockHAWebSocket.callService).toHaveBeenCalledWith(
        'homeassistant',
        'restart',
        {}
      );
    });
  });

  describe('turnOn', () => {
    it('should extract domain from entityId and call turn_on service', async () => {
      const { result } = renderHook(() => useServiceCall());

      await act(async () => {
        await result.current.turnOn('light.living_room');
      });

      expect(mockHAWebSocket.callService).toHaveBeenCalledWith(
        'light',
        'turn_on',
        { entity_id: 'light.living_room' }
      );
    });

    it('should merge additional data with entity_id', async () => {
      const { result } = renderHook(() => useServiceCall());

      await act(async () => {
        await result.current.turnOn('light.living_room', { brightness: 128, color_temp: 300 });
      });

      expect(mockHAWebSocket.callService).toHaveBeenCalledWith(
        'light',
        'turn_on',
        { entity_id: 'light.living_room', brightness: 128, color_temp: 300 }
      );
    });

    it('should handle switch domain', async () => {
      const { result } = renderHook(() => useServiceCall());

      await act(async () => {
        await result.current.turnOn('switch.coffee_maker');
      });

      expect(mockHAWebSocket.callService).toHaveBeenCalledWith(
        'switch',
        'turn_on',
        { entity_id: 'switch.coffee_maker' }
      );
    });

    it('should handle fan domain', async () => {
      const { result } = renderHook(() => useServiceCall());

      await act(async () => {
        await result.current.turnOn('fan.bedroom');
      });

      expect(mockHAWebSocket.callService).toHaveBeenCalledWith(
        'fan',
        'turn_on',
        { entity_id: 'fan.bedroom' }
      );
    });
  });

  describe('turnOff', () => {
    it('should extract domain from entityId and call turn_off service', async () => {
      const { result } = renderHook(() => useServiceCall());

      await act(async () => {
        await result.current.turnOff('light.living_room');
      });

      expect(mockHAWebSocket.callService).toHaveBeenCalledWith(
        'light',
        'turn_off',
        { entity_id: 'light.living_room' }
      );
    });

    it('should handle climate domain', async () => {
      const { result } = renderHook(() => useServiceCall());

      await act(async () => {
        await result.current.turnOff('climate.thermostat');
      });

      expect(mockHAWebSocket.callService).toHaveBeenCalledWith(
        'climate',
        'turn_off',
        { entity_id: 'climate.thermostat' }
      );
    });
  });

  describe('toggle', () => {
    it('should extract domain from entityId and call toggle service', async () => {
      const { result } = renderHook(() => useServiceCall());

      await act(async () => {
        await result.current.toggle('light.living_room');
      });

      expect(mockHAWebSocket.callService).toHaveBeenCalledWith(
        'light',
        'toggle',
        { entity_id: 'light.living_room' }
      );
    });

    it('should handle media_player domain', async () => {
      const { result } = renderHook(() => useServiceCall());

      await act(async () => {
        await result.current.toggle('media_player.tv');
      });

      expect(mockHAWebSocket.callService).toHaveBeenCalledWith(
        'media_player',
        'toggle',
        { entity_id: 'media_player.tv' }
      );
    });
  });

  describe('domain extraction', () => {
    it('should handle entity_id with underscores in name', async () => {
      const { result } = renderHook(() => useServiceCall());

      await act(async () => {
        await result.current.toggle('light.living_room_main_light');
      });

      expect(mockHAWebSocket.callService).toHaveBeenCalledWith(
        'light',
        'toggle',
        { entity_id: 'light.living_room_main_light' }
      );
    });

    it('should handle input_boolean domain', async () => {
      const { result } = renderHook(() => useServiceCall());

      await act(async () => {
        await result.current.toggle('input_boolean.vacation_mode');
      });

      expect(mockHAWebSocket.callService).toHaveBeenCalledWith(
        'input_boolean',
        'toggle',
        { entity_id: 'input_boolean.vacation_mode' }
      );
    });
  });

  describe('function stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useServiceCall());

      const initialCallService = result.current.callService;
      const initialTurnOn = result.current.turnOn;
      const initialTurnOff = result.current.turnOff;
      const initialToggle = result.current.toggle;

      rerender();

      expect(result.current.callService).toBe(initialCallService);
      expect(result.current.turnOn).toBe(initialTurnOn);
      expect(result.current.turnOff).toBe(initialTurnOff);
      expect(result.current.toggle).toBe(initialToggle);
    });
  });
});
