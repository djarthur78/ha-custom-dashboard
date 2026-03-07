/**
 * MetricCard Component
 * Clean metric display - no colored accent bars
 */

import { useEntity } from '../../../hooks/useEntity';

export function MetricCard({ entityId, label, unit = '', icon = null, format = null, yesterday = null }) {
  const { state, loading } = useEntity(entityId);
  const displayValue = loading ? '--' : format ? format(state) : (state ?? '--');

  return (
    <div className="rounded-lg p-3" style={{
      backgroundColor: 'rgba(0,0,0,0.02)',
      border: '1px solid rgba(0,0,0,0.06)',
    }}>
      <div className="flex items-center gap-1.5 mb-0.5">
        {icon && <span className="text-[var(--color-text-secondary)]">{icon}</span>}
        <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-lg font-black text-[var(--color-text)]" style={{ letterSpacing: '-0.5px' }}>
        {displayValue}
        {unit && <span className="text-xs font-medium text-[var(--color-text-secondary)] ml-1">{unit}</span>}
      </div>
      {yesterday != null && (
        <div className="text-[10px] text-[var(--color-text-secondary)]">
          yesterday: {yesterday}
        </div>
      )}
    </div>
  );
}

export function MetricRow({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {items.map(item => (
        <MetricCard key={item.entityId} {...item} />
      ))}
    </div>
  );
}

/**
 * ProgressMetric - metric with a visual progress bar
 */
export function ProgressMetric({ entityId, label, goal, unit = '', color = '#3b82f6', yesterday = null }) {
  const { state } = useEntity(entityId);
  const value = parseFloat(state) || 0;
  const pct = goal ? Math.min((value / goal) * 100, 100) : 0;
  const displayValue = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : Math.round(value);

  return (
    <div className="rounded-lg p-3" style={{
      backgroundColor: 'rgba(0,0,0,0.02)',
      border: '1px solid rgba(0,0,0,0.06)',
    }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          {label}
        </span>
        {goal && (
          <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">
            {Math.round(pct)}%
          </span>
        )}
      </div>
      <div className="text-lg font-black text-[var(--color-text)] mb-1" style={{ letterSpacing: '-0.5px' }}>
        {displayValue}
        {unit && <span className="text-xs font-medium text-[var(--color-text-secondary)] ml-1">{unit}</span>}
      </div>
      {yesterday != null && (
        <div className="text-[10px] text-[var(--color-text-secondary)] mb-1">
          yesterday: {yesterday}
        </div>
      )}
      {goal && (
        <div className="rounded-full overflow-hidden" style={{ height: 4, backgroundColor: `${color}15` }}>
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
export function HeroMetric({ entityId, label, unit = '', color = '#9f5644', icon = null, format = null }) {
  const { state, loading } = useEntity(entityId);
  const displayValue = loading ? '--' : format ? format(state) : (state ?? '--');

  return (
    <div className="rounded-lg p-3 text-center" style={{
      backgroundColor: `${color}08`,
      border: `1px solid ${color}15`,
    }}>
      {icon && (
        <div className="flex justify-center mb-1">
          <span style={{ color }}>{icon}</span>
        </div>
      )}
      <div className="text-2xl font-black mb-0.5" style={{ color, letterSpacing: '-1px' }}>
        {displayValue}
      </div>
      <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
        {label}
        {unit && <span className="ml-1 normal-case">{unit}</span>}
      </div>
    </div>
  );
}
