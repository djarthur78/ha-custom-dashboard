import { useEffect, useState } from 'react';
import haWebSocket from '../../../../services/ha-websocket';
import { useHAConnection } from '../../../../hooks/useHAConnection';
import { SPA_HISTORY_ENTITIES } from '../spaConfig';

const HISTORY_ENTITY_IDS = Object.values(SPA_HISTORY_ENTITIES);

export function useSpaHistory(hours = 24) {
  const { isConnected } = useHAConnection();
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isConnected) return undefined;
    let cancelled = false;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const end = new Date();
        const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
        const result = await haWebSocket.send({
          type: 'history/history_during_period',
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          entity_ids: HISTORY_ENTITY_IDS,
          minimal_response: false,
          no_attributes: true,
          significant_changes_only: false,
        }, true, 15000);
        if (!cancelled) {
          setHistory(result || {});
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadHistory();
    const interval = window.setInterval(loadHistory, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [hours, isConnected]);

  return { history, loading, error };
}

export default useSpaHistory;
