/**
 * usePlaybackControls Hook
 * Provides all media playback service call functions.
 * Each function takes an entityId so it can control any speaker.
 */

import { useServiceCall } from '../../../../hooks/useServiceCall';

export function usePlaybackControls() {
  const { callService, loading, error } = useServiceCall();

  const playPause = (entityId) =>
    callService('media_player', 'media_play_pause', { entity_id: entityId });

  const play = (entityId) =>
    callService('media_player', 'media_play', { entity_id: entityId });

  const pause = (entityId) =>
    callService('media_player', 'media_pause', { entity_id: entityId });

  const next = (entityId) =>
    callService('media_player', 'media_next_track', { entity_id: entityId });

  const previous = (entityId) =>
    callService('media_player', 'media_previous_track', { entity_id: entityId });

  const setVolume = (entityId, volumeLevel) =>
    callService('media_player', 'volume_set', {
      entity_id: entityId,
      volume_level: volumeLevel,
    });

  const toggleMute = (entityId, currentlyMuted) =>
    callService('media_player', 'volume_mute', {
      entity_id: entityId,
      is_volume_muted: !currentlyMuted,
    });

  const setShuffle = (entityId, shuffle) =>
    callService('media_player', 'shuffle_set', {
      entity_id: entityId,
      shuffle,
    });

  const setRepeat = (entityId, repeat) =>
    callService('media_player', 'repeat_set', {
      entity_id: entityId,
      repeat, // 'off' | 'all' | 'one'
    });

  const seek = (entityId, seekPosition) =>
    callService('media_player', 'media_seek', {
      entity_id: entityId,
      seek_position: seekPosition,
    });

  const playMedia = (entityId, mediaContentId, mediaContentType, enqueue = 'play') =>
    callService('media_player', 'play_media', {
      entity_id: entityId,
      media_content_id: mediaContentId,
      media_content_type: mediaContentType,
      enqueue,
    });

  return {
    playPause, play, pause, next, previous,
    setVolume, toggleMute,
    setShuffle, setRepeat,
    seek, playMedia,
    loading, error,
  };
}
