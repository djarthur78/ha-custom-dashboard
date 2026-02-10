/**
 * SpeakerPanel Component
 * Right panel (25%) — speaker grid with volume, grouping controls.
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
    <div className="bg-[var(--color-surface)] rounded-xl h-full flex flex-col overflow-hidden"
         style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

      {/* Header */}
      <div className="px-3 py-2.5 border-b border-[var(--color-border)] flex-shrink-0">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Speakers</h3>
      </div>

      {/* Speaker List (scrollable) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {Object.entries(speakersByZone).map(([zone, zoneSpeakers]) => (
          <div key={zone}>
            {/* Zone label */}
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ZONES[zone]?.color || '#9ca3af' }}
              />
              <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                {ZONES[zone]?.label || zone}
              </span>
            </div>

            {/* Speaker cards */}
            <div className="space-y-2.5">
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
      <div className="p-3 border-t border-[var(--color-border)] flex-shrink-0 space-y-3">
        <div className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 px-1">
          Quick Groups
        </div>
        {PRESET_GROUPS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => groupControls.groupSpeakers(preset.members[0], preset.members)}
            disabled={groupControls.groupLoading}
            className="w-full flex flex-col items-center justify-center gap-1.5 py-3.5 px-4 text-sm font-semibold
                       text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all shadow-md hover:shadow-lg"
            style={{
              background: `linear-gradient(to right, ${preset.color.from}, ${preset.color.to})`,
            }}
          >
            <span>{preset.label}</span>
            <span className="text-xs font-normal opacity-90">{preset.description}</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--color-border)]" />

      {/* Manual Grouping Controls */}
      <div className="p-3 border-t border-[var(--color-border)] flex-shrink-0 space-y-2">
        {/* Group Selected */}
        <button
          onClick={handleGroupSelected}
          disabled={checkedSpeakers.size < 2 || groupControls.groupLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium
                     bg-[var(--color-primary)] text-white rounded-lg
                     disabled:opacity-40 disabled:cursor-not-allowed
                     hover:opacity-90 transition-opacity"
        >
          <Link2 size={14} />
          Group Selected ({checkedSpeakers.size})
        </button>

        {/* Play Everywhere + Ungroup row */}
        <div className="flex gap-2">
          <button
            onClick={handlePlayEverywhere}
            disabled={!activeSpeakerId || groupControls.groupLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-medium
                       bg-green-600 text-white rounded-lg
                       disabled:opacity-40 disabled:cursor-not-allowed
                       hover:opacity-90 transition-opacity"
          >
            <PlayCircle size={14} />
            Everywhere
          </button>
          <button
            onClick={() => groupControls.ungroupAll(speakers)}
            disabled={groupControls.groupLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-medium
                       bg-gray-500 text-white rounded-lg
                       disabled:opacity-40 disabled:cursor-not-allowed
                       hover:opacity-90 transition-opacity"
          >
            <Unlink size={14} />
            Ungroup All
          </button>
        </div>
      </div>
    </div>
  );
}
