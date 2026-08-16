import { createElement, useId, useMemo, useState } from 'react';
import { Activity, Clock3, Droplets, Thermometer } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { useSpaHistory } from './hooks/useSpaHistory';
import { SPA_ENTITIES, SPA_HISTORY_ENTITIES } from './spaConfig';

const CHART_WIDTH = 600;
const CHART_HEIGHT = 292;
const PAD = { left: 62, right: 18, top: 18, bottom: 34 };

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

function domainForSeries(pointsBySeries, band, focus, unit) {
  const currentValues = pointsBySeries
    .map((item) => item.current ?? item.points[item.points.length - 1]?.value)
    .filter(Number.isFinite);

  if (band) {
    const bandSpan = Math.max(band.max - band.min, 0.001);
    const padding = bandSpan * 0.2;
    const currentMin = currentValues.length ? Math.min(...currentValues) : band.min;
    const currentMax = currentValues.length ? Math.max(...currentValues) : band.max;
    return {
      min: Math.min(band.min - padding, currentMin - bandSpan * 0.1),
      max: Math.max(band.max + padding, currentMax + bandSpan * 0.1),
    };
  }

  const values = pointsBySeries.flatMap((item) => item.points.map((point) => point.value));
  values.push(...currentValues);
  if (values.length === 0) return { min: 0, max: 1 };
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const center = focus?.center ?? (rawMin + rawMax) / 2;
  const minimumSpan = focus?.span ?? (unit === '°C' ? 3 : 1);
  const dataSpan = Math.max(rawMax - rawMin, minimumSpan);
  const span = Math.max(minimumSpan, dataSpan * 1.18);
  return {
    min: Math.min(center - span / 2, rawMin - span * 0.04),
    max: Math.max(center + span / 2, rawMax + span * 0.04),
  };
}

function LineChart({ title, icon, unit, series, band, decimals = 1, focus = null, now }) {
  const clipId = useId().replace(/:/g, '');
  const chart = useMemo(() => {
    const end = now;
    const start = end - 24 * 60 * 60 * 1000;
    const pointsBySeries = series.map((item) => ({
      ...item,
      points: item.points.filter((point) => point.time >= start && point.time <= end),
    }));
    return { start, end, pointsBySeries, ...domainForSeries(pointsBySeries, band, focus, unit) };
  }, [band, focus, now, series, unit]);

  const plotWidth = CHART_WIDTH - PAD.left - PAD.right;
  const plotHeight = CHART_HEIGHT - PAD.top - PAD.bottom;
  const y = (value) => PAD.top + ((chart.max - value) / (chart.max - chart.min || 1)) * plotHeight;
  const x = (time) => PAD.left + ((time - chart.start) / (chart.end - chart.start)) * plotWidth;
  const pathFor = (points) => points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.time).toFixed(1)} ${y(point.value).toFixed(1)}`).join(' ');
  const hasData = chart.pointsBySeries.some((item) => item.points.length > 0);
  const bandY = band ? Math.max(PAD.top, y(band.max)) : null;
  const bandBottom = band ? Math.min(PAD.top + plotHeight, y(band.min)) : null;
  const bandHeight = band ? Math.max(0, bandBottom - bandY) : 0;
  const ticks = band
    ? [chart.max, band.max, (band.min + band.max) / 2, band.min, chart.min]
    : [0, 0.25, 0.5, 0.75, 1].map((fraction) => chart.max - (chart.max - chart.min) * fraction);

  return (
    <article className="flex h-full min-h-0 flex-col rounded-xl border px-4 py-3" style={{ borderColor: 'var(--ds-border)', backgroundColor: 'var(--ds-warm-inactive-bg)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            {createElement(icon, { size: 20, className: 'shrink-0 text-[var(--ds-accent)]' })}
            <h4 className="text-base font-bold text-[var(--ds-text)]">{title}</h4>
          </div>
          {band && (
            <div className="mt-1 pl-[30px] text-sm font-semibold text-[var(--ds-health-good)]">
              Good range {formatAxisValue(band.min, decimals)}–{formatAxisValue(band.max, decimals)} {unit}
            </div>
          )}
        </div>
        <span className="shrink-0 text-sm font-medium text-[var(--ds-text-secondary)]">24 hours</span>
      </div>

      <div className="mt-2 flex min-h-[24px] flex-wrap gap-x-4 gap-y-1">
        {series.map((item) => {
          const latest = item.current ?? item.points[item.points.length - 1]?.value;
          return (
            <span key={`${item.label}-current`} className="text-sm font-bold" style={{ color: item.color }}>
              {item.label}: {formatAxisValue(latest, decimals)}{unit}
            </span>
          );
        })}
      </div>

      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="mt-1 min-h-0 w-full flex-1" role="img" aria-label={`${title} over the last 24 hours`}>
        <defs>
          <clipPath id={clipId}>
            <rect x={PAD.left} y={PAD.top} width={plotWidth} height={plotHeight} />
          </clipPath>
        </defs>
        {band && (
          <g>
            <rect x={PAD.left} y={bandY} width={plotWidth} height={bandHeight} rx="5" fill="rgba(74,154,74,0.24)" />
            {bandHeight > 30 && (
              <text x={PAD.left + 12} y={bandY + 20} fontSize="14" fontWeight="700" fill="var(--ds-health-good)">GOOD RANGE</text>
            )}
          </g>
        )}
        {ticks.map((value) => {
          const lineY = y(value);
          return (
            <g key={value}>
              <line x1={PAD.left} x2={CHART_WIDTH - PAD.right} y1={lineY} y2={lineY} stroke="var(--ds-border)" strokeDasharray="4 5" opacity="0.9" />
              <text x={PAD.left - 10} y={lineY + 6} textAnchor="end" fontSize="18" fontWeight="700" fill="var(--ds-text-secondary)">
                {formatAxisValue(value, decimals)}
              </text>
            </g>
          );
        })}
        <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top + plotHeight} stroke="var(--ds-border)" />
        <text x={PAD.left} y={CHART_HEIGHT - 6} fontSize="16" fontWeight="600" fill="var(--ds-text-secondary)">24h ago</text>
        <text x={CHART_WIDTH - PAD.right} y={CHART_HEIGHT - 6} textAnchor="end" fontSize="16" fontWeight="600" fill="var(--ds-text-secondary)">Now</text>
        <g clipPath={`url(#${clipId})`}>
          {chart.pointsBySeries.map((item) => item.points.length > 1 && (
            <path key={item.label} d={pathFor(item.points)} fill="none" stroke={item.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </g>
        {!hasData && <text x={CHART_WIDTH / 2} y={PAD.top + plotHeight / 2} textAnchor="middle" fontSize="16" fill="var(--ds-text-secondary)">History is collecting</text>}
      </svg>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--ds-text-secondary)]">
        {series.map((item) => <span key={item.label} className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>)}
        {band && <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: 'rgba(74,154,74,0.45)' }} />Good range</span>}
      </div>
    </article>
  );
}

export function SpaHistoryCharts() {
  const [end] = useState(Date.now);
  const { history, loading, error } = useSpaHistory(24);
  const balboaTemperature = useEntity(SPA_HISTORY_ENTITIES.balboaTemperature);
  const icoTemperature = useEntity(SPA_HISTORY_ENTITIES.icoTemperature);
  const targetTemperature = useEntity(SPA_HISTORY_ENTITIES.targetTemperature);
  const ph = useEntity(SPA_HISTORY_ENTITIES.ph);
  const orp = useEntity(SPA_HISTORY_ENTITIES.orp);
  const phMinimum = useEntity(SPA_ENTITIES.phMinimum);
  const phMaximum = useEntity(SPA_ENTITIES.phMaximum);
  const orpMinimum = useEntity(SPA_ENTITIES.orpMinimum);
  const orpMaximum = useEntity(SPA_ENTITIES.orpMaximum);
  const start = end - 24 * 60 * 60 * 1000;
  const points = (entityId) => historyPoints(history, entityId, start, end);
  const current = (entity, decimals = 1) => {
    const value = numberValue(entity.state);
    return value == null ? null : Number(value.toFixed(decimals));
  };

  const targetValue = current(targetTemperature);
  const phMin = numberValue(phMinimum.state) ?? 7.2;
  const phMax = numberValue(phMaximum.state) ?? 7.6;
  const orpMin = numberValue(orpMinimum.state) ?? 550;
  const orpMax = numberValue(orpMaximum.state) ?? 650;
  const temperatureSeries = [
    { label: 'Balboa', color: '#c56b54', points: points(SPA_HISTORY_ENTITIES.balboaTemperature), current: current(balboaTemperature) },
    { label: 'ICO', color: '#4d89a8', points: points(SPA_HISTORY_ENTITIES.icoTemperature), current: current(icoTemperature) },
    { label: 'Target', color: '#8b7a68', points: points(SPA_HISTORY_ENTITIES.targetTemperature), current: targetValue },
  ];

  return (
    <section className="ds-card flex h-full min-h-0 flex-col" style={{ padding: 16 }}>
      <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-3">
        <div>
          <h3 className="text-xl font-bold text-[var(--ds-text)]">Spa history</h3>
          <p className="mt-0.5 text-sm text-[var(--ds-text-secondary)]">Last 24 hours · focused around the useful range</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--ds-text-secondary)]">
          <Clock3 size={18} />
          Live Home Assistant history
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 pt-3 lg:grid-cols-3">
        <LineChart
          title="Temperature"
          icon={Thermometer}
          unit="°C"
          series={temperatureSeries}
          band={targetValue == null ? null : { min: targetValue - 1, max: targetValue + 1 }}
          decimals={1}
          focus={{ center: targetValue ?? current(balboaTemperature) ?? 38, span: 3.2 }}
          now={end}
        />
        <LineChart
          title="pH"
          icon={Droplets}
          unit=""
          band={{ min: phMin, max: phMax }}
          series={[{ label: 'ICO pH', color: '#7b6aa8', points: points(SPA_HISTORY_ENTITIES.ph), current: current(ph, 2) }]}
          decimals={2}
          now={end}
        />
        <LineChart
          title="Disinfection (ORP)"
          icon={Activity}
          unit="mV"
          band={{ min: orpMin, max: orpMax }}
          series={[{ label: 'ICO ORP', color: '#4e9b7b', points: points(SPA_HISTORY_ENTITIES.orp), current: current(orp, 0) }]}
          decimals={0}
          now={end}
        />
      </div>
      {loading && <div className="pt-2 text-sm text-[var(--ds-text-secondary)]">Updating history...</div>}
      {error && <div className="pt-2 text-sm text-[var(--ds-health-warn)]">History temporarily unavailable.</div>}
    </section>
  );
}

export default SpaHistoryCharts;
