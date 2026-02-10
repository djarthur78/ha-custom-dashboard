/**
 * useSpeakerGroups Hook
 * Manages Sonos speaker grouping (join/unjoin).
 *
 * How Sonos grouping works:
 * - media_player.join: Makes speakers play together. The entity_id is the
 *   "coordinator" (main speaker), group_members includes all speakers in the group.
 * - media_player.unjoin: Removes a speaker from its group.
 * - The group_members attribute on each entity shows which speakers are grouped.
 */

import { useState } from 'react';
import { useServiceCall } from '../../../../hooks/useServiceCall';

export function useSpeakerGroups() {
  const { callService } = useServiceCall();
  const [groupLoading, setGroupLoading] = useState(false);

  /**
   * Group multiple speakers together.
   * @param {string} coordinatorId - The main speaker entity_id (controls playback)
   * @param {string[]} memberIds - All speaker entity_ids to include (including coordinator)
   */
  const groupSpeakers = async (coordinatorId, memberIds) => {
    setGroupLoading(true);
    try {
      await callService('media_player', 'join', {
        entity_id: coordinatorId,
        group_members: memberIds,
      });
    } finally {
      setGroupLoading(false);
    }
  };

  /**
   * Remove a single speaker from its group.
   * @param {string} entityId - The speaker to remove from the group
   */
  const unjoinSpeaker = async (entityId) => {
    setGroupLoading(true);
    try {
      await callService('media_player', 'unjoin', {
        entity_id: entityId,
      });
    } finally {
      setGroupLoading(false);
    }
  };

  /**
   * Ungroup all speakers that are currently in a group.
   * @param {Array} speakers - Array of speaker objects from useSonosSpeakers
   */
  const ungroupAll = async (speakers) => {
    setGroupLoading(true);
    try {
      // Find speakers that are in a group (group_members has more than just themselves)
      const grouped = speakers.filter((s) => s.groupMembers.length > 1);
      // Unjoin each grouped speaker (except the first in each group which is the coordinator)
      for (const speaker of grouped) {
        // Only unjoin if this speaker is NOT the coordinator
        // (the coordinator is the first entity in group_members)
        if (speaker.groupMembers[0] !== speaker.entityId) {
          await callService('media_player', 'unjoin', {
            entity_id: speaker.entityId,
          });
        }
      }
    } finally {
      setGroupLoading(false);
    }
  };

  return {
    groupSpeakers,
    unjoinSpeaker,
    ungroupAll,
    groupLoading,
  };
}
