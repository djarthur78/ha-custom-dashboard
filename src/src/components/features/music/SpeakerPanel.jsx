/**
 * SpeakerPanel Component
 * Right panel — speaker grid with volume, grouping controls.
 * Styled to match Games Room warm earthy design.
 */

import { useState } from 'react';
import { Link2, Unlink, PlayCircle } from 'lucide-react';
import { SpeakerCard } from './SpeakerCard';
import { ZONES, PRESET_GROUPS } from './musicConfig';

export function SpeakerPanel({
  speakers,
  activeSpeakerId,
  onSelectSpeaker,
  onVolumeChange,
  groupControls,
}) {
  // Track which speakers are checked for grouping
  const [checkedSpeakers, setCheckedSpeakers] = useState(new Set());

  const toggleCheck = (entityId) => {
    setCheckedSpeakers((prev) => {
      const next = new Set(prev);
      if (next.has(entityId)) {
        next.delete(entityId);
      } else {
        next.add(entityId);
      }
      return next;
    });
  };

  const handleGroupSelected = () => {
    if (checkedSpeakers.size < 2) return;
    const memberIds = [...checkedSpeakers];
    // Use the active speaker as coordinator if it's checked, otherwise first checked
    const coordinatorId = memberIds.includes(activeSpeakerId)
      ? activeSpeakerId
      : memberIds[0];
    groupControls.groupSpeakers(coordinatorId, memberIds);
    setCheckedSpeakers(new Set()); // Clear selection after grouping
  };

  const handlePlayEverywhere = () => {
    // Group ALL speakers under the active speaker
    if (!activeSpeakerId) return;
    const allIds = speakers.map((s) => s.entityId);
    groupControls.groupSpeakers(activeSpeakerId, allIds);
  };

  // Group speakers by zone for visual organization
  const speakersByZone = {};
  for (const speaker of speakers) {
    const zone = speaker.zone || 'other';
    if (!speakersByZone[zone]) speakersByZone[zone] = [];
    speakersByZone[zone].push(speaker);
  }

  return (
    <div className="ds-card h-full flex flex-col overflow-hidden" style={{ padding: 0 }}>

      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--ds-border)] flex-shrink-0">
        <h3 className="text-base font-bold text-[var(--ds-text)]">Speakers</h3>
      </div>

      {/* Speaker List (scrollable) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {Object.entries(speakersByZone).map(([zone, zoneSpeakers]) => (
          <div key={zone}>
            {/* Zone label */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ZONES[zone]?.color || '#9ca3af' }}
              />
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ds-text-secondary)' }}>
                {ZONES[zone]?.label || zone}
              </span>
            </div>

            {/* Speaker cards */}
            <div className="space-y-2">
              {zoneSpeakers.map((speaker) => (
                <SpeakerCard
                  key={speaker.entityId}
                  speaker={speaker}
                  speakers={speakers}
                  isSelected={speaker.entityId === activeSpeakerId}
                  isChecked={checkedSpeakers.has(speaker.entityId)}
                  onSelect={onSelectSpeaker}
                  onCheck={toggleCheck}
                  onVolumeChange={onVolumeChange}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Preset Groups */}
      <div className="p-3 border-t border-[var(--ds-border)] flex-shrink-0 space-y-2">
        <div className="text-xs font-medium uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--ds-text-secondary)' }}>
          Quick Groups
        </div>
        {PRESET_GROUPS.map((preset) => {
          return (
            <button
              key={preset.id}
              onClick={() => groupControls.groupSpeakers(preset.members[0], preset.members)}
              disabled={groupControls.groupLoading}
              className="w-full flex flex-col items-center justify-center gap-1 py-2.5 px-4 text-sm font-semibold
                         rounded-xl disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all hover:shadow-md"
              style={{
                backgroundColor: 'var(--ds-warm-inactive-bg)',
                color: 'var(--ds-text)',
                border: '1px solid var(--ds-border)',
              }}
            >
              <span>{preset.label}</span>
              <span className="text-xs font-normal" style={{ color: 'var(--ds-text-secondary)' }}>{preset.description}</span>
            </button>
          );
        })}
      </div>

      {/* Manual Grouping Controls */}
      <div className="p-3 border-t border-[var(--ds-border)] flex-shrink-0 space-y-2">
        {/* Group Selected */}
        <button
          onClick={handleGroupSelected}
          disabled={checkedSpeakers.size < 2 || groupControls.groupLoading}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium
                     text-white rounded-xl
                     disabled:opacity-40 disabled:cursor-not-allowed
                     hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--ds-accent)', border: '1px solid var(--ds-accent-hover)' }}
        >
          <Link2 size={14} />
          Group Selected ({checkedSpeakers.size})
        </button>

        {/* Play Everywhere + Ungroup row */}
        <div className="flex gap-2">
          <button
            onClick={handlePlayEverywhere}
            disabled={!activeSpeakerId || groupControls.groupLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium
                       rounded-xl
                       disabled:opacity-40 disabled:cursor-not-allowed
                       hover:shadow-md transition-all"
            style={{
              backgroundColor: 'var(--ds-warm-inactive-bg)',
              color: 'var(--ds-text)',
              border: '1px solid var(--ds-border)',
            }}
          >
            <PlayCircle size={14} />
            Everywhere
          </button>
          <button
            onClick={() => groupControls.ungroupAll(speakers)}
            disabled={groupControls.groupLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium
                       rounded-xl
                       disabled:opacity-40 disabled:cursor-not-allowed
                       hover:shadow-md transition-all"
            style={{
              backgroundColor: 'var(--ds-warm-inactive-bg)',
              color: 'var(--ds-text)',
              border: '1px solid var(--ds-border)',
            }}
          >
            <Unlink size={14} />
            Ungroup All
          </button>
        </div>
      </div>
    </div>
  );
}
