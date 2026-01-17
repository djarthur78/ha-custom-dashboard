/**
 * useEntity Hook
 * Subscribe to entity state changes from Home Assistant
 */

import { useEffect, useState } from 'react';
import haWebSocket from '../services/ha-websocket';
import { useHAConnection } from './useHAConnection';

export function useEntity(entityId) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isConnected } = useHAConnection();

  useEffect(() => {
    if (!entityId || !isConnected) {
      return;
    }

    // Get initial state
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
