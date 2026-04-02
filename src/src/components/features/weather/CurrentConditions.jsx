/**
 * CurrentConditions Component
 * Hero display: big temperature + weather icon + condition text
 */

import { Thermometer, Droplets } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { useWeather } from '../../../hooks/useWeather';
import { getWeatherIcon } from '../../../utils/weather';
import { ECOWITT_INDOOR, ECOWITT_OUTDOOR, PRESSURE, getTempColor, getHumidityColor } from './weatherConfig';

function SensorValue({ label, value, unit, color }) {
  const isAvailable = value != null && value !== 'unavailable';
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--ds-border)' }}>
      <span className="text-sm text-[var(--ds-text-secondary)]">{label}</span>
      {isAvailable ? (
        <span className="text-sm font-semibold" style={{ color }}>{value}{unit}</span>
      ) : (
        <span className="text-sm italic" style={{ color: 'var(--ds-text-secondary)' }}>Awaiting sensor</span>
      )}
    </div>
  );
}

export function CurrentConditions({ compact = false }) {
  const weather = useWeather();
  const outdoorTemp = useEntity(ECOWITT_OUTDOOR.temperature);
  const outdoorHumidity = useEntity(ECOWITT_OUTDOOR.humidity);
  const outdoorFeelsLike = useEntity(ECOWITT_OUTDOOR.feelsLike);
  const indoorTemp = useEntity(ECOWITT_INDOOR.temperature);
  const indoorHumidity = useEntity(ECOWITT_INDOOR.humidity);
  const indoorDewpoint = useEntity(ECOWITT_INDOOR.dewpoint);
  const pressure = useEntity(PRESSURE.relative);

  const outdoorTempVal = outdoorTemp.state && outdoorTemp.state !== 'unavailable' ? parseFloat(outdoorTemp.state) : null;
  const outdoorHumVal = outdoorHumidity.state && outdoorHumidity.state !== 'unavailable' ? parseFloat(outdoorHumidity.state) : null;
  const feelsLikeVal = outdoorFeelsLike.state && outdoorFeelsLike.state !== 'unavailable' ? parseFloat(outdoorFeelsLike.state) : null;
  // Use Ecowitt outdoor temp, fall back to Met Office if unavailable
  const temp = outdoorTempVal ?? weather.temperature;
  const condition = weather.condition;
  const humidity = outdoorHumVal ?? weather.humidity;

  const indoorTempVal = indoorTemp.state && indoorTemp.state !== 'unavailable' ? parseFloat(indoorTemp.state) : null;
  const indoorHumVal = indoorHumidity.state && indoorHumidity.state !== 'unavailable' ? parseFloat(indoorHumidity.state) : null;
  const indoorDewVal = indoorDewpoint.state && indoorDewpoint.state !== 'unavailable' ? parseFloat(indoorDewpoint.state) : null;
  const pressureVal = pressure.state && pressure.state !== 'unavailable' ? parseFloat(pressure.state) : null;

  if (compact) {
    return (
      <div className="ds-card" style={{ padding: '16px' }}>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {getWeatherIcon(condition, 48)}
          </div>
          <div className="flex-1">
            <div className="text-4xl font-bold" style={{ color: getTempColor(temp) }}>
              {temp != null ? `${Math.round(temp)}°C` : '--'}
            </div>
            <div className="text-sm text-[var(--ds-text-secondary)] capitalize">{condition?.replace(/-/g, ' ') || 'Unknown'}</div>
          </div>
          <div className="text-right">
            {feelsLikeVal != null && (
              <div className="text-sm">
                <span className="text-[var(--ds-text-secondary)]">Feels </span>
                <span className="font-semibold" style={{ color: getTempColor(feelsLikeVal) }}>{Math.round(feelsLikeVal)}°</span>
              </div>
            )}
            {indoorTempVal != null && (
              <div className="text-sm">
                <span className="text-[var(--ds-text-secondary)]">Indoor </span>
                <span className="font-semibold" style={{ color: getTempColor(indoorTempVal) }}>{indoorTempVal.toFixed(1)}°</span>
              </div>
            )}
            {indoorHumVal != null && (
              <div className="text-sm">
                <span className="text-[var(--ds-text-secondary)]">Humidity </span>
                <span className="font-semibold" style={{ color: getHumidityColor(indoorHumVal) }}>{indoorHumVal}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-card h-full flex flex-col" style={{ padding: '24px' }}>
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="mb-3">
          {getWeatherIcon(condition, 80)}
        </div>
        <div className="text-[100px] font-bold leading-none mb-1" style={{ color: getTempColor(temp) }}>
          {temp != null ? `${temp.toFixed(1)}°` : '--'}
        </div>
        {feelsLikeVal != null && (
          <div className="text-lg text-[var(--ds-text-secondary)] mb-1">
            Feels like <span className="text-xl font-bold" style={{ color: getTempColor(feelsLikeVal) }}>{feelsLikeVal.toFixed(1)}°</span>
          </div>
        )}
        <div className="text-xl text-[var(--ds-text-secondary)] capitalize mb-1">
          {condition?.replace(/-/g, ' ') || 'Unknown'}
        </div>
        {humidity != null && (
          <div className="flex items-center gap-1 text-sm text-[var(--ds-text-secondary)]">
            <Droplets size={14} />
            <span>{humidity}% humidity</span>
          </div>
        )}
      </div>

      {/* Indoor + Pressure section */}
      <div style={{ borderTop: '1px solid var(--ds-border)', paddingTop: '16px', marginTop: '16px' }}>
        <div className="flex items-center gap-2 mb-2">
          <Thermometer size={16} style={{ color: 'var(--ds-text-secondary)' }} />
          <span className="text-xs font-semibold text-[var(--ds-text-secondary)] uppercase tracking-wider">Indoor Conditions</span>
        </div>
        <SensorValue label="Temperature" value={indoorTempVal?.toFixed(1)} unit="°C" color={getTempColor(indoorTempVal)} />
        <SensorValue label="Humidity" value={indoorHumVal != null ? `${indoorHumVal}` : null} unit="%" color={getHumidityColor(indoorHumVal)} />
        <SensorValue label="Dewpoint" value={indoorDewVal?.toFixed(1)} unit="°C" color={getTempColor(indoorDewVal)} />
        <SensorValue label="Pressure" value={pressureVal?.toFixed(0)} unit=" hPa" color="#5a8fb8" />
      </div>
    </div>
  );
}
