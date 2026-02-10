/**
 * useActiveSpeaker Hook
 * Manages which Sonos speaker is the current playback target.
 * Auto-detects the first playing speaker if user hasn't selected one.
 */

import { useState, useMemo } from 'react';

export function useActiveSpeaker(speakers) {
  // null = auto-detect, string = user manually picked an entity ID
  const [selectedId, setSelectedId] = useState(null);

  const activeSpeaker = useMemo(() => {
    // If user manually selected a speaker, use that one
    if (selectedId) {
      const found = speakers.find((s) => s.entityId === selectedId);
      if (found) return found;
    }

    // Auto-detect: first playing, then first paused, then first speaker
    const playing = speakers.find((s) => s.state === 'playing');
    if (playing) return playing;

    const paused = speakers.find((s) => s.state === 'paused');
    if (paused) return paused;

    return speakers[0] || null;
  }, [speakers, selectedId]);

  return {
    activeSpeaker,           // The speaker object (or null)
    selectedId,              // The manually selected entity ID (or null)
    selectSpeaker: setSelectedId, // Call with entity ID to select
    clearSelection: () => setSelectedId(null), // Reset to auto-detect
    isManualSelection: selectedId !== null,
  };
}
