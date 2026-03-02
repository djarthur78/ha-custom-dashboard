/**
 * ColdPlungeControls Component
 * Master ON/OFF toggle + individual device status for cold plunge
 * ON = chiller + pump + fan, OFF = all off
 */

import { useState, useCallback } from 'react';
import { Power, Snowflake, Waves, Wind, Sparkles } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import haWebSocket from '../../../services/ha-websocket';
import { COLD_PLUNGE, COLD_PLUNGE_POWER } from './healthConfig';

const DEVICES = [
  { key: 'chiller', label: 'Chiller', icon: Snowflake, color: '#3b82f6' },
  { key: 'pump', label: 'Pump', icon: Waves, color: '#06b6d4' },
  { key: 'fan', label: 'Fan', icon: Wind, color: '#8b5cf6' },
  { key: 'ozone', label: 'Ozone', icon: Sparkles, color: '#f59e0b' },
];

function DeviceStatus({ entityId, powerEntityId, label, icon: Icon, color }) {
  const { state } = useEntity(entityId);
  const { state: power } = useEntity(powerEntityId);
  const isOn = state === 'on';

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl transition-all duration-300"
      style={{
        backgroundColor: isOn ? `${color}10` : 'rgba(0,0,0,0.02)',
        border: isOn ? `1px solid ${color}30` : '1px solid rgba(0,0,0,0.04)',
      }}
    >
      <div className="rounded-lg p-1.5" style={{
        backgroundColor: isOn ? `${color}15` : 'rgba(0,0,0,0.04)',
      }}>
        <Icon size={16} style={{ color: isOn ? color : '#9ca3af' }} />
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-[var(--color-text)]">{label}</div>
        {power && power !== 'unavailable' && (
          <div className="text-xs font-medium" style={{ color: isOn ? color : 'var(--color-text-secondary)' }}>
            {parseFloat(power).toFixed(1)}W
          </div>
        )}
      </div>
      <div className="rounded-full transition-all duration-300" style={{
        width: 10,
        height: 10,
        backgroundColor: isOn ? color : '#d1d5db',
        boxShadow: isOn ? `0 0 8px ${color}60` : 'none',
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
    <div className="rounded-2xl overflow-hidden" style={{
      backgroundColor: 'var(--color-surface)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <div className="px-5 py-3 flex items-center gap-2" style={{
        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      }}>
        <Snowflake size={18} style={{ color: 'white' }} />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cold Plunge</h3>
      </div>
      <div className="p-5">
        {/* Master ON/OFF buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={handleMasterOn}
            disabled={loading || coreOn}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all"
            style={{
              background: coreOn
                ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                : 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
              color: coreOn ? 'white' : '#3b82f6',
              opacity: loading ? 0.6 : 1,
              boxShadow: coreOn ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none',
            }}
          >
            <Power size={18} />
            ON
          </button>
          <button
            onClick={handleMasterOff}
            disabled={loading || !anyOn}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all"
            style={{
              background: !anyOn
                ? 'linear-gradient(135deg, #374151, #1f2937)'
                : 'linear-gradient(135deg, #fee2e2, #fecaca)',
              color: !anyOn ? '#6b7280' : '#ef4444',
              opacity: loading ? 0.6 : 1,
              boxShadow: !anyOn ? 'none' : '0 4px 12px rgba(239, 68, 68, 0.2)',
            }}
          >
            <Power size={18} />
            OFF
          </button>
        </div>

        {/* Device statuses */}
        <div className="grid grid-cols-2 gap-2">
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

        <p className="text-[10px] text-[var(--color-text-secondary)] mt-3 text-center font-medium">
          ON = Chiller + Pump + Fan &bull; OFF = All devices
        </p>
      </div>
    </div>
  );
}
