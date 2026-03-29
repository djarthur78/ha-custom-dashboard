/**
 * WeekendForecast Component
 * 3-day weather forecast strip for lawn care planning.
 * Highlights weekend days and shows rain advisory.
 */

import { format, parseISO, isSaturday, isSunday } from 'date-fns';
import { Droplets, CloudRain } from 'lucide-react';
import { useWeather } from '../../../hooks/useWeather';
import { getWeatherIcon } from '../../../utils/weather';
import { getTempColor } from '../weather/weatherConfig';

export function WeekendForecast({ compact = false }) {
  const { forecast, loading } = useWeather();

  const days = forecast.slice(0, 3);

  if (loading || days.length === 0) {
    return (
      <div className="ds-card flex items-center justify-center" style={{ padding: '12px', minHeight: compact ? 60 : 80 }}>
        <span className="text-xs italic text-[var(--ds-text-secondary)]">Loading forecast...</span>
      </div>
    );
  }

  const hasRain = days.some(d => d.precipitation_probability > 50);

  return (
    <div className="ds-card" style={{ padding: compact ? '10px' : '14px' }}>
      <h3 className="text-[10px] font-semibold text-[var(--ds-text-secondary)] uppercase tracking-wider mb-2">
        3-Day Forecast
      </h3>

      <div className="flex justify-between gap-1">
        {days.map(day => {
          const date = parseISO(day.datetime);
          const isWeekend = isSaturday(date) || isSunday(date);

          return (
            <div
              key={day.datetime}
              className="flex flex-col items-center flex-1 rounded-lg py-1.5"
              style={{
                backgroundColor: isWeekend ? 'rgba(74,154,74,0.06)' : 'transparent',
              }}
            >
              <span className={`text-xs font-semibold ${isWeekend ? 'text-[#4a9a4a]' : 'text-[var(--ds-text-secondary)]'}`}>
                {format(date, 'EEE')}
              </span>
              <div className="my-1">{getWeatherIcon(day.condition, compact ? 20 : 24)}</div>
              <span className="text-sm font-bold" style={{ color: getTempColor(day.temperature) }}>
                {Math.round(day.temperature)}°
              </span>
              {day.templow != null && (
                <span className="text-[10px] text-[var(--ds-text-secondary)]">
                  {Math.round(day.templow)}°
                </span>
              )}
              {day.precipitation_probability > 0 && (
                <span
                  className="flex items-center gap-0.5 text-[10px] mt-0.5"
                  style={{ color: day.precipitation_probability > 50 ? '#5a8fb8' : '#9ca3af' }}
                >
                  <Droplets size={9} />
                  {day.precipitation_probability}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {hasRain && (
        <div
          className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-md text-xs font-medium"
          style={{ backgroundColor: 'rgba(90,143,184,0.1)', color: '#5a8fb8' }}
        >
          <CloudRain size={14} />
          Rain expected — consider skipping watering
        </div>
      )}
    </div>
  );
}
