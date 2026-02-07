/**
 * useEntity Hook
 * Subscribe to entity state changes from Home Assistant.
 * Uses state cache for instant initial load when available.
 */

import { useEffect, useState } from 'react';
import haWebSocket from '../services/ha-websocket';
import { useHAConnection } from './useHAConnection';

export function useEntity(entityId) {
  const [state, setState] = useState(() => {
    // Try to initialize from cache for instant display
    return haWebSocket.getCachedState(entityId);
  });
  const [loading, setLoading] = useState(() => !haWebSocket.getCachedState(entityId));
  const [error, setError] = useState(null);
  const { isConnected } = useHAConnection();

  useEffect(() => {
    if (!entityId || !isConnected) {
      return;
    }

    // Get initial state (from cache or network)
    haWebSocket.getState(entityId)
      .then(initialState => {
        setState(initialState);
        setLoading(false);
        setError(null);
      })
      .catch(err => {
        console.error(`Failed to get state for ${entityId}:`, err);
        setError(err.message);
        setLoading(false);
      });

    // Subscribe to state changes
    const unsubscribe = haWebSocket.subscribeToEntity(entityId, (newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, [entityId, isConnected]);

  return {
    state: state?.state,
    attributes: state?.attributes,
    lastChanged: state?.last_changed,
    lastUpdated: state?.last_updated,
    fullState: state,
    loading,
    error,
  };
}

export default useEntity;
