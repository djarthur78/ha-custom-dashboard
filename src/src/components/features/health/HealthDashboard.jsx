/**
 * HealthDashboard Component
 * Clean, single-screen health dashboard - no scrolling on 1920x1080
 * CSS Grid layout: score rings | 3-col main content | bottom row
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Heart, Activity, RefreshCw, Footprints, Flame, Zap,
  TrendingDown, TrendingUp, Clock, Timer,
} from 'lucide-react';
import { ScoreRing } from './ScoreRing';
import { MetricCard, HeroMetric, ProgressMetric } from './MetricCard';
import { ColdPlungeControls } from './ColdPlungeControls';
import { SleepBreakdown } from './SleepBreakdown';
import { useEntity } from '../../../hooks/useEntity';
import { useYesterdayValue } from '../../../hooks/useYesterdayValue';
import haWebSocket from '../../../services/ha-websocket';
import {
  OURA_SCORES,
  OURA_SLEEP,
  OURA_HEART,
  OURA_ACTIVITY,
  OURA_BODY,
  OURA_STRESS,
} from './healthConfig';

function formatHours(val) {
  if (!val || val === 'unavailable' || val === 'unknown') return '--';
  const h = Math.floor(parseFloat(val));
  const m = Math.round((parseFloat(val) - h) * 60);
  return `${h}h ${m}m`;
}

function formatTime(val) {
  if (!val || val === 'unavailable' || val === 'unknown') return '--';
  try {
    const d = new Date(val);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--';
  }
}

function formatNumber(val) {
  if (!val || val === 'unavailable' || val === 'unknown') return '--';
  const n = parseFloat(val);
  if (isNaN(n)) return '--';
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : Math.round(n).toString();
}

/**
 * Section label - subtle uppercase text with thin border
 */
function SectionLabel({ children }) {
  return (
    <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 pb-1"
      style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      {children}
    </div>
  );
}

/**
 * HeartRateRange - visual min/current/max range bar
 */
function HeartRateRange() {
  const current = useEntity(OURA_HEART.current);
  const min = useEntity(OURA_HEART.min);
  const max = useEntity(OURA_HEART.max);

  const curVal = parseInt(current.state, 10);
  const minVal = parseInt(min.state, 10);
  const maxVal = parseInt(max.state, 10);

  if (isNaN(curVal) || isNaN(minVal) || isNaN(maxVal)) return null;

  const range = maxVal - minVal || 1;
  const curPct = Math.max(0, Math.min(100, ((curVal - minVal) / range) * 100));

  return (
    <div className="rounded-lg p-2.5" style={{
      backgroundColor: 'rgba(239, 68, 68, 0.04)',
      border: '1px solid rgba(239, 68, 68, 0.1)',
    }}>
      <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
        Today's Range
      </div>
      <div className="relative rounded-full" style={{ height: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
        <div
          className="absolute rounded-full"
          style={{
            height: 6,
            left: 0,
            right: 0,
            background: 'linear-gradient(90deg, #93c5fd, #ef4444, #dc2626)',
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{
            left: `${curPct}%`,
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            border: '2px solid white',
            boxShadow: '0 1px 4px rgba(239,68,68,0.4)',
            transform: 'translate(-50%, -50%)',
            marginTop: 3,
          }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] font-bold" style={{ color: '#93c5fd' }}>
          <TrendingDown size={9} className="inline mr-0.5" />{minVal}
        </span>
        <span className="text-[10px] font-bold" style={{ color: '#ef4444' }}>
          {curVal} bpm
        </span>
        <span className="text-[10px] font-bold" style={{ color: '#dc2626' }}>
          {maxVal}<TrendingUp size={9} className="inline ml-0.5" />
        </span>
      </div>
    </div>
  );
}

/**
 * ActivityBreakdown - visual time bars for activity levels
 */
function ActivityBreakdown() {
  const high = useEntity(OURA_ACTIVITY.high_activity);
  const medium = useEntity(OURA_ACTIVITY.medium_activity);
  const low = useEntity(OURA_ACTIVITY.low_activity);

  const levels = [
    { label: 'High', value: parseFloat(high.state) || 0, color: '#ef4444', icon: Zap },
    { label: 'Med', value: parseFloat(medium.state) || 0, color: '#f59e0b', icon: Activity },
    { label: 'Low', value: parseFloat(low.state) || 0, color: '#22c55e', icon: Footprints },
  ];

  const maxVal = Math.max(...levels.map(l => l.value), 1);

  return (
    <div className="space-y-2">
      {levels.map(({ label, value, color, icon: LIcon }) => (
        <div key={label}>
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1">
              <LIcon size={10} style={{ color }} />
              <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase">{label}</span>
            </div>
            <span className="text-xs font-bold text-[var(--color-text)]">{Math.round(value)}m</span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 5, backgroundColor: `${color}12` }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(value / maxVal) * 100}%`,
                background: `linear-gradient(90deg, ${color}, ${color}bb)`,
                minWidth: value > 0 ? 3 : 0,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * StressBadge - visual status indicator
 */
function StressBadge({ entityId, label }) {
  const { state } = useEntity(entityId);
  const val = state && state !== 'unavailable' && state !== 'unknown' ? state : null;

  const badgeColors = {
    restored: { bg: '#22c55e20', text: '#16a34a', border: '#22c55e30' },
    normal: { bg: '#3b82f620', text: '#2563eb', border: '#3b82f630' },
    strained: { bg: '#f59e0b20', text: '#d97706', border: '#f59e0b30' },
    stressed: { bg: '#ef444420', text: '#dc2626', border: '#ef444430' },
    strong: { bg: '#22c55e20', text: '#16a34a', border: '#22c55e30' },
    adequate: { bg: '#3b82f620', text: '#2563eb', border: '#3b82f630' },
    limited: { bg: '#f59e0b20', text: '#d97706', border: '#f59e0b30' },
  };

  const colors = val ? (badgeColors[val.toLowerCase()] || badgeColors.normal) : { bg: '#9ca3af15', text: '#6b7280', border: '#9ca3af20' };

  return (
    <div className="rounded-lg p-2.5" style={{
      backgroundColor: colors.bg,
      border: `1px solid ${colors.border}`,
    }}>
      <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5">
        {label}
      </div>
      <div className="text-sm font-black" style={{ color: colors.text }}>
        {val ? val.charAt(0).toUpperCase() + val.slice(1) : '--'}
      </div>
    </div>
  );
}

/**
 * TempDeviation - compact temperature deviation display
 */
function TempDeviation() {
  const { state } = useEntity(OURA_BODY.temp_deviation);
  const val = parseFloat(state);
  const isValid = !isNaN(val) && state !== 'unavailable';
  const isPositive = isValid && val > 0;
  const color = isValid
    ? (Math.abs(val) <= 0.5 ? '#22c55e' : Math.abs(val) <= 1 ? '#f59e0b' : '#ef4444')
    : '#9ca3af';

  return (
    <div className="rounded-lg p-2.5" style={{
      backgroundColor: `${color}08`,
      border: `1px solid ${color}15`,
    }}>
      <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5">
        Temp Deviation
      </div>
      <div className="flex items-center gap-1.5">
        {isValid && (isPositive
          ? <TrendingUp size={14} style={{ color }} />
          : <TrendingDown size={14} style={{ color }} />
        )}
        <span className="text-lg font-black" style={{ color, letterSpacing: '-0.5px' }}>
          {isValid ? `${isPositive ? '+' : ''}${val.toFixed(2)}` : '--'}
        </span>
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">&deg;C</span>
      </div>
    </div>
  );
}

/**
 * YesterdayComparison wrapper - fetches yesterday value for display
 */
function StepsWithYesterday() {
  const yesterday = useYesterdayValue(OURA_ACTIVITY.steps);
  return (
    <ProgressMetric
      entityId={OURA_ACTIVITY.steps}
      label="Steps"
      goal={10000}
      color="#22c55e"
      yesterday={yesterday ? formatNumber(yesterday) : null}
    />
  );
}

function CaloriesWithYesterday() {
  const yesterday = useYesterdayValue(OURA_ACTIVITY.active_calories);
  return (
    <ProgressMetric
      entityId={OURA_ACTIVITY.active_calories}
      label="Active Cal"
      goal={500}
      unit="kcal"
      color="#f59e0b"
      yesterday={yesterday ? formatNumber(yesterday) : null}
    />
  );
}

function HRVWithYesterday() {
  const yesterday = useYesterdayValue(OURA_HEART.avg_sleep_hrv);
  return (
    <MetricCard
      entityId={OURA_HEART.avg_sleep_hrv}
      label="Sleep HRV"
      unit="ms"
      yesterday={yesterday ? `${Math.round(parseFloat(yesterday))} ms` : null}
    />
  );
}

export function HealthDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const refreshOura = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await haWebSocket.send({
        type: 'config_entries/reload',
        entry_id: '01KJHSA41S3RQM9MX1RRCBMZC8',
      });
      if (mountedRef.current) setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to refresh Oura data:', err);
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  }, [refreshing]);

  const hasAutoRefreshed = useRef(false);
  useEffect(() => {
    if (!hasAutoRefreshed.current) {
      hasAutoRefreshed.current = true;
      refreshOura();
    }
  }, [refreshOura]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      height: '100%',
      gap: '10px',
      minHeight: 0,
    }}>
      {/* === ROW 1: SCORE RINGS === */}
      <div className="rounded-xl flex items-center justify-between px-6 py-3" style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div className="flex items-center gap-12">
          <ScoreRing entityId={OURA_SCORES.sleep} label="Sleep" size={100} strokeWidth={9} />
          <ScoreRing entityId={OURA_SCORES.readiness} label="Readiness" size={100} strokeWidth={9} />
          <ScoreRing entityId={OURA_SCORES.activity} label="Activity" size={100} strokeWidth={9} />
        </div>
        <button
          onClick={refreshOura}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            backgroundColor: refreshing ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.03)',
            color: 'var(--color-text-secondary)',
            border: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Syncing...' : 'Sync Oura'}
          {lastRefreshed && !refreshing && (
            <span className="text-[10px] opacity-50">
              {lastRefreshed.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </button>
      </div>

      {/* === ROW 2: MAIN 3-COLUMN CONTENT === */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '10px',
        minHeight: 0,
      }}>
        {/* SLEEP COLUMN */}
        <div className="rounded-xl p-4 overflow-hidden" style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid rgba(0,0,0,0.06)',
          minHeight: 0,
        }}>
          <SectionLabel>Sleep</SectionLabel>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <MetricCard entityId={OURA_SLEEP.total_duration} label="Total Sleep" format={formatHours} />
            <MetricCard entityId={OURA_SLEEP.efficiency} label="Efficiency" unit="%" />
          </div>
          <SleepBreakdown
            deepId={OURA_SLEEP.deep_duration}
            lightId={OURA_SLEEP.light_duration}
            remId={OURA_SLEEP.rem_duration}
            awakeId={OURA_SLEEP.awake_time}
          />
          <div className="grid grid-cols-2 gap-2 mt-3">
            <MetricCard entityId={OURA_SLEEP.bedtime_start} label="Bedtime" icon={<Clock size={12} />} format={formatTime} />
            <MetricCard entityId={OURA_SLEEP.bedtime_end} label="Wake Up" icon={<Clock size={12} />} format={formatTime} />
          </div>
        </div>

        {/* HEART & BODY COLUMN */}
        <div className="rounded-xl p-4 overflow-hidden" style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid rgba(0,0,0,0.06)',
          minHeight: 0,
        }}>
          <SectionLabel>Heart & Body</SectionLabel>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <HeroMetric
              entityId={OURA_HEART.current}
              label="Current"
              unit="bpm"
              color="#ef4444"
              icon={<Heart size={18} />}
            />
            <HeroMetric
              entityId={OURA_HEART.avg_sleep_hrv}
              label="Sleep HRV"
              unit="ms"
              color="#8b5cf6"
              icon={<Activity size={18} />}
            />
          </div>
          <HeartRateRange />
          <div className="grid grid-cols-2 gap-2 mt-3">
            <MetricCard entityId={OURA_HEART.average} label="Resting HR" unit="bpm"
              format={(v) => v && v !== 'unavailable' ? Math.round(parseFloat(v)) : '--'} />
            <MetricCard entityId={OURA_HEART.lowest_sleep} label="Lowest (Sleep)" unit="bpm" />
          </div>
          <div className="mt-3">
            <TempDeviation />
          </div>
        </div>

        {/* ACTIVITY COLUMN */}
        <div className="rounded-xl p-4 overflow-hidden" style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid rgba(0,0,0,0.06)',
          minHeight: 0,
        }}>
          <SectionLabel>Activity</SectionLabel>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <StepsWithYesterday />
            <CaloriesWithYesterday />
          </div>
          <ActivityBreakdown />
        </div>
      </div>

      {/* === ROW 3: BOTTOM - STRESS + COLD PLUNGE === */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '10px',
        minHeight: 0,
      }}>
        {/* STRESS & RECOVERY */}
        <div className="rounded-xl p-4" style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}>
          <SectionLabel>Stress & Recovery</SectionLabel>
          <div className="grid grid-cols-4 gap-2">
            <StressBadge entityId={OURA_STRESS.day_summary} label="Day Summary" />
            <StressBadge entityId={OURA_STRESS.resilience} label="Resilience" />
            <MetricCard entityId={OURA_STRESS.stress_high} label="High Stress" unit="min"
              icon={<Timer size={12} />} />
            <MetricCard entityId={OURA_STRESS.recovery_high} label="Recovery" unit="min"
              icon={<Timer size={12} />} />
          </div>
        </div>

        {/* COLD PLUNGE */}
        <div className="rounded-xl p-4" style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}>
          <ColdPlungeControls />
        </div>
      </div>
    </div>
  );
}
