/**
 * SystemHealth Component
 * Service status checks + Mac Mini resource gauges
 */

import { Server, AlertCircle } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { ALFRED_SERVICES, ALFRED_SYSTEM, getResourceColor } from './alfredConfig';

function ServiceRow({ label, entityId }) {
  const { state } = useEntity(entityId);
  const isOn = state === 'on';
  const isUnavailable = !state || state === 'unavailable' || state === 'unknown';

  return (
    <div className="flex items-center gap-2" style={{ height: '28px' }}>
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          backgroundColor: isUnavailable
            ? 'var(--ds-text-secondary)'
            : isOn
              ? 'var(--ds-state-on)'
              : 'var(--ds-state-off)',
        }}
      />
      <span className="text-sm" style={{ color: 'var(--ds-text)' }}>{label}</span>
      {isUnavailable && (
        <span className="text-xs ml-auto" style={{ color: 'var(--ds-text-secondary)' }}>--</span>
      )}
    </div>
  );
}

function ResourceGauge({ label, entityId }) {
  const { state } = useEntity(entityId);
  const pct = state != null && state !== 'unavailable' ? parseFloat(state) : null;
  const color = getResourceColor(pct);
  const isAvailable = pct != null && !isNaN(pct);

  return (
    <div className="flex items-center gap-2">
      <div className="w-10 text-xs font-medium" style={{ color: 'var(--ds-text-secondary)' }}>
        {label}
      </div>
      <div
        className="flex-1 h-3 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--ds-warm-inactive-bg)' }}
      >
        {isAvailable && (
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(pct, 100)}%`,
              backgroundColor: color,
              transition: 'width 0.7s ease-out',
            }}
          />
        )}
      </div>
      <div
        className="w-10 text-xs font-semibold text-right"
        style={{ color: isAvailable ? color : 'var(--ds-text-secondary)' }}
      >
        {isAvailable ? `${Math.round(pct)}%` : '--'}
      </div>
    </div>
  );
}

export function SystemHealth() {
  return (
    <div className="ds-card h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Server size={16} style={{ color: 'var(--ds-accent)' }} />
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--ds-text-secondary)' }}
        >
          System Health
        </span>
      </div>

      {/* Services */}
      <div className="flex flex-col gap-0.5 mb-4">
        {ALFRED_SERVICES.map(({ key, label, entityId }) => (
          <ServiceRow key={key} label={label} entityId={entityId} />
        ))}
      </div>

      {/* Resources divider */}
      <div
        className="text-xs font-semibold uppercase tracking-wider mb-2 pt-3"
        style={{
          color: 'var(--ds-text-secondary)',
          borderTop: '1px solid var(--ds-border)',
        }}
      >
        Mac Mini
      </div>

      {/* Resource Gauges */}
      <div className="flex flex-col gap-2">
        <ResourceGauge label="CPU" entityId={ALFRED_SYSTEM.cpu} />
        <ResourceGauge label="RAM" entityId={ALFRED_SYSTEM.ram} />
        <ResourceGauge label="Disk" entityId={ALFRED_SYSTEM.disk} />
      </div>
    </div>
  );
}
