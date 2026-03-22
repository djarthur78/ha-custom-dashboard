/**
 * useHeatingOverride Hook
 * Manages timed temperature overrides for Heat Genius rooms.
 * Stores previous targets, applies override temp, counts down, then reverts.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import haWebSocket from '../../../../services/ha-websocket';
import { FROST_PROTECTION_TEMP } from '../heatingConfig';

export function useHeatingOverride() {
  // { groupKey: { rooms: [{id, previousTarget}], temp, endTime, duration } }
  const [activeOverrides, setActiveOverrides] = useState({});
  const [loading, setLoading] = useState(false);
  const intervalsRef = useRef({});

  // Tick countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveOverrides(prev => {
        const now = Date.now();
        const updated = { ...prev };
        let changed = false;

        for (const key of Object.keys(updated)) {
          if (now >= updated[key].endTime) {
            // Timer expired — will be reverted in a separate effect
            changed = true;
          }
        }

        return changed ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check for expired overrides and revert
  useEffect(() => {
    const now = Date.now();
    for (const [key, override] of Object.entries(activeOverrides)) {
      if (now >= override.endTime && !intervalsRef.current[key]) {
        intervalsRef.current[key] = true;
        revertOverride(key, override.rooms);
      }
    }
  }, [activeOverrides]);

  const revertOverride = useCallback(async (key, rooms) => {
    try {
      for (const room of rooms) {
        await haWebSocket.callService('climate', 'set_temperature', {
          entity_id: room.id,
          temperature: room.previousTarget,
        });
      }
    } catch (err) {
      console.error(`Failed to revert override ${key}:`, err);
    } finally {
      setActiveOverrides(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      delete intervalsRef.current[key];
    }
  }, []);

  const startOverride = useCallback(async (key, rooms, temp, durationHours) => {
    setLoading(true);
    try {
      for (const room of rooms) {
        await haWebSocket.callService('climate', 'set_temperature', {
          entity_id: room.id,
          temperature: temp,
        });
      }

      setActiveOverrides(prev => ({
        ...prev,
        [key]: {
          rooms,
          temp,
          endTime: Date.now() + durationHours * 60 * 60 * 1000,
          duration: durationHours,
        },
      }));
    } catch (err) {
      console.error(`Failed to start override ${key}:`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelOverride = useCallback(async (key) => {
    const override = activeOverrides[key];
    if (!override) return;
    await revertOverride(key, override.rooms);
  }, [activeOverrides, revertOverride]);

  const getTimeRemaining = useCallback((key) => {
    const override = activeOverrides[key];
    if (!override) return null;
    const remaining = Math.max(0, override.endTime - Date.now());
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return { hours, minutes, seconds, total: remaining };
  }, [activeOverrides]);

  return {
    activeOverrides,
    loading,
    startOverride,
    cancelOverride,
    getTimeRemaining,
  };
}
