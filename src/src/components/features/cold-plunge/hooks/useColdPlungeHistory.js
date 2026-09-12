import { useEffect, useState } from 'react';
import { useHAConnection } from '../../../../hooks/useHAConnection';
import haWebSocket from '../../../../services/ha-websocket';

export function useColdPlungeHistory(entityId, hours = 24) {
  const { isConnected } = useHAConnection();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    if (!entityId || !isConnected) return undefined;

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
          entity_ids: [entityId],
          minimal_response: false,
          no_attributes: true,
          significant_changes_only: false,
        }, true, 15000);

        if (!cancelled) {
          setHistory(result?.[entityId] || []);
          setError(null);
          setUpdatedAt(Date.now());
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
  }, [entityId, hours, isConnected]);

  return { history, loading, error, updatedAt };
}

export default useColdPlungeHistory;
