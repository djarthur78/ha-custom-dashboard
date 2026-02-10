/**
 * useHarmonyActivity Hook
 * Subscribes to the Harmony Hub activity selector to determine current room mode.
 *
 * Returns:
 *   currentActivity - string like 'power_off', 'SkyQ', 'Kodi Movies', etc.
 *   options         - array of all available activities
 *   loading         - boolean
 *   error           - string or null
 */

import { useEntity } from '../../../../hooks/useEntity';
import { HARMONY_ACTIVITY_ENTITY } from '../gamesRoomConfig';

export function useHarmonyActivity() {
  const { state, attributes, loading, error } = useEntity(HARMONY_ACTIVITY_ENTITY);

  return {
    currentActivity: state || 'power_off',
    options: attributes?.options || [],
    loading,
    error,
  };
}
