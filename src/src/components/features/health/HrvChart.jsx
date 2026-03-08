/**
 * HrvChart Component
 * 7-day HRV trend line chart using SVG (no library).
 * Shows elite zone band (70-100ms) and day labels.
 */

import { useHistoryData } from '../../../hooks/useHistoryData';
import { OURA_HEART } from './healthConfig';
import { Activity } from 'lucide-react';

// Get one value per day (last reading of each day)
function getDailyValues(data) {
  const dailyMap = {};
  for (const point of data) {
    const dayKey = point.timestamp.toISOString().split('T')[0];
    dailyMap[dayKey] = point; // last value wins
  }
  return Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, point]) => ({
      day: key,
      value: point.value,
      timestamp: point.timestamp,
    }));
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HrvChart() {
  const { data, loading, error } = useHistoryData(OURA_HEART.avg_sleep_hrv, 7);

  if (loading) {
    return (
      <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(122, 90, 170, 0.04)', border: '1px solid rgba(122, 90, 170, 0.1)' }}>
        <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase">HRV Trend</div>
        <div className="h-[140px] flex items-center justify-center text-xs text-[var(--color-text-secondary)]">Loading...</div>
      </div>
    );
  }

  const dailyValues = getDailyValues(data);
  if (dailyValues.length < 2) {
    return (
      <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(122, 90, 170, 0.04)', border: '1px solid rgba(122, 90, 170, 0.1)' }}>
        <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase">HRV Trend</div>
        <div className="h-[140px] flex items-center justify-center text-xs text-[var(--color-text-secondary)]">
          {error ? 'Failed to load' : 'Not enough data'}
        </div>
      </div>
    );
  }

  // Chart dimensions
  const width = 400;
  const height = 140;
  const padLeft = 30;
  const padRight = 10;
  const padTop = 15;
  const padBottom = 25;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Data range
  const values = dailyValues.map(d => d.value);
  const currentValue = values[values.length - 1];
  const minVal = Math.min(...values, 40);
  const maxVal = Math.max(...values, 110);
  const range = maxVal - minVal || 1;

  // Scale functions
  const scaleX = (i) => padLeft + (i / (dailyValues.length - 1)) * chartW;
  const scaleY = (v) => padTop + chartH - ((v - minVal) / range) * chartH;

  // Build polyline points
  const points = dailyValues.map((d, i) => `${scaleX(i)},${scaleY(d.value)}`).join(' ');

  // Elite zone band (70-100ms)
  const eliteTop = scaleY(100);
  const eliteBottom = scaleY(70);

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(122, 90, 170, 0.04)', border: '1px solid rgba(122, 90, 170, 0.1)' }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Activity size={10} style={{ color: '#7a5aaa' }} />
          <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase">7-Day HRV Trend</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[var(--color-text-secondary)]">Elite: 70-100ms</span>
          <span className="text-sm font-black" style={{ color: '#7a5aaa' }}>{Math.round(currentValue)}ms</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 140 }}>
        {/* Elite zone band */}
        <rect
          x={padLeft}
          y={eliteTop}
          width={chartW}
          height={Math.max(0, eliteBottom - eliteTop)}
          fill="rgba(122, 90, 170, 0.08)"
        />
        <text x={padLeft + 2} y={eliteTop + 10} fill="rgba(122, 90, 170, 0.3)" fontSize="8" fontWeight="600">Elite Zone</text>

        {/* Grid lines */}
        {[40, 60, 80, 100].filter(v => v >= minVal && v <= maxVal).map(v => (
          <g key={v}>
            <line x1={padLeft} y1={scaleY(v)} x2={width - padRight} y2={scaleY(v)}
              stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
            <text x={padLeft - 4} y={scaleY(v) + 3} fill="var(--ds-text-secondary)" fontSize="8" textAnchor="end">{v}</text>
          </g>
        ))}

        {/* HRV line */}
        <polyline
          points={points}
          fill="none"
          stroke="#7a5aaa"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data point dots */}
        {dailyValues.map((d, i) => (
          <circle
            key={i}
            cx={scaleX(i)}
            cy={scaleY(d.value)}
            r={i === dailyValues.length - 1 ? 5 : 3}
            fill={i === dailyValues.length - 1 ? '#7a5aaa' : 'white'}
            stroke="#7a5aaa"
            strokeWidth="2"
          />
        ))}

        {/* Current value label */}
        <text
          x={scaleX(dailyValues.length - 1)}
          y={scaleY(currentValue) - 10}
          fill="#7a5aaa"
          fontSize="10"
          fontWeight="800"
          textAnchor="middle"
        >
          {Math.round(currentValue)}
        </text>

        {/* Day labels */}
        {dailyValues.map((d, i) => (
          <text
            key={i}
            x={scaleX(i)}
            y={height - 5}
            fill="var(--ds-text-secondary)"
            fontSize="8"
            textAnchor="middle"
          >
            {DAY_LABELS[d.timestamp.getDay()]}
          </text>
        ))}
      </svg>
    </div>
  );
}
