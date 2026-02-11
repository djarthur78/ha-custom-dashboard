/**
 * useQueue Hook
 *
 * IMPORTANT: The standard Home Assistant Sonos integration does NOT expose
 * the full queue track list via API. Only queue_position and queue_size are
 * available as entity attributes.
 *
 * This hook is a placeholder for potential future functionality. Currently,
 * the queue display shows only:
 * - Current track (from entity attributes)
 * - Queue position (e.g., "2 of 50")
 * - Tracks remaining
 *
 * To get full queue display, users would need to install:
 * https://github.com/JackJPowell/sensor.sonos_upcoming_media
 *
 * Reference: https://www.home-assistant.io/integrations/sonos/
 */

import { useState, useCallback } from 'react';

export function useQueue(activeSpeakerEntityId) {
  const [queue] = useState([]);
  const [loading] = useState(false);
  const [error] = useState(null);

  // Placeholder refetch function (no-op since we can't actually fetch queue)
  const refetch = useCallback(() => {
    // Note: There's no API to fetch the full queue from standard Sonos integration
    console.warn('[useQueue] Full queue fetching not supported by HA Sonos integration');
  }, []);

  return {
    queue,
    loading,
    error,
    refetch,
  };
}
