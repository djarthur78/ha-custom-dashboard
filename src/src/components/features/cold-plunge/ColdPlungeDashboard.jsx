/**
 * ColdPlungeDashboard Component
 * Full viewport cold plunge page with giant status display + controls
 */

import { useState, useCallback } from 'react';
import { Power, Snowflake, Waves, Wind, Sparkles, Thermometer } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import haWebSocket from '../../../services/ha-websocket';

const COLD_PLUNGE = {
  chiller: 'switch.cold_plunge_devices_p304m_cold_plunge_chiller',
  pump: 'switch.cold_plunge_devices_p304m_cold_plunge_pump',
  fan: 'switch.cold_plunge_devices_p304m_cold_plunge_fan',
  ozone: 'switch.cold_plunge_devices_p304m_cold_plunge_ozone',
};

const COLD_PLUNGE_POWER = {
  chiller: 'sensor.cold_plunge_devices_p304m_cold_plunge_chiller_power',
  pump: 'sensor.cold_plunge_devices_p304m_cold_plunge_pump_power',
  fan: 'sensor.cold_plunge_devices_p304m_cold_plunge_fan_power',
  ozone: 'sensor.cold_plunge_devices_p304m_cold_plunge_ozone_power',
};

const DEVICES = [
  { key: 'chiller', label: 'Chiller', icon: Snowflake, color: '#5a8fb8' },
  { key: 'pump', label: 'Pump', icon: Waves, color: '#7a5aaa' },
  { key: 'fan', label: 'Fan', icon: Wind, color: '#d4944c' },
  { key: 'ozone', label: 'Ozone', icon: Sparkles, color: '#9f5644' },
];

function DeviceToggleCard({ deviceKey, label, icon: Icon, color }) {
  const { state } = useEntity(COLD_PLUNGE[deviceKey]);
  const { state: power } = useEntity(COLD_PLUNGE_POWER[deviceKey]);
  const [toggling, setToggling] = useState(false);
  const isOn = state === 'on';

  const handleToggle = useCallback(async () => {
    setToggling(true);
    try {
      await haWebSocket.callService('switch', isOn ? 'turn_off' : 'turn_on', {
        entity_id: COLD_PLUNGE[deviceKey],
      });
    } catch (err) {
      console.error(`Failed to toggle ${label}:`, err);
    } finally {
      setToggling(false);
    }
  }, [deviceKey, label, isOn]);

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
      className="ds-card flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md disabled:opacity-60"
      style={{
        padding: '16px',
        backgroundColor: isOn ? 'var(--ds-state-on-bg)' : 'var(--ds-card)',
        border: isOn ? '2px solid var(--ds-state-on)' : '1px solid var(--ds-border)',
      }}
    >
      <Icon size={28} style={{ color: isOn ? color : '#9ca3af' }} />
      <span className="text-sm font-semibold text-[var(--color-text)]">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className="rounded-full" style={{
          width: 8,
          height: 8,
          backgroundColor: isOn ? 'var(--ds-state-on)' : 'var(--ds-state-off)',
          boxShadow: isOn ? '0 0 8px rgba(74,154,74,0.4)' : 'none',
        }} />
        <span className="text-xs font-medium" style={{ color: isOn ? 'var(--ds-state-on)' : 'var(--ds-state-off)' }}>
          {isOn ? 'ON' : 'OFF'}
        </span>
      </div>
      {power && power !== 'unavailable' && isOn && (
        <span className="text-xs" style={{ color }}>{parseFloat(power).toFixed(1)}W</span>
      )}
    </button>
  );
}

export function ColdPlungeDashboard() {
  const [loading, setLoading] = useState(false);

  const chillerEntity = useEntity(COLD_PLUNGE.chiller);
  const pumpEntity = useEntity(COLD_PLUNGE.pump);
  const fanEntity = useEntity(COLD_PLUNGE.fan);
  const ozoneEntity = useEntity(COLD_PLUNGE.ozone);

  const coreOn = chillerEntity.state === 'on' && pumpEntity.state === 'on' && fanEntity.state === 'on';
  const anyOn = [chillerEntity, pumpEntity, fanEntity, ozoneEntity].some(e => e.state === 'on');

  // Count active devices
  const activeCount = [chillerEntity, pumpEntity, fanEntity, ozoneEntity].filter(e => e.state === 'on').length;

  const handleMasterOn = useCallback(async () => {
    setLoading(true);
    try {
      await haWebSocket.callService('switch', 'turn_on', { entity_id: COLD_PLUNGE.chiller });
      await haWebSocket.callService('switch', 'turn_on', { entity_id: COLD_PLUNGE.pump });
      await haWebSocket.callService('switch', 'turn_on', { entity_id: COLD_PLUNGE.fan });
    } catch (err) {
      console.error('Failed to turn on cold plunge:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMasterOff = useCallback(async () => {
    setLoading(true);
    try {
      await haWebSocket.callService('switch', 'turn_off', { entity_id: COLD_PLUNGE.chiller });
      await haWebSocket.callService('switch', 'turn_off', { entity_id: COLD_PLUNGE.pump });
      await haWebSocket.callService('switch', 'turn_off', { entity_id: COLD_PLUNGE.fan });
      await haWebSocket.callService('switch', 'turn_off', { entity_id: COLD_PLUNGE.ozone });
    } catch (err) {
      console.error('Failed to turn off cold plunge:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Status color based on system state
  const statusColor = coreOn ? '#5a8fb8' : anyOn ? '#d4944c' : '#9ca3af';
  const statusText = coreOn ? 'System Active' : anyOn ? 'Partially On' : 'System Off';

  return (
    <div className="flex gap-3 p-3" style={{ height: 'calc(100vh - 72px)' }}>
      {/* Left: Giant Status Display (55%) */}
      <div className="flex-[55] min-h-0">
        <div className="ds-card h-full flex flex-col items-center justify-center text-center"
          style={{
            background: coreOn
              ? 'linear-gradient(135deg, rgba(90,143,184,0.06), rgba(90,143,184,0.02))'
              : 'var(--ds-card)',
          }}
        >
          <Thermometer size={80} style={{ color: statusColor }} className="mb-4" />
          <div className="text-[120px] font-bold leading-none mb-2" style={{ color: statusColor }}>
            <Snowflake size={60} style={{ color: statusColor, display: 'inline', verticalAlign: 'middle', marginRight: '12px' }} />
            {activeCount}/4
          </div>
          <div className="text-2xl font-medium text-[var(--color-text-secondary)] mb-2">
            Cold Plunge
          </div>
          <div className="text-xl font-semibold" style={{ color: statusColor }}>
            {statusText}
          </div>
        </div>
      </div>

      {/* Right: Controls (45%) */}
      <div className="flex-[45] min-h-0">
        <div className="ds-card h-full flex flex-col gap-4" style={{ padding: '24px' }}>
          {/* Master ON/OFF */}
          <div className="flex-shrink-0">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
              Master Control
            </h3>
            <div className="flex gap-3">
              <button
                onClick={handleMasterOn}
                disabled={loading || coreOn}
                className="flex-1 flex items-center justify-center gap-2 py-4 text-lg font-bold rounded-xl
                           disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                style={{
                  backgroundColor: coreOn ? 'var(--ds-state-on)' : 'var(--ds-warm-inactive-bg)',
                  color: coreOn ? 'white' : 'var(--ds-warm-inactive-text)',
                }}
              >
                <Power size={20} />
                ON
              </button>
              <button
                onClick={handleMasterOff}
                disabled={loading || !anyOn}
                className="flex-1 flex items-center justify-center gap-2 py-4 text-lg font-bold rounded-xl
                           disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                style={{
                  backgroundColor: !anyOn ? 'var(--ds-state-off)' : 'var(--ds-warm-inactive-bg)',
                  color: !anyOn ? 'white' : 'var(--ds-warm-inactive-text)',
                }}
              >
                <Power size={20} />
                OFF
              </button>
            </div>
          </div>

          {/* Device Grid */}
          <div className="flex-1 min-h-0">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
              Individual Devices
            </h3>
            <div className="grid grid-cols-2 gap-3 h-[calc(100%-2rem)]">
              {DEVICES.map(({ key, label, icon, color }) => (
                <DeviceToggleCard
                  key={key}
                  deviceKey={key}
                  label={label}
                  icon={icon}
                  color={color}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
