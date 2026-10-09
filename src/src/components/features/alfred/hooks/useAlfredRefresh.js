/**
 * useAlfredRefresh Hook
 * Refreshes Alfred entities through the authenticated Home Assistant boundary.
 * Local Mac collection and publication run independently of the browser.
 */

import { useState, useEffect, useCallback } from 'react';
import haWebSocket from '../../../../services/ha-websocket';

export function useAlfredRefresh() {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await haWebSocket.refreshStates();
      setLastRefresh(Date.now());
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Refresh on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return { refreshing, lastRefresh, error, refresh };
}
