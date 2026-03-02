/**
 * MetricCard Component
 * Enhanced metric display with colored accent and visual hierarchy
 */

import { useEntity } from '../../../hooks/useEntity';

export function MetricCard({ entityId, label, unit = '', icon = null, format = null, accent = null }) {
  const { state, loading } = useEntity(entityId);

  const displayValue = loading ? '--' : format ? format(state) : (state ?? '--');

  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden"
      style={{
        backgroundColor: accent ? `${accent}08` : 'rgba(0,0,0,0.02)',
        border: accent ? `1px solid ${accent}20` : '1px solid rgba(0,0,0,0.04)',
      }}
    >
      {accent && (
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{ width: 3, backgroundColor: accent, borderRadius: '0 2px 2px 0' }}
        />
      )}
      <div className="flex items-center gap-2 mb-1">
        {icon && <span style={{ color: accent || 'var(--color-text-secondary)' }}>{icon}</span>}
        <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-2xl font-black text-[var(--color-text)]" style={{ letterSpacing: '-0.5px' }}>
        {displayValue}
        {unit && <span className="text-sm font-medium text-[var(--color-text-secondary)] ml-1">{unit}</span>}
      </div>
    </div>
  );
}

export function MetricRow({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map(item => (
        <MetricCard key={item.entityId} {...item} />
      ))}
    </div>
  );
}

/**
 * ProgressMetric - metric with a visual progress bar
 */
export function ProgressMetric({ entityId, label, goal, unit = '', color = '#3b82f6' }) {
  const { state } = useEntity(entityId);
  const value = parseFloat(state) || 0;
  const pct = goal ? Math.min((value / goal) * 100, 100) : 0;
  const displayValue = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : Math.round(value);

  return (
    <div className="rounded-xl p-4" style={{
      backgroundColor: `${color}08`,
      border: `1px solid ${color}15`,
    }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          {label}
        </span>
        {goal && (
          <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">
            {Math.round(pct)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-black text-[var(--color-text)] mb-2" style={{ letterSpacing: '-0.5px' }}>
        {displayValue}
        {unit && <span className="text-sm font-medium text-[var(--color-text-secondary)] ml-1">{unit}</span>}
      </div>
      {goal && (
        <div className="rounded-full overflow-hidden" style={{ height: 6, backgroundColor: `${color}15` }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * HeroMetric - large featured metric display
 */
export function HeroMetric({ entityId, label, unit = '', color = '#ef4444', icon = null, format = null }) {
  const { state, loading } = useEntity(entityId);
  const displayValue = loading ? '--' : format ? format(state) : (state ?? '--');

  return (
    <div className="rounded-2xl p-5 text-center relative overflow-hidden" style={{
      background: `linear-gradient(135deg, ${color}12, ${color}06)`,
      border: `1px solid ${color}20`,
    }}>
      {icon && (
        <div className="flex justify-center mb-2">
          <span style={{ color }}>{icon}</span>
        </div>
      )}
      <div className="text-4xl font-black mb-1" style={{ color, letterSpacing: '-1px' }}>
        {displayValue}
      </div>
      <div className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
        {label}
        {unit && <span className="ml-1 normal-case">{unit}</span>}
      </div>
    </div>
  );
}
