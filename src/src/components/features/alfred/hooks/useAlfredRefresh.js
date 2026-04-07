/**
 * useAlfredRefresh Hook
 * Fetches fresh Alfred data from the Mac Mini API when the Alfred page mounts.
 * The API pushes data to HA sensors, so WebSocket-subscribed components auto-update.
 */

import { useState, useEffect, useCallback } from 'react';

const ALFRED_API = 'http://192.168.1.150:18800/alfred';

export function useAlfredRefresh() {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(ALFRED_API, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLastRefresh(data.timestamp || Date.now());
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
