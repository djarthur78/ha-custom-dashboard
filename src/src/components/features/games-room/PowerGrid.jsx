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
      className="bg-[var(--color-surface)] rounded-xl h-full p-4 flex flex-col"
      style={{
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[var(--color-text)]">Lights</h3>
      </div>

      {/* 2x2 Grid */}
      <div className="flex-1 grid grid-cols-2 gap-3">
        {devices.map((device) => {
          const Icon = LucideIcons[device.icon];
          const isOn = device.switchState === 'on';

          return (
            <button
              key={device.id}
              onClick={() => handleToggle(device)}
              disabled={device.loading}
              className={`flex flex-col items-center justify-center gap-2 rounded-lg p-2
                        transition-all cursor-pointer border min-h-[80px]
                        ${isOn
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                        }
                        hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {/* Icon */}
              {Icon && <Icon size={24} />}

              {/* Label */}
              <div className="text-xs font-medium text-center leading-tight">
                {device.label}
              </div>

              {/* Status indicator */}
              <div
                className={`w-3 h-3 rounded-full ${
                  isOn ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
