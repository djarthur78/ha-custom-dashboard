/**
 * MobileColdPlungePage
 * Vertical stack: status + master controls + device grid
 */

import { useState, useCallback, useEffect } from 'react';
import { Power, Snowflake, Waves, Wind, Sparkles, Thermometer } from 'lucide-react';
import { MobilePageContainer } from '../../components/mobile/MobilePageContainer';
import { useEntity } from '../../hooks/useEntity';
import haWebSocket from '../../services/ha-websocket';
import { getTriggerStats } from '../../services/ha-rest';

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
      className="ds-card flex flex-col items-center justify-center gap-1.5 transition-all disabled:opacity-60"
      style={{
        padding: '14px',
        backgroundColor: isOn ? 'var(--ds-state-on-bg)' : 'var(--ds-card)',
        border: isOn ? '2px solid var(--ds-state-on)' : '1px solid var(--ds-border)',
      }}
    >
      <Icon size={24} style={{ color: isOn ? color : '#9ca3af' }} />
      <span className="text-xs font-semibold text-[var(--color-text)]">{label}</span>
      <div className="flex items-center gap-1">
        <div className="rounded-full" style={{
          width: 6,
          height: 6,
          backgroundColor: isOn ? 'var(--ds-state-on)' : 'var(--ds-state-off)',
        }} />
        <span className="text-[10px] font-medium" style={{ color: isOn ? 'var(--ds-state-on)' : 'var(--ds-state-off)' }}>
          {isOn ? 'ON' : 'OFF'}
        </span>
      </div>
      {power && power !== 'unavailable' && isOn && (
        <span className="text-[10px]" style={{ color }}>{parseFloat(power).toFixed(1)}W</span>
      )}
    </button>
  );
}

export function MobileColdPlungePage() {
  const [loading, setLoading] = useState(false);

  const chillerEntity = useEntity(COLD_PLUNGE.chiller);
  const pumpEntity = useEntity(COLD_PLUNGE.pump);
  const fanEntity = useEntity(COLD_PLUNGE.fan);
  const ozoneEntity = useEntity(COLD_PLUNGE.ozone);
  const waterTempEntity = useEntity(COLD_PLUNGE_SENSORS.waterTemp);
  const motionEntity = useEntity(COLD_PLUNGE_SENSORS.motion);

  const coreOn = chillerEntity.state === 'on' && pumpEntity.state === 'on' && fanEntity.state === 'on';
  const anyOn = [chillerEntity, pumpEntity, fanEntity, ozoneEntity].some(e => e.state === 'on');
  const activeCount = [chillerEntity, pumpEntity, fanEntity, ozoneEntity].filter(e => e.state === 'on').length;

  const waterTemp = waterTempEntity.state && waterTempEntity.state !== 'unavailable'
    ? parseFloat(waterTempEntity.state)
    : null;
  const tempColor = getTempColor(waterTemp);
  const motionDetected = motionEntity.state === 'on';

  // Motion stats
  const [motionStats, setMotionStats] = useState({ count: null, lastTriggered: null });

  useEffect(() => {
    let mounted = true;
    getTriggerStats(COLD_PLUNGE_SENSORS.motion, 24)
      .then(stats => { if (mounted) setMotionStats(stats); })
      .catch(() => { if (mounted) setMotionStats({ count: null, lastTriggered: null }); });
    return () => { mounted = false; };
  }, [motionDetected]);

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

  const statusColor = coreOn ? '#5a8fb8' : anyOn ? '#d4944c' : '#9ca3af';
  const statusText = coreOn ? 'System Active' : anyOn ? 'Partially On' : 'System Off';

  return (
    <MobilePageContainer>
      <div className="space-y-3">
        {/* Status */}
        <div className="ds-card flex items-center gap-4" style={{ padding: '16px' }}>
          <div className="flex flex-col items-center" style={{ minWidth: 72 }}>
            <Thermometer size={28} style={{ color: tempColor }} />
            <span className="text-3xl font-bold leading-tight" style={{ color: tempColor }}>
              {waterTemp != null ? `${waterTemp.toFixed(1)}°` : '--'}
            </span>
            <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">Water</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Snowflake size={20} style={{ color: statusColor }} />
              <span className="text-lg font-bold" style={{ color: statusColor }}>
                {activeCount === 0 ? 'All Off' : activeCount === 4 ? 'All On' : `${activeCount} of 4 on`}
              </span>
            </div>
            <div className="text-sm font-medium" style={{ color: statusColor }}>{statusText}</div>
            {motionDetected && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#d4944c' }} />
                <span className="text-xs font-medium" style={{ color: '#d4944c' }}>Lid Open — Shutting Down</span>
              </div>
            )}
          </div>
        </div>

        {/* Master Controls */}
        <div className="flex gap-3">
          <button
            onClick={handleMasterOn}
            disabled={loading || coreOn}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 text-base font-bold rounded-xl
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            style={{
              backgroundColor: coreOn ? 'var(--ds-state-on)' : 'var(--ds-warm-inactive-bg)',
              color: coreOn ? 'white' : 'var(--ds-warm-inactive-text)',
            }}
          >
            <Power size={18} />
            ON
          </button>
          <button
            onClick={handleMasterOff}
            disabled={loading || !anyOn}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 text-base font-bold rounded-xl
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            style={{
              backgroundColor: !anyOn ? 'var(--ds-state-off)' : 'var(--ds-warm-inactive-bg)',
              color: !anyOn ? 'white' : 'var(--ds-warm-inactive-text)',
            }}
          >
            <Power size={18} />
            OFF
          </button>
        </div>

        {/* Device Grid - 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          {DEVICES.map(({ key, label, icon, color }) => (
            <DeviceToggleCard key={key} deviceKey={key} label={label} icon={icon} color={color} />
          ))}
        </div>

        {/* Motion sensor stats */}
        <div className="ds-card flex justify-between" style={{ padding: '12px 16px' }}>
          <div>
            <div className="text-[10px] text-[var(--ds-text-secondary)] uppercase tracking-wider mb-0.5">Last Triggered</div>
            <div className="text-sm font-medium text-[var(--ds-text)]">
              {motionStats.lastTriggered
                ? new Date(motionStats.lastTriggered).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                : 'Not in last 24h'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[var(--ds-text-secondary)] uppercase tracking-wider mb-0.5">Triggers (24h)</div>
            <div className="text-sm font-medium text-[var(--ds-text)]">
              {motionStats.count != null ? `${motionStats.count} time${motionStats.count !== 1 ? 's' : ''}` : 'No data'}
            </div>
          </div>
        </div>
      </div>
    </MobilePageContainer>
  );
}

export default MobileColdPlungePage;
