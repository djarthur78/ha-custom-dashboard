/**
 * MobileMusicPage
 * Top: compact now playing, Bottom: tabbed playlists/queue/speakers
 */

import { useState } from 'react';
import { MobileTabSwitcher } from '../../components/mobile/MobileTabSwitcher';
import { MobileNowPlaying } from '../../components/features/music/MobileNowPlaying';
import { PlaylistPanel } from '../../components/features/music/PlaylistPanel';
import { SpeakerPanel } from '../../components/features/music/SpeakerPanel';
import { useSonosSpeakers } from '../../components/features/music/hooks/useSonosSpeakers';
import { useActiveSpeaker } from '../../components/features/music/hooks/useActiveSpeaker';
import { usePlaybackControls } from '../../components/features/music/hooks/usePlaybackControls';
import { useSpeakerGroups } from '../../components/features/music/hooks/useSpeakerGroups';

const tabs = [
  { id: 'playlists', label: 'Playlists' },
  { id: 'queue', label: 'Queue' },
  { id: 'speakers', label: 'Speakers' },
];

export function MobileMusicPage() {
  const { speakers, loading } = useSonosSpeakers();
  const { activeSpeaker, selectSpeaker } = useActiveSpeaker(speakers);
  const controls = usePlaybackControls();
  const groupControls = useSpeakerGroups();
  const [activeTab, setActiveTab] = useState('playlists');

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 300 }}>
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#e2e2e6', borderTopColor: 'var(--ds-accent)' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 44px - 56px)' }}>
      {/* Now Playing - top */}
      <div className="flex-shrink-0 border-b" style={{ borderColor: 'var(--ds-border)' }}>
        <MobileNowPlaying speaker={activeSpeaker} controls={controls} />
      </div>

      {/* Tab Switcher */}
      <MobileTabSwitcher tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content - scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'playlists' && (
          <div className="h-full">
            <PlaylistPanel
              activeSpeaker={activeSpeaker}
              onPlayMedia={controls.playMedia}
              onNextTrack={controls.next}
            />
          </div>
        )}

        {activeTab === 'speakers' && (
          <div className="h-full">
            <SpeakerPanel
              speakers={speakers}
              activeSpeakerId={activeSpeaker?.entityId}
              onSelectSpeaker={selectSpeaker}
              onVolumeChange={controls.setVolume}
              groupControls={groupControls}
            />
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="h-full">
            <PlaylistPanel
              activeSpeaker={activeSpeaker}
              onPlayMedia={controls.playMedia}
              onNextTrack={controls.next}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileMusicPage;
