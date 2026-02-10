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
      className="flex flex-col gap-3 p-3"
      style={{ height: 'calc(100vh - 56px)' }}
    >
      {/* Now Playing — hero, top 55% */}
      <div className="flex-[55] min-h-0">
        <NowPlaying />
      </div>

      {/* Controls — bottom 45%, 3 columns */}
      <div className="flex-[45] min-h-0 grid grid-cols-[30fr_30fr_40fr] gap-3">
        <SceneButtons />
        <ClimateCard />
        <PowerGrid />
      </div>
    </div>
  );
}
