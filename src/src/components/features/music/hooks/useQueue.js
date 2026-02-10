/**
 * useQueue Hook
 * Fetches and manages the playback queue for the active speaker.
 * Uses HA's media_player/browse_media to get queue items.
 */

import { useState, useCallback, useEffect } from 'react';
import haWebSocket from '../../../../services/ha-websocket';

export function useQueue(activeSpeakerEntityId) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQueue = useCallback(async (entityId) => {
    if (!entityId) {
      setQueue([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await haWebSocket.sendCommand({
        type: 'media_player/browse_media',
        entity_id: entityId,
        media_content_type: 'queue',
        media_content_id: 'queue',
      });

      if (result?.children) {
        // Extract queue items from result
        const queueItems = result.children.map((item, index) => ({
          position: index + 1,
          title: item.title,
          artist: item.media_content_id?.split('/')?.pop() || '', // Try to extract artist
          thumbnail: item.thumbnail,
          mediaContentId: item.media_content_id,
          mediaContentType: item.media_content_type,
          canPlay: item.can_play,
        }));
        setQueue(queueItems);
      } else {
        setQueue([]);
      }
    } catch (err) {
      console.error('[useQueue] Failed to fetch queue:', err);
      setError(err.message || 'Failed to load queue');
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch when speaker changes
  useEffect(() => {
    fetchQueue(activeSpeakerEntityId);
  }, [activeSpeakerEntityId, fetchQueue]);

  return {
    queue,
    loading,
    error,
    refetch: () => fetchQueue(activeSpeakerEntityId),
  };
}
