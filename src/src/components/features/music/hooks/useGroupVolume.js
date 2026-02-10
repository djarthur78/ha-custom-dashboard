/**
 * useGroupVolume Hook
 * Manages volume control for grouped Sonos speakers.
 * Sets volume on ALL members of a group simultaneously.
 */

import { useState, useCallback } from 'react';
import { useServiceCall } from '../../../../hooks/useServiceCall';

export function useGroupVolume() {
  const { callService } = useServiceCall();
  const [loading, setLoading] = useState(false);

  /**
   * Set volume for all speakers in a group.
   * @param {string[]} groupMembers - Array of entity_ids in the group
   * @param {number} volumeLevel - Volume 0.0 to 1.0
   */
  const setGroupVolume = useCallback(async (groupMembers, volumeLevel) => {
    if (!groupMembers || groupMembers.length === 0) return;

    setLoading(true);
    try {
      // Call volume_set on all group members in parallel
      await Promise.all(
        groupMembers.map((entityId) =>
          callService('media_player', 'volume_set', {
            entity_id: entityId,
            volume_level: volumeLevel,
          })
        )
      );
    } catch (err) {
      console.error('[useGroupVolume] Failed to set group volume:', err);
    } finally {
      setLoading(false);
    }
  }, [callService]);

  return { setGroupVolume, loading };
}
