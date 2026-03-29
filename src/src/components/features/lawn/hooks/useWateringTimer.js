/**
 * useWateringTimer Hook
 * Manages timed watering sessions for irrigation areas.
 * Turns on zone(s), counts down, auto-stops when timer expires.
 * For paired lawn areas: runs zone A for half the time, then zone B.
 * Hard stop if moisture exceeds 70%.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import haWebSocket from '../../../../services/ha-websocket';
import { MOISTURE_HARD_STOP } from '../lawnConfig';

// Persisted in state: { areaKey: { zones, endTime, duration, paired, phase } }
// phase: 'A' (first zone) or 'B' (second zone) — only for paired areas

export function useWateringTimer() {
  const [activeSessions, setActiveSessions] = useState({});
  const [loading, setLoading] = useState(false);
  const revertingRef = useRef({});

  // Tick every second to check for expired timers and phase switches
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActiveSessions(prev => {
        let changed = false;
        const updated = { ...prev };

        for (const [key, session] of Object.entries(updated)) {
          if (session.paired && session.phase === 'A') {
            // Check if it's time to switch to zone B
            const halfTime = session.startTime + (session.duration * 60 * 1000) / 2;
            if (now >= halfTime && !session.switched) {
              updated[key] = { ...session, switched: true };
              changed = true;
              switchToZoneB(key, session);
            }
          }
          if (now >= session.endTime) {
            changed = true;
          }
        }

        return changed ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check for expired sessions and stop zones
  useEffect(() => {
    const now = Date.now();
    for (const [key, session] of Object.entries(activeSessions)) {
      if (now >= session.endTime && !revertingRef.current[key]) {
        revertingRef.current[key] = true;
        stopSession(key, session.zones);
      }
    }
  }, [activeSessions]);

  const switchToZoneB = useCallback(async (key, session) => {
    if (session.zones.length < 2) return;
    try {
      // Turn off zone A, start zone B with remaining duration
      const remaining = Math.max(1, Math.round((session.endTime - Date.now()) / 60000));
      await haWebSocket.callService('switch', 'turn_off', { entity_id: session.zones[0] });
      await haWebSocket.callService('rainbird', 'start_irrigation', {
        entity_id: session.zones[1],
        duration: remaining,
      });
      setActiveSessions(prev => {
        if (!prev[key]) return prev;
        return { ...prev, [key]: { ...prev[key], phase: 'B' } };
      });
    } catch (err) {
      console.error(`[useWateringTimer] Failed to switch to zone B for ${key}:`, err);
    }
  }, []);

  const stopSession = useCallback(async (key, zones) => {
    try {
      for (const zoneId of zones) {
        await haWebSocket.callService('switch', 'turn_off', { entity_id: zoneId });
      }
    } catch (err) {
      console.error(`[useWateringTimer] Failed to stop ${key}:`, err);
    } finally {
      setActiveSessions(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      delete revertingRef.current[key];
    }
  }, []);

  /**
   * Start a timed watering session.
   * @param {string} areaKey - unique area identifier
   * @param {string[]} zoneIds - zone entity IDs to control
   * @param {number} durationMinutes - how long to run
   * @param {boolean} paired - if true, alternate zones A→B (50/50 split)
   */
  const startWatering = useCallback(async (areaKey, zoneIds, durationMinutes, paired) => {
    setLoading(true);
    try {
      const now = Date.now();
      const endTime = now + durationMinutes * 60 * 1000;

      // Use rainbird.start_irrigation with duration — switch.turn_on only runs
      // for the controller's default (a few mins), not the requested duration.
      const zoneDuration = paired ? Math.round(durationMinutes / 2) : durationMinutes;
      await haWebSocket.callService('rainbird', 'start_irrigation', {
        entity_id: zoneIds[0],
        duration: zoneDuration,
      });

      setActiveSessions(prev => ({
        ...prev,
        [areaKey]: {
          zones: zoneIds,
          startTime: now,
          endTime,
          duration: durationMinutes,
          paired,
          phase: paired ? 'A' : 'single',
          switched: false,
        },
      }));
    } catch (err) {
      console.error(`[useWateringTimer] Failed to start ${areaKey}:`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  const stopWatering = useCallback(async (areaKey) => {
    const session = activeSessions[areaKey];
    if (!session) return;
    setLoading(true);
    try {
      await stopSession(areaKey, session.zones);
    } finally {
      setLoading(false);
    }
  }, [activeSessions, stopSession]);

  /**
   * Check moisture and force-stop if above hard stop threshold.
   * Call this from components that have moisture data.
   */
  const checkMoistureHardStop = useCallback((areaKey, avgMoisture) => {
    if (avgMoisture == null) return;
    if (avgMoisture >= MOISTURE_HARD_STOP && activeSessions[areaKey]) {
      console.log(`[useWateringTimer] Hard stop: ${areaKey} moisture ${avgMoisture}% >= ${MOISTURE_HARD_STOP}%`);
      stopWatering(areaKey);
    }
  }, [activeSessions, stopWatering]);

  const getTimeRemaining = useCallback((areaKey) => {
    const session = activeSessions[areaKey];
    if (!session) return null;
    const remaining = Math.max(0, session.endTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return { minutes, seconds, total: remaining, phase: session.phase };
  }, [activeSessions]);

  const isRunning = useCallback((areaKey) => {
    return !!activeSessions[areaKey];
  }, [activeSessions]);

  return {
    activeSessions,
    loading,
    startWatering,
    stopWatering,
    checkMoistureHardStop,
    getTimeRemaining,
    isRunning,
  };
}
