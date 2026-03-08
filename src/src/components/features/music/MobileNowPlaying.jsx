/**
 * MobileNowPlaying Component
 * Compact now-playing for mobile — album art, track info, transport, volume
 */

import { useState, useEffect, useRef } from 'react';
import {
  SkipBack, Play, Pause, SkipForward,
  Volume2, VolumeX, Shuffle, Repeat, Repeat1,
  Music,
} from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { useProgressTimer } from './hooks/useProgressTimer';
import {
  SUPPORT_PAUSE, SUPPORT_PLAY, SUPPORT_PREVIOUS_TRACK,
  SUPPORT_NEXT_TRACK, SUPPORT_VOLUME_SET, SUPPORT_VOLUME_MUTE,
  SUPPORT_SHUFFLE_SET, SUPPORT_REPEAT_SET, SUPPORT_SEEK,
  VOLUME_DEBOUNCE_MS,
} from './musicConfig';

export function MobileNowPlaying({ speaker, controls }) {
  const [localVolume, setLocalVolume] = useState(speaker?.volumeLevel || 0);
  const [imageError, setImageError] = useState(false);
  const volumeTimeoutRef = useRef(null);

  useEffect(() => {
    if (speaker?.volumeLevel !== undefined) {
      setLocalVolume(speaker.volumeLevel);
    }
  }, [speaker?.volumeLevel]);

  useEffect(() => {
    setImageError(false);
  }, [speaker?.entityPicture]);

  const currentPosition = useProgressTimer(
    speaker?.mediaPosition,
    speaker?.mediaPositionUpdatedAt,
    speaker?.mediaDuration,
    speaker?.state === 'playing'
  );

  const supports = (feature) =>
    speaker && (speaker.supportedFeatures & feature) !== 0;

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setLocalVolume(newVolume);
    clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => {
      if (speaker) controls.setVolume(speaker.entityId, newVolume);
    }, VOLUME_DEBOUNCE_MS);
  };

  const isPlaying = speaker?.state === 'playing';
  const isPaused = speaker?.state === 'paused';
  const hasMedia = isPlaying || isPaused;

  if (!speaker || !hasMedia) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Music size={48} className="text-gray-300 mb-3" />
        <p className="text-sm font-medium text-[var(--color-text)]">Nothing Playing</p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          {speaker ? speaker.label : 'Select a speaker'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 py-3">
      {/* Album Art */}
      <div className="w-44 h-44 rounded-xl overflow-hidden bg-gray-200 shadow-lg mb-3">
        {speaker.entityPicture && !imageError ? (
          <img
            src={speaker.entityPicture}
            alt={speaker.mediaTitle || 'Album art'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(181,69,58,0.15), rgba(176,138,98,0.15))' }}>
            <Music size={48} className="text-gray-400" />
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="text-center w-full mb-2">
        <h2 className="text-base font-bold text-[var(--color-text)] truncate">
          {speaker.mediaTitle || 'Unknown Track'}
        </h2>
        {speaker.mediaArtist && (
          <p className="text-sm text-[var(--color-text-secondary)] truncate">
            {speaker.mediaArtist}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      {supports(SUPPORT_SEEK) && (
        <div className="w-full mb-2">
          <ProgressBar
            currentPosition={currentPosition}
            duration={speaker.mediaDuration}
            onSeek={(pos) => controls.seek(speaker.entityId, pos)}
          />
        </div>
      )}

      {/* Transport Controls */}
      <div className="flex items-center justify-center gap-3 mb-3">
        {supports(SUPPORT_SHUFFLE_SET) && (
          <button
            onClick={() => controls.setShuffle(speaker.entityId, !speaker.shuffle)}
            className="p-2 rounded-full transition-colors"
            style={{ color: speaker.shuffle ? 'var(--ds-accent)' : '#9ca3af' }}
          >
            <Shuffle size={18} />
          </button>
        )}
        {supports(SUPPORT_PREVIOUS_TRACK) && (
          <button
            onClick={() => controls.previous(speaker.entityId)}
            className="p-2.5 rounded-full hover:bg-gray-100"
          >
            <SkipBack size={22} className="text-[var(--color-text)]" />
          </button>
        )}
        {(supports(SUPPORT_PLAY) || supports(SUPPORT_PAUSE)) && (
          <button
            onClick={() => controls.playPause(speaker.entityId)}
            className="p-3.5 rounded-full text-white"
            style={{ backgroundColor: 'var(--ds-accent)' }}
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
          </button>
        )}
        {supports(SUPPORT_NEXT_TRACK) && (
          <button
            onClick={() => controls.next(speaker.entityId)}
            className="p-2.5 rounded-full hover:bg-gray-100"
          >
            <SkipForward size={22} className="text-[var(--color-text)]" />
          </button>
        )}
        {supports(SUPPORT_REPEAT_SET) && (
          <button
            onClick={() => {
              const nextRepeat = speaker.repeat === 'off' ? 'all'
                : speaker.repeat === 'all' ? 'one' : 'off';
              controls.setRepeat(speaker.entityId, nextRepeat);
            }}
            className="p-2 rounded-full transition-colors"
            style={{ color: speaker.repeat !== 'off' ? 'var(--ds-accent)' : '#9ca3af' }}
          >
            {speaker.repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
          </button>
        )}
      </div>

      {/* Volume Slider */}
      {supports(SUPPORT_VOLUME_SET) && (
        <div className="flex items-center gap-2 w-full">
          {supports(SUPPORT_VOLUME_MUTE) && (
            <button
              onClick={() => controls.toggleMute(speaker.entityId, speaker.isVolumeMuted)}
              className="p-1 flex-shrink-0"
            >
              {speaker.isVolumeMuted ? (
                <VolumeX size={16} className="text-gray-400" />
              ) : (
                <Volume2 size={16} className="text-gray-400" />
              )}
            </button>
          )}
          <input
            type="range"
            min="0" max="1" step="0.01"
            value={localVolume}
            onChange={handleVolumeChange}
            className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-[var(--ds-accent)]"
            style={{
              background: `linear-gradient(to right, var(--ds-accent-secondary) ${localVolume * 100}%, #e5e7eb ${localVolume * 100}%)`,
            }}
          />
          <span className="text-xs font-medium min-w-[3ch] text-[var(--color-text-secondary)]">
            {Math.round(localVolume * 100)}%
          </span>
        </div>
      )}

      {/* Speaker label */}
      <div className="text-[10px] text-[var(--color-text-secondary)] mt-2">
        {speaker.label}
      </div>
    </div>
  );
}
