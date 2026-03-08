/**
 * SpeakerPanel Component
 * Right panel — speaker grid with volume, grouping controls.
 * Preset groups color their member speaker cards. Only one preset active at a time.
 */

import { useState } from 'react';
import { Link2, Unlink, PlayCircle } from 'lucide-react';
import { SpeakerCard } from './SpeakerCard';
import { ZONES, PRESET_GROUPS } from './musicConfig';

/**
 * Detect which preset group (if any) is currently active.
 * A preset is "active" if ALL its members share the same groupMembers array
 * (i.e. they are all grouped together via Sonos).
 */
function detectActivePreset(speakers) {
  for (const preset of PRESET_GROUPS) {
    const presetSpeakers = preset.members.map(id =>
      speakers.find(s => s.entityId === id)
    ).filter(Boolean);

    if (presetSpeakers.length !== preset.members.length) continue;

    // Check if all preset members are grouped together
    const firstMembers = presetSpeakers[0]?.groupMembers || [];
    if (firstMembers.length < 2) continue;

    const allGrouped = presetSpeakers.every(s => {
      const members = s.groupMembers || [];
      return members.length === firstMembers.length &&
        preset.members.every(id => members.includes(id));
    });

    if (allGrouped) return preset;
  }
  return null;
}

/**
 * Get the group color for a speaker based on the active preset.
 */
function getGroupColor(speaker, activePreset) {
  if (!activePreset) return null;
  if (activePreset.members.includes(speaker.entityId)) {
    return activePreset.color.from;
  }
  return null;
}

export function SpeakerPanel({
  speakers,
  activeSpeakerId,
  onSelectSpeaker,
  onVolumeChange,
  groupControls,
}) {
  // Track which speakers are checked for grouping
  const [checkedSpeakers, setCheckedSpeakers] = useState(new Set());

  const activePreset = detectActivePreset(speakers);

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
    const coordinatorId = memberIds.includes(activeSpeakerId)
      ? activeSpeakerId
      : memberIds[0];
    groupControls.groupSpeakers(coordinatorId, memberIds);
    setCheckedSpeakers(new Set());
  };

  const handlePlayEverywhere = () => {
    if (!activeSpeakerId) return;
    const allIds = speakers.map((s) => s.entityId);
    groupControls.groupSpeakers(activeSpeakerId, allIds);
  };

  const handlePresetClick = (preset) => {
    // If this preset is already active, ungroup it
    if (activePreset?.id === preset.id) {
      groupControls.ungroupAll(speakers.filter(s => preset.members.includes(s.entityId)));
    } else {
      groupControls.groupSpeakers(preset.members[0], preset.members);
    }
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
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {Object.entries(speakersByZone).map(([zone, zoneSpeakers]) => (
          <div key={zone}>
            {/* Zone label */}
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ZONES[zone]?.color || '#9ca3af' }}
              />
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ds-text-secondary)' }}>
                {ZONES[zone]?.label || zone}
              </span>
            </div>

            {/* Speaker cards — more spacing */}
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
                  groupColor={getGroupColor(speaker, activePreset)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Preset Groups */}
      <div className="p-4 border-t border-[var(--ds-border)] flex-shrink-0">
        <div className="text-xs font-medium uppercase tracking-wider mb-3 px-1" style={{ color: 'var(--ds-text-secondary)' }}>
          Quick Groups
        </div>
        <div className="flex gap-2.5">
          {PRESET_GROUPS.map((preset) => {
            const isActive = activePreset?.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset)}
                disabled={groupControls.groupLoading}
                className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 px-3 text-base font-semibold
                           rounded-xl disabled:opacity-40 disabled:cursor-not-allowed
                           transition-all hover:shadow-md"
                style={isActive
                  ? {
                      background: `linear-gradient(135deg, ${preset.color.from}, ${preset.color.to})`,
                      color: 'white',
                      border: '1px solid transparent',
                    }
                  : {
                      backgroundColor: 'var(--ds-warm-inactive-bg)',
                      color: 'var(--ds-text)',
                      border: '1px solid var(--ds-border)',
                    }
                }
              >
                <span>{preset.label}</span>
                <span className="text-xs font-normal" style={{ color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--ds-text-secondary)' }}>
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Grouping Controls */}
      <div className="p-4 border-t border-[var(--ds-border)] flex-shrink-0 space-y-3">
        {/* Group Selected */}
        <button
          onClick={handleGroupSelected}
          disabled={checkedSpeakers.size < 2 || groupControls.groupLoading}
          className="w-full flex items-center justify-center gap-2 py-3 px-3 text-sm font-medium
                     text-white rounded-xl
                     disabled:opacity-40 disabled:cursor-not-allowed
                     hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--ds-accent)', border: '1px solid var(--ds-accent-hover)' }}
        >
          <Link2 size={14} />
          Group Selected ({checkedSpeakers.size})
        </button>

        {/* Play Everywhere + Ungroup row */}
        <div className="flex gap-2.5">
          <button
            onClick={handlePlayEverywhere}
            disabled={!activeSpeakerId || groupControls.groupLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 px-2 text-sm font-medium
                       rounded-xl
                       disabled:opacity-40 disabled:cursor-not-allowed
                       hover:shadow-md transition-all"
            style={{
              backgroundColor: 'var(--ds-warm-inactive-bg)',
              color: 'var(--ds-text)',
              border: '1px solid var(--ds-border)',
            }}
          >
            <PlayCircle size={16} />
            Everywhere
          </button>
          <button
            onClick={() => groupControls.ungroupAll(speakers)}
            disabled={groupControls.groupLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 px-2 text-sm font-medium
                       rounded-xl
                       disabled:opacity-40 disabled:cursor-not-allowed
                       hover:shadow-md transition-all"
            style={{
              backgroundColor: 'var(--ds-warm-inactive-bg)',
              color: 'var(--ds-text)',
              border: '1px solid var(--ds-border)',
            }}
          >
            <Unlink size={16} />
            Ungroup All
          </button>
        </div>
      </div>
    </div>
  );
}
