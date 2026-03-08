/**
 * SpeakerCard Component
 * Displays a single Sonos speaker with status, volume slider, and selection state.
 * Styled to match Games Room warm earthy design.
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

  // Status indicator color
  const statusColorStyle =
    speaker.state === 'playing' ? 'var(--ds-accent)' :
    speaker.state === 'paused'  ? 'var(--ds-accent-secondary)' :
    'var(--ds-warm-inactive-bg)';

  const statusTooltip =
    speaker.state === 'playing' ? 'Playing' :
    speaker.state === 'paused'  ? 'Paused' :
    'Idle';

  const isGrouped = speaker.groupMembers.length > 1;

  return (
    <div
      onClick={() => onSelect(speaker.entityId)}
      className="ds-card cursor-pointer transition-all hover:shadow-md"
      style={{
        padding: '12px',
        ...(isSelected ? { boxShadow: '0 0 0 2px var(--ds-accent)' } : {}),
      }}
    >
      {/* Top row: checkbox, name, status dot */}
      <div className="flex items-center gap-2.5 mb-2">
        {/* Checkbox for grouping */}
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => {
            e.stopPropagation();
            onCheck(speaker.entityId);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
          style={{ accentColor: 'var(--ds-accent)' }}
        />

        <span className="font-medium text-sm truncate flex-1" style={{ color: 'var(--ds-text)' }}>
          {speaker.label}
        </span>

        {/* Status dot */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: statusColorStyle }}
          title={statusTooltip}
        />

        {/* Group indicator */}
        {isGrouped && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(181,69,58,0.1)', border: '1px solid rgba(181,69,58,0.3)' }}
            title={`Grouped with: ${speaker.groupMembers.filter(id => id !== speaker.entityId).map(id => {
              const s = speakers?.find(sp => sp.entityId === id);
              return s?.label || id;
            }).join(', ')}`}
          >
            <Link2 size={11} style={{ color: 'var(--ds-accent)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--ds-accent)' }}>
              {speaker.groupMembers.length}
            </span>
          </div>
        )}
      </div>

      {/* Currently playing track (if any) */}
      {speaker.mediaTitle && (
        <div className="text-xs truncate mb-2" style={{ color: 'var(--ds-text-secondary)' }}>
          {speaker.mediaTitle}
        </div>
      )}

      {/* Volume slider */}
      <div className="flex items-center gap-2">
        {speaker.isVolumeMuted ? (
          <VolumeX size={14} className="flex-shrink-0" style={{ color: 'var(--ds-text-secondary)' }} />
        ) : (
          <Volume2 size={14} className="flex-shrink-0" style={{ color: 'var(--ds-text-secondary)' }} />
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
                     [&::-webkit-slider-thumb]:bg-[var(--ds-accent)]"
        />
        <span className="text-xs font-medium min-w-[36px] text-right flex-shrink-0" style={{ color: 'var(--ds-text)' }}>
          {Math.round(localVolume * 100)}%
        </span>
      </div>
    </div>
  );
}
