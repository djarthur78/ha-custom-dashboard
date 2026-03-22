/**
 * ForecastCard Component
 * 5-day forecast strip with weather icons and hi/lo temps
 */

import { format, parseISO } from 'date-fns';
import { Droplets } from 'lucide-react';
import { useWeather } from '../../../hooks/useWeather';
import { getWeatherIcon } from '../../../utils/weather';
import { getTempColor } from './weatherConfig';

export function ForecastCard({ compact = false }) {
  const { forecast, loading } = useWeather();

  // Take next 5 days
  const days = forecast.slice(0, 5);

  if (loading || days.length === 0) {
    return (
      <div className="ds-card flex items-center justify-center" style={{ padding: '16px', minHeight: compact ? 80 : 100 }}>
        <span className="text-sm italic text-[var(--ds-text-secondary)]">Loading forecast...</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="ds-card" style={{ padding: '12px' }}>
        <div className="flex gap-1 overflow-x-auto">
          {days.map((day) => {
            const date = parseISO(day.datetime);
            return (
              <div key={day.datetime} className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 60, padding: '4px' }}>
                <span className="text-[10px] font-medium text-[var(--ds-text-secondary)]">
                  {format(date, 'EEE')}
                </span>
                <div className="my-1">{getWeatherIcon(day.condition, 20)}</div>
                <span className="text-xs font-bold" style={{ color: getTempColor(day.temperature) }}>
                  {Math.round(day.temperature)}°
                </span>
                {day.templow != null && (
                  <span className="text-[10px] text-[var(--ds-text-secondary)]">
                    {Math.round(day.templow)}°
                  </span>
                )}
                {day.precipitation_probability > 0 && (
                  <span className="flex items-center gap-0.5 text-[9px]" style={{ color: day.precipitation_probability > 50 ? '#5a8fb8' : '#9ca3af' }}>
                    <Droplets size={8} />
                    {day.precipitation_probability}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="ds-card" style={{ padding: '16px' }}>
      <h3 className="text-xs font-semibold text-[var(--ds-text-secondary)] uppercase tracking-wider mb-3">
        5-Day Forecast
      </h3>
      <div className="flex justify-between">
        {days.map((day) => {
          const date = parseISO(day.datetime);
          return (
            <div key={day.datetime} className="flex flex-col items-center gap-1.5 flex-1">
              <span className="text-sm font-medium text-[var(--ds-text-secondary)]">
                {format(date, 'EEE')}
              </span>
              <span className="text-xs text-[var(--ds-text-secondary)]">
                {format(date, 'd MMM')}
              </span>
              <div className="my-1">{getWeatherIcon(day.condition, 32)}</div>
              <span className="text-lg font-bold" style={{ color: getTempColor(day.temperature) }}>
                {Math.round(day.temperature)}°
              </span>
              {day.templow != null && (
                <span className="text-sm text-[var(--ds-text-secondary)]">
                  {Math.round(day.templow)}°
                </span>
              )}
              <span className="text-[10px] text-[var(--ds-text-secondary)] capitalize">
                {day.condition?.replace(/-/g, ' ')}
              </span>
              {day.precipitation_probability > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] mt-1" style={{ color: day.precipitation_probability > 50 ? '#5a8fb8' : '#9ca3af' }}>
                  <Droplets size={10} />
                  {day.precipitation_probability}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
