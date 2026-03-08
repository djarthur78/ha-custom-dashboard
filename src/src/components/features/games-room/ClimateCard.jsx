/**
 * ClimateCard Component
 * Simple climate control with ON/OFF buttons, heat/cool, temperature, and fan speed.
 */

import { ThermometerSun, Droplets, Flame, Snowflake } from 'lucide-react';
import { useClimate } from './hooks/useClimate';
import { useServiceCall } from '../../../hooks/useServiceCall';
import { CLIMATE_ENTITY } from './gamesRoomConfig';

export function ClimateCard() {
  const { callService } = useServiceCall();
  const {
    state,
    isOn,
    currentTemp,
    targetTemp,
    humidity,
    feelsLike,
    fanMode,
    fanModes,
    minTemp,
    maxTemp,
    tempStep,
    loading,
  } = useClimate();

  const handleOn = () => {
    callService('climate', 'turn_on', { entity_id: CLIMATE_ENTITY });
  };

  const handleOff = () => {
    callService('climate', 'turn_off', { entity_id: CLIMATE_ENTITY });
  };

  const handleTempChange = (delta) => {
    const newTemp = Math.min(maxTemp, Math.max(minTemp, targetTemp + delta));
    callService('climate', 'set_temperature', {
      entity_id: CLIMATE_ENTITY,
      temperature: newTemp,
    });
  };

  const handleModeChange = (mode) => {
    callService('climate', 'set_hvac_mode', {
      entity_id: CLIMATE_ENTITY,
      hvac_mode: mode,
    });
  };

  const handleFanChange = (mode) => {
    callService('climate', 'set_fan_mode', {
      entity_id: CLIMATE_ENTITY,
      fan_mode: mode,
    });
  };

  if (loading) {
    return (
      <div className="ds-card h-full flex items-center justify-center">
        <div className="text-[var(--color-text-secondary)]">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="ds-card h-full flex flex-col gap-2"
      style={{ padding: '12px' }}
    >
      {/* Header */}
      <h3 className="text-base font-bold text-[var(--color-text)]">Climate</h3>

      {/* Current Temperature Display */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <ThermometerSun size={24} style={{ color: 'var(--ds-accent)' }} />
          <div className="text-4xl font-bold text-[var(--color-text)]">
            {currentTemp?.toFixed(1) || '--'}°C
          </div>
        </div>
        {feelsLike !== null && (
          <div className="text-xs text-[var(--color-text-secondary)]">
            Feels like {feelsLike.toFixed(1)}°C • {humidity?.toFixed(0) || '--'}%
          </div>
        )}
      </div>

      {/* ON / OFF Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleOn}
          disabled={loading || isOn}
          className="py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          style={{
            backgroundColor: isOn ? 'var(--ds-state-on)' : 'var(--ds-warm-inactive-bg)',
            color: isOn ? 'white' : 'var(--ds-warm-inactive-text)',
          }}
        >
          ON
        </button>
        <button
          onClick={handleOff}
          disabled={loading || !isOn}
          className="py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          style={{
            backgroundColor: !isOn ? 'var(--ds-state-off)' : 'var(--ds-warm-inactive-bg)',
            color: !isOn ? 'white' : 'var(--ds-warm-inactive-text)',
          }}
        >
          OFF
        </button>
      </div>

      {isOn && (
        <>
          {/* Heat / Cool Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleModeChange('heat')}
              disabled={loading}
              className="py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: state === 'heat' ? 'var(--ds-accent)' : 'var(--ds-warm-inactive-bg)',
                color: state === 'heat' ? 'white' : 'var(--ds-warm-inactive-text)',
              }}
            >
              <Flame size={16} />
              Heat
            </button>
            <button
              onClick={() => handleModeChange('cool')}
              disabled={loading}
              className="py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: state === 'cool' ? 'var(--ds-accent)' : 'var(--ds-warm-inactive-bg)',
                color: state === 'cool' ? 'white' : 'var(--ds-warm-inactive-text)',
              }}
            >
              <Snowflake size={16} />
              Cool
            </button>
          </div>

          {/* Temperature +/- */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleTempChange(-tempStep)}
              disabled={loading || targetTemp <= minTemp}
              className="w-12 h-12 rounded-xl font-bold text-2xl
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
              style={{ backgroundColor: 'rgba(181,69,58,0.1)', color: 'var(--ds-accent)' }}
            >
              −
            </button>
            <div className="text-center">
              <div className="text-xs text-[var(--color-text-secondary)]">Target</div>
              <div className="text-3xl font-bold text-[var(--color-text)]">
                {targetTemp?.toFixed(0) || '--'}°
              </div>
            </div>
            <button
              onClick={() => handleTempChange(tempStep)}
              disabled={loading || targetTemp >= maxTemp}
              className="w-12 h-12 rounded-xl font-bold text-2xl
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
              style={{ backgroundColor: 'rgba(181,69,58,0.1)', color: 'var(--ds-accent)' }}
            >
              +
            </button>
          </div>

          {/* Fan Speed Buttons - single row */}
          <div className="grid grid-cols-3 gap-2">
            {['low', 'medium', 'high'].map((speed) => (
              <button
                key={speed}
                onClick={() => handleFanChange(speed)}
                disabled={loading}
                className="py-1.5 rounded-xl text-xs font-bold transition-all capitalize"
                style={{
                  backgroundColor: fanMode === speed ? 'var(--ds-accent)' : 'var(--ds-warm-inactive-bg)',
                  color: fanMode === speed ? 'white' : 'var(--ds-warm-inactive-text)',
                }}
              >
                {speed}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
