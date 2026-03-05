/**
 * SleepBreakdown Component
 * Compact stacked bar showing sleep stage distribution
 */

import { useEntity } from '../../../hooks/useEntity';

const STAGES = [
  { key: 'deep', label: 'Deep', color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
  { key: 'light', label: 'Light', color: '#818cf8', gradient: 'linear-gradient(135deg, #818cf8, #6366f1)' },
  { key: 'rem', label: 'REM', color: '#22d3ee', gradient: 'linear-gradient(135deg, #22d3ee, #06b6d4)' },
  { key: 'awake', label: 'Awake', color: '#f97316', gradient: 'linear-gradient(135deg, #f97316, #ea580c)' },
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
        {STAGES.map(({ key, gradient }) => {
          const pct = (values[key] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={key}
              className="relative flex items-center justify-center transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: gradient,
                minWidth: pct > 3 ? '36px' : '2px',
              }}
            >
              {pct > 10 && (
                <span className="text-[9px] font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                  {Math.round(pct)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend with durations */}
      <div className="grid grid-cols-4 gap-1.5 mt-2">
        {STAGES.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-1.5 rounded-md p-1.5" style={{
            backgroundColor: `${color}08`,
          }}>
            <div className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, backgroundColor: color }} />
            <div>
              <div className="text-[9px] font-semibold text-[var(--color-text-secondary)] uppercase">{label}</div>
              <div className="text-xs font-bold text-[var(--color-text)]">{formatHours(values[key])}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
