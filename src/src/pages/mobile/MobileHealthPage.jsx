/**
 * MobileHealthPage
 * Single-column scrollable health dashboard for mobile
 * Reuses sub-components from HealthDashboard but in mobile-friendly single-column layout
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { RefreshCw, Heart, Activity, Moon } from 'lucide-react';
import { MobilePageContainer } from '../../components/mobile/MobilePageContainer';
import { ScoreRing } from '../../components/features/health/ScoreRing';
import { MetricCard, HeroMetric } from '../../components/features/health/MetricCard';
import { SleepBreakdown } from '../../components/features/health/SleepBreakdown';
import { HrvChart } from '../../components/features/health/HrvChart';
import { useEntity } from '../../hooks/useEntity';
import haWebSocket from '../../services/ha-websocket';
import {
  OURA_SCORES,
  OURA_SLEEP,
  OURA_HEART,
  OURA_ACTIVITY,
} from '../../components/features/health/healthConfig';

function formatHours(val) {
  if (!val || val === 'unavailable' || val === 'unknown') return '--';
  const h = Math.floor(parseFloat(val));
  const m = Math.round((parseFloat(val) - h) * 60);
  return `${h}h ${m}m`;
}

function formatTime(val) {
  if (!val || val === 'unavailable' || val === 'unknown') return '--';
  try {
    return new Date(val).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch { return '--'; }
}

function formatNumber(val) {
  if (!val || val === 'unavailable' || val === 'unknown') return '--';
  const n = parseFloat(val);
  if (isNaN(n)) return '--';
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : Math.round(n).toString();
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider pb-1.5 mb-2"
      style={{ color: 'var(--ds-text-secondary)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      {Icon && <Icon size={12} />}
      {children}
    </div>
  );
}

function MobileTrainingReadiness() {
  const readiness = useEntity(OURA_SCORES.readiness);
  const hrv = useEntity(OURA_HEART.avg_sleep_hrv);
  const rhr = useEntity(OURA_HEART.lowest_sleep);

  const score = parseInt(readiness.state, 10);
  const hrvVal = parseFloat(hrv.state);
  const rhrVal = parseFloat(rhr.state);

  let decision, bgColor, textColor, borderColor;
  if (isNaN(score)) {
    decision = 'Loading...'; bgColor = 'rgba(0,0,0,0.03)'; textColor = 'var(--ds-text-secondary)'; borderColor = 'rgba(0,0,0,0.06)';
  } else if (score >= 85) {
    decision = 'Train Hard'; bgColor = 'rgba(74,154,74,0.08)'; textColor = '#3a8a3a'; borderColor = 'rgba(74,154,74,0.2)';
  } else if (score >= 70) {
    decision = 'Moderate'; bgColor = 'rgba(212,148,76,0.08)'; textColor = '#c4843c'; borderColor = 'rgba(212,148,76,0.2)';
  } else {
    decision = 'Rest Day'; bgColor = 'rgba(196,99,106,0.08)'; textColor = '#b4535a'; borderColor = 'rgba(196,99,106,0.2)';
  }

  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: bgColor, border: `2px solid ${borderColor}` }}>
      <div className="text-lg font-black" style={{ color: textColor }}>{decision}</div>
      <div className="flex items-center gap-4 mt-1">
        <div>
          <div className="text-[9px] font-semibold uppercase" style={{ color: 'var(--ds-text-secondary)' }}>Readiness</div>
          <div className="text-base font-black" style={{ color: textColor }}>{!isNaN(score) ? score : '--'}</div>
        </div>
        <div>
          <div className="text-[9px] font-semibold uppercase" style={{ color: 'var(--ds-text-secondary)' }}>HRV</div>
          <div className="text-base font-black" style={{ color: '#7a5aaa' }}>{!isNaN(hrvVal) ? Math.round(hrvVal) : '--'}ms</div>
        </div>
        <div>
          <div className="text-[9px] font-semibold uppercase" style={{ color: 'var(--ds-text-secondary)' }}>RHR</div>
          <div className="text-base font-black" style={{ color: '#c4636a' }}>{!isNaN(rhrVal) ? Math.round(rhrVal) : '--'}bpm</div>
        </div>
      </div>
    </div>
  );
}

function MobileSleepTimeline() {
  const bedtime = useEntity(OURA_SLEEP.bedtime_start);
  const waketime = useEntity(OURA_SLEEP.bedtime_end);
  const totalSleep = useEntity(OURA_SLEEP.total_duration);
  const timeInBed = useEntity(OURA_SLEEP.time_in_bed);

  const sleepHrs = parseFloat(totalSleep.state) || 0;
  const bedHrs = parseFloat(timeInBed.state) || 0;
  const efficiency = bedHrs > 0 ? Math.round((sleepHrs / bedHrs) * 100) : 0;

  return (
    <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(122,90,170,0.04)', border: '1px solid rgba(122,90,170,0.1)' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--ds-text-secondary)' }}>Sleep Window</span>
        <span className="text-[10px] font-bold" style={{ color: '#7a5aaa' }}>{efficiency}% efficient</span>
      </div>
      <div className="relative rounded-full overflow-hidden" style={{ height: 16, backgroundColor: 'rgba(122,90,170,0.08)' }}>
        <div className="absolute inset-y-0 left-0 rounded-full flex items-center justify-center"
          style={{ width: bedHrs > 0 ? `${(sleepHrs / bedHrs) * 100}%` : '0%', background: 'linear-gradient(90deg, #7a5aaa, #8a6aba)' }}>
          <span className="text-[9px] font-bold text-white">{formatHours(totalSleep.state)}</span>
        </div>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] font-bold" style={{ color: '#7a5aaa' }}>{formatTime(bedtime.state)}</span>
        <span className="text-[10px]" style={{ color: 'var(--ds-text-secondary)' }}>In bed: {formatHours(timeInBed.state)}</span>
        <span className="text-[10px] font-bold" style={{ color: '#d4944c' }}>{formatTime(waketime.state)}</span>
      </div>
    </div>
  );
}

function MobileStepGoal() {
  const steps = useEntity(OURA_ACTIVITY.steps);
  const val = parseFloat(steps.state) || 0;
  const goal = 10000;
  const pct = Math.min((val / goal) * 100, 100);
  const color = pct >= 100 ? '#4a9a4a' : pct >= 60 ? '#d4944c' : '#c4636a';
  const size = 72;
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(74,154,74,0.1)" strokeWidth={5} />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={5}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-black" style={{ color }}>{formatNumber(steps.state)}</span>
        </div>
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--ds-text-secondary)' }}>Steps</div>
        <div className="text-lg font-black" style={{ color }}>{Math.round(pct)}%</div>
        <div className="text-[9px]" style={{ color: 'var(--ds-text-secondary)' }}>of 10,000</div>
      </div>
    </div>
  );
}

export function MobileHealthPage() {
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const refreshOura = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await haWebSocket.send({ type: 'config_entries/reload', entry_id: '01KJHSA41S3RQM9MX1RRCBMZC8' });
    } catch (err) {
      console.error('Failed to refresh Oura data:', err);
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  }, [refreshing]);

  const hasAutoRefreshed = useRef(false);
  useEffect(() => {
    if (!hasAutoRefreshed.current) { hasAutoRefreshed.current = true; refreshOura(); }
  }, [refreshOura]);

  return (
    <MobilePageContainer>
      <div className="space-y-3">
        {/* Score Rings Row */}
        <div className="ds-card flex items-center justify-between" style={{ padding: '12px' }}>
          <div className="flex items-center gap-4">
            <ScoreRing entityId={OURA_SCORES.sleep} label="Sleep" size={64} strokeWidth={6} />
            <ScoreRing entityId={OURA_SCORES.readiness} label="Ready" size={64} strokeWidth={6} />
            <ScoreRing entityId={OURA_SCORES.activity} label="Active" size={64} strokeWidth={6} />
          </div>
          <button onClick={refreshOura} disabled={refreshing}
            className="p-2 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}>
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} style={{ color: 'var(--ds-text-secondary)' }} />
          </button>
        </div>

        {/* Training Readiness */}
        <MobileTrainingReadiness />

        {/* Sleep & Recovery */}
        <div className="ds-card" style={{ padding: '12px' }}>
          <SectionLabel icon={Moon}>Sleep & Recovery</SectionLabel>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <MetricCard entityId={OURA_SLEEP.total_duration} label="Total" format={formatHours} />
            <MetricCard entityId={OURA_SLEEP.efficiency} label="Efficiency" unit="%" />
            <MetricCard entityId={OURA_SLEEP.latency} label="Fell Asleep"
              format={(v) => v && v !== 'unavailable' ? `${Math.round(parseFloat(v))}m` : '--'} />
          </div>
          <div className="space-y-3">
            <SleepBreakdown
              deepId={OURA_SLEEP.deep_duration}
              lightId={OURA_SLEEP.light_duration}
              remId={OURA_SLEEP.rem_duration}
              awakeId={OURA_SLEEP.awake_time}
            />
            <MobileSleepTimeline />
          </div>
        </div>

        {/* HRV Chart */}
        <div className="ds-card" style={{ padding: '12px' }}>
          <HrvChart />
        </div>

        {/* Activity */}
        <div className="ds-card" style={{ padding: '12px' }}>
          <SectionLabel icon={Activity}>Activity</SectionLabel>
          <div className="mb-3">
            <MobileStepGoal />
          </div>
          <HeroMetric entityId={OURA_HEART.current} label="Current HR" unit="bpm" color="#c4636a" icon={<Heart size={14} />} />
        </div>
      </div>
    </MobilePageContainer>
  );
}

export default MobileHealthPage;
