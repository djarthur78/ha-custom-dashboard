/**
 * AlfredDashboard Component
 * Full viewport Alfred Command Centre — left hero + right operations grid
 * Mirrors LawnDashboard/HeatingDashboard layout pattern.
 */

import { StatusHero } from './StatusHero';
import { CronTable } from './CronTable';
import { ChannelActivity } from './ChannelActivity';
import { SystemHealth } from './SystemHealth';

export function AlfredDashboard() {
  return (
    <div className="flex gap-3 p-3" style={{ height: 'calc(100vh - 72px)' }}>
      {/* Left: Status Hero (30%) */}
      <div className="flex-[30] min-h-0">
        <StatusHero />
      </div>

      {/* Right: Operations Grid (70%) */}
      <div className="flex-[70] min-h-0 flex flex-col gap-3">
        {/* Top: Cron Monitor — full width, 55% height */}
        <div className="flex-[55] min-h-0">
          <CronTable />
        </div>

        {/* Bottom: 2-column split, 45% height */}
        <div className="flex-[45] min-h-0 flex gap-3">
          <div className="flex-1 min-h-0">
            <ChannelActivity />
          </div>
          <div className="flex-1 min-h-0">
            <SystemHealth />
          </div>
        </div>
      </div>
    </div>
  );
}
