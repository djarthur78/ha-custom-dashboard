/**
 * Native SofaBaton selection bookkeeping, not physical equipment readiness.
 * Missing state must not be interpreted as Powered Off.
 */

import { useEntity } from '../../../../hooks/useEntity';
import { SOFABATON_ACTIVITY_ENTITY } from '../gamesRoomConfig';

export function useSofaBatonActivity() {
  const { state, attributes, loading, error } = useEntity(SOFABATON_ACTIVITY_ENTITY);

  return {
    currentActivity: state || null,
    available: !loading && !error && !!state && !['unknown', 'unavailable'].includes(state),
    options: attributes?.options || [],
    loading,
    error,
  };
}
