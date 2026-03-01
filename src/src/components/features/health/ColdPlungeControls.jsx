/**
 * ColdPlungeControls Component
 * Master on/off toggle and individual device status for cold plunge
 */

import { useCallback } from 'react';
import { Power, Snowflake, Waves, Wind, Sparkles } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { useServiceCall } from '../../../hooks/useServiceCall';
import { COLD_PLUNGE, COLD_PLUNGE_POWER } from './healthConfig';

const DEVICES = [
  { key: 'chiller', label: 'Chiller', icon: Snowflake },
  { key: 'pump', label: 'Pump', icon: Waves },
  { key: 'fan', label: 'Fan', icon: Wind },
  { key: 'ozone', label: 'Ozone', icon: Sparkles },
];

// eslint-disable-next-line no-unused-vars
function DeviceToggle({ entityId, powerEntityId, label, icon: Icon }) {
  const { state } = useEntity(entityId);
  const { state: power } = useEntity(powerEntityId);
  const { toggle, loading } = useServiceCall();
  const isOn = state === 'on';

  return (
    <button
      onClick={() => toggle(entityId)}
      disabled={loading}
      className="flex items-center gap-3 p-3 rounded-xl transition-all w-full"
      style={{
        backgroundColor: isOn ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.03)',
        border: isOn ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <Icon size={20} className={isOn ? 'text-blue-500' : 'text-gray-400'} />
      <div className="flex-1 text-left">
        <div className="text-sm font-semibold text-[var(--color-text)]">{label}</div>
        {power && power !== 'unavailable' && (
          <div className="text-xs text-[var(--color-text-secondary)]">{parseFloat(power).toFixed(1)}W</div>
        )}
      </div>
      <div className={`w-3 h-3 rounded-full ${isOn ? 'bg-blue-500' : 'bg-gray-300'}`} />
    </button>
  );
}

export function ColdPlungeControls() {
  const { toggle, loading } = useServiceCall();

  // Check if any device is on
  const chillerEntity = useEntity(COLD_PLUNGE.chiller);
  const pumpEntity = useEntity(COLD_PLUNGE.pump);
  const fanEntity = useEntity(COLD_PLUNGE.fan);
  const ozoneEntity = useEntity(COLD_PLUNGE.ozone);

  const anyOn = [chillerEntity, pumpEntity, fanEntity, ozoneEntity].some(e => e.state === 'on');

  const handleMasterToggle = useCallback(async () => {
    // Toggle all devices to opposite of current majority state
    const targetState = anyOn ? 'turn_off' : 'turn_on';
    const entities = Object.values(COLD_PLUNGE);
    for (const entityId of entities) {
      try {
        if (targetState === 'turn_on') {
          await toggle(entityId);
        } else {
          await toggle(entityId);
        }
      } catch (err) {
        console.error(`Failed to ${targetState} ${entityId}:`, err);
      }
    }
  }, [anyOn, toggle]);

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-6" style={{
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[var(--color-text)]">Cold Plunge</h3>
        <button
          onClick={handleMasterToggle}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
          style={{
            backgroundColor: anyOn ? 'rgba(59, 130, 246, 0.15)' : '#f3f4f6',
            color: anyOn ? '#3b82f6' : '#6b7280',
          }}
        >
          <Power size={16} />
          {anyOn ? 'All On' : 'All Off'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {DEVICES.map(({ key, label, icon }) => (
          <DeviceToggle
            key={key}
            entityId={COLD_PLUNGE[key]}
            powerEntityId={COLD_PLUNGE_POWER[key]}
            label={label}
            icon={icon}
          />
        ))}
      </div>
    </div>
  );
}
