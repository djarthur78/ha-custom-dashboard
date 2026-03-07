/**
 * GamesRoomDashboard
 * Main layout for the Games Room page.
 * Full-width, fills viewport below header. No scrolling.
 */

import { NowPlaying } from './NowPlaying';
import { SceneButtons } from './SceneButtons';
import { ClimateCard } from './ClimateCard';
import { PowerGrid } from './PowerGrid';

export function GamesRoomDashboard() {
  return (
    <div
      className="flex gap-3 p-3"
      style={{ height: 'calc(100vh - 72px)' }}
    >
      {/* Left: Now Playing — full height, 60% */}
      <div className="flex-[60] min-h-0">
        <NowPlaying />
      </div>

      {/* Right: Controls stacked — 40% */}
      <div className="flex-[40] flex flex-col gap-3 min-h-0">
        <SceneButtons />
        <ClimateCard />
        <PowerGrid />
      </div>
    </div>
  );
}
