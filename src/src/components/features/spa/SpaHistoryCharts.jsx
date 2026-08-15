import { useMemo } from 'react';
import { Activity, Clock3, Droplets, Thermometer } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { useSpaHistory } from './hooks/useSpaHistory';
import { SPA_ENTITIES, SPA_HISTORY_ENTITIES } from './spaConfig';

const CHART_WIDTH = 640;
const CHART_HEIGHT = 142;
const PAD = { left: 40, right: 12, top: 12, bottom: 22 };

function numberValue(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function historyPoints(history, entityId, start, end) {
  return (history?.[entityId] || []).map((item) => ({
    time: item.last_changed || item.last_updated
      ? new Date(item.last_changed || item.last_updated).getTime()
      : Number(item.lu) * 1000,
    value: numberValue(item.state ?? item.s),
  })).filter((point) => point.value != null && Number.isFinite(point.time) && point.time >= start && point.time <= end);
}

function formatAxisValue(value, decimals = 1) {
  return Number.isFinite(value) ? value.toFixed(decimals) : '--';
}

function LineChart({ title, icon: Icon, unit, series, band, decimals = 1, height = CHART_HEIGHT, focus = null }) {
  const chart = useMemo(() => {
    const end = Date.now();
    const start = end - 24 * 60 * 60 * 1000;
    const pointsBySeries = series.map((item) => ({
      ...item,
      points: item.points.filter((point) => point.time >= start && point.time <= end),
    }));
    const values = pointsBySeries.flatMap((item) => item.points.map((point) => point.value));
    if (band) values.push(band.min, band.max);
    if (values.length === 0) return { start, end, pointsBySeries, min: 0, max: 1 };
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const range = Math.max(rawMax - rawMin, 0.001);
    const bandSpan = band ? Math.max(band.max - band.min, 0.001) : 0;
    const defaultCenter = band ? (band.min + band.max) / 2 : (rawMin + rawMax) / 2;
    const center = focus?.center ?? defaultCenter;
    const minSpan = focus?.span ?? Math.max(
      range * 1.4,
      bandSpan * 1.8,
      unit === 'pH' ? 0.8 : unit === 'mV' ? 180 : 2.8,
    );
    let min = center - minSpan / 2;
    let max = center + minSpan / 2;
    if (rawMin < min) min = rawMin - Math.max(range * 0.08, unit === 'pH' ? 0.04 : 0.8);
    if (rawMax > max) max = rawMax + Math.max(range * 0.08, unit === 'pH' ? 0.04 : 0.8);
    return { start, end, pointsBySeries, min, max };
  }, [band, focus, series, unit]);

  const plotWidth = CHART_WIDTH - PAD.left - PAD.right;
  const plotHeight = height - PAD.top - PAD.bottom;
  const y = (value) => PAD.top + ((chart.max - value) / (chart.max - chart.min || 1)) * plotHeight;
  const x = (time) => PAD.left + ((time - chart.start) / (chart.end - chart.start)) * plotWidth;
  const pathFor = (points) => points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.time).toFixed(1)} ${y(point.value).toFixed(1)}`).join(' ');
  const hasData = chart.pointsBySeries.some((item) => item.points.length > 0);
  const bandY = band ? y(band.max) : null;
  const bandHeight = band ? Math.max(0, y(band.min) - bandY) : 0;
  const labelTop = PAD.top + 4;

  return (
    <div className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--ds-border)', backgroundColor: 'var(--ds-warm-inactive-bg)' }}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={16} className="text-[var(--ds-accent)] flex-shrink-0" />
          <span className="text-sm font-bold text-[var(--ds-text)]">{title}</span>
          {band && <span className="text-[13px] text-[var(--ds-text-secondary)]">target {formatAxisValue(band.min, decimals)}–{formatAxisValue(band.max, decimals)} {unit}</span>}
        </div>
        <span className="text-[13px] text-[var(--ds-text-secondary)]">24 hours</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 pb-1">
        {series.map((item) => {
          const latest = item.current ?? item.points[item.points.length - 1]?.value;
          return <span key={`${item.label}-current`} className="text-[13px] font-semibold" style={{ color: item.color }}>{item.label}: {formatAxisValue(latest, decimals)}{unit}</span>;
        })}
      </div>
      <svg viewBox={`0 0 ${CHART_WIDTH} ${height}`} className="w-full" style={{ height: `${height}px` }} role="img" aria-label={`${title} over the last 24 hours`}>
        <line x1={PAD.left} x2={CHART_WIDTH - PAD.right} y1={PAD.top + plotHeight} y2={PAD.top + plotHeight} stroke="var(--ds-border)" />
        <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top + plotHeight} stroke="var(--ds-border)" />
        {band && <rect x={PAD.left} y={bandY} width={plotWidth} height={bandHeight} fill="rgba(69,151,120,0.12)" />}
        {[0, 0.5, 1].map((fraction) => {
          const value = chart.max - (chart.max - chart.min) * fraction;
          const lineY = PAD.top + plotHeight * fraction;
          return <g key={fraction}>
            <line x1={PAD.left} x2={CHART_WIDTH - PAD.right} y1={lineY} y2={lineY} stroke="var(--ds-border)" strokeDasharray="3 4" opacity="0.65" />
            <text x={PAD.left - 6} y={lineY + 4} textAnchor="end" fontSize="13" fill="var(--ds-text-secondary)">{formatAxisValue(value, decimals)}</text>
          </g>;
        })}
        <text x={PAD.left} y={height - 3} fontSize="13" fill="var(--ds-text-secondary)">24h ago</text>
        <text x={CHART_WIDTH - PAD.right} y={height - 3} textAnchor="end" fontSize="13" fill="var(--ds-text-secondary)">Now</text>
        {chart.pointsBySeries.map((item) => item.points.length > 1 && (
          <path key={item.label} d={pathFor(item.points)} fill="none" stroke={item.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {!hasData && <text x={CHART_WIDTH / 2} y={labelTop + plotHeight / 2 + 4} textAnchor="middle" fontSize="13" fill="var(--ds-text-secondary)">History is collecting</text>}
      </svg>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[var(--ds-text-secondary)]">
        {series.map((item) => <span key={item.label} className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>)}
        {band && <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: 'rgba(69,151,120,0.35)' }} />ICO target band</span>}
      </div>
    </div>
  );
}

export function SpaHistoryCharts() {
  const { history, loading, error } = useSpaHistory(24);
  const balboaTemperature = useEntity(SPA_HISTORY_ENTITIES.balboaTemperature);
  const icoTemperature = useEntity(SPA_HISTORY_ENTITIES.icoTemperature);
  const targetTemperature = useEntity(SPA_HISTORY_ENTITIES.targetTemperature);
  const ph = useEntity(SPA_HISTORY_ENTITIES.ph);
  const orp = useEntity(SPA_HISTORY_ENTITIES.orp);
  const phMinimum = useEntity(SPA_ENTITIES.phMinimum);
  const phMaximum = useEntity(SPA_ENTITIES.phMaximum);
  const end = Date.now();
  const start = end - 24 * 60 * 60 * 1000;
  const points = (entityId) => historyPoints(history, entityId, start, end);
  const current = (entity, decimals = 1) => {
    const value = numberValue(entity.state);
    return value == null ? null : Number(value.toFixed(decimals));
  };

  const temperatureSeries = [
    { label: 'Balboa', color: '#c56b54', points: points(SPA_HISTORY_ENTITIES.balboaTemperature), current: current(balboaTemperature) },
    { label: 'ICO', color: '#4d89a8', points: points(SPA_HISTORY_ENTITIES.icoTemperature), current: current(icoTemperature) },
    { label: 'Target', color: '#8b7a68', points: points(SPA_HISTORY_ENTITIES.targetTemperature), current: current(targetTemperature) },
  ];
  const tempFocus = {
    center: current(targetTemperature) ?? current(balboaTemperature) ?? 38,
    span: 3.6,
  };
  const phFocus = {
    center: ((numberValue(phMinimum.state) ?? 7.2) + (numberValue(phMaximum.state) ?? 7.6)) / 2,
    span: 0.8,
  };
  const orpFocus = {
    center: (550 + 650) / 2,
    span: 220,
  };

  return (
    <div className="ds-card flex min-h-0 flex-col" style={{ padding: 16 }}>
      <div className="flex items-center justify-between pb-3 border-b border-[var(--ds-border)]">
        <div>
          <h3 className="text-base font-bold text-[var(--ds-text)]">Spa History</h3>
          <p className="mt-0.5 text-xs text-[var(--ds-text-secondary)]">24-hour view, centred on the useful range</p>
        </div>
        <Clock3 size={18} className="text-[var(--ds-text-secondary)]" />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 pt-2 pr-1 lg:grid-cols-2 lg:overflow-hidden">
        <div className="lg:col-span-2">
          <LineChart
            title="Temperature"
            icon={Thermometer}
            unit="°C"
            series={temperatureSeries}
            decimals={1}
            height={168}
            focus={tempFocus}
          />
        </div>
        <LineChart
          title="pH"
          icon={Droplets}
          unit=""
          band={{ min: 7.2, max: 7.6 }}
          series={[{ label: 'ICO pH', color: '#7b6aa8', points: points(SPA_HISTORY_ENTITIES.ph), current: current(ph, 2) }]}
          decimals={2}
          height={148}
          focus={phFocus}
        />
        <LineChart
          title="Disinfection (ORP)"
          icon={Activity}
          unit="mV"
          band={{ min: 550, max: 650 }}
          series={[{ label: 'ICO ORP', color: '#4e9b7b', points: points(SPA_HISTORY_ENTITIES.orp), current: current(orp, 0) }]}
          decimals={0}
          height={148}
          focus={orpFocus}
        />
      </div>
      {loading && <div className="pt-2 text-xs text-[var(--ds-text-secondary)]">Updating history...</div>}
      {error && <div className="pt-2 text-xs text-[var(--ds-health-warn)]">History temporarily unavailable.</div>}
    </div>
  );
}

export default SpaHistoryCharts;
