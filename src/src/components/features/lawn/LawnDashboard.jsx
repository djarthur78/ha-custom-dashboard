/**
 * LawnDashboard Component
 * Full viewport lawn & flowerbeds page — left hero panel + right area grid
 * Mirrors the HeatingDashboard layout pattern.
 */

import { Droplets, TreePine, Sprout } from 'lucide-react';
import { useLawnData } from './hooks/useLawnData';
import { useWateringTimer } from './hooks/useWateringTimer';
import { getMoistureStatus, getSoilMoistureColor } from './lawnConfig';
import { AreaCard } from './AreaCard';
import { WeekendForecast } from './WeekendForecast';
import { WeekendPlanCard } from './WeekendPlanCard';

export function LawnDashboard() {
  const {
    lawnAreas,
    bedAreas,
    overallAvgMoisture,
    lawnAvg,
    bedAvg,
    activeZoneCount,
    dryAreaCount,
  } = useLawnData();

  const timer = useWateringTimer();

  const moistureStatus = getMoistureStatus(overallAvgMoisture);
  const moistureColor = getSoilMoistureColor(overallAvgMoisture);

  return (
    <div className="flex gap-3 p-3" style={{ height: 'calc(100vh - 72px)' }}>
      {/* Left: Hero Display (30%) */}
      <div className="flex-[30] min-h-0">
        <div
          className="ds-card h-full flex flex-col items-center text-center"
          style={{
            background: dryAreaCount > 0
              ? 'linear-gradient(135deg, rgba(212,148,76,0.06), rgba(212,148,76,0.02))'
              : 'var(--ds-card)',
          }}
        >
          {/* Average Moisture Hero */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <Droplets size={48} style={{ color: moistureColor }} className="mb-2" />
            <div className="text-[96px] font-bold leading-none mb-1" style={{ color: moistureColor }}>
              {overallAvgMoisture != null ? `${Math.round(overallAvgMoisture)}%` : '--'}
            </div>
            <div className="text-lg font-medium text-[var(--color-text-secondary)] mb-1">
              Overall Moisture
            </div>
            <div className="text-sm font-semibold mb-4" style={{ color: moistureStatus.color }}>
              {moistureStatus.label}
            </div>

            {/* Status */}
            <div className="flex flex-col items-center gap-3">
              {activeZoneCount > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#4a9a4a' }} />
                  <span className="text-lg font-bold" style={{ color: '#4a9a4a' }}>
                    {activeZoneCount} zone{activeZoneCount !== 1 ? 's' : ''} running
                  </span>
                </div>
              ) : (
                <span className="text-lg font-bold text-[#9ca3af]">All zones off</span>
              )}

              {dryAreaCount > 0 && (
                <div
                  className="flex items-center gap-2 px-3 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(212,148,76,0.12)' }}
                >
                  <span className="text-sm font-medium" style={{ color: '#d4944c' }}>
                    {dryAreaCount} area{dryAreaCount !== 1 ? 's' : ''} need{dryAreaCount === 1 ? 's' : ''} watering
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom stats — Lawn avg, Beds avg */}
          <div className="w-full flex-shrink-0 pt-4 mt-4" style={{ borderTop: '1px solid var(--ds-border)' }}>
            <div className="flex justify-around px-4 text-sm mb-4">
              <div className="text-center">
                <div className="text-xs text-[var(--ds-text-secondary)] uppercase tracking-wider mb-1">
                  <TreePine size={10} className="inline mr-0.5" />Lawn
                </div>
                <div className="text-lg font-bold" style={{ color: getSoilMoistureColor(lawnAvg) }}>
                  {lawnAvg != null ? `${Math.round(lawnAvg)}%` : '--'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-[var(--ds-text-secondary)] uppercase tracking-wider mb-1">
                  <Sprout size={10} className="inline mr-0.5" />Beds
                </div>
                <div className="text-lg font-bold" style={{ color: getSoilMoistureColor(bedAvg) }}>
                  {bedAvg != null ? `${Math.round(bedAvg)}%` : '--'}
                </div>
              </div>
            </div>

            {/* Compact Weekend Forecast */}
            <WeekendForecast compact />
          </div>
        </div>
      </div>

      {/* Right: Area Grid + Plan (70%) */}
      <div className="flex-[70] min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-3">
          {/* Lawn Section */}
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider px-1">
            <TreePine size={14} className="inline mr-1" />Lawn
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {lawnAreas.map(area => (
              <AreaCard key={area.key} area={area} timer={timer} />
            ))}
          </div>

          {/* Flower Beds Section */}
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider px-1 mt-1">
            <Sprout size={14} className="inline mr-1" />Flower Beds
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {bedAreas.map(area => (
              <AreaCard key={area.key} area={area} timer={timer} />
            ))}
          </div>

          {/* Weekend Plan */}
          <WeekendPlanCard />
        </div>
      </div>
    </div>
  );
}
