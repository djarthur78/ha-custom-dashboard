/**
 * RainCard Component
 * Rain rate, daily, weekly, and monthly totals + next rain insight
 */

import { CloudRain, Umbrella } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { RAIN } from './weatherConfig';
import { useWeeklyRain } from './hooks/useWeeklyRain';
import { useWeatherInsights } from './hooks/useWeatherInsights';

export function RainCard() {
  const rate = useEntity(RAIN.rate);
  const daily = useEntity(RAIN.daily);
  const monthly = useEntity(RAIN.monthly);
  const { weeklyRain } = useWeeklyRain();
  const { nextRain } = useWeatherInsights();

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
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="text-xs text-[var(--ds-text-secondary)]">Today</div>
              <div className="text-base font-semibold text-[var(--ds-text)]">
                {dailyVal != null ? `${dailyVal.toFixed(1)} mm` : '--'}
              </div>
            </div>
            {weeklyRain != null && (
              <div className="flex-1">
                <div className="text-xs text-[var(--ds-text-secondary)]">Weekly</div>
                <div className="text-base font-semibold text-[var(--ds-text)]">
                  {`${weeklyRain.toFixed(1)} mm`}
                </div>
              </div>
            )}
            <div className="flex-1">
              <div className="text-xs text-[var(--ds-text-secondary)]">Monthly</div>
              <div className="text-base font-semibold text-[var(--ds-text)]">
                {monthlyVal != null ? `${monthlyVal.toFixed(1)} mm` : '--'}
              </div>
            </div>
          </div>
          {nextRain && (
            <div className="flex items-center gap-1.5 pt-1" style={{ borderTop: '1px solid var(--ds-border)' }}>
              <Umbrella size={12} style={{ color: '#5a8fb8' }} />
              <span className="text-xs" style={{ color: '#5a8fb8' }}>
                Rain {nextRain.day.toLowerCase()}{nextRain.probability ? ` (${nextRain.probability}%)` : ''}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm italic text-[var(--ds-text-secondary)]">Awaiting sensor</span>
        </div>
      )}
    </div>
  );
}
