/**
 * WindCard Component
 * Wind speed, direction, and gust display
 */

import { Wind } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { WIND, getWindColor } from './weatherConfig';

function getWindDirection(degrees) {
  if (degrees == null) return '--';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(degrees / 22.5) % 16];
}

export function WindCard() {
  const speed = useEntity(WIND.speed);
  const direction = useEntity(WIND.direction);
  const gust = useEntity(WIND.gust);

  const speedVal = speed.state && speed.state !== 'unavailable' ? parseFloat(speed.state) : null;
  const dirVal = direction.state && direction.state !== 'unavailable' ? parseFloat(direction.state) : null;
  const gustVal = gust.state && gust.state !== 'unavailable' ? parseFloat(gust.state) : null;

  const anyAvailable = speedVal != null || dirVal != null || gustVal != null;

  return (
    <div className="ds-card h-full flex flex-col" style={{ padding: '16px' }}>
      <div className="flex items-center gap-2 mb-3">
        <Wind size={16} style={{ color: 'var(--ds-text-secondary)' }} />
        <h3 className="text-xs font-semibold text-[var(--ds-text-secondary)] uppercase tracking-wider">Wind</h3>
      </div>

      {anyAvailable ? (
        <div className="flex-1 flex flex-col justify-center gap-3">
          <div>
            <div className="text-xs text-[var(--ds-text-secondary)]">Speed</div>
            <div className="text-2xl font-bold" style={{ color: getWindColor(speedVal) }}>
              {speedVal != null ? `${speedVal.toFixed(1)} km/h` : '--'}
            </div>
          </div>
          <div className="flex gap-4">
            <div>
              <div className="text-xs text-[var(--ds-text-secondary)]">Direction</div>
              <div className="text-lg font-semibold text-[var(--ds-text)]">
                {dirVal != null ? `${getWindDirection(dirVal)} (${Math.round(dirVal)}°)` : '--'}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--ds-text-secondary)]">Gust</div>
              <div className="text-lg font-semibold" style={{ color: getWindColor(gustVal) }}>
                {gustVal != null ? `${gustVal.toFixed(1)} km/h` : '--'}
              </div>
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
