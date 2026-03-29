/**
 * useWeekendPlan Hook
 * Fetches the OpenClaw weekend plan JSON from HA's /local/ directory.
 * Re-fetches each time the component mounts (i.e., when the tab is opened).
 */

import { useState, useEffect } from 'react';
import { getPlanUrl } from '../lawnConfig';

export function useWeekendPlan() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchPlan() {
      setLoading(true);
      setError(null);

      try {
        const planUrl = getPlanUrl();
        const res = await fetch(planUrl, { cache: 'no-store' });
        if (!res.ok) {
          if (res.status === 404) {
            // No plan file yet — not an error
            if (mounted) {
              setPlan(null);
              setLoading(false);
            }
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        if (mounted) {
          setPlan(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('[useWeekendPlan] Failed to fetch plan:', err);
        if (mounted) {
          setPlan(null);
          setError(err.message);
          setLoading(false);
        }
      }
    }

    fetchPlan();

    return () => { mounted = false; };
  }, []);

  return { plan, loading, error };
}
