/**
 * AreaCard Component
 * Displays a single irrigation area: zone status, soil moisture, last watered,
 * and manual watering trigger button.
 */

import { Droplets, Sprout, TreePine, Power, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useServiceCall } from '../../../hooks/useServiceCall';
import { getSoilMoistureColor, getMoistureStatus } from './lawnConfig';

export function AreaCard({ area, compact = false }) {
  const { turnOn, turnOff, loading } = useServiceCall();
  const { label, type, zoneStates, moistureReadings, avgMoisture, isActive, lastWatered, paired } = area;

  const moistureStatus = getMoistureStatus(avgMoisture);
  const Icon = type === 'lawn' ? TreePine : Sprout;

  const handleToggle = async () => {
    try {
      if (isActive) {
        // Stop all zones
        for (const zone of zoneStates) {
          if (zone.state === 'on') await turnOff(zone.id);
        }
      } else {
        // Start: for paired lawns, just turn on zone A (alternate manually)
        // For flowerbeds, turn on the single zone
        await turnOn(zoneStates[0].id);
      }
    } catch (err) {
      console.error('[AreaCard] Toggle failed:', err);
    }
  };

  const lastWateredText = lastWatered
    ? formatDistanceToNow(new Date(lastWatered), { addSuffix: true })
    : '--';

  return (
    <div
      className="ds-card"
      style={{
        padding: compact ? '12px' : '16px',
        borderLeft: `3px solid ${moistureStatus.color}`,
        background: isActive
          ? 'linear-gradient(135deg, rgba(74,154,74,0.06), rgba(74,154,74,0.02))'
          : 'var(--ds-card)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={compact ? 16 : 18} style={{ color: moistureStatus.color }} />
          <span className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-[var(--ds-text)]`}>
            {label}
          </span>
        </div>
        {isActive && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#4a9a4a' }} />
            <span className="text-xs font-medium" style={{ color: '#4a9a4a' }}>Active</span>
          </div>
        )}
      </div>

      {/* Moisture Readings */}
      <div className="flex gap-3 mb-3">
        {moistureReadings.map(sensor => (
          <div key={sensor.id} className="flex-1">
            <div className="text-[10px] uppercase tracking-wider text-[var(--ds-text-secondary)] mb-0.5">
              {sensor.label}
            </div>
            <div
              className={`${compact ? 'text-lg' : 'text-xl'} font-bold`}
              style={{ color: getSoilMoistureColor(sensor.value) }}
            >
              {sensor.value != null ? `${Math.round(sensor.value)}%` : '--'}
            </div>
          </div>
        ))}
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wider text-[var(--ds-text-secondary)] mb-0.5">
            Avg
          </div>
          <div
            className={`${compact ? 'text-lg' : 'text-xl'} font-bold`}
            style={{ color: moistureStatus.color }}
          >
            {avgMoisture != null ? `${Math.round(avgMoisture)}%` : '--'}
          </div>
          <div className="text-[10px] font-medium" style={{ color: moistureStatus.color }}>
            {moistureStatus.label}
          </div>
        </div>
      </div>

      {/* Zone Status + Last Watered */}
      <div className="flex items-center justify-between mb-3 text-xs text-[var(--ds-text-secondary)]">
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>Last: {lastWateredText}</span>
        </div>
        <div className="flex gap-2">
          {zoneStates.map(zone => (
            <span
              key={zone.id}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                backgroundColor: zone.state === 'on' ? 'rgba(74,154,74,0.15)' : 'rgba(156,163,175,0.15)',
                color: zone.state === 'on' ? '#4a9a4a' : '#9ca3af',
              }}
            >
              {zone.label}: {zone.state === 'on' ? 'ON' : 'OFF'}
            </span>
          ))}
        </div>
      </div>

      {/* Manual Trigger Button */}
      <button
        onClick={handleToggle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{
          backgroundColor: isActive ? 'rgba(181,69,58,0.1)' : 'rgba(74,154,74,0.1)',
          color: isActive ? '#b5453a' : '#4a9a4a',
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Power size={14} />
        {isActive ? 'Stop Watering' : 'Start Watering'}
        {paired && !isActive && (
          <span className="text-[10px] opacity-70">(Zone A)</span>
        )}
      </button>
    </div>
  );
}
