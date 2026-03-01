/**
 * HealthDashboard Component
 * Main layout for Health & Wellness tab with Oura Ring data and Cold Plunge controls
 */

import { Heart, Activity, Thermometer, Brain } from 'lucide-react';
import { ScoreRing } from './ScoreRing';
import { MetricCard, MetricRow } from './MetricCard';
import { ColdPlungeControls } from './ColdPlungeControls';
import {
  OURA_SCORES,
  OURA_SLEEP,
  OURA_HEART,
  OURA_ACTIVITY,
  OURA_BODY,
  OURA_STRESS,
} from './healthConfig';

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
              { entityId: OURA_SLEEP.restfulness, label: 'Restfulness' },
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

      {/* Heart Rate + Cold Plunge Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Heart Rate Section */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-6" style={{
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div className="flex items-center gap-2 mb-4">
            <Heart size={20} className="text-red-500" />
            <h3 className="text-lg font-bold text-[var(--color-text)]">Heart Rate</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard entityId={OURA_HEART.current} label="Current" unit="bpm" />
            <MetricCard entityId={OURA_HEART.average} label="Average" unit="bpm" />
            <MetricCard entityId={OURA_HEART.min} label="Lowest" unit="bpm" />
            <MetricCard entityId={OURA_HEART.max} label="Highest" unit="bpm" />
            <MetricCard entityId={OURA_HEART.hrv_balance} label="HRV Balance" />
            <MetricCard entityId={OURA_HEART.cardio_age} label="Cardio Age" unit="yrs" />
          </div>
        </div>

        {/* Cold Plunge Controls */}
        <ColdPlungeControls />
      </div>

      {/* Activity Section */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-6" style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <div className="flex items-center gap-2 mb-4">
          <Activity size={20} className="text-green-500" />
          <h3 className="text-lg font-bold text-[var(--color-text)]">Activity</h3>
        </div>
        <MetricRow items={[
          { entityId: OURA_ACTIVITY.steps, label: 'Steps' },
          { entityId: OURA_ACTIVITY.active_calories, label: 'Active Calories', unit: 'kcal' },
          { entityId: OURA_ACTIVITY.total_calories, label: 'Total Calories', unit: 'kcal' },
          { entityId: OURA_ACTIVITY.target_calories, label: 'Target', unit: 'kcal' },
        ]} />
        <div className="mt-3">
          <MetricRow items={[
            { entityId: OURA_ACTIVITY.high_activity, label: 'High Activity', unit: 'min' },
            { entityId: OURA_ACTIVITY.medium_activity, label: 'Medium Activity', unit: 'min' },
            { entityId: OURA_ACTIVITY.low_activity, label: 'Low Activity', unit: 'min' },
          ]} />
        </div>
      </div>

      {/* Body + Stress Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Body Section */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-6" style={{
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div className="flex items-center gap-2 mb-4">
            <Thermometer size={20} className="text-orange-500" />
            <h3 className="text-lg font-bold text-[var(--color-text)]">Body</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <MetricCard
              entityId={OURA_BODY.temp_deviation}
              label="Temp Deviation"
              unit="C"
              format={(v) => v ? `${parseFloat(v) > 0 ? '+' : ''}${parseFloat(v).toFixed(2)}` : '--'}
            />
            <MetricCard entityId={OURA_BODY.spo2} label="SpO2" unit="%" />
            <MetricCard entityId={OURA_BODY.breathing_index} label="Breathing Index" />
          </div>
        </div>

        {/* Stress & Recovery Section */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-6" style={{
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div className="flex items-center gap-2 mb-4">
            <Brain size={20} className="text-purple-500" />
            <h3 className="text-lg font-bold text-[var(--color-text)]">Stress & Recovery</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <MetricCard
              entityId={OURA_STRESS.day_summary}
              label="Day Summary"
              format={(v) => v ? v.charAt(0).toUpperCase() + v.slice(1) : '--'}
            />
            <MetricCard
              entityId={OURA_STRESS.resilience}
              label="Resilience"
              format={(v) => v ? v.charAt(0).toUpperCase() + v.slice(1) : '--'}
            />
            <MetricCard entityId={OURA_STRESS.recovery_score} label="Recovery Score" />
          </div>
        </div>
      </div>
    </div>
  );
}
