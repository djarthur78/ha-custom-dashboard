/**
 * HealthDashboard Component
 * Full-screen health dashboard - fills 1920x1080 wall panel
 * CSS Grid layout: score rings | 3-col main content | bottom row
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Heart, Activity, RefreshCw, Footprints, Flame, Zap,
  TrendingDown, TrendingUp, Clock, Timer, Moon, Bed,
  Wind, Droplets, Shield, BarChart3, Target, Gauge,
  BedDouble, AlarmClock,
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

function formatNumber(val) {
  if (!val || val === 'unavailable' || val === 'unknown') return '--';
  const n = parseFloat(val);
  if (isNaN(n)) return '--';
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : Math.round(n).toString();
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider pb-1.5"
      style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      {Icon && <Icon size={11} />}
      {children}
    </div>
  );
}

/**
 * MiniGauge - small circular progress indicator
 */
function MiniGauge({ value, max = 100, size = 44, color = '#3b82f6', label }) {
  const pct = Math.min((value / max) * 100, 100);
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={4} />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={4}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-black" style={{ color }}>{Math.round(pct)}%</span>
        </div>
      </div>
      {label && <span className="text-[8px] font-semibold text-[var(--color-text-secondary)] uppercase mt-0.5">{label}</span>}
    </div>
  );
}

/**
 * SleepTimeline - visual bed-to-wake timeline
 */
function SleepTimeline() {
  const bedtime = useEntity(OURA_SLEEP.bedtime_start);
  const waketime = useEntity(OURA_SLEEP.bedtime_end);
  const totalSleep = useEntity(OURA_SLEEP.total_duration);
  const timeInBed = useEntity(OURA_SLEEP.time_in_bed);

  const bedStr = formatTime(bedtime.state);
  const wakeStr = formatTime(waketime.state);
  const sleepHrs = parseFloat(totalSleep.state) || 0;
  const bedHrs = parseFloat(timeInBed.state) || 0;
  const efficiency = bedHrs > 0 ? Math.round((sleepHrs / bedHrs) * 100) : 0;

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1">
          <BedDouble size={10} className="text-indigo-400" />
          <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase">Sleep Window</span>
        </div>
        <span className="text-[10px] font-bold text-indigo-500">{efficiency}% efficient</span>
      </div>
      <div className="relative rounded-full overflow-hidden" style={{ height: 18, backgroundColor: 'rgba(99, 102, 241, 0.08)' }}>
        <div className="absolute inset-y-0 left-0 rounded-full flex items-center justify-center"
          style={{
            width: bedHrs > 0 ? `${(sleepHrs / bedHrs) * 100}%` : '0%',
            background: 'linear-gradient(90deg, #6366f1, #818cf8)',
          }}>
          <span className="text-[9px] font-bold text-white">{formatHours(totalSleep.state)}</span>
        </div>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] font-bold text-indigo-500"><Moon size={9} className="inline mr-0.5" />{bedStr}</span>
        <span className="text-[10px] text-[var(--color-text-secondary)]">In bed: {formatHours(timeInBed.state)}</span>
        <span className="text-[10px] font-bold text-amber-500"><AlarmClock size={9} className="inline mr-0.5" />{wakeStr}</span>
      </div>
    </div>
  );
}

/**
 * ReadinessFactors - visual breakdown of readiness contributors
 */
function ReadinessFactors() {
  const restfulness = useEntity(OURA_SLEEP.restfulness);
  const rhrScore = useEntity(OURA_HEART.resting_score);
  const hrvBalance = useEntity(OURA_HEART.hrv_balance);
  const recovery = useEntity(OURA_SLEEP.recovery_score);

  const factors = [
    { label: 'Restfulness', value: parseInt(restfulness.state) || 0, color: '#6366f1' },
    { label: 'RHR Score', value: parseInt(rhrScore.state) || 0, color: '#ef4444' },
    { label: 'HRV Balance', value: parseInt(hrvBalance.state) || 0, color: '#8b5cf6' },
    { label: 'Recovery', value: parseInt(recovery.state) || 0, color: '#22c55e' },
  ];

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-1 mb-2">
        <Shield size={10} className="text-[var(--color-text-secondary)]" />
        <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase">Readiness Factors</span>
      </div>
      <div className="space-y-2.5">
        {factors.map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-[9px] font-medium text-[var(--color-text-secondary)] w-16 truncate">{label}</span>
            <div className="flex-1 rounded-full overflow-hidden" style={{ height: 10, backgroundColor: `${color}12` }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
            </div>
            <span className="text-[10px] font-bold w-6 text-right" style={{ color }}>{value || '--'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SleepScores - regularity + timing sub-scores
 */
function SleepScores() {
  const regularity = useEntity(OURA_SLEEP.regularity);
  const timing = useEntity(OURA_SLEEP.timing);
  const restfulness = useEntity(OURA_SLEEP.restfulness);

  const items = [
    { label: 'Regularity', value: parseInt(regularity.state) || 0, color: '#6366f1' },
    { label: 'Timing', value: parseInt(timing.state) || 0, color: '#818cf8' },
    { label: 'Restfulness', value: parseInt(restfulness.state) || 0, color: '#a5b4fc' },
  ];

  return (
    <div className="flex items-center justify-around">
      {items.map(({ label, value, color }) => (
        <MiniGauge key={label} value={value} max={100} size={60} color={color} label={label} />
      ))}
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
    <div className="rounded-lg p-3" style={{
      backgroundColor: 'rgba(239, 68, 68, 0.04)',
      border: '1px solid rgba(239, 68, 68, 0.1)',
    }}>
      <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
        Today's HR Range
      </div>
      <div className="relative rounded-full" style={{ height: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
        <div className="absolute rounded-full"
          style={{ height: 6, left: 0, right: 0, background: 'linear-gradient(90deg, #93c5fd, #ef4444, #dc2626)' }} />
        <div className="absolute top-1/2 -translate-y-1/2"
          style={{
            left: `${curPct}%`, width: 12, height: 12, borderRadius: '50%',
            backgroundColor: '#ef4444', border: '2px solid white',
            boxShadow: '0 1px 4px rgba(239,68,68,0.4)',
            transform: 'translate(-50%, -50%)', marginTop: 3,
          }} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] font-bold" style={{ color: '#93c5fd' }}>
          <TrendingDown size={9} className="inline mr-0.5" />{minVal}
        </span>
        <span className="text-[10px] font-bold" style={{ color: '#ef4444' }}>{curVal} bpm</span>
        <span className="text-[10px] font-bold" style={{ color: '#dc2626' }}>
          {maxVal}<TrendingUp size={9} className="inline ml-0.5" />
        </span>
      </div>
    </div>
  );
}

/**
 * SpO2Display - blood oxygen with visual gauge
 */
function SpO2Display() {
  const { state } = useEntity(OURA_BODY.spo2);
  const val = parseFloat(state);
  const isValid = !isNaN(val);
  const color = isValid ? (val >= 95 ? '#22c55e' : val >= 90 ? '#f59e0b' : '#ef4444') : '#9ca3af';

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: `${color}08`, border: `1px solid ${color}15` }}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5">
            <Droplets size={9} className="inline mr-0.5" />SpO2
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black" style={{ color }}>{isValid ? val.toFixed(1) : '--'}</span>
            <span className="text-[10px] text-[var(--color-text-secondary)]">%</span>
          </div>
        </div>
        {isValid && <MiniGauge value={Math.max(0, (val - 90))} max={10} size={38} color={color} />}
      </div>
    </div>
  );
}

/**
 * TempDeviation
 */
function TempDeviation() {
  const { state } = useEntity(OURA_BODY.temp_deviation);
  const val = parseFloat(state);
  const isValid = !isNaN(val) && state !== 'unavailable';
  const isPositive = isValid && val > 0;
  const color = isValid
    ? (Math.abs(val) <= 0.5 ? '#22c55e' : Math.abs(val) <= 1 ? '#f59e0b' : '#ef4444')
    : '#9ca3af';

  const scalePct = isValid ? Math.max(0, Math.min(100, ((val + 1) / 2) * 100)) : 50;

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: `${color}08`, border: `1px solid ${color}15` }}>
      <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
        Temp Deviation
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        {isValid && (isPositive
          ? <TrendingUp size={14} style={{ color }} />
          : <TrendingDown size={14} style={{ color }} />
        )}
        <span className="text-lg font-black" style={{ color, letterSpacing: '-0.5px' }}>
          {isValid ? `${isPositive ? '+' : ''}${val.toFixed(2)}` : '--'}
        </span>
        <span className="text-[10px] text-[var(--color-text-secondary)]">&deg;C</span>
      </div>
      <div className="relative rounded-full" style={{ height: 4, backgroundColor: 'rgba(0,0,0,0.06)' }}>
        <div className="absolute top-0 left-1/2 -translate-x-px" style={{ width: 1, height: 4, backgroundColor: 'rgba(0,0,0,0.15)' }} />
        {isValid && (
          <div className="absolute top-1/2 -translate-y-1/2"
            style={{
              left: `${scalePct}%`, width: 8, height: 8, borderRadius: '50%',
              backgroundColor: color, transform: 'translate(-50%, -50%)', marginTop: 2,
            }} />
        )}
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[8px] text-[var(--color-text-secondary)]">-1°C</span>
        <span className="text-[8px] text-[var(--color-text-secondary)]">0</span>
        <span className="text-[8px] text-[var(--color-text-secondary)]">+1°C</span>
      </div>
    </div>
  );
}

/**
 * BreathingIndex
 */
function BreathingIndex() {
  const { state } = useEntity(OURA_BODY.breathing_index);
  const val = parseFloat(state);
  const isValid = !isNaN(val) && state !== 'unavailable';
  // Lower is better: 0-5 normal, 5-15 mild, 15-30 moderate, 30+ severe
  const color = isValid ? (val <= 5 ? '#22c55e' : val <= 15 ? '#f59e0b' : '#ef4444') : '#9ca3af';
  const label = isValid ? (val <= 5 ? 'Normal' : val <= 15 ? 'Mild' : val <= 30 ? 'Moderate' : 'Elevated') : '--';

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: `${color}08`, border: `1px solid ${color}15` }}>
      <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5">
        <Wind size={9} className="inline mr-0.5" />Breathing Index
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-black" style={{ color }}>{isValid ? val.toFixed(1) : '--'}</span>
        <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

/**
 * HeartRateZones - visual comparison of resting vs sleep vs active HR
 */
function HeartRateZones() {
  const resting = useEntity(OURA_HEART.average);
  const sleepHR = useEntity(OURA_HEART.avg_sleep);
  const lowest = useEntity(OURA_HEART.lowest_sleep);
  const current = useEntity(OURA_HEART.current);

  const zones = [
    { label: 'Lowest', value: parseInt(lowest.state) || 0, color: '#22c55e' },
    { label: 'Sleep Avg', value: parseInt(sleepHR.state) || 0, color: '#3b82f6' },
    { label: 'Resting', value: parseInt(resting.state) || 0, color: '#f59e0b' },
    { label: 'Current', value: parseInt(current.state) || 0, color: '#ef4444' },
  ];

  const maxHR = Math.max(...zones.map(z => z.value), 1);

  return (
    <div className="rounded-lg p-3 flex flex-col" style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)', flex: '1 0 auto' }}>
      <div className="flex items-center gap-1 mb-2">
        <Heart size={10} className="text-[var(--color-text-secondary)]" />
        <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase">Heart Rate Zones</span>
      </div>
      <div className="flex items-end gap-3 justify-around flex-1" style={{ minHeight: 80 }}>
        {zones.map(({ label, value, color }) => (
          <div key={label} className="flex flex-col items-center flex-1 h-full" style={{ justifyContent: 'flex-end' }}>
            <span className="text-[10px] font-black mb-0.5" style={{ color }}>{value || '--'}</span>
            <div className="w-full rounded-t-md transition-all duration-700"
              style={{
                height: value > 0 ? `${(value / maxHR) * 100}%` : 2,
                backgroundColor: color,
                minHeight: 2,
                maxHeight: '85%',
              }} />
            <span className="text-[8px] font-medium text-[var(--color-text-secondary)] mt-0.5 truncate w-full text-center">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ActivityBreakdown - visual time bars + stacked bar
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
  const totalActive = levels.reduce((sum, l) => sum + l.value, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1">
          <BarChart3 size={10} className="text-[var(--color-text-secondary)]" />
          <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase">Activity Mix</span>
        </div>
        <span className="text-[10px] font-bold text-[var(--color-text)]">{Math.round(totalActive)}m total</span>
      </div>
      <div className="flex rounded-lg overflow-hidden mb-2" style={{ height: 30 }}>
        {levels.map(({ label, value, color }) => {
          const pct = totalActive > 0 ? (value / totalActive) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div key={label} className="flex items-center justify-center" style={{ width: `${pct}%`, backgroundColor: color, minWidth: pct > 5 ? 30 : 2 }}>
              {pct > 15 && <span className="text-[9px] font-bold text-white">{Math.round(pct)}%</span>}
            </div>
          );
        })}
      </div>
      <div className="space-y-2">
        {levels.map(({ label, value, color, icon: LIcon }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <LIcon size={11} style={{ color }} />
                <span className="text-[9px] font-semibold text-[var(--color-text-secondary)] uppercase">{label}</span>
              </div>
              <span className="text-[10px] font-bold text-[var(--color-text)]">{Math.round(value)}m</span>
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: 8, backgroundColor: `${color}12` }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(value / maxVal) * 100}%`, background: `linear-gradient(90deg, ${color}, ${color}bb)`, minWidth: value > 0 ? 3 : 0 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * CalorieBudget - visual calorie progress
 */
function CalorieBudget() {
  const total = useEntity(OURA_ACTIVITY.total_calories);
  const active = useEntity(OURA_ACTIVITY.active_calories);
  const target = useEntity(OURA_ACTIVITY.target_calories);

  const totalVal = parseFloat(total.state) || 0;
  const activeVal = parseFloat(active.state) || 0;
  const targetVal = parseFloat(target.state) || 500;
  const restVal = totalVal - activeVal;

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-1 mb-1.5">
        <Flame size={10} className="text-orange-500" />
        <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase">Calorie Budget</span>
      </div>
      <div className="flex items-center gap-3">
        <MiniGauge value={activeVal} max={targetVal} size={58} color="#f59e0b" label="Goal" />
        <div className="flex-1 space-y-1">
          <div className="flex justify-between">
            <span className="text-[9px] text-[var(--color-text-secondary)]">Active</span>
            <span className="text-[10px] font-bold text-amber-500">{Math.round(activeVal)} kcal</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[9px] text-[var(--color-text-secondary)]">Resting</span>
            <span className="text-[10px] font-bold text-[var(--color-text)]">{Math.round(restVal)} kcal</span>
          </div>
          <div className="flex justify-between pt-1" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <span className="text-[9px] font-semibold text-[var(--color-text-secondary)]">Total</span>
            <span className="text-[10px] font-black text-[var(--color-text)]">{Math.round(totalVal)} kcal</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * StepGoalVisual - large circular step progress
 */
function StepGoalVisual() {
  const steps = useEntity(OURA_ACTIVITY.steps);
  const val = parseFloat(steps.state) || 0;
  const goal = 10000;
  const pct = Math.min((val / goal) * 100, 100);
  const yesterday = useYesterdayValue(OURA_ACTIVITY.steps);

  const size = 100;
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 100 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="rounded-lg p-3 flex items-center gap-3" style={{ backgroundColor: 'rgba(34, 197, 94, 0.04)', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(34,197,94,0.1)" strokeWidth={6} />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={6}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Footprints size={14} style={{ color }} />
          <span className="text-[10px] font-black" style={{ color }}>{formatNumber(steps.state)}</span>
        </div>
      </div>
      <div className="flex-1">
        <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase mb-0.5">Steps Goal</div>
        <div className="text-lg font-black text-[var(--color-text)]">{Math.round(pct)}%</div>
        <div className="text-[9px] text-[var(--color-text-secondary)]">Target: 10,000</div>
        {yesterday && (
          <div className="text-[9px] text-[var(--color-text-secondary)]">Yesterday: {formatNumber(yesterday)}</div>
        )}
      </div>
    </div>
  );
}

/**
 * StressBadge
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
    <div className="rounded-lg p-3" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}>
      <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-sm font-black" style={{ color: colors.text }}>
        {val ? val.charAt(0).toUpperCase() + val.slice(1) : '--'}
      </div>
    </div>
  );
}

/**
 * StressRecoveryBar
 */
function StressRecoveryBar() {
  const stressHigh = useEntity(OURA_STRESS.stress_high);
  const recoveryHigh = useEntity(OURA_STRESS.recovery_high);

  const stressMin = parseFloat(stressHigh.state) || 0;
  const recoveryMin = parseFloat(recoveryHigh.state) || 0;
  const total = stressMin + recoveryMin || 1;

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-1 mb-1.5">
        <Gauge size={10} className="text-[var(--color-text-secondary)]" />
        <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase">Stress vs Recovery</span>
      </div>
      <div className="flex rounded-lg overflow-hidden" style={{ height: 20 }}>
        <div className="flex items-center justify-center" style={{
          width: `${(stressMin / total) * 100}%`,
          backgroundColor: '#ef4444',
          minWidth: stressMin > 0 ? 30 : 0,
        }}>
          {stressMin > 0 && <span className="text-[9px] font-bold text-white">{Math.round(stressMin)}m</span>}
        </div>
        <div className="flex items-center justify-center" style={{
          width: `${(recoveryMin / total) * 100}%`,
          backgroundColor: '#22c55e',
          minWidth: recoveryMin > 0 ? 30 : 0,
        }}>
          {recoveryMin > 0 && <span className="text-[9px] font-bold text-white">{Math.round(recoveryMin)}m</span>}
        </div>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-medium" style={{ color: '#ef4444' }}>Stress {Math.round(stressMin)}m</span>
        <span className="text-[9px] font-medium" style={{ color: '#22c55e' }}>Recovery {Math.round(recoveryMin)}m</span>
      </div>
    </div>
  );
}

/**
 * Yesterday comparison wrappers
 */
function CaloriesWithYesterday() {
  const yesterday = useYesterdayValue(OURA_ACTIVITY.active_calories);
  return (
    <ProgressMetric entityId={OURA_ACTIVITY.active_calories} label="Active Cal" goal={500} unit="kcal" color="#f59e0b"
      yesterday={yesterday ? formatNumber(yesterday) : null} />
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
      gridTemplateRows: 'auto 1fr 160px',
      height: '100%',
      gap: '8px',
      minHeight: 0,
    }}>
      {/* === ROW 1: SCORE RINGS === */}
      <div className="rounded-xl flex items-center justify-between px-6 py-3" style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div className="flex items-center gap-10">
          <ScoreRing entityId={OURA_SCORES.sleep} label="Sleep" size={88} strokeWidth={8} />
          <ScoreRing entityId={OURA_SCORES.readiness} label="Readiness" size={88} strokeWidth={8} />
          <ScoreRing entityId={OURA_SCORES.activity} label="Activity" size={88} strokeWidth={8} />
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
        gap: '8px',
        minHeight: 0,
        overflow: 'hidden',
      }}>
        {/* SLEEP COLUMN */}
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid rgba(0,0,0,0.06)',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          <SectionLabel icon={Moon}>Sleep</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard entityId={OURA_SLEEP.total_duration} label="Total" format={formatHours} />
            <MetricCard entityId={OURA_SLEEP.efficiency} label="Efficiency" unit="%" />
            <MetricCard entityId={OURA_SLEEP.latency} label="Fell Asleep"
              format={(v) => v && v !== 'unavailable' ? `${Math.round(parseFloat(v))}m` : '--'} />
          </div>
          <SleepBreakdown
            deepId={OURA_SLEEP.deep_duration}
            lightId={OURA_SLEEP.light_duration}
            remId={OURA_SLEEP.rem_duration}
            awakeId={OURA_SLEEP.awake_time}
          />
          <SleepTimeline />
          <SleepScores />
          <ReadinessFactors />
          <div className="grid grid-cols-2 gap-2">
            <MetricCard entityId={OURA_HEART.lowest_sleep} label="Lowest HR" unit="bpm"
              format={(v) => v && v !== 'unavailable' ? Math.round(parseFloat(v)).toString() : '--'} />
            <MetricCard entityId={OURA_HEART.avg_sleep} label="Avg Sleep HR" unit="bpm"
              format={(v) => v && v !== 'unavailable' ? Math.round(parseFloat(v)).toString() : '--'} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard entityId={OURA_SLEEP.recovery_score} label="Recovery" />
            <MetricCard entityId={OURA_SLEEP.deep_pct} label="Deep %" unit="%" />
            <MetricCard entityId={OURA_SLEEP.rem_pct} label="REM %" unit="%" />
          </div>
        </div>

        {/* HEART & BODY COLUMN */}
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid rgba(0,0,0,0.06)',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          <SectionLabel icon={Heart}>Heart & Body</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <HeroMetric entityId={OURA_HEART.current} label="Current" unit="bpm" color="#ef4444" icon={<Heart size={16} />} />
            <HeroMetric entityId={OURA_HEART.avg_sleep_hrv} label="Sleep HRV" unit="ms" color="#8b5cf6" icon={<Activity size={16} />} />
          </div>
          <HeartRateRange />
          <HeartRateZones />
          <div className="grid grid-cols-2 gap-2">
            <TempDeviation />
            <SpO2Display />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <BreathingIndex />
            <MetricCard entityId={OURA_HEART.cardio_age} label="Cardio Age" unit="yrs" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard entityId={OURA_STRESS.daytime_recovery} label="Day Recovery" />
            <MetricCard entityId={OURA_HEART.hrv_balance} label="HRV Balance" />
            <MetricCard entityId={OURA_HEART.resting_score} label="RHR Score" />
          </div>
        </div>

        {/* ACTIVITY COLUMN */}
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid rgba(0,0,0,0.06)',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          <SectionLabel icon={Activity}>Activity</SectionLabel>
          <StepGoalVisual />
          <CaloriesWithYesterday />
          <ActivityBreakdown />
          <CalorieBudget />
          <div className="grid grid-cols-2 gap-2">
            <MetricCard entityId={OURA_HEART.average} label="Avg HR" unit="bpm"
              format={(v) => v && v !== 'unavailable' ? Math.round(parseFloat(v)).toString() : '--'} />
            <MetricCard entityId={OURA_BODY.temp_deviation} label="Temp" unit="°C"
              format={(v) => v && v !== 'unavailable' ? `${parseFloat(v) > 0 ? '+' : ''}${parseFloat(v).toFixed(2)}` : '--'} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard entityId={OURA_ACTIVITY.total_calories} label="Total Cal" unit="kcal" />
            <MetricCard entityId={OURA_ACTIVITY.target_calories} label="Target" unit="kcal" />
            <MetricCard entityId={OURA_SCORES.activity} label="Score" />
          </div>
        </div>
      </div>

      {/* === ROW 3: BOTTOM - STRESS + COLD PLUNGE === */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '8px',
        minHeight: 0,
      }}>
        {/* STRESS & RECOVERY */}
        <div className="rounded-xl p-3 flex flex-col" style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}>
          <SectionLabel icon={Shield}>Stress & Recovery</SectionLabel>
          <div className="flex-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', alignContent: 'stretch' }}>
            <div className="flex flex-col gap-2">
              <StressBadge entityId={OURA_STRESS.day_summary} label="Day Summary" />
              <StressBadge entityId={OURA_STRESS.resilience} label="Resilience" />
            </div>
            <div className="flex flex-col gap-2">
              <MetricCard entityId={OURA_STRESS.stress_high} label="High Stress" unit="min" icon={<Timer size={12} />} />
              <MetricCard entityId={OURA_STRESS.recovery_high} label="Recovery" unit="min" icon={<Timer size={12} />} />
            </div>
            <div className="flex flex-col gap-2">
              <MetricCard entityId={OURA_STRESS.resilience_score} label="Resilience Score" />
              <StressRecoveryBar />
            </div>
          </div>
        </div>

        {/* COLD PLUNGE */}
        <div className="rounded-xl p-3" style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}>
          <ColdPlungeControls />
        </div>
      </div>
    </div>
  );
}
