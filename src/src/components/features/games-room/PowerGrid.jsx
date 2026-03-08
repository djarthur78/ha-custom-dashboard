/**
 * PowerGrid Component
 * 3x2 grid of power device cards with toggle and wattage display.
 */

import * as LucideIcons from 'lucide-react';
import { usePowerDevices } from './hooks/usePowerDevices';
import { useServiceCall } from '../../../hooks/useServiceCall';

export function PowerGrid() {
  const { toggle } = useServiceCall();
  const { devices, totalConsumption } = usePowerDevices();

  const handleToggle = (device) => {
    toggle(device.switchEntity);
  };

  return (
    <div
      className="ds-card h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-[var(--color-text)]">Lights</h3>
      </div>

      {/* 2x2 Grid */}
      <div className="flex-1 grid grid-cols-2 gap-2">
        {devices.map((device) => {
          const Icon = LucideIcons[device.icon];
          const isOn = device.switchState === 'on';

          return (
            <button
              key={device.id}
              onClick={() => handleToggle(device)}
              disabled={device.loading}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-2
                        transition-all cursor-pointer border min-h-[60px]
                        hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{
                backgroundColor: isOn ? 'var(--ds-accent)' : 'var(--ds-warm-inactive-bg)',
                color: isOn ? 'white' : 'var(--ds-warm-inactive-text)',
                borderColor: isOn ? 'var(--ds-accent)' : '#d5d0cd',
              }}
            >
              {/* Icon */}
              {Icon && <Icon size={22} />}

              {/* Label */}
              <div className="text-xs font-medium text-center leading-tight">
                {device.label}
              </div>

              {/* Status indicator */}
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: isOn ? 'white' : '#b5b0ad' }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
