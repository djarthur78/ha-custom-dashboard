/**
 * RainCard Component
 * Rain rate, daily, and monthly totals
 */

import { CloudRain } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { RAIN } from './weatherConfig';

export function RainCard() {
  const rate = useEntity(RAIN.rate);
  const daily = useEntity(RAIN.daily);
  const monthly = useEntity(RAIN.monthly);

  const rateVal = rate.state && rate.state !== 'unavailable' ? parseFloat(rate.state) : null;
  const dailyVal = daily.state && daily.state !== 'unavailable' ? parseFloat(daily.state) : null;
  const monthlyVal = monthly.state && monthly.state !== 'unavailable' ? parseFloat(monthly.state) : null;

  const anyAvailable = rateVal != null || dailyVal != null || monthlyVal != null;

  return (
    <div className="ds-card h-full flex flex-col" style={{ padding: '16px' }}>
      <div className="flex items-center gap-2 mb-3">
        <CloudRain size={16} style={{ color: 'var(--ds-text-secondary)' }} />
        <h3 className="text-xs font-semibold text-[var(--ds-text-secondary)] uppercase tracking-wider">Rain</h3>
      </div>

      {anyAvailable ? (
        <div className="flex-1 flex flex-col justify-center gap-3">
          <div>
            <div className="text-xs text-[var(--ds-text-secondary)]">Rate</div>
            <div className="text-2xl font-bold" style={{ color: rateVal > 0 ? '#5a8fb8' : '#4a9a4a' }}>
              {rateVal != null ? `${rateVal.toFixed(1)} mm/h` : '--'}
            </div>
          </div>
          <div className="flex gap-4">
            <div>
              <div className="text-xs text-[var(--ds-text-secondary)]">Today</div>
              <div className="text-lg font-semibold text-[var(--ds-text)]">
                {dailyVal != null ? `${dailyVal.toFixed(1)} mm` : '--'}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--ds-text-secondary)]">Monthly</div>
              <div className="text-lg font-semibold text-[var(--ds-text)]">
                {monthlyVal != null ? `${monthlyVal.toFixed(1)} mm` : '--'}
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
