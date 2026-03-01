/**
 * MetricCard Component
 * Reusable card for displaying a metric with label and value
 */

import { useEntity } from '../../../hooks/useEntity';

export function MetricCard({ entityId, label, unit = '', icon = null, format = null }) {
  const { state, loading } = useEntity(entityId);

  const displayValue = loading ? '--' : format ? format(state) : (state ?? '--');

  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-4" style={{
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-[var(--color-text-secondary)]">{icon}</span>}
        <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-[var(--color-text)]">
        {displayValue}{unit && <span className="text-sm font-normal text-[var(--color-text-secondary)] ml-1">{unit}</span>}
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
