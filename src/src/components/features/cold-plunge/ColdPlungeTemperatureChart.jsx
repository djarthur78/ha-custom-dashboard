import { useId, useMemo, useState } from 'react';
import { Clock3, Thermometer } from 'lucide-react';
import { useColdPlungeHistory } from './hooks/useColdPlungeHistory';

const CHART_WIDTH = 600;
const CHART_HEIGHT = 210;
const PAD = { left: 54, right: 16, top: 16, bottom: 32 };

function numberValue(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function historyTime(item) {
  const timestamp = item.last_changed || item.last_updated;
  return timestamp ? new Date(timestamp).getTime() : Number(item.lu) * 1000;
}

function chartDomain(values) {
  if (values.length === 0) return { min: 0, max: 10 };

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const midpoint = (rawMin + rawMax) / 2;
  const span = Math.max(4, rawMax - rawMin + 1);
  return {
    min: Math.floor(midpoint - span / 2),
    max: Math.ceil(midpoint + span / 2),
  };
}

export function ColdPlungeTemperatureChart({ entityId, currentTemperature, color }) {
  const clipId = useId().replace(/:/g, '');
  const [initialEnd] = useState(Date.now);
  const { history, loading, error, updatedAt } = useColdPlungeHistory(entityId, 24);
  const end = updatedAt ?? initialEnd;
  const chart = useMemo(() => {
    const start = end - 24 * 60 * 60 * 1000;
    const points = history.map((item) => ({
      time: historyTime(item),
      value: numberValue(item.state ?? item.s),
    })).filter((point) => point.value != null && Number.isFinite(point.time) && point.time >= start && point.time <= end);
    const values = points.map((point) => point.value);
    if (currentTemperature != null) values.push(currentTemperature);
    return { start, end, points, ...chartDomain(values) };
  }, [currentTemperature, end, history]);

  const plotWidth = CHART_WIDTH - PAD.left - PAD.right;
  const plotHeight = CHART_HEIGHT - PAD.top - PAD.bottom;
  const x = (time) => PAD.left + ((time - chart.start) / (chart.end - chart.start)) * plotWidth;
  const y = (value) => PAD.top + ((chart.max - value) / (chart.max - chart.min || 1)) * plotHeight;
  const path = chart.points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.time).toFixed(1)} ${y(point.value).toFixed(1)}`).join(' ');
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => chart.max - (chart.max - chart.min) * fraction);

  return (
    <section className="w-full flex-shrink-0 rounded-xl border px-4 py-3 text-left" style={{ borderColor: 'var(--ds-border)', backgroundColor: 'var(--ds-warm-inactive-bg)' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Thermometer size={18} style={{ color }} />
            <h3 className="text-sm font-bold text-[var(--ds-text)]">Temperature history</h3>
          </div>
          <div className="mt-1 pl-[26px] text-xs font-semibold" style={{ color }}>
            Current {currentTemperature != null ? `${currentTemperature.toFixed(1)}°C` : '--'}
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--ds-text-secondary)]">
          <Clock3 size={14} />
          24 hours
        </span>
      </div>

      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="mt-1 h-[210px] w-full" role="img" aria-label="Cold plunge water temperature over the last 24 hours">
        <defs>
          <clipPath id={clipId}>
            <rect x={PAD.left} y={PAD.top} width={plotWidth} height={plotHeight} />
          </clipPath>
        </defs>
        {ticks.map((value) => {
          const lineY = y(value);
          return (
            <g key={value}>
              <line x1={PAD.left} x2={CHART_WIDTH - PAD.right} y1={lineY} y2={lineY} stroke="var(--ds-border)" strokeDasharray="4 5" />
              <text x={PAD.left - 9} y={lineY + 5} textAnchor="end" fontSize="14" fontWeight="700" fill="var(--ds-text-secondary)">{value.toFixed(1)}°</text>
            </g>
          );
        })}
        <text x={PAD.left} y={CHART_HEIGHT - 5} fontSize="13" fontWeight="600" fill="var(--ds-text-secondary)">24h ago</text>
        <text x={CHART_WIDTH - PAD.right} y={CHART_HEIGHT - 5} textAnchor="end" fontSize="13" fontWeight="600" fill="var(--ds-text-secondary)">Now</text>
        <g clipPath={`url(#${clipId})`}>
          {chart.points.length > 1 && <path d={path} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
          {chart.points.length === 1 && <circle cx={x(chart.points[0].time)} cy={y(chart.points[0].value)} r="5" fill={color} />}
        </g>
        {chart.points.length === 0 && <text x={CHART_WIDTH / 2} y={PAD.top + plotHeight / 2} textAnchor="middle" fontSize="15" fill="var(--ds-text-secondary)">History is collecting</text>}
      </svg>

      {loading && <div className="text-xs text-[var(--ds-text-secondary)]">Updating history...</div>}
      {error && <div className="text-xs text-[var(--ds-health-warn)]">History temporarily unavailable.</div>}
    </section>
  );
}

export default ColdPlungeTemperatureChart;
