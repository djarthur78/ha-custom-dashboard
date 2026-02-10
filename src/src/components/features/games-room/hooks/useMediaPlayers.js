/**
 * useMediaPlayers Hook
 * Subscribes to Kodi, Sonos, and TV media players.
 * Determines the "active" player (playing > paused > idle).
 *
 * Returns:
 *   activePlayer   - config object from MEDIA_PLAYERS, or null if nothing playing
 *   activeEntity   - { state, attributes, ... } from useEntity for the active player
 *   isPlaying      - boolean: at least one player is playing
 *   isPaused       - boolean: active player is paused (not playing)
 *   mediaTitle     - string or null
 *   mediaArtist    - string or null
 *   entityPicture  - string URL or null (album art / movie poster)
 *   volumeLevel    - number 0-1 or null
 *   isVolumeMuted  - boolean
 *   supportedFeatures - number bitmask
 *   loading        - boolean
 */

import { useEntity } from '../../../../hooks/useEntity';
import { MEDIA_PLAYERS } from '../gamesRoomConfig';

export function useMediaPlayers() {
  // IMPORTANT: hooks must be called unconditionally, so call all 3 always
  const kodi  = useEntity(MEDIA_PLAYERS[0].id);  // media_player.osmc_mediaroom
  const sonos = useEntity(MEDIA_PLAYERS[1].id);  // media_player.games_room
  const tv    = useEntity(MEDIA_PLAYERS[2].id);  // media_player.games_room_tv

  const players = [
    { config: MEDIA_PLAYERS[0], entity: kodi },
    { config: MEDIA_PLAYERS[1], entity: sonos },
    { config: MEDIA_PLAYERS[2], entity: tv },
  ];

  // Find the active player: prefer "playing" over "paused" over nothing
  // Sort by priority (lower = higher priority)
  const playing = players
    .filter(p => p.entity.state === 'playing')
    .sort((a, b) => a.config.priority - b.config.priority);

  const paused = players
    .filter(p => p.entity.state === 'paused')
    .sort((a, b) => a.config.priority - b.config.priority);

  const active = playing[0] || paused[0] || null;

  return {
    activePlayer: active?.config || null,
    activeEntity: active?.entity || null,
    isPlaying: playing.length > 0,
    isPaused: !playing.length && paused.length > 0,
    mediaTitle: active?.entity?.attributes?.media_title || null,
    mediaArtist: active?.entity?.attributes?.media_artist || active?.entity?.attributes?.media_series_title || null,
    entityPicture: active?.entity?.attributes?.entity_picture || null,
    volumeLevel: active?.entity?.attributes?.volume_level ?? null,
    isVolumeMuted: active?.entity?.attributes?.is_volume_muted || false,
    supportedFeatures: active?.entity?.attributes?.supported_features || 0,
    loading: kodi.loading || sonos.loading || tv.loading,
  };
}
