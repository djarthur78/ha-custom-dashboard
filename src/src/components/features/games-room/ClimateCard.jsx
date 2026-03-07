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
      className="ds-card h-full p-4 flex flex-col gap-3"
    >
      {/* Header */}
      <h3 className="text-lg font-bold text-[var(--color-text)]">Climate</h3>

      {/* Current Temperature Display */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <ThermometerSun size={28} style={{ color: '#9f5644' }} />
          <div className="text-5xl font-bold text-[var(--color-text)]">
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
          className="py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          style={{
            backgroundColor: isOn ? '#9f5644' : '#e8e4e1',
            color: isOn ? 'white' : '#8a8380',
          }}
        >
          ON
        </button>
        <button
          onClick={handleOff}
          disabled={loading || !isOn}
          className="py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          style={{
            backgroundColor: !isOn ? '#2c2e2e' : '#e8e4e1',
            color: !isOn ? 'white' : '#8a8380',
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
              className="py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: state === 'heat' ? '#9f5644' : '#e8e4e1',
                color: state === 'heat' ? 'white' : '#8a8380',
              }}
            >
              <Flame size={18} />
              Heat
            </button>
            <button
              onClick={() => handleModeChange('cool')}
              disabled={loading}
              className="py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: state === 'cool' ? '#9f5644' : '#e8e4e1',
                color: state === 'cool' ? 'white' : '#8a8380',
              }}
            >
              <Snowflake size={18} />
              Cool
            </button>
          </div>

          {/* Temperature +/- */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleTempChange(-tempStep)}
              disabled={loading || targetTemp <= minTemp}
              className="w-16 h-16 rounded-xl font-bold text-3xl
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
              style={{ backgroundColor: 'rgba(159,86,68,0.1)', color: '#9f5644' }}
            >
              −
            </button>
            <div className="text-center">
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">Target</div>
              <div className="text-4xl font-bold text-[var(--color-text)]">
                {targetTemp?.toFixed(0) || '--'}°
              </div>
            </div>
            <button
              onClick={() => handleTempChange(tempStep)}
              disabled={loading || targetTemp >= maxTemp}
              className="w-16 h-16 rounded-xl font-bold text-3xl
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
              style={{ backgroundColor: 'rgba(159,86,68,0.1)', color: '#9f5644' }}
            >
              +
            </button>
          </div>

          {/* Fan Speed Buttons */}
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-2 text-center">Fan Speed</div>
            <div className="grid grid-cols-3 gap-2">
              {['low', 'medium', 'high'].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleFanChange(speed)}
                  disabled={loading}
                  className="py-2 rounded-xl text-xs font-bold transition-all capitalize"
                  style={{
                    backgroundColor: fanMode === speed ? '#9f5644' : '#e8e4e1',
                    color: fanMode === speed ? 'white' : '#8a8380',
                  }}
                >
                  {speed}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
