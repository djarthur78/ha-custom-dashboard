/**
 * useServiceCall Hook
 * Call Home Assistant services with loading and error states
 */

import { useState, useCallback } from 'react';
import haWebSocket from '../services/ha-websocket';

export function useServiceCall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callService = useCallback(async (domain, service, serviceData = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await haWebSocket.callService(domain, service, serviceData);
      setLoading(false);
      return result;
    } catch (err) {
      console.error('Service call failed:', err);
      setError(err.message);
      setLoading(false);
      throw err;
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
