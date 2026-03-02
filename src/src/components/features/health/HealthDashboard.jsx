/**
 * HealthDashboard Component
 * Main layout for Health & Wellness tab with Oura Ring data and Cold Plunge controls
 */

import { Heart, Activity, Thermometer, Brain, Moon, Clock } from 'lucide-react';
import { ScoreRing } from './ScoreRing';
import { MetricCard, MetricRow } from './MetricCard';
import { ColdPlungeControls } from './ColdPlungeControls';
import { SleepBreakdown } from './SleepBreakdown';
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

function SectionCard({ icon: Icon, iconColor, title, children }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-6" style={{
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={20} className={iconColor} />
        <h3 className="text-lg font-bold text-[var(--color-text)]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function HealthDashboard() {
  return (
    <div className="space-y-6">
      {/* Score Rings Row */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-6" style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <div className="flex justify-around items-start">
          <ScoreRing
            entityId={OURA_SCORES.sleep}
            label="Sleep"
            size={160}
            subMetrics={[
              { entityId: OURA_SLEEP.efficiency, label: 'Efficiency', unit: '%' },
              { entityId: OURA_SLEEP.regularity, label: 'Regularity' },
              { entityId: OURA_SLEEP.timing, label: 'Timing' },
            ]}
          />
          <ScoreRing
            entityId={OURA_SCORES.readiness}
            label="Readiness"
            size={160}
            subMetrics={[
              { entityId: OURA_SLEEP.restfulness, label: 'Restful' },
              { entityId: OURA_HEART.resting_score, label: 'RHR Score' },
              { entityId: OURA_HEART.hrv_balance, label: 'HRV' },
            ]}
          />
          <ScoreRing
            entityId={OURA_SCORES.activity}
            label="Activity"
            size={160}
            subMetrics={[
              { entityId: OURA_ACTIVITY.steps, label: 'Steps' },
              { entityId: OURA_ACTIVITY.active_calories, label: 'Active Cal' },
              { entityId: OURA_ACTIVITY.target_calories, label: 'Target Cal' },
            ]}
          />
        </div>
      </div>

      {/* Sleep Detail + Heart Rate Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Sleep Detail */}
        <SectionCard icon={Moon} iconColor="text-indigo-500" title="Sleep">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MetricCard entityId={OURA_SLEEP.total_duration} label="Total Sleep" format={formatHours} />
            <MetricCard entityId={OURA_SLEEP.time_in_bed} label="Time in Bed" format={formatHours} />
            <MetricCard entityId={OURA_SLEEP.latency} label="Fell Asleep" format={(v) => v ? `${Math.round(parseFloat(v))}min` : '--'} />
          </div>
          <SleepBreakdown
            deepId={OURA_SLEEP.deep_duration}
            lightId={OURA_SLEEP.light_duration}
            remId={OURA_SLEEP.rem_duration}
            awakeId={OURA_SLEEP.awake_time}
          />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <MetricCard entityId={OURA_SLEEP.bedtime_start} label="Bedtime" icon={<Clock size={14} />} format={formatTime} />
            <MetricCard entityId={OURA_SLEEP.bedtime_end} label="Wake Up" icon={<Clock size={14} />} format={formatTime} />
          </div>
        </SectionCard>

        {/* Heart Rate Section */}
        <SectionCard icon={Heart} iconColor="text-red-500" title="Heart Rate">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard entityId={OURA_HEART.current} label="Current" unit="bpm" />
            <MetricCard entityId={OURA_HEART.average} label="Daytime Avg" unit="bpm" />
            <MetricCard entityId={OURA_HEART.avg_sleep} label="Sleep Avg" unit="bpm" />
            <MetricCard entityId={OURA_HEART.lowest_sleep} label="Lowest (Sleep)" unit="bpm" />
            <MetricCard entityId={OURA_HEART.min} label="Day Min" unit="bpm" />
            <MetricCard entityId={OURA_HEART.max} label="Day Max" unit="bpm" />
            <MetricCard entityId={OURA_HEART.avg_sleep_hrv} label="Sleep HRV" unit="ms" />
            <MetricCard entityId={OURA_HEART.cardio_age} label="Cardio Age" unit="yrs" />
          </div>
        </SectionCard>
      </div>

      {/* Activity + Cold Plunge Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Activity */}
        <SectionCard icon={Activity} iconColor="text-green-500" title="Activity">
          <MetricRow items={[
            { entityId: OURA_ACTIVITY.steps, label: 'Steps' },
            { entityId: OURA_ACTIVITY.active_calories, label: 'Active Cal', unit: 'kcal' },
            { entityId: OURA_ACTIVITY.total_calories, label: 'Total Cal', unit: 'kcal' },
            { entityId: OURA_ACTIVITY.target_calories, label: 'Target', unit: 'kcal' },
          ]} />
          <div className="mt-3">
            <MetricRow items={[
              { entityId: OURA_ACTIVITY.high_activity, label: 'High', unit: 'min' },
              { entityId: OURA_ACTIVITY.medium_activity, label: 'Medium', unit: 'min' },
              { entityId: OURA_ACTIVITY.low_activity, label: 'Low', unit: 'min' },
            ]} />
          </div>
        </SectionCard>

        {/* Cold Plunge */}
        <ColdPlungeControls />
      </div>

      {/* Body + Stress Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Body */}
        <SectionCard icon={Thermometer} iconColor="text-orange-500" title="Body">
          <div className="grid grid-cols-1 gap-3">
            <MetricCard
              entityId={OURA_BODY.temp_deviation}
              label="Temp Deviation"
              unit="C"
              format={(v) => v && v !== 'unavailable' ? `${parseFloat(v) > 0 ? '+' : ''}${parseFloat(v).toFixed(2)}` : '--'}
            />
            <MetricCard entityId={OURA_BODY.spo2} label="SpO2" unit="%" format={(v) => v ? `${parseFloat(v).toFixed(1)}` : '--'} />
            <MetricCard entityId={OURA_BODY.breathing_index} label="Breathing Index" />
          </div>
        </SectionCard>

        {/* Stress & Recovery */}
        <SectionCard icon={Brain} iconColor="text-purple-500" title="Stress & Recovery">
          <div className="grid grid-cols-1 gap-3">
            <MetricCard
              entityId={OURA_STRESS.day_summary}
              label="Day Summary"
              format={(v) => v && v !== 'unavailable' ? v.charAt(0).toUpperCase() + v.slice(1) : '--'}
            />
            <MetricCard
              entityId={OURA_STRESS.resilience}
              label="Resilience"
              format={(v) => v && v !== 'unavailable' ? v.charAt(0).toUpperCase() + v.slice(1) : '--'}
            />
            <MetricCard entityId={OURA_STRESS.resilience_score} label="Resilience Score" />
            <MetricCard entityId={OURA_STRESS.daytime_recovery} label="Daytime Recovery" />
            <MetricCard entityId={OURA_STRESS.stress_high} label="High Stress" unit="min" />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
