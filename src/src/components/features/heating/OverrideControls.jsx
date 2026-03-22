/**
 * OverrideControls Component
 * Temperature + duration selector for heating override.
 * Shows active override countdown with cancel button.
 */

import { useState } from 'react';
import { Flame, X, Check } from 'lucide-react';
import { DEFAULT_OVERRIDE_TEMP, DURATION_OPTIONS } from './heatingConfig';

export function OverrideControls({
  label,
  overrideKey,
  rooms,
  activeOverride,
  timeRemaining,
  onStart,
  onCancel,
  loading,
  compact,
}) {
  const [temp, setTemp] = useState(DEFAULT_OVERRIDE_TEMP);
  const [duration, setDuration] = useState(2);
  const isActive = !!activeOverride;

  const handleConfirm = () => {
    onStart(overrideKey, rooms, temp, duration);
  };

  const formatTime = (tr) => {
    if (!tr) return '';
    const parts = [];
    if (tr.hours > 0) parts.push(`${tr.hours}h`);
    parts.push(`${tr.minutes}m`);
    if (tr.hours === 0) parts.push(`${tr.seconds}s`);
    return parts.join(' ');
  };

  if (isActive) {
    return (
      <div className="ds-card flex items-center justify-between" style={{
        padding: compact ? '10px 12px' : '12px 16px',
        backgroundColor: 'rgba(181,69,58,0.06)',
        border: '1px solid rgba(181,69,58,0.2)',
      }}>
        <div className="flex items-center gap-2">
          <Flame size={compact ? 16 : 18} style={{ color: '#b5453a' }} />
          <div>
            <div className="text-xs font-bold text-[var(--ds-text)]">
              {label} Override: {activeOverride.temp}°C
            </div>
            <div className="text-[10px] font-medium" style={{ color: '#b5453a' }}>
              {timeRemaining ? formatTime(timeRemaining) : 'Expiring...'}
            </div>
          </div>
        </div>
        <button
          onClick={() => onCancel(overrideKey)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{ backgroundColor: 'var(--ds-state-off)', color: 'white' }}
        >
          <X size={14} />
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="ds-card" style={{ padding: compact ? '10px' : '14px' }}>
      <div className="flex items-center gap-2 mb-2">
        <Flame size={compact ? 14 : 16} style={{ color: '#b5453a' }} />
        <span className="text-xs font-bold text-[var(--ds-text)]">{label}</span>
      </div>

      {/* Temp selector */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-[var(--ds-text-secondary)] uppercase tracking-wider">Temp</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTemp(t => Math.max(18, t - 1))}
            className="w-7 h-7 rounded-lg font-bold text-sm transition-colors"
            style={{ backgroundColor: 'rgba(181,69,58,0.1)', color: 'var(--ds-accent)' }}
          >
            -
          </button>
          <span className="text-lg font-bold text-[var(--ds-text)] w-10 text-center">{temp}°</span>
          <button
            onClick={() => setTemp(t => Math.min(28, t + 1))}
            className="w-7 h-7 rounded-lg font-bold text-sm transition-colors"
            style={{ backgroundColor: 'rgba(181,69,58,0.1)', color: 'var(--ds-accent)' }}
          >
            +
          </button>
        </div>
      </div>

      {/* Duration selector */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-[var(--ds-text-secondary)] uppercase tracking-wider">Duration</span>
        <div className="flex gap-1.5">
          {DURATION_OPTIONS.map((h) => (
            <button
              key={h}
              onClick={() => setDuration(h)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
              style={{
                backgroundColor: duration === h ? 'var(--ds-accent)' : 'var(--ds-warm-inactive-bg)',
                color: duration === h ? 'white' : 'var(--ds-warm-inactive-text)',
              }}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={loading || rooms.length === 0}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm
                   disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        style={{ backgroundColor: 'var(--ds-accent)', color: 'white' }}
      >
        <Check size={16} />
        Override {rooms.length} room{rooms.length !== 1 ? 's' : ''} to {temp}° for {duration}h
      </button>
    </div>
  );
}
