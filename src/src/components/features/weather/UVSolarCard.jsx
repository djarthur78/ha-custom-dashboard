/**
 * UVSolarCard Component
 * UV index and solar radiation display
 */

import { Sun } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { UV_SOLAR, getUVColor } from './weatherConfig';

function getUVLabel(uv) {
  if (uv == null) return '';
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  if (uv < 11) return 'Very High';
  return 'Extreme';
}

export function UVSolarCard() {
  const uv = useEntity(UV_SOLAR.uv);
  const solar = useEntity(UV_SOLAR.solar);

  const uvVal = uv.state && uv.state !== 'unavailable' ? parseFloat(uv.state) : null;
  const solarVal = solar.state && solar.state !== 'unavailable' ? parseFloat(solar.state) : null;

  const anyAvailable = uvVal != null || solarVal != null;

  return (
    <div className="ds-card h-full flex flex-col" style={{ padding: '16px' }}>
      <div className="flex items-center gap-2 mb-3">
        <Sun size={16} style={{ color: 'var(--ds-text-secondary)' }} />
        <h3 className="text-xs font-semibold text-[var(--ds-text-secondary)] uppercase tracking-wider">UV / Solar</h3>
      </div>

      {anyAvailable ? (
        <div className="flex-1 flex flex-col justify-center gap-3">
          <div>
            <div className="text-xs text-[var(--ds-text-secondary)]">UV Index</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold" style={{ color: getUVColor(uvVal) }}>
                {uvVal != null ? uvVal.toFixed(1) : '--'}
              </span>
              {uvVal != null && (
                <span className="text-sm font-medium" style={{ color: getUVColor(uvVal) }}>{getUVLabel(uvVal)}</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--ds-text-secondary)]">Solar Radiation</div>
            <div className="text-lg font-semibold text-[var(--ds-text)]">
              {solarVal != null ? `${solarVal.toFixed(0)} W/m²` : '--'}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm italic text-[var(--ds-text-secondary)]">Awaiting sensor</span>
        </div>
      )}
    </div>
  );
}
