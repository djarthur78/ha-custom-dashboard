/**
 * HealthDashboard Component
 * Epic health & wellness dashboard with Oura Ring data and Cold Plunge controls
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Heart, Activity, Thermometer, Brain, Moon, Clock, RefreshCw,
  Footprints, Flame, Zap, TrendingDown, TrendingUp, Wind, Droplets, Timer,
} from 'lucide-react';
import { ScoreRing } from './ScoreRing';
import { MetricCard, HeroMetric, ProgressMetric } from './MetricCard';
import { ColdPlungeControls } from './ColdPlungeControls';
import { SleepBreakdown } from './SleepBreakdown';
import { useEntity } from '../../../hooks/useEntity';
import haWebSocket from '../../../services/ha-websocket';
import {
  OURA_SCORES,
  OURA_SLEEP,
  OURA_HEART,
  OURA_ACTIVITY,
  OURA_BODY,
  OURA_STRESS,
  getScoreColor,
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

/**
 * SectionCard with gradient header strip
 */
function SectionCard({ icon: Icon, title, gradient, children }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{
      backgroundColor: 'var(--color-surface)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <div className="px-5 py-3 flex items-center gap-2" style={{ background: gradient }}>
        <Icon size={18} style={{ color: 'white' }} />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-5">
        {children}
      </div>
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
    <div className="mt-4 rounded-xl p-4" style={{
      backgroundColor: 'rgba(239, 68, 68, 0.04)',
      border: '1px solid rgba(239, 68, 68, 0.1)',
    }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Today's Range</span>
      </div>
      <div className="relative rounded-full" style={{ height: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
        <div
          className="absolute rounded-full"
          style={{
            height: 8,
            left: 0,
            right: 0,
            background: 'linear-gradient(90deg, #93c5fd, #ef4444, #dc2626)',
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{
            left: `${curPct}%`,
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            border: '3px solid white',
            boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
            transform: 'translate(-50%, -50%)',
            marginTop: 4,
          }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs font-bold" style={{ color: '#93c5fd' }}>
          <TrendingDown size={10} className="inline mr-1" />{minVal}
        </span>
        <span className="text-xs font-bold" style={{ color: '#ef4444' }}>
          {curVal} bpm
        </span>
        <span className="text-xs font-bold" style={{ color: '#dc2626' }}>
          {maxVal}<TrendingUp size={10} className="inline ml-1" />
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
    { label: 'Medium', value: parseFloat(medium.state) || 0, color: '#f59e0b', icon: Activity },
    { label: 'Low', value: parseFloat(low.state) || 0, color: '#22c55e', icon: Footprints },
  ];

  const maxVal = Math.max(...levels.map(l => l.value), 1);

  return (
    <div className="space-y-3">
      {levels.map(({ label, value, color, icon: LIcon }) => (
        <div key={label}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <LIcon size={12} style={{ color }} />
              <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{label}</span>
            </div>
            <span className="text-sm font-bold text-[var(--color-text)]">{Math.round(value)} min</span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 8, backgroundColor: `${color}12` }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(value / maxVal) * 100}%`,
                background: `linear-gradient(90deg, ${color}, ${color}bb)`,
                minWidth: value > 0 ? 4 : 0,
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
    <div className="rounded-xl p-4" style={{
      backgroundColor: colors.bg,
      border: `1px solid ${colors.border}`,
    }}>
      <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-lg font-black" style={{ color: colors.text }}>
        {val ? val.charAt(0).toUpperCase() + val.slice(1) : '--'}
      </div>
    </div>
  );
}

/**
 * SpO2Gauge - visual oxygen saturation indicator
 */
function SpO2Gauge() {
  const { state } = useEntity(OURA_BODY.spo2);
  const val = parseFloat(state);
  const isValid = !isNaN(val);
  const pct = isValid ? val : 0;
  const color = pct >= 95 ? '#22c55e' : pct >= 90 ? '#f59e0b' : '#ef4444';

  return (
    <div className="rounded-xl p-4" style={{
      backgroundColor: `${color}08`,
      border: `1px solid ${color}15`,
    }}>
      <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
        Blood Oxygen (SpO2)
      </div>
      <div className="flex items-end gap-3">
        <div className="text-3xl font-black" style={{ color, letterSpacing: '-1px' }}>
          {isValid ? val.toFixed(1) : '--'}
          <span className="text-sm font-medium text-[var(--color-text-secondary)] ml-1">%</span>
        </div>
        <div className="flex-1 mb-2">
          <div className="rounded-full overflow-hidden" style={{ height: 8, backgroundColor: `${color}15` }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(0, (pct - 85) / 15 * 100)}%`,
                background: `linear-gradient(90deg, ${color}, ${color}cc)`,
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-[var(--color-text-secondary)]">85</span>
            <span className="text-[9px] text-[var(--color-text-secondary)]">100</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * TempDeviation - visual temperature deviation display
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
    <div className="rounded-xl p-4" style={{
      backgroundColor: `${color}08`,
      border: `1px solid ${color}15`,
    }}>
      <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
        Temperature Deviation
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center">
          {isValid && (isPositive
            ? <TrendingUp size={20} style={{ color }} />
            : <TrendingDown size={20} style={{ color }} />
          )}
          <span className="text-3xl font-black ml-2" style={{ color, letterSpacing: '-1px' }}>
            {isValid ? `${isPositive ? '+' : ''}${val.toFixed(2)}` : '--'}
          </span>
          <span className="text-sm font-medium text-[var(--color-text-secondary)] ml-1">&deg;C</span>
        </div>
      </div>
    </div>
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
    <div className="space-y-6">
      {/* === SCORE RINGS === */}
      <div className="rounded-2xl overflow-hidden" style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}>
        {/* Sync button */}
        <div className="flex justify-end px-5 pt-4">
          <button
            onClick={refreshOura}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              backgroundColor: refreshing ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.1)',
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
        <div className="flex justify-around items-start px-8 pb-6 pt-2">
          <ScoreRing
            entityId={OURA_SCORES.sleep}
            label="Sleep"
            size={170}
            subMetrics={[
              { entityId: OURA_SLEEP.efficiency, label: 'Efficiency', unit: '%' },
              { entityId: OURA_SLEEP.regularity, label: 'Regularity' },
              { entityId: OURA_SLEEP.timing, label: 'Timing' },
            ]}
          />
          <ScoreRing
            entityId={OURA_SCORES.readiness}
            label="Readiness"
            size={170}
            subMetrics={[
              { entityId: OURA_SLEEP.restfulness, label: 'Restful' },
              { entityId: OURA_HEART.resting_score, label: 'RHR Score' },
              { entityId: OURA_HEART.hrv_balance, label: 'HRV' },
            ]}
          />
          <ScoreRing
            entityId={OURA_SCORES.activity}
            label="Activity"
            size={170}
            subMetrics={[
              { entityId: OURA_ACTIVITY.steps, label: 'Steps' },
              { entityId: OURA_ACTIVITY.active_calories, label: 'Active Cal' },
              { entityId: OURA_ACTIVITY.target_calories, label: 'Target Cal' },
            ]}
          />
        </div>
      </div>

      {/* === SLEEP + HEART RATE === */}
      <div className="grid grid-cols-2 gap-6">
        <SectionCard icon={Moon} title="Sleep" gradient="linear-gradient(135deg, #6366f1, #4f46e5)">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MetricCard entityId={OURA_SLEEP.total_duration} label="Total Sleep" format={formatHours} accent="#6366f1" />
            <MetricCard entityId={OURA_SLEEP.time_in_bed} label="Time in Bed" format={formatHours} accent="#818cf8" />
            <MetricCard entityId={OURA_SLEEP.latency} label="Fell Asleep" accent="#a5b4fc"
              format={(v) => v && v !== 'unavailable' ? `${Math.round(parseFloat(v))}min` : '--'} />
          </div>
          <SleepBreakdown
            deepId={OURA_SLEEP.deep_duration}
            lightId={OURA_SLEEP.light_duration}
            remId={OURA_SLEEP.rem_duration}
            awakeId={OURA_SLEEP.awake_time}
          />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <MetricCard entityId={OURA_SLEEP.bedtime_start} label="Bedtime" icon={<Clock size={14} />} format={formatTime} accent="#6366f1" />
            <MetricCard entityId={OURA_SLEEP.bedtime_end} label="Wake Up" icon={<Clock size={14} />} format={formatTime} accent="#6366f1" />
          </div>
        </SectionCard>

        <SectionCard icon={Heart} title="Heart Rate" gradient="linear-gradient(135deg, #ef4444, #dc2626)">
          <div className="grid grid-cols-2 gap-3">
            <HeroMetric
              entityId={OURA_HEART.current}
              label="Current"
              unit="bpm"
              color="#ef4444"
              icon={<Heart size={24} />}
            />
            <HeroMetric
              entityId={OURA_HEART.avg_sleep_hrv}
              label="Sleep HRV"
              unit="ms"
              color="#8b5cf6"
              icon={<Activity size={24} />}
            />
          </div>
          <HeartRateRange />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <MetricCard entityId={OURA_HEART.average} label="Daytime Avg" unit="bpm" accent="#ef4444"
              format={(v) => v && v !== 'unavailable' ? Math.round(parseFloat(v)) : '--'} />
            <MetricCard entityId={OURA_HEART.avg_sleep} label="Sleep Avg" unit="bpm" accent="#f97316"
              format={(v) => v && v !== 'unavailable' ? Math.round(parseFloat(v)) : '--'} />
            <MetricCard entityId={OURA_HEART.lowest_sleep} label="Lowest (Sleep)" unit="bpm" accent="#22c55e" />
            <MetricCard entityId={OURA_HEART.cardio_age} label="Cardio Age" unit="yrs" accent="#3b82f6" />
          </div>
        </SectionCard>
      </div>

      {/* === ACTIVITY + COLD PLUNGE === */}
      <div className="grid grid-cols-2 gap-6">
        <SectionCard icon={Activity} title="Activity" gradient="linear-gradient(135deg, #22c55e, #16a34a)">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <ProgressMetric
              entityId={OURA_ACTIVITY.steps}
              label="Steps"
              goal={10000}
              color="#22c55e"
            />
            <ProgressMetric
              entityId={OURA_ACTIVITY.active_calories}
              label="Active Calories"
              goal={500}
              unit="kcal"
              color="#f59e0b"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <MetricCard entityId={OURA_ACTIVITY.total_calories} label="Total Calories" unit="kcal" accent="#ef4444" />
            <MetricCard entityId={OURA_ACTIVITY.target_calories} label="Target" unit="kcal" accent="#22c55e" />
          </div>
          <ActivityBreakdown />
        </SectionCard>

        <ColdPlungeControls />
      </div>

      {/* === BODY + STRESS === */}
      <div className="grid grid-cols-2 gap-6">
        <SectionCard icon={Thermometer} title="Body" gradient="linear-gradient(135deg, #f59e0b, #d97706)">
          <TempDeviation />
          <div className="mt-3">
            <SpO2Gauge />
          </div>
          <div className="mt-3">
            <MetricCard entityId={OURA_BODY.breathing_index} label="Breathing Disturbance Index" accent="#f59e0b"
              icon={<Wind size={14} />} />
          </div>
        </SectionCard>

        <SectionCard icon={Brain} title="Stress & Recovery" gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <StressBadge entityId={OURA_STRESS.day_summary} label="Day Summary" />
            <StressBadge entityId={OURA_STRESS.resilience} label="Resilience" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard entityId={OURA_STRESS.resilience_score} label="Resilience Score" accent="#8b5cf6" />
            <MetricCard entityId={OURA_STRESS.daytime_recovery} label="Daytime Recovery" accent="#22c55e" />
            <MetricCard entityId={OURA_STRESS.stress_high} label="High Stress" unit="min" accent="#ef4444"
              icon={<Timer size={14} />} />
            <MetricCard entityId={OURA_STRESS.recovery_high} label="Recovery Time" unit="min" accent="#3b82f6"
              icon={<Timer size={14} />} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
