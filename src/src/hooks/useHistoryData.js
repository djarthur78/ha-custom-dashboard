/**
 * useHistoryData Hook
 * Fetches entity history from HA REST API over a given time period.
 * Returns an array of { timestamp, value } data points.
 */

import { useState, useEffect } from 'react';
import { getHAConfig } from '../utils/ha-config';

export function useHistoryData(entityId, days = 7) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!entityId) return;

    let cancelled = false;

    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const { url: HA_URL, token: HA_TOKEN } = getHAConfig({ useProxy: true });
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - days);

        const params = new URLSearchParams({
          filter_entity_id: entityId,
          end_time: now.toISOString(),
          minimal_response: '',
          no_attributes: '',
        });

        const response = await fetch(
          `${HA_URL}/api/history/period/${start.toISOString()}?${params}`,
          {
            headers: {
              'Authorization': `Bearer ${HA_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();
        if (cancelled) return;

        if (result && result[0] && result[0].length > 0) {
          const points = result[0]
            .map(entry => ({
              timestamp: new Date(entry.last_changed || entry.last_updated),
              value: parseFloat(entry.state),
            }))
            .filter(p => !isNaN(p.value));
          setData(points);
        } else {
          setData([]);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchHistory();
    return () => { cancelled = true; };
  }, [entityId, days]);

  return { data, loading, error };
}
