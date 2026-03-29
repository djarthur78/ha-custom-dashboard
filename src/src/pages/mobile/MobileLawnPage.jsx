/**
 * MobileLawnPage
 * Single-column vertical scroll lawn & flowerbeds display
 */

import { Droplets, TreePine, Sprout } from 'lucide-react';
import { MobilePageContainer } from '../../components/mobile/MobilePageContainer';
import { useLawnData } from '../../components/features/lawn/hooks/useLawnData';
import { getMoistureStatus, getSoilMoistureColor } from '../../components/features/lawn/lawnConfig';
import { AreaCard } from '../../components/features/lawn/AreaCard';
import { WeekendForecast } from '../../components/features/lawn/WeekendForecast';
import { WeekendPlanCard } from '../../components/features/lawn/WeekendPlanCard';

export function MobileLawnPage() {
  const {
    lawnAreas,
    bedAreas,
    overallAvgMoisture,
    lawnAvg,
    bedAvg,
    activeZoneCount,
    dryAreaCount,
  } = useLawnData();

  const moistureStatus = getMoistureStatus(overallAvgMoisture);

  return (
    <MobilePageContainer>
      <div className="space-y-3">
        {/* Compact Status Card */}
        <div className="ds-card" style={{ padding: '12px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Droplets size={28} style={{ color: moistureStatus.color }} />
              <div>
                <div className="text-2xl font-bold" style={{ color: moistureStatus.color }}>
                  {overallAvgMoisture != null ? `${Math.round(overallAvgMoisture)}%` : '--'}
                </div>
                <div className="text-xs text-[var(--ds-text-secondary)]">
                  {moistureStatus.label}
                </div>
              </div>
            </div>

            <div className="flex gap-3 text-center">
              <div>
                <div className="text-xs text-[var(--ds-text-secondary)]">
                  <TreePine size={10} className="inline" /> Lawn
                </div>
                <div className="text-sm font-bold" style={{ color: getSoilMoistureColor(lawnAvg) }}>
                  {lawnAvg != null ? `${Math.round(lawnAvg)}%` : '--'}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--ds-text-secondary)]">
                  <Sprout size={10} className="inline" /> Beds
                </div>
                <div className="text-sm font-bold" style={{ color: getSoilMoistureColor(bedAvg) }}>
                  {bedAvg != null ? `${Math.round(bedAvg)}%` : '--'}
                </div>
              </div>
            </div>
          </div>

          {/* Status row */}
          <div className="flex items-center gap-3 mt-2 text-xs">
            {activeZoneCount > 0 ? (
              <span className="flex items-center gap-1" style={{ color: '#4a9a4a' }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#4a9a4a' }} />
                {activeZoneCount} zone{activeZoneCount !== 1 ? 's' : ''} running
              </span>
            ) : (
              <span className="text-[#9ca3af]">All zones off</span>
            )}
            {dryAreaCount > 0 && (
              <span style={{ color: '#d4944c' }}>
                {dryAreaCount} area{dryAreaCount !== 1 ? 's' : ''} need{dryAreaCount === 1 ? 's' : ''} water
              </span>
            )}
          </div>
        </div>

        {/* Weekend Forecast */}
        <WeekendForecast compact />

        {/* Lawn Areas */}
        <h3 className="text-xs font-semibold text-[var(--ds-text-secondary)] uppercase tracking-wider px-1">
          <TreePine size={12} className="inline mr-1" />Lawn
        </h3>
        {lawnAreas.map(area => (
          <AreaCard key={area.key} area={area} compact />
        ))}

        {/* Flower Bed Areas */}
        <h3 className="text-xs font-semibold text-[var(--ds-text-secondary)] uppercase tracking-wider px-1">
          <Sprout size={12} className="inline mr-1" />Flower Beds
        </h3>
        {bedAreas.map(area => (
          <AreaCard key={area.key} area={area} compact />
        ))}

        {/* Weekend Plan */}
        <WeekendPlanCard compact />
      </div>
    </MobilePageContainer>
  );
}

export default MobileLawnPage;
