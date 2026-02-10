/**
 * useSonosSpeakers Hook
 * Batch-subscribes to all 11 Sonos speakers via the WebSocket singleton.
 * Returns an array of speaker objects with real-time state.
 */

import { useEffect, useState } from 'react';
import haWebSocket from '../../../../services/ha-websocket';
import { useHAConnection } from '../../../../hooks/useHAConnection';
import { SONOS_SPEAKERS } from '../musicConfig';

// Extract the data we need from a raw HA state object.
// This runs every time a speaker's state changes.
function extractSpeakerData(stateObj) {
  if (!stateObj) {
    return {
      state: 'unavailable',
      volumeLevel: 0,
      isVolumeMuted: false,
      mediaTitle: null,
      mediaArtist: null,
      mediaAlbumName: null,
      entityPicture: null,
      mediaDuration: null,
      mediaPosition: null,
      mediaPositionUpdatedAt: null,
      shuffle: false,
      repeat: 'off',
      queuePosition: null,
      queueSize: null,
      groupMembers: [],
      supportedFeatures: 0,
      friendlyName: '',
      source: null,
    };
  }

  const a = stateObj.attributes || {};
  return {
    state: stateObj.state,
    volumeLevel: a.volume_level ?? 0,
    isVolumeMuted: a.is_volume_muted ?? false,
    mediaTitle: a.media_title || null,
    mediaArtist: a.media_artist || null,
    mediaAlbumName: a.media_album_name || null,
    entityPicture: a.entity_picture || null,
    mediaDuration: a.media_duration || null,
    mediaPosition: a.media_position || null,
    mediaPositionUpdatedAt: a.media_position_updated_at || null,
    shuffle: a.shuffle ?? false,
    repeat: a.repeat || 'off',
    queuePosition: a.queue_position ?? null,
    queueSize: a.queue_size ?? null,
    groupMembers: a.group_members || [],
    supportedFeatures: a.supported_features || 0,
    friendlyName: a.friendly_name || '',
    source: a.source || null,
  };
}

export function useSonosSpeakers() {
  const { isConnected } = useHAConnection();

  // Initialize state from cache (instant load, no flicker)
  const [speakers, setSpeakers] = useState(() =>
    SONOS_SPEAKERS.map((config) => ({
      ...config,
      ...extractSpeakerData(haWebSocket.getCachedState(config.entityId)),
    }))
  );

  useEffect(() => {
    if (!isConnected) return;

    // Re-initialize from cache when connection is established
    setSpeakers(
      SONOS_SPEAKERS.map((config) => ({
        ...config,
        ...extractSpeakerData(haWebSocket.getCachedState(config.entityId)),
      }))
    );

    // Subscribe to each speaker's state changes
    const unsubscribers = SONOS_SPEAKERS.map((config, index) =>
      haWebSocket.subscribeToEntity(config.entityId, (newState) => {
        setSpeakers((prev) => {
          const updated = [...prev];
          updated[index] = { ...config, ...extractSpeakerData(newState) };
          return updated;
        });
      })
    );

    // Cleanup: unsubscribe from all speakers when unmounting
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [isConnected]);

  return {
    speakers,
    loading: !isConnected,
    // Helper: find speakers that are currently playing
    playingSpeakers: speakers.filter((s) => s.state === 'playing'),
    // Helper: find speakers that are playing or paused
    activeSpeakers: speakers.filter((s) => s.state === 'playing' || s.state === 'paused'),
  };
}
