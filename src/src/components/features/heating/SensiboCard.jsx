/**
 * SensiboCard Component
 * Controls a Sensibo AC unit: on/off, heat/cool mode, temperature.
 */

import { useState, useCallback } from 'react';
import { Flame, Snowflake, Power } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import haWebSocket from '../../../services/ha-websocket';
import { getHeatingColor } from './heatingConfig';

export function SensiboCard({ entityId, label, feelsLikeEntity, compact }) {
  const { state, attributes } = useEntity(entityId);
  const feelsLikeSensor = useEntity(feelsLikeEntity);
  const [loading, setLoading] = useState(false);

  const currentTemp = attributes?.current_temperature;
  const targetTemp = attributes?.temperature;
  const humidity = attributes?.current_humidity;
  const feelsLike = feelsLikeSensor.state ? parseFloat(feelsLikeSensor.state) : null;
  const isOn = state !== 'off' && state !== 'unavailable';
  const minTemp = attributes?.min_temp || 16;
  const maxTemp = attributes?.max_temp || 30;
  const tempStep = attributes?.target_temp_step || 1;
  const tempColor = getHeatingColor(currentTemp);

  const callClimate = useCallback(async (service, data = {}) => {
    setLoading(true);
    try {
      await haWebSocket.callService('climate', service, { entity_id: entityId, ...data });
    } catch (err) {
      console.error(`Sensibo ${label} ${service} failed:`, err);
    } finally {
      setLoading(false);
    }
  }, [entityId, label]);

  const handleOn = () => callClimate('turn_on');
  const handleOff = () => callClimate('turn_off');
  const handleMode = (mode) => callClimate('set_hvac_mode', { hvac_mode: mode });
  const handleTemp = (delta) => {
    const newTemp = Math.min(maxTemp, Math.max(minTemp, targetTemp + delta));
    callClimate('set_temperature', { temperature: newTemp });
  };

  const iconSize = compact ? 20 : 24;
  const tempSize = compact ? 'text-2xl' : 'text-3xl';

  return (
    <div className="ds-card flex flex-col gap-2" style={{ padding: compact ? '12px' : '16px' }}>
      {/* Header + temp */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--color-text)]">{label}</span>
        <div className="flex items-center gap-1">
          <div className="rounded-full" style={{
            width: 6,
            height: 6,
            backgroundColor: isOn ? 'var(--ds-state-on)' : 'var(--ds-state-off)',
            boxShadow: isOn ? '0 0 6px rgba(74,154,74,0.4)' : 'none',
          }} />
          <span className="text-[10px] font-medium" style={{
            color: isOn ? 'var(--ds-state-on)' : 'var(--ds-state-off)',
          }}>
            {isOn ? (state || '').toUpperCase() : 'OFF'}
          </span>
        </div>
      </div>

      {/* Current temp */}
      <div className="text-center">
        <span className={`${tempSize} font-bold`} style={{ color: tempColor }}>
          {currentTemp != null ? `${currentTemp.toFixed(1)}°` : '--'}
        </span>
        {feelsLike !== null && (
          <div className="text-[10px] text-[var(--color-text-secondary)]">
            Feels {feelsLike.toFixed(1)}°{humidity != null ? ` · ${humidity}%` : ''}
          </div>
        )}
      </div>

      {/* ON/OFF */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleOn}
          disabled={loading || isOn}
          className="py-2 rounded-xl font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1"
          style={{
            backgroundColor: isOn ? 'var(--ds-state-on)' : 'var(--ds-warm-inactive-bg)',
            color: isOn ? 'white' : 'var(--ds-warm-inactive-text)',
          }}
        >
          <Power size={14} />
          ON
        </button>
        <button
          onClick={handleOff}
          disabled={loading || !isOn}
          className="py-2 rounded-xl font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1"
          style={{
            backgroundColor: !isOn ? 'var(--ds-state-off)' : 'var(--ds-warm-inactive-bg)',
            color: !isOn ? 'white' : 'var(--ds-warm-inactive-text)',
          }}
        >
          <Power size={14} />
          OFF
        </button>
      </div>

      {isOn && (
        <>
          {/* Heat/Cool */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleMode('heat')}
              disabled={loading}
              className="py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
              style={{
                backgroundColor: state === 'heat' ? '#b5453a' : 'var(--ds-warm-inactive-bg)',
                color: state === 'heat' ? 'white' : 'var(--ds-warm-inactive-text)',
              }}
            >
              <Flame size={14} />
              Heat
            </button>
            <button
              onClick={() => handleMode('cool')}
              disabled={loading}
              className="py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
              style={{
                backgroundColor: state === 'cool' ? '#5a8fb8' : 'var(--ds-warm-inactive-bg)',
                color: state === 'cool' ? 'white' : 'var(--ds-warm-inactive-text)',
              }}
            >
              <Snowflake size={14} />
              Cool
            </button>
          </div>

          {/* Target temp +/- */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleTemp(-tempStep)}
              disabled={loading || targetTemp <= minTemp}
              className="w-10 h-10 rounded-xl font-bold text-xl disabled:opacity-50 transition-colors"
              style={{ backgroundColor: 'rgba(181,69,58,0.1)', color: 'var(--ds-accent)' }}
            >
              -
            </button>
            <div className="text-center">
              <div className="text-[10px] text-[var(--color-text-secondary)]">Target</div>
              <div className="text-xl font-bold text-[var(--color-text)]">
                {targetTemp != null ? `${targetTemp}°` : '--'}
              </div>
            </div>
            <button
              onClick={() => handleTemp(tempStep)}
              disabled={loading || targetTemp >= maxTemp}
              className="w-10 h-10 rounded-xl font-bold text-xl disabled:opacity-50 transition-colors"
              style={{ backgroundColor: 'rgba(181,69,58,0.1)', color: 'var(--ds-accent)' }}
            >
              +
            </button>
          </div>
        </>
      )}
    </div>
  );
}
