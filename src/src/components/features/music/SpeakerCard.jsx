/**
 * SpeakerCard Component
 * Displays a single Sonos speaker with status, volume slider, and selection state.
 * Full-color highlight when selected. Group preset color tints member cards.
 */

import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Link2 } from 'lucide-react';
import { VOLUME_DEBOUNCE_MS } from './musicConfig';

export function SpeakerCard({ speaker, speakers, isSelected, isChecked, onSelect, onCheck, onVolumeChange, groupColor }) {
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

  const isPlaying = speaker.state === 'playing';
  const isPaused = speaker.state === 'paused';
  const isGrouped = speaker.groupMembers.length > 1;

  // Determine card styling
  let cardStyle = { padding: '12px' };
  let textColor = 'var(--ds-text)';
  let secondaryColor = 'var(--ds-text-secondary)';
  let sliderThumbColor = 'var(--ds-accent)';
  let volumeIconColor = 'var(--ds-text-secondary)';

  if (isSelected) {
    // Full color highlight for selected speaker
    cardStyle = {
      ...cardStyle,
      backgroundColor: 'var(--ds-accent)',
      border: '1px solid var(--ds-accent)',
      color: 'white',
    };
    textColor = 'white';
    secondaryColor = 'rgba(255,255,255,0.75)';
    sliderThumbColor = 'white';
    volumeIconColor = 'rgba(255,255,255,0.75)';
  } else if (groupColor) {
    // Tinted card for group members
    cardStyle = {
      ...cardStyle,
      backgroundColor: `${groupColor}15`,
      border: `2px solid ${groupColor}`,
    };
    sliderThumbColor = groupColor;
  }

  // Status dot color
  const statusDotColor = isPlaying ? 'var(--ds-state-on)' : isPaused ? 'var(--ds-accent-secondary)' : 'var(--ds-warm-inactive-bg)';
  const statusTooltip = isPlaying ? 'Playing' : isPaused ? 'Paused' : 'Idle';

  return (
    <div
      onClick={() => onSelect(speaker.entityId)}
      className="ds-card cursor-pointer transition-all hover:shadow-md"
      style={cardStyle}
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
          style={{ accentColor: isSelected ? 'white' : 'var(--ds-accent)' }}
        />

        <span className="font-medium text-sm truncate flex-1" style={{ color: textColor }}>
          {speaker.label}
        </span>

        {/* Status dot */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : statusDotColor }}
          title={statusTooltip}
        />

        {/* Group indicator */}
        {isGrouped && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
            style={isSelected
              ? { backgroundColor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)' }
              : { backgroundColor: 'rgba(181,69,58,0.1)', border: '1px solid rgba(181,69,58,0.3)' }
            }
            title={`Grouped with: ${speaker.groupMembers.filter(id => id !== speaker.entityId).map(id => {
              const s = speakers?.find(sp => sp.entityId === id);
              return s?.label || id;
            }).join(', ')}`}
          >
            <Link2 size={11} style={{ color: isSelected ? 'white' : 'var(--ds-accent)' }} />
            <span className="text-xs font-medium" style={{ color: isSelected ? 'white' : 'var(--ds-accent)' }}>
              {speaker.groupMembers.length}
            </span>
          </div>
        )}
      </div>

      {/* Currently playing track (if any) */}
      {speaker.mediaTitle && (
        <div className="text-xs truncate mb-2" style={{ color: secondaryColor }}>
          {speaker.mediaTitle}
        </div>
      )}

      {/* Volume slider */}
      <div className="flex items-center gap-2">
        {speaker.isVolumeMuted ? (
          <VolumeX size={14} className="flex-shrink-0" style={{ color: volumeIconColor }} />
        ) : (
          <Volume2 size={14} className="flex-shrink-0" style={{ color: volumeIconColor }} />
        )}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={localVolume}
          onChange={handleVolumeChange}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                     [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full"
          style={{
            background: isSelected ? 'rgba(255,255,255,0.3)' : '#e5e7eb',
            // Tailwind v4 can't do dynamic thumb colors, so we use a CSS variable trick
          }}
        />
        <span className="text-xs font-medium min-w-[36px] text-right flex-shrink-0" style={{ color: textColor }}>
          {Math.round(localVolume * 100)}%
        </span>
      </div>
    </div>
  );
}
