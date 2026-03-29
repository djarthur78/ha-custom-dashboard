/**
 * WeekendPlanCard Component
 * Displays the OpenClaw weekend plan — lawn tasks, plant tasks, and watering recommendation.
 * Read-only; managed via OpenClaw on Discord.
 */

import { format, parseISO } from 'date-fns';
import { TreePine, Sprout, Droplets, Clock } from 'lucide-react';
import { useWeekendPlan } from './hooks/useWeekendPlan';

const PRIORITY_COLORS = {
  high: '#b5453a',
  medium: '#d4944c',
  low: '#4a9a4a',
};

const RECOMMENDATION_STYLES = {
  skip: { bg: 'rgba(90,143,184,0.1)', color: '#5a8fb8', label: 'Skip Watering' },
  water: { bg: 'rgba(74,154,74,0.1)', color: '#4a9a4a', label: 'Water All Zones' },
  partial: { bg: 'rgba(212,148,76,0.1)', color: '#d4944c', label: 'Partial Watering' },
};

function TaskList({ tasks, icon: Icon, title, updated, grouped = false }) {
  if (!tasks || tasks.length === 0) return null;

  // Group tasks by area if any have an area field
  const hasAreas = grouped && tasks.some(t => t.area);
  const groups = hasAreas
    ? tasks.reduce((acc, task) => {
        const area = task.area || 'General';
        if (!acc[area]) acc[area] = [];
        acc[area].push(task);
        return acc;
      }, {})
    : null;

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon size={14} style={{ color: 'var(--ds-text-secondary)' }} />
          <span className="text-xs font-semibold text-[var(--ds-text-secondary)] uppercase tracking-wider">
            {title}
          </span>
        </div>
        {updated && (
          <span className="text-[9px] text-[var(--ds-text-secondary)]">
            Updated {format(parseISO(updated), 'EEE d MMM, HH:mm')}
          </span>
        )}
      </div>

      {hasAreas ? (
        <div className="space-y-2">
          {Object.entries(groups).map(([area, areaTasks]) => (
            <div key={area}>
              <div className="text-[10px] font-semibold text-[var(--ds-text-secondary)] uppercase tracking-wider pl-1 mb-0.5">
                {area}
              </div>
              <div className="space-y-1">
                {areaTasks.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 pl-3">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: PRIORITY_COLORS[item.priority] || '#9ca3af' }}
                    />
                    <span className="text-sm text-[var(--ds-text)]">{item.task}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {tasks.map((item, i) => (
            <div key={i} className="flex items-start gap-2 pl-1">
              <div
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: PRIORITY_COLORS[item.priority] || '#9ca3af' }}
              />
              <span className="text-sm text-[var(--ds-text)]">{item.task}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WeekendPlanCard({ compact = false }) {
  const { plan, loading, error } = useWeekendPlan();

  if (loading) {
    return (
      <div className="ds-card flex items-center justify-center" style={{ padding: '16px', minHeight: 80 }}>
        <span className="text-xs italic text-[var(--ds-text-secondary)]">Loading plan...</span>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="ds-card" style={{ padding: compact ? '12px' : '16px' }}>
        <div className="text-center py-4">
          <Sprout size={24} className="mx-auto mb-2 text-[var(--ds-text-secondary)]" />
          <p className="text-sm text-[var(--ds-text-secondary)]">
            Waiting for OpenClaw update
          </p>
          {error && (
            <p className="text-xs text-[var(--ds-text-secondary)] mt-1 opacity-60">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  const recStyle = RECOMMENDATION_STYLES[plan.watering?.recommendation] || RECOMMENDATION_STYLES.skip;

  return (
    <div className="ds-card" style={{ padding: compact ? '12px' : '16px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-[var(--ds-text-secondary)] uppercase tracking-wider">
          Weekend Plan
        </h3>
        {plan.generated && (
          <div className="flex items-center gap-1 text-[10px] text-[var(--ds-text-secondary)]">
            <Clock size={10} />
            {format(parseISO(plan.generated), 'EEE d MMM, HH:mm')}
          </div>
        )}
      </div>

      {/* Watering Recommendation Banner */}
      {plan.watering && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
          style={{ backgroundColor: recStyle.bg }}
        >
          <Droplets size={16} style={{ color: recStyle.color }} />
          <div>
            <span className="text-sm font-semibold" style={{ color: recStyle.color }}>
              {recStyle.label}
            </span>
            {plan.watering.reason && (
              <p className="text-xs mt-0.5" style={{ color: recStyle.color, opacity: 0.8 }}>
                {plan.watering.reason}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Task Lists */}
      <TaskList tasks={plan.lawn?.tasks} icon={TreePine} title="Lawn" updated={plan.lawn?.updated} />
      {plan.lawn?.notes && (
        <p className="text-xs italic text-[var(--ds-text-secondary)] mb-3 pl-1">
          {plan.lawn.notes}
        </p>
      )}

      <TaskList tasks={plan.plants?.tasks} icon={Sprout} title="Plants" updated={plan.plants?.updated} grouped />
      {plan.plants?.notes && (
        <p className="text-xs italic text-[var(--ds-text-secondary)] pl-1">
          {plan.plants.notes}
        </p>
      )}
    </div>
  );
}
