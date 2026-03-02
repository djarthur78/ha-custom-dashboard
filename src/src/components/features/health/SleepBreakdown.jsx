/**
 * SleepBreakdown Component
 * Visual bar showing sleep stage distribution (deep/light/REM/awake)
 */

import { useEntity } from '../../../hooks/useEntity';

const STAGES = [
  { key: 'deep', label: 'Deep', color: '#6366f1' },
  { key: 'light', label: 'Light', color: '#818cf8' },
  { key: 'rem', label: 'REM', color: '#22d3ee' },
  { key: 'awake', label: 'Awake', color: '#f97316' },
];

function formatHours(val) {
  if (!val) return '--';
  const h = Math.floor(parseFloat(val));
  const m = Math.round((parseFloat(val) - h) * 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function SleepBreakdown({ deepId, lightId, remId, awakeId }) {
  const deep = useEntity(deepId);
  const light = useEntity(lightId);
  const rem = useEntity(remId);
  const awake = useEntity(awakeId);

  const values = {
    deep: parseFloat(deep.state) || 0,
    light: parseFloat(light.state) || 0,
    rem: parseFloat(rem.state) || 0,
    awake: parseFloat(awake.state) || 0,
  };

  const total = values.deep + values.light + values.rem + values.awake;
  if (total === 0) return null;

  return (
    <div>
      {/* Stacked bar */}
      <div className="flex rounded-lg overflow-hidden" style={{ height: '28px' }}>
        {STAGES.map(({ key, color }) => {
          const pct = (values[key] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={key}
              style={{
                width: `${pct}%`,
                backgroundColor: color,
                minWidth: pct > 0 ? '2px' : 0,
              }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-between mt-2">
        {STAGES.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="rounded-full" style={{ width: 10, height: 10, backgroundColor: color }} />
            <span className="text-xs text-[var(--color-text-secondary)]">
              {label}: <span className="font-semibold text-[var(--color-text)]">{formatHours(values[key])}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
