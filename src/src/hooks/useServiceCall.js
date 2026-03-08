/**
 * useServiceCall Hook
 * Call Home Assistant services with loading and error states.
 * Uses a pending counter so multiple concurrent calls don't block each other.
 */

import { useState, useCallback, useRef } from 'react';
import haWebSocket from '../services/ha-websocket';

export function useServiceCall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pendingRef = useRef(0);

  const callService = useCallback(async (domain, service, serviceData = {}) => {
    pendingRef.current++;
    setLoading(true);
    setError(null);

    try {
      const result = await haWebSocket.callService(domain, service, serviceData);
      return result;
    } catch (err) {
      console.error('Service call failed:', err);
      setError(err.message);
      throw err;
    } finally {
      pendingRef.current--;
      if (pendingRef.current === 0) setLoading(false);
    }
  }, []);

  const turnOn = useCallback((entityId, data = {}) => {
    const [domain] = entityId.split('.');
    return callService(domain, 'turn_on', { entity_id: entityId, ...data });
  }, [callService]);

  const turnOff = useCallback((entityId) => {
    const [domain] = entityId.split('.');
    return callService(domain, 'turn_off', { entity_id: entityId });
  }, [callService]);

  const toggle = useCallback((entityId) => {
    const [domain] = entityId.split('.');
    return callService(domain, 'toggle', { entity_id: entityId });
  }, [callService]);

  return {
    callService,
    turnOn,
    turnOff,
    toggle,
    loading,
    error,
  };
}

export default useServiceCall;
