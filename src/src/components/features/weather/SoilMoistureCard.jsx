/**
 * SoilMoistureCard Component
 * Grouped soil moisture display: Lawn (4 probes) + Plants (4 probes)
 */

import { Sprout, TreePine } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { SOIL_MOISTURE, getSoilMoistureColor } from './weatherConfig';

function ProbeCell({ id, label }) {
  const entity = useEntity(id);
  const value = entity.state && entity.state !== 'unavailable' ? parseFloat(entity.state) : null;
  const color = getSoilMoistureColor(value);

  return (
    <div
      className="ds-card flex flex-col items-center justify-center gap-1"
      style={{
        padding: '8px',
        border: value != null ? `1px solid ${color}33` : '1px solid var(--ds-border)',
        backgroundColor: value != null ? `${color}08` : 'var(--ds-card)',
      }}
    >
      <span className="text-[10px] font-medium text-[var(--ds-text-secondary)]">{label}</span>
      {value != null ? (
        <span className="text-lg font-bold" style={{ color }}>{Math.round(value)}%</span>
      ) : (
        <span className="text-xs italic text-[var(--ds-text-secondary)]">--</span>
      )}
    </div>
  );
}

function ProbeGroup({ title, icon: Icon, probes }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={13} style={{ color: 'var(--ds-text-secondary)' }} />
        <span className="text-[11px] font-semibold text-[var(--ds-text-secondary)] uppercase tracking-wider">{title}</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {probes.map(({ id, label }) => (
          <ProbeCell key={id} id={id} label={label} />
        ))}
      </div>
    </div>
  );
}

export function SoilMoistureCard({ compact = false }) {
  return (
    <div className="ds-card" style={{ padding: compact ? '12px' : '16px' }}>
      <div className="flex items-center gap-2 mb-3">
        <Sprout size={16} style={{ color: 'var(--ds-text-secondary)' }} />
        <h3 className="text-xs font-semibold text-[var(--ds-text-secondary)] uppercase tracking-wider">Soil Moisture</h3>
      </div>
      <div className={compact ? 'flex gap-3' : 'grid grid-cols-2 gap-4'}>
        <ProbeGroup title="Lawn" icon={TreePine} probes={SOIL_MOISTURE.lawn} />
        <ProbeGroup title="Plant Beds" icon={Sprout} probes={SOIL_MOISTURE.plants} />
      </div>
    </div>
  );
}
