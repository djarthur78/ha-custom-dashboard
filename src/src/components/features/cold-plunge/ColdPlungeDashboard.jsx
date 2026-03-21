/**
 * ColdPlungeDashboard Component
 * Full viewport cold plunge page with giant status display + controls
 */

import { useState, useCallback, useEffect } from 'react';
import { Power, Snowflake, Waves, Wind, Sparkles, Thermometer } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import haWebSocket from '../../../services/ha-websocket';
import { getTriggerStats } from '../../../services/ha-rest';

const COLD_PLUNGE = {
  chiller: 'switch.cold_plunge_devices_p304m_cold_plunge_chiller',
  pump: 'switch.cold_plunge_devices_p304m_cold_plunge_pump',
  fan: 'switch.cold_plunge_devices_p304m_cold_plunge_fan',
  ozone: 'switch.cold_plunge_devices_p304m_cold_plunge_ozone',
};

const COLD_PLUNGE_SENSORS = {
  waterTemp: 'sensor.cold_plunge_temp_cold_plunge_water_temp',
  motion: 'binary_sensor.cold_plunge_temp_cold_plunge_motion',
};

function getTempColor(temp) {
  if (temp == null) return '#9ca3af';
  if (temp < 5) return '#5a8fb8';
  if (temp < 10) return '#4a9a9a';
  if (temp < 15) return '#4a9a4a';
  if (temp < 20) return '#d4944c';
  return '#b5453a';
}

const COLD_PLUNGE_POWER = {
  chiller: 'sensor.unnamed_p304m_cold_plunge_chiller_current_consumption',
  pump: 'sensor.unnamed_p304m_cold_plunge_pump_current_consumption',
  fan: 'sensor.unnamed_p304m_cold_plunge_fan_current_consumption',
  ozone: 'sensor.unnamed_p304m_cold_plunge_ozone_current_consumption',
};

const CHILLER_ACTIVE_THRESHOLD = 100; // Watts - above this = compressor running

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
  const waterTempEntity = useEntity(COLD_PLUNGE_SENSORS.waterTemp);
  const motionEntity = useEntity(COLD_PLUNGE_SENSORS.motion);
  const chillerPowerEntity = useEntity(COLD_PLUNGE_POWER.chiller);

  const coreOn = chillerEntity.state === 'on' && pumpEntity.state === 'on' && fanEntity.state === 'on';
  const anyOn = [chillerEntity, pumpEntity, fanEntity, ozoneEntity].some(e => e.state === 'on');

  // Chiller active detection via power consumption
  const chillerPower = chillerPowerEntity.state && chillerPowerEntity.state !== 'unavailable'
    ? parseFloat(chillerPowerEntity.state) : null;
  const chillerIsOn = chillerEntity.state === 'on';
  const chillerActivelyChilling = chillerIsOn && chillerPower != null && chillerPower > CHILLER_ACTIVE_THRESHOLD;

  // Count active devices
  const activeCount = [chillerEntity, pumpEntity, fanEntity, ozoneEntity].filter(e => e.state === 'on').length;

  // Water temperature
  const waterTemp = waterTempEntity.state && waterTempEntity.state !== 'unavailable'
    ? parseFloat(waterTempEntity.state)
    : null;
  const tempColor = getTempColor(waterTemp);
  const motionDetected = motionEntity.state === 'on';

  // Motion stats — both use history API so they're consistent
  const [motionStats, setMotionStats] = useState({ count: null, lastTriggered: null });

  useEffect(() => {
    let mounted = true;
    getTriggerStats(COLD_PLUNGE_SENSORS.motion, 24)
      .then(stats => { if (mounted) setMotionStats(stats); })
      .catch(() => { if (mounted) setMotionStats({ count: null, lastTriggered: null }); });
    return () => { mounted = false; };
  }, [motionDetected]); // Re-fetch when motion state changes

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
        <div className="ds-card h-full flex flex-col items-center text-center"
          style={{
            background: coreOn
              ? 'linear-gradient(135deg, rgba(90,143,184,0.06), rgba(90,143,184,0.02))'
              : 'var(--ds-card)',
          }}
        >
          {/* Water Temperature - Hero */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <Thermometer size={64} style={{ color: tempColor }} className="mb-2" />
            <div className="text-[140px] font-bold leading-none mb-1" style={{ color: tempColor }}>
              {waterTemp != null ? `${waterTemp.toFixed(1)}°` : '--'}
            </div>
            <div className="text-2xl font-medium text-[var(--color-text-secondary)] mb-6">
              Water Temperature
            </div>

            {/* Status row */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <Snowflake size={24} style={{ color: statusColor }} />
                <span className="text-2xl font-bold" style={{ color: statusColor }}>
                  {activeCount === 0 ? 'All Off' : activeCount === 4 ? 'All On' : `${activeCount} of 4 devices on`}
                </span>
              </div>
              <span className="text-lg font-medium" style={{ color: statusColor }}>{statusText}</span>
              {chillerIsOn && (
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full" style={{
                  backgroundColor: chillerActivelyChilling ? 'rgba(90,143,184,0.15)' : 'rgba(156,163,175,0.15)',
                }}>
                  <div className="w-2 h-2 rounded-full" style={{
                    backgroundColor: chillerActivelyChilling ? '#5a8fb8' : '#9ca3af',
                    ...(chillerActivelyChilling ? { animation: 'pulse 2s infinite' } : {}),
                  }} />
                  <span className="text-sm font-semibold" style={{ color: chillerActivelyChilling ? '#5a8fb8' : '#9ca3af' }}>
                    {chillerActivelyChilling ? 'Actively Chilling' : 'Chiller Standby'}
                  </span>
                  {chillerPower != null && (
                    <span className="text-sm" style={{ color: chillerActivelyChilling ? 'rgba(90,143,184,0.7)' : 'rgba(156,163,175,0.7)' }}>
                      {chillerPower.toFixed(0)}W
                    </span>
                  )}
                </div>
              )}
              {motionDetected && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(212,148,76,0.15)' }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#d4944c' }} />
                  <span className="text-sm font-medium" style={{ color: '#d4944c' }}>Lid Open — Shutting Down</span>
                </div>
              )}
            </div>
          </div>

          {/* Motion sensor stats */}
          <div className="w-full flex-shrink-0 pt-4 mt-4" style={{ borderTop: '1px solid var(--ds-border)' }}>
            <div className="flex justify-between px-6 text-sm">
              <div className="text-left">
                <div className="text-xs text-[var(--ds-text-secondary)] uppercase tracking-wider mb-1">Last Triggered</div>
                <div className="font-medium text-[var(--ds-text)]">
                  {motionStats.lastTriggered
                    ? new Date(motionStats.lastTriggered).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : 'Not in last 24h'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[var(--ds-text-secondary)] uppercase tracking-wider mb-1">Triggers (24h)</div>
                <div className="font-medium text-[var(--ds-text)]">
                  {motionStats.count != null ? `${motionStats.count} time${motionStats.count !== 1 ? 's' : ''}` : 'No data'}
                </div>
              </div>
            </div>
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
