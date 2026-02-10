/**
 * NowPlaying Component
 * Hero section showing current media with poster/art, transport controls, and volume.
 */

import { useState, useEffect, useRef } from 'react';
import {
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Gamepad2,
  Film,
  Music,
  Tv,
} from 'lucide-react';
import { useMediaPlayers } from './hooks/useMediaPlayers';
import { useHarmonyActivity } from './hooks/useHarmonyActivity';
import { useServiceCall } from '../../../hooks/useServiceCall';
import {
  SUPPORT_PAUSE,
  SUPPORT_PLAY,
  SUPPORT_NEXT_TRACK,
  SUPPORT_PREVIOUS_TRACK,
  SUPPORT_VOLUME_SET,
  SUPPORT_VOLUME_MUTE,
} from './gamesRoomConfig';

const SOURCE_ICONS = { Kodi: Film, Sonos: Music, TV: Tv };

export function NowPlaying() {
  const { callService } = useServiceCall();
  const { currentActivity } = useHarmonyActivity();
  const {
    activePlayer,
    activeEntity,
    isPlaying,
    isPaused,
    mediaTitle,
    mediaArtist,
    entityPicture,
    volumeLevel,
    isVolumeMuted,
    supportedFeatures,
    loading,
  } = useMediaPlayers();

  const [localVolume, setLocalVolume] = useState(volumeLevel || 0);
  const [imageError, setImageError] = useState(false);
  const volumeTimeoutRef = useRef(null);

  // Sync from HA when not dragging
  useEffect(() => {
    if (volumeLevel !== null) {
      setLocalVolume(volumeLevel);
    }
  }, [volumeLevel]);

  const supports = (feature) => (supportedFeatures & feature) !== 0;

  const handlePrevious = () => {
    if (activePlayer) {
      callService('media_player', 'media_previous_track', { entity_id: activePlayer.id });
    }
  };

  const handlePlayPause = () => {
    if (activePlayer) {
      callService('media_player', 'media_play_pause', { entity_id: activePlayer.id });
    }
  };

  const handleNext = () => {
    if (activePlayer) {
      callService('media_player', 'media_next_track', { entity_id: activePlayer.id });
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setLocalVolume(newVolume);

    // Debounce the service call
    clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => {
      if (activePlayer) {
        callService('media_player', 'volume_set', {
          entity_id: activePlayer.id,
          volume_level: newVolume,
        });
      }
    }, 200);
  };

  const handleMuteToggle = () => {
    if (activePlayer) {
      callService('media_player', 'volume_mute', {
        entity_id: activePlayer.id,
        is_volume_muted: !isVolumeMuted,
      });
    }
  };

  // Mode 1: Something is playing or paused
  if (activePlayer && (isPlaying || isPaused)) {
    const SourceIcon = SOURCE_ICONS[activePlayer.label] || Film;

    return (
      <div
        className="bg-[var(--color-surface)] rounded-xl h-full p-6 flex gap-6"
        style={{
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* Album Art / Movie Poster */}
        <div className="flex-shrink-0 w-[35%] max-w-[300px]">
          <div className="relative h-full rounded-lg overflow-hidden bg-gray-200">
            {entityPicture && !imageError ? (
              <img
                src={entityPicture}
                alt={mediaTitle || 'Now Playing'}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                <SourceIcon size={80} className="text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Metadata and Controls */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          {/* Title and Source */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="text-3xl font-bold text-[var(--color-text)] truncate">
                {mediaTitle || 'Unknown Title'}
              </h2>
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium whitespace-nowrap">
                <SourceIcon size={14} />
                <span>{activePlayer.label}</span>
              </div>
            </div>
            {mediaArtist && (
              <div className="text-lg text-[var(--color-text-secondary)] mb-4 truncate">
                {mediaArtist}
              </div>
            )}
          </div>

          {/* Transport Controls */}
          <div className="flex items-center justify-center gap-4 my-6">
            {supports(SUPPORT_PREVIOUS_TRACK) && (
              <button
                onClick={handlePrevious}
                disabled={loading}
                className="p-3 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <SkipBack size={28} className="text-[var(--color-text)]" />
              </button>
            )}

            {(supports(SUPPORT_PLAY) || supports(SUPPORT_PAUSE)) && (
              <button
                onClick={handlePlayPause}
                disabled={loading}
                className="p-4 rounded-full bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isPlaying ? (
                  <Pause size={32} fill="currentColor" />
                ) : (
                  <Play size={32} fill="currentColor" />
                )}
              </button>
            )}

            {supports(SUPPORT_NEXT_TRACK) && (
              <button
                onClick={handleNext}
                disabled={loading}
                className="p-3 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <SkipForward size={28} className="text-[var(--color-text)]" />
              </button>
            )}
          </div>

          {/* Volume Control */}
          {supports(SUPPORT_VOLUME_SET) && (
            <div className="flex items-center gap-3">
              {supports(SUPPORT_VOLUME_MUTE) && (
                <button
                  onClick={handleMuteToggle}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  {isVolumeMuted ? (
                    <VolumeX size={24} className="text-[var(--color-text-secondary)]" />
                  ) : (
                    <Volume2 size={24} className="text-[var(--color-text-secondary)]" />
                  )}
                </button>
              )}
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={localVolume}
                onChange={handleVolumeChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-[var(--color-primary)]"
              />
              <span className="text-sm font-medium text-[var(--color-text)] min-w-[3ch]">
                {Math.round(localVolume * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mode 2: Nothing playing (idle)
  return (
    <div
      className="bg-[var(--color-surface)] rounded-xl h-full flex flex-col items-center justify-center text-center"
      style={{
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      }}
    >
      <Gamepad2 size={80} className="text-gray-300 mb-4" />
      <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">Nothing Playing</h2>
      <p className="text-[var(--color-text-secondary)] mb-1">
        Current mode: <span className="font-medium">{currentActivity.replace(/_/g, ' ')}</span>
      </p>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Tap a scene button to get started
      </p>
    </div>
  );
}
