/**
 * NowPlayingPanel Component
 * Left panel (40%) — shows album art, track info, progress bar,
 * transport controls, shuffle/repeat, and volume for the active speaker.
 */

import { useState, useEffect, useRef } from 'react';
import {
  SkipBack, Play, Pause, SkipForward,
  Volume2, VolumeX, Shuffle, Repeat, Repeat1,
  Music, Link2,
} from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { useProgressTimer } from './hooks/useProgressTimer';
import { useGroupVolume } from './hooks/useGroupVolume';
import haWebSocket from '../../../services/ha-websocket';
import {
  SUPPORT_PAUSE, SUPPORT_PLAY, SUPPORT_PREVIOUS_TRACK,
  SUPPORT_NEXT_TRACK, SUPPORT_VOLUME_SET, SUPPORT_VOLUME_MUTE,
  SUPPORT_SHUFFLE_SET, SUPPORT_REPEAT_SET, SUPPORT_SEEK,
  VOLUME_DEBOUNCE_MS,
} from './musicConfig';

export function NowPlayingPanel({ speaker, controls }) {
  const groupVolumeControls = useGroupVolume();
  const [localVolume, setLocalVolume] = useState(speaker?.volumeLevel || 0);
  const [imageError, setImageError] = useState(false);
  const volumeTimeoutRef = useRef(null);

  // Sync volume from HA
  useEffect(() => {
    if (speaker?.volumeLevel !== undefined) {
      setLocalVolume(speaker.volumeLevel);
    }
  }, [speaker?.volumeLevel]);

  // Reset image error when track changes
  useEffect(() => {
    setImageError(false);
  }, [speaker?.entityPicture]);

  // Smooth progress timer
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

  const isGrouped = speaker?.groupMembers.length > 1;
  const groupMembers = speaker?.groupMembers || [];

  // Get friendly names for group members
  const groupMemberNames = groupMembers
    .map(id => {
      // Try to get friendly name from entity state
      const state = haWebSocket.getCachedState(id);
      return state?.attributes?.friendly_name || id.split('.')[1];
    })
    .join(', ');

  // ─── Nothing Playing State ───
  if (!speaker || !hasMedia) {
    return (
      <div className="ds-card h-full flex flex-col items-center justify-center text-center">
        <Music size={80} className="text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">Nothing Playing</h2>
        <p className="text-[var(--color-text-secondary)]">
          {speaker ? `Selected: ${speaker.label}` : 'Select a speaker to get started'}
        </p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Choose a playlist to start playing
        </p>
      </div>
    );
  }

  // ─── Active Playback State ───
  return (
    <div className="ds-card h-full p-5 flex flex-col overflow-hidden">

      {/* Group Header */}
      <div className="flex-shrink-0 mb-3 pb-3 border-b border-[var(--color-border)]">
        {isGrouped ? (
          <div className="flex items-start gap-2">
            <Link2 size={18} className="text-[var(--ds-accent)] flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                Now Playing on Group
              </div>
              <div className="text-base font-semibold text-[var(--color-text)] truncate">
                {groupMembers.length} Speakers
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] truncate">
                {groupMemberNames}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
              Now Playing on
            </div>
            <div className="text-base font-semibold text-[var(--color-text)]">
              {speaker.label}
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pb-3">
        {/* Album Art */}
        <div className="flex-shrink-0">
          <div className="relative w-full aspect-square mx-auto rounded-xl overflow-hidden bg-gray-200 shadow-xl">
            {speaker.entityPicture && !imageError ? (
              <img
                src={speaker.entityPicture}
                alt={speaker.mediaTitle || 'Album art'}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(181,69,58,0.15), rgba(176,138,98,0.15))' }}>
                <Music size={80} className="text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Track Info */}
        <div className="flex-shrink-0 text-center px-4">
          <h2 className="text-2xl font-bold text-[var(--color-text)] truncate mb-1.5">
            {speaker.mediaTitle || 'Unknown Track'}
          </h2>
          {speaker.mediaArtist && (
            <p className="text-lg text-[var(--color-text-secondary)] truncate mb-1">
              {speaker.mediaArtist}
            </p>
          )}
          {speaker.mediaAlbumName && (
            <p className="text-sm text-[var(--color-text-secondary)] truncate">
              {speaker.mediaAlbumName}
            </p>
          )}

          {/* Queue info */}
          {speaker.queueSize && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-2">
              Track {speaker.queuePosition} of {speaker.queueSize}
            </p>
          )}
        </div>
      </div>

      {/* Controls - Fixed at Bottom */}
      <div className="flex-shrink-0 space-y-3 pt-3 border-t border-[var(--color-border)]">
        {/* Progress Bar */}
        {supports(SUPPORT_SEEK) && (
          <ProgressBar
            currentPosition={currentPosition}
            duration={speaker.mediaDuration}
            onSeek={(pos) => controls.seek(speaker.entityId, pos)}
          />
        )}

        {/* Transport Controls */}
        <div className="flex items-center justify-center gap-4">
          {/* Shuffle */}
          {supports(SUPPORT_SHUFFLE_SET) && (
            <button
              onClick={() => controls.setShuffle(speaker.entityId, !speaker.shuffle)}
              className={`p-3 rounded-full transition-colors active:scale-90 ${
                speaker.shuffle
                  ? 'text-[var(--ds-accent)] bg-[rgba(181,69,58,0.08)]'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Shuffle size={22} />
            </button>
          )}

          {/* Previous */}
          {supports(SUPPORT_PREVIOUS_TRACK) && (
            <button
              onClick={() => controls.previous(speaker.entityId)}
              className="p-4 rounded-full hover:bg-gray-100 active:bg-gray-200 active:scale-90 transition-all"
            >
              <SkipBack size={28} className="text-[var(--color-text)]" />
            </button>
          )}

          {/* Play/Pause */}
          {(supports(SUPPORT_PLAY) || supports(SUPPORT_PAUSE)) && (
            <button
              onClick={() => controls.playPause(speaker.entityId)}
              className="p-5 rounded-full bg-[var(--ds-accent)] text-white hover:opacity-90 active:scale-90 transition-all"
            >
              {isPlaying ? (
                <Pause size={36} fill="currentColor" />
              ) : (
                <Play size={36} fill="currentColor" />
              )}
            </button>
          )}

          {/* Next */}
          {supports(SUPPORT_NEXT_TRACK) && (
            <button
              onClick={() => controls.next(speaker.entityId)}
              className="p-4 rounded-full hover:bg-gray-100 active:bg-gray-200 active:scale-90 transition-all"
            >
              <SkipForward size={28} className="text-[var(--color-text)]" />
            </button>
          )}

          {/* Repeat */}
          {supports(SUPPORT_REPEAT_SET) && (
            <button
              onClick={() => {
                const nextRepeat = speaker.repeat === 'off' ? 'all'
                  : speaker.repeat === 'all' ? 'one' : 'off';
                controls.setRepeat(speaker.entityId, nextRepeat);
              }}
              className={`p-3 rounded-full transition-colors active:scale-90 ${
                speaker.repeat !== 'off'
                  ? 'text-[var(--ds-accent)] bg-[rgba(181,69,58,0.08)]'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              {speaker.repeat === 'one' ? <Repeat1 size={22} /> : <Repeat size={22} />}
            </button>
          )}
        </div>

        {/* Volume Controls */}
        {supports(SUPPORT_VOLUME_SET) && (
          <div className="space-y-2">
            {/* Group volume slider (if grouped) */}
            {isGrouped && (
              <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(181,69,58,0.06)', border: '1px solid rgba(181,69,58,0.15)' }}>
                <div className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: 'var(--ds-accent)' }}>
                  <Link2 size={12} />
                  Group Volume
                </div>
                <div className="flex items-center gap-3">
                  {supports(SUPPORT_VOLUME_MUTE) && (
                    <button
                      onClick={() => controls.toggleMute(speaker.entityId, speaker.isVolumeMuted)}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                    >
                      {speaker.isVolumeMuted ? (
                        <VolumeX size={18} style={{ color: 'var(--ds-accent)' }} />
                      ) : (
                        <Volume2 size={18} style={{ color: 'var(--ds-accent)' }} />
                      )}
                    </button>
                  )}
                  <input
                    type="range"
                    min="0" max="1" step="0.01"
                    value={localVolume}
                    onChange={(e) => {
                      const newVolume = parseFloat(e.target.value);
                      setLocalVolume(newVolume);
                      clearTimeout(volumeTimeoutRef.current);
                      volumeTimeoutRef.current = setTimeout(() => {
                        groupVolumeControls.setGroupVolume(groupMembers, newVolume);
                      }, VOLUME_DEBOUNCE_MS);
                    }}
                    className="flex-1 h-2 rounded-lg appearance-none cursor-pointer
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                               [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
                               [&::-webkit-slider-thumb]:bg-[var(--ds-accent)]"
                    style={{
                      background: `linear-gradient(to right, var(--ds-accent-secondary) ${localVolume * 100}%, #e5e7eb ${localVolume * 100}%)`,
                    }}
                  />
                  <span className="text-sm font-medium min-w-[3ch]" style={{ color: 'var(--ds-accent)' }}>
                    {Math.round(localVolume * 100)}%
                  </span>
                </div>
              </div>
            )}

            {/* Individual speaker volume */}
            <div className="flex items-center gap-3">
              <div className="text-xs text-[var(--color-text-secondary)] min-w-[70px]">
                {isGrouped ? 'This Speaker' : 'Volume'}
              </div>
              {supports(SUPPORT_VOLUME_MUTE) && (
                <button
                  onClick={() => controls.toggleMute(speaker.entityId, speaker.isVolumeMuted)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  {speaker.isVolumeMuted ? (
                    <VolumeX size={18} className="text-[var(--color-text-secondary)]" />
                  ) : (
                    <Volume2 size={18} className="text-[var(--color-text-secondary)]" />
                  )}
                </button>
              )}
              <input
                type="range"
                min="0" max="1" step="0.01"
                value={localVolume}
                onChange={handleVolumeChange}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                           [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-[var(--ds-accent)]"
                style={{
                  background: `linear-gradient(to right, var(--ds-accent-secondary) ${localVolume * 100}%, #e5e7eb ${localVolume * 100}%)`,
                }}
              />
              <span className="text-sm font-medium text-[var(--color-text)] min-w-[3ch]">
                {Math.round(localVolume * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
