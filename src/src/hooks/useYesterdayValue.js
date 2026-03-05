/**
 * useYesterdayValue Hook
 * Fetches yesterday's last state value for an entity via REST API
 * Caches the result for the session to avoid repeated API calls
 */

import { useState, useEffect } from 'react';
import { getYesterdayState } from '../services/ha-rest';

const cache = new Map();

export function useYesterdayValue(entityId) {
  const [value, setValue] = useState(() => cache.get(entityId) ?? null);

  useEffect(() => {
    if (!entityId) return;
    if (cache.has(entityId)) {
      setValue(cache.get(entityId));
      return;
    }

    let cancelled = false;
    getYesterdayState(entityId)
      .then(val => {
        if (!cancelled && val != null) {
          cache.set(entityId, val);
          setValue(val);
        }
      })
      .catch(err => {
        console.warn(`[useYesterdayValue] Failed for ${entityId}:`, err.message);
      });

    return () => { cancelled = true; };
  }, [entityId]);

  return value;
}
