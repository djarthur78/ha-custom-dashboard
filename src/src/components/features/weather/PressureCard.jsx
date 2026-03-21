/**
 * PressureCard Component
 * Barometric pressure display (for mobile — desktop shows in CurrentConditions)
 */

import { Gauge } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { PRESSURE } from './weatherConfig';

export function PressureCard() {
  const relative = useEntity(PRESSURE.relative);

  const relVal = relative.state && relative.state !== 'unavailable' ? parseFloat(relative.state) : null;

  return (
    <div className="ds-card h-full flex flex-col" style={{ padding: '16px' }}>
      <div className="flex items-center gap-2 mb-3">
        <Gauge size={16} style={{ color: 'var(--ds-text-secondary)' }} />
        <h3 className="text-xs font-semibold text-[var(--ds-text-secondary)] uppercase tracking-wider">Pressure</h3>
      </div>

      {relVal != null ? (
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-3xl font-bold text-[var(--ds-text)]">
            {relVal.toFixed(0)}
          </div>
          <div className="text-sm text-[var(--ds-text-secondary)]">hPa</div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm italic text-[var(--ds-text-secondary)]">Awaiting sensor</span>
        </div>
      )}
    </div>
  );
}
