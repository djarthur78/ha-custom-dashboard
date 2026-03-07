/**
 * SpeakerCard Component
 * Displays a single Sonos speaker with status, volume slider, and selection state.
 *
 * Props:
 * - speaker: Object from useSonosSpeakers (entityId, label, state, volumeLevel, etc.)
 * - isSelected: Boolean, true if this is the active playback target
 * - isChecked: Boolean, true if checked for grouping
 * - onSelect: Function, called when user taps the card to select it
 * - onCheck: Function, called when user toggles the checkbox
 * - onVolumeChange: Function(entityId, volumeLevel), called on volume slider change
 */

import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Link2 } from 'lucide-react';
import { VOLUME_DEBOUNCE_MS } from './musicConfig';

// Simple hash function for consistent group colors
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function SpeakerCard({ speaker, speakers, isSelected, isChecked, onSelect, onCheck, onVolumeChange }) {
  const [localVolume, setLocalVolume] = useState(speaker.volumeLevel || 0);
  const volumeTimeoutRef = useRef(null);

  // Sync volume from HA when it changes externally
  useEffect(() => {
    setLocalVolume(speaker.volumeLevel || 0);
  }, [speaker.volumeLevel]);

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setLocalVolume(newVolume);

    // Debounce the service call to avoid flooding HA
    clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => {
      onVolumeChange(speaker.entityId, newVolume);
    }, VOLUME_DEBOUNCE_MS);
  };

  // Status indicator color and tooltip
  const statusColorStyle =
    speaker.state === 'playing' ? '#9f5644' :
    speaker.state === 'paused'  ? '#b08a62' :
    '#e8e4e1';

  const statusTooltip =
    speaker.state === 'playing' ? 'Playing' :
    speaker.state === 'paused'  ? 'Paused' :
    'Idle';

  const isGrouped = speaker.groupMembers.length > 1;
  const isCoordinator = speaker.groupMembers[0] === speaker.entityId;

  // Generate consistent color for group (based on coordinator ID)
  // Use HSL for easier manipulation of lightness/alpha
  const groupHue = isGrouped ? hashCode(speaker.groupMembers[0]) % 360 : 0;
  const groupBgColor = isGrouped
    ? `hsla(${groupHue}, 60%, 85%, 0.25)` // Very light, semi-transparent
    : 'var(--color-surface)';

  return (
    <div
      onClick={() => onSelect(speaker.entityId)}
      className={`
        rounded-2xl p-4 cursor-pointer transition-all
        border border-[var(--ds-border)]
        ${isSelected ? 'ring-2 ring-[var(--ds-accent)]' : 'hover:border-[#bbb]'}
      `}
      style={{
        backgroundColor: groupBgColor,
      }}
    >
      {/* Top row: checkbox, name, status dot */}
      <div className="flex items-center gap-2.5 mb-2.5">
        {/* Checkbox for grouping (stop propagation so it doesn't trigger card select) */}
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => {
            e.stopPropagation();
            onCheck(speaker.entityId);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-4.5 h-4.5 rounded border-gray-300 text-[var(--color-primary)]
                     focus:ring-[var(--color-primary)] cursor-pointer"
        />

        <span className="font-medium text-base text-[var(--color-text)] truncate flex-1">
          {speaker.label}
        </span>

        {/* Status dot */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: statusColorStyle }}
          title={statusTooltip}
        />

        {/* Group indicator */}
        {isGrouped && (
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(159,86,68,0.1)', border: '1px solid rgba(159,86,68,0.3)' }}
            title={`Grouped with: ${speaker.groupMembers.filter(id => id !== speaker.entityId).map(id => {
              const s = speakers?.find(sp => sp.entityId === id);
              return s?.label || id;
            }).join(', ')}`}
          >
            <Link2 size={12} style={{ color: '#9f5644' }} />
            <span className="text-xs font-medium" style={{ color: '#9f5644' }}>
              {speaker.groupMembers.length}
            </span>
          </div>
        )}
      </div>

      {/* Currently playing track (if any) */}
      {speaker.mediaTitle && (
        <div className="text-sm text-[var(--color-text-secondary)] truncate mb-2.5">
          {speaker.mediaTitle}
        </div>
      )}

      {/* Volume slider */}
      <div className="flex items-center gap-2.5">
        {speaker.isVolumeMuted ? (
          <VolumeX size={16} className="text-gray-400 flex-shrink-0" />
        ) : (
          <Volume2 size={16} className="text-gray-400 flex-shrink-0" />
        )}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={localVolume}
          onChange={handleVolumeChange}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                     [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-[var(--color-primary)]"
        />
        <span className="text-sm font-medium text-[var(--color-text)] min-w-[50px] text-right flex-shrink-0">
          {Math.round(localVolume * 100)}%
        </span>
      </div>
    </div>
  );
}
