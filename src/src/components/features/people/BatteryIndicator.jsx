import { Battery, BatteryCharging, BatteryLow } from 'lucide-react';

/**
 * Battery Indicator Component
 * Shows battery level with color-coded bar and charging state
 */
export function BatteryIndicator({ level, state }) {
  const isCharging = state === 'Charging' || state === 'Full';
  const isLow = level !== null && level < 20;

  // Determine color
  let barColor = 'bg-gray-500';
  let textColor = 'text-gray-400';

  if (level !== null) {
    if (level < 20) {
      barColor = 'bg-red-500';
      textColor = 'text-red-400';
    } else if (level < 50) {
      barColor = 'bg-amber-500';
      textColor = 'text-amber-400';
    } else {
      barColor = 'bg-green-500';
      textColor = 'text-green-400';
    }
  }

  // Choose icon
  let Icon = Battery;
  if (isCharging) {
    Icon = BatteryCharging;
  } else if (isLow) {
    Icon = BatteryLow;
  }

  return (
    <div className="flex items-center gap-2">
      <Icon size={16} className={textColor} />
      <div className="flex items-center gap-2">
        <div className="w-12 h-2 bg-gray-700 rounded-full overflow-hidden">
          {level !== null && (
            <div
              className={`h-full ${barColor} transition-all duration-300`}
              style={{ width: `${level}%` }}
            />
          )}
        </div>
        <span className={`text-sm font-medium ${textColor} min-w-[3ch]`}>
          {level !== null ? `${level}%` : '--'}
        </span>
      </div>
    </div>
  );
}
