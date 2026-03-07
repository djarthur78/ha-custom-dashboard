/**
 * ColdPlungeControls Component
 * Compact cold plunge controls for grid cell layout
 */

import { useState, useCallback } from 'react';
import { Power, Snowflake, Waves, Wind, Sparkles } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import haWebSocket from '../../../services/ha-websocket';
import { COLD_PLUNGE, COLD_PLUNGE_POWER } from './healthConfig';

const DEVICES = [
  { key: 'chiller', label: 'Chiller', icon: Snowflake, color: '#6b8a9a' },
  { key: 'pump', label: 'Pump', icon: Waves, color: '#7b6b8a' },
  { key: 'fan', label: 'Fan', icon: Wind, color: '#b08a62' },
  { key: 'ozone', label: 'Ozone', icon: Sparkles, color: '#9f5644' },
];

function DeviceStatus({ entityId, powerEntityId, label, icon: Icon, color }) {
  const { state } = useEntity(entityId);
  const { state: power } = useEntity(powerEntityId);
  const isOn = state === 'on';

  return (
    <div
      className="flex items-center gap-2 p-2 rounded-lg transition-all duration-300"
      style={{
        backgroundColor: isOn ? `${color}10` : 'rgba(0,0,0,0.02)',
        border: isOn ? `1px solid ${color}30` : '1px solid rgba(0,0,0,0.04)',
      }}
    >
      <Icon size={14} style={{ color: isOn ? color : '#9ca3af' }} />
      <div className="flex-1">
        <div className="text-xs font-bold text-[var(--color-text)]">{label}</div>
        {power && power !== 'unavailable' && (
          <div className="text-[10px] font-medium" style={{ color: isOn ? color : 'var(--color-text-secondary)' }}>
            {parseFloat(power).toFixed(1)}W
          </div>
        )}
      </div>
      <div className="rounded-full" style={{
        width: 8,
        height: 8,
        backgroundColor: isOn ? color : '#d1d5db',
        boxShadow: isOn ? `0 0 6px ${color}60` : 'none',
      }} />
    </div>
  );
}

export function ColdPlungeControls() {
  const [loading, setLoading] = useState(false);

  const chillerEntity = useEntity(COLD_PLUNGE.chiller);
  const pumpEntity = useEntity(COLD_PLUNGE.pump);
  const fanEntity = useEntity(COLD_PLUNGE.fan);
  const ozoneEntity = useEntity(COLD_PLUNGE.ozone);

  const coreOn = chillerEntity.state === 'on' && pumpEntity.state === 'on' && fanEntity.state === 'on';
  const anyOn = [chillerEntity, pumpEntity, fanEntity, ozoneEntity].some(e => e.state === 'on');

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

  return (
    <div className="h-full flex flex-col">
      <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Snowflake size={12} style={{ color: '#6b8a9a' }} />
        Cold Plunge
      </div>

      {/* Master ON/OFF buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={handleMasterOn}
          disabled={loading || coreOn}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
          style={{
            backgroundColor: coreOn ? '#9f5644' : '#e8e4e1',
            color: coreOn ? 'white' : '#8a8380',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Power size={14} />
          ON
        </button>
        <button
          onClick={handleMasterOff}
          disabled={loading || !anyOn}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
          style={{
            backgroundColor: !anyOn ? '#2c2e2e' : '#e8e4e1',
            color: !anyOn ? '#6b7280' : '#8a8380',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Power size={14} />
          OFF
        </button>
      </div>

      {/* Device statuses - 2x2 grid */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        {DEVICES.map(({ key, label, icon, color }) => (
          <DeviceStatus
            key={key}
            entityId={COLD_PLUNGE[key]}
            powerEntityId={COLD_PLUNGE_POWER[key]}
            label={label}
            icon={icon}
            color={color}
          />
        ))}
      </div>
    </div>
  );
}
