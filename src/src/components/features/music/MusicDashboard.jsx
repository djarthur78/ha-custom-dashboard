/**
 * MusicDashboard Component
 * Main three-panel layout for the Music page.
 * Full viewport, no scrolling on the outer container.
 */

import { NowPlayingPanel } from './NowPlayingPanel';
import { PlaylistPanel } from './PlaylistPanel';
import { SpeakerPanel } from './SpeakerPanel';
import { useSonosSpeakers } from './hooks/useSonosSpeakers';
import { useActiveSpeaker } from './hooks/useActiveSpeaker';
import { usePlaybackControls } from './hooks/usePlaybackControls';
import { useSpeakerGroups } from './hooks/useSpeakerGroups';

export function MusicDashboard() {
  const { speakers, loading } = useSonosSpeakers();
  const { activeSpeaker, selectSpeaker } = useActiveSpeaker(speakers);
  const controls = usePlaybackControls();
  const groupControls = useSpeakerGroups();

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 56px)' }}>
        <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex gap-3 p-3" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Left: Now Playing (40%) */}
      <div className="flex-[40] min-h-0 min-w-0">
        <NowPlayingPanel speaker={activeSpeaker} controls={controls} />
      </div>

      {/* Center: Playlists / Queue (30%) */}
      <div className="flex-[30] min-h-0 min-w-0">
        <PlaylistPanel
          activeSpeaker={activeSpeaker}
          onPlayMedia={controls.playMedia}
          onNextTrack={controls.next}
        />
      </div>

      {/* Right: Speakers (30%) */}
      <div className="flex-[30] min-h-0 min-w-0">
        <SpeakerPanel
          speakers={speakers}
          activeSpeakerId={activeSpeaker?.entityId}
          onSelectSpeaker={selectSpeaker}
          onVolumeChange={controls.setVolume}
          groupControls={groupControls}
        />
      </div>
    </div>
  );
}
