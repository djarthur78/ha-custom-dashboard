/**
 * AreaCard Component
 * Displays a single irrigation area: zone status, soil moisture, last watered,
 * duration picker, and timed watering trigger with countdown.
 */

import { useState, useEffect } from 'react';
import { Sprout, TreePine, Power, Clock, Timer } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getSoilMoistureColor, getMoistureStatus, WATERING_DURATIONS, DEFAULT_DURATION } from './lawnConfig';

export function AreaCard({ area, compact = false, timer }) {
  const { label, type, key: areaKey, zoneStates, moistureReadings, avgMoisture, isActive, lastWatered, paired } = area;
  const { startWatering, stopWatering, checkMoistureHardStop, getTimeRemaining, isRunning, loading } = timer;

  const [selectedDuration, setSelectedDuration] = useState(DEFAULT_DURATION[type]);
  const durations = WATERING_DURATIONS[type];

  const timerActive = isRunning(areaKey);
  const timeRemaining = getTimeRemaining(areaKey);

  const moistureStatus = getMoistureStatus(avgMoisture);
  const Icon = type === 'lawn' ? TreePine : Sprout;

  // Check moisture hard stop while running
  useEffect(() => {
    if (timerActive) {
      checkMoistureHardStop(areaKey, avgMoisture);
    }
  }, [timerActive, areaKey, avgMoisture, checkMoistureHardStop]);

  const handleStart = () => {
    const zoneIds = zoneStates.map(z => z.id);
    startWatering(areaKey, zoneIds, selectedDuration, paired);
  };

  const handleStop = () => {
    stopWatering(areaKey);
  };

  const lastWateredText = lastWatered
    ? formatDistanceToNow(new Date(lastWatered), { addSuffix: true })
    : '--';

  const formatCountdown = (tr) => {
    if (!tr) return '';
    return `${tr.minutes}:${String(tr.seconds).padStart(2, '0')}`;
  };

  return (
    <div
      className="ds-card"
      style={{
        padding: compact ? '12px' : '16px',
        borderLeft: `3px solid ${moistureStatus.color}`,
        background: (isActive || timerActive)
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
        {timerActive && timeRemaining ? (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#4a9a4a' }} />
            <Timer size={12} style={{ color: '#4a9a4a' }} />
            <span className="text-xs font-bold tabular-nums" style={{ color: '#4a9a4a' }}>
              {formatCountdown(timeRemaining)}
            </span>
            {paired && timeRemaining.phase && (
              <span className="text-[10px] font-medium" style={{ color: '#4a9a4a' }}>
                Zone {timeRemaining.phase}
              </span>
            )}
          </div>
        ) : isActive ? (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#d4944c' }} />
            <span className="text-xs font-medium" style={{ color: '#d4944c' }}>Running (no timer)</span>
          </div>
        ) : null}
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

      {/* Duration Picker + Trigger */}
      {timerActive ? (
        <button
          onClick={handleStop}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'rgba(181,69,58,0.1)',
            color: '#b5453a',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Power size={14} />
          Stop Watering
        </button>
      ) : (
        <div className="flex gap-2">
          {/* Duration pills */}
          <div className="flex gap-1 flex-1">
            {durations.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDuration(d)}
                className="flex-1 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{
                  backgroundColor: selectedDuration === d ? 'rgba(74,154,74,0.15)' : 'rgba(156,163,175,0.08)',
                  color: selectedDuration === d ? '#4a9a4a' : 'var(--ds-text-secondary)',
                  border: selectedDuration === d ? '1px solid rgba(74,154,74,0.3)' : '1px solid transparent',
                }}
              >
                {d}m
              </button>
            ))}
          </div>
          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={loading || isActive}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'rgba(74,154,74,0.1)',
              color: '#4a9a4a',
              opacity: (loading || isActive) ? 0.5 : 1,
            }}
          >
            <Power size={14} />
            Start
          </button>
        </div>
      )}
    </div>
  );
}
