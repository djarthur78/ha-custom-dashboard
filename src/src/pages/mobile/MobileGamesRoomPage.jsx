/**
 * MobileGamesRoomPage
 * Vertical scroll layout: scenes, climate, power, now playing
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MobilePageContainer } from '../../components/mobile/MobilePageContainer';
import { SceneButtons } from '../../components/features/games-room/SceneButtons';
import { ClimateCard } from '../../components/features/games-room/ClimateCard';
import { PowerGrid } from '../../components/features/games-room/PowerGrid';
import { NowPlaying } from '../../components/features/games-room/NowPlaying';

export function MobileGamesRoomPage() {
  const [mediaExpanded, setMediaExpanded] = useState(false);

  return (
    <MobilePageContainer>
      <div className="space-y-3">
        {/* Scene Buttons */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ds-text-secondary)' }}>
            Scenes
          </h3>
          <SceneButtons />
        </div>

        {/* Climate */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ds-text-secondary)' }}>
            Climate
          </h3>
          <ClimateCard />
        </div>

        {/* Power Grid */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ds-text-secondary)' }}>
            Power
          </h3>
          <PowerGrid />
        </div>

        {/* Now Playing - Collapsible */}
        <div className="ds-card" style={{ padding: 0 }}>
          <button
            onClick={() => setMediaExpanded(!mediaExpanded)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ds-text-secondary)' }}>
              Now Playing
            </span>
            {mediaExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {mediaExpanded && (
            <div style={{ height: 300 }}>
              <NowPlaying />
            </div>
          )}
        </div>
      </div>
    </MobilePageContainer>
  );
}

export default MobileGamesRoomPage;
