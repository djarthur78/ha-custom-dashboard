/**
 * OverrideControls Component
 * Compact, inline temperature + duration override controls.
 * Collapsed: single button. Expanded: temp/duration/confirm row.
 * Active: countdown bar with cancel.
 */

import { useState } from 'react';
import { Flame, X, ChevronUp, ChevronDown, Timer } from 'lucide-react';
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
  const [expanded, setExpanded] = useState(false);
  const isActive = !!activeOverride;

  const handleConfirm = () => {
    onStart(overrideKey, rooms, temp, duration);
    setExpanded(false);
  };

  const formatTime = (tr) => {
    if (!tr) return '';
    const parts = [];
    if (tr.hours > 0) parts.push(`${tr.hours}h`);
    parts.push(`${tr.minutes}m`);
    if (tr.hours === 0) parts.push(`${tr.seconds}s`);
    return parts.join(' ');
  };

  // Active override — slim countdown bar
  if (isActive) {
    return (
      <div className="flex items-center gap-3 rounded-xl" style={{
        padding: compact ? '8px 12px' : '10px 16px',
        backgroundColor: 'rgba(181,69,58,0.08)',
        border: '1px solid rgba(181,69,58,0.2)',
      }}>
        <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: '#b5453a' }} />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-bold" style={{ color: '#b5453a' }}>
            {label}: {activeOverride.temp}°C
          </span>
          <span className="text-xs font-medium ml-2" style={{ color: 'rgba(181,69,58,0.7)' }}>
            {timeRemaining ? formatTime(timeRemaining) + ' left' : 'Expiring...'}
          </span>
        </div>
        <button
          onClick={() => onCancel(overrideKey)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
          style={{ backgroundColor: 'var(--ds-state-off)', color: 'white' }}
        >
          <X size={12} />
          Cancel
        </button>
      </div>
    );
  }

  // Collapsed — single trigger button
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center justify-between rounded-xl transition-all hover:shadow-sm"
        style={{
          padding: compact ? '10px 14px' : '12px 16px',
          backgroundColor: 'var(--ds-warm-inactive-bg)',
          border: '1px solid transparent',
        }}
      >
        <div className="flex items-center gap-2.5">
          <Flame size={compact ? 16 : 18} style={{ color: 'var(--ds-accent)' }} />
          <span className="text-sm font-bold" style={{ color: 'var(--ds-text)' }}>
            Override {label}
          </span>
        </div>
        <span className="text-xs font-medium" style={{ color: 'var(--ds-warm-inactive-text)' }}>
          {rooms.length} rooms
        </span>
      </button>
    );
  }

  // Expanded — inline controls
  return (
    <div className="rounded-xl" style={{
      padding: compact ? '10px 12px' : '12px 16px',
      backgroundColor: 'rgba(181,69,58,0.04)',
      border: '1px solid rgba(181,69,58,0.15)',
    }}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={compact ? 14 : 16} style={{ color: '#b5453a' }} />
          <span className="text-sm font-bold" style={{ color: 'var(--ds-text)' }}>
            Override {label}
          </span>
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="text-xs font-medium px-2 py-1 rounded-lg transition-colors hover:opacity-70"
          style={{ color: 'var(--ds-text-secondary)' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Controls row — temp + duration inline */}
      <div className="flex items-center gap-3 mb-3">
        {/* Temperature */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTemp(t => Math.max(18, t - 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-colors hover:opacity-80"
            style={{ backgroundColor: 'rgba(181,69,58,0.1)', color: 'var(--ds-accent)' }}
          >
            <ChevronDown size={16} />
          </button>
          <div className="w-12 text-center">
            <span className="text-xl font-bold" style={{ color: 'var(--ds-text)' }}>{temp}°</span>
          </div>
          <button
            onClick={() => setTemp(t => Math.min(28, t + 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-colors hover:opacity-80"
            style={{ backgroundColor: 'rgba(181,69,58,0.1)', color: 'var(--ds-accent)' }}
          >
            <ChevronUp size={16} />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6" style={{ backgroundColor: 'var(--ds-border)' }} />

        {/* Duration pills */}
        <div className="flex items-center gap-1">
          <Timer size={12} style={{ color: 'var(--ds-text-secondary)' }} className="mr-1" />
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

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={loading || rooms.length === 0}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm
                   disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90"
        style={{ backgroundColor: 'var(--ds-accent)', color: 'white' }}
      >
        <Flame size={14} />
        Heat {rooms.length} rooms to {temp}° for {duration}h
      </button>
    </div>
  );
}
