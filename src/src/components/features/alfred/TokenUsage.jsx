/**
 * TokenUsage Component
 * Shows OpenAI token usage: today/week totals, model breakdown, per-cron-job costs
 */

import { Zap, AlertCircle } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';

function formatTokens(n) {
  if (n == null) return '--';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

function UsageBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2" style={{ height: '24px' }}>
      <div
        className="w-28 text-xs font-medium truncate text-right"
        style={{ color: 'var(--ds-text-secondary)' }}
        title={label}
      >
        {label}
      </div>
      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ds-warm-inactive-bg)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: color || 'var(--ds-accent)',
            transition: 'width 0.7s ease-out',
            minWidth: value > 0 ? '4px' : '0',
          }}
        />
      </div>
      <div className="w-16 text-xs font-semibold text-right" style={{ color: 'var(--ds-text)' }}>
        ${typeof value === 'number' ? value.toFixed(2) : value}
      </div>
    </div>
  );
}

function PeriodBlock({ label, data }) {
  if (!data) return null;
  return (
    <div className="flex-1 min-w-0">
      <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--ds-text-secondary)' }}>{label}</div>
      <div className="text-xl font-bold" style={{ color: 'var(--ds-text)' }}>{formatTokens(data.totalTokens)}</div>
      <div className="text-sm font-semibold" style={{ color: 'var(--ds-accent)' }}>${data.cost?.toFixed(2)}</div>
      <div className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>{data.requests} reqs</div>
    </div>
  );
}

export function TokenUsage() {
  const entity = useEntity('sensor.alfred_token_usage');
  const attrs = entity.attributes || {};
  const today = attrs.today || null;
  const thisCycle = attrs.thisCycle || null;
  const lastCycle = attrs.lastCycle || null;
  const models = attrs.models || [];
  const cronJobs = attrs.cronJobs || [];

  if (!today && !thisCycle) {
    return (
      <div className="ds-card h-full flex flex-col items-center justify-center gap-3">
        <AlertCircle size={32} style={{ color: 'var(--ds-text-secondary)' }} />
        <div className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
          Awaiting token data...
        </div>
      </div>
    );
  }

  const BUDGET = 20.00;
  const used = thisCycle?.cost || 0;
  const remaining = BUDGET - used;
  const budgetPct = Math.min((used / BUDGET) * 100, 100);
  const budgetColor = remaining < 0
    ? 'var(--ds-state-off)'
    : remaining < 5
      ? 'var(--ds-health-warn)'
      : 'var(--ds-state-on)';

  const maxCronCost = cronJobs.length > 0 ? cronJobs[0].cost : 1;

  return (
    <div className="ds-card h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Zap size={16} style={{ color: 'var(--ds-accent)' }} />
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--ds-text-secondary)' }}
        >
          Token Usage (OpenAI)
        </span>
      </div>

      {/* Three period headline */}
      <div className="flex gap-4 mb-2">
        <PeriodBlock label="Last Cycle" data={lastCycle} />
        <PeriodBlock label="This Cycle" data={thisCycle} />
        <PeriodBlock label="Today" data={today} />
        {/* Model breakdown */}
        {models.length > 0 && (
          <div className="ml-auto text-right flex-shrink-0">
            <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--ds-text-secondary)' }}>Models</div>
            {models.slice(0, 3).map(m => (
              <div key={m.name} className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
                <span style={{ color: 'var(--ds-text)' }}>{m.name.split('/').pop()}</span>
                {' '}{formatTokens(m.tokens)} · ${m.cost.toFixed(2)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cycle reset + Budget bar */}
      <div className="mb-4">
        <div className="text-xs mb-2" style={{ color: 'var(--ds-text-secondary)' }}>
          Cycle resets: Monday
        </div>
        <div className="flex items-center gap-2 text-xs mb-1">
          <span style={{ color: 'var(--ds-text-secondary)' }}>
            $20.00 plan
          </span>
          <span style={{ color: 'var(--ds-text)' }}>
            — ${used.toFixed(2)} used
          </span>
          <span style={{ color: budgetColor, fontWeight: 600 }}>
            {remaining < 0
              ? `— Over budget by $${Math.abs(remaining).toFixed(2)}`
              : `— $${remaining.toFixed(2)} remaining`
            }
          </span>
        </div>
        <div
          className="w-full h-2.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--ds-warm-inactive-bg)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${budgetPct}%`,
              backgroundColor: budgetColor,
              transition: 'width 0.7s ease-out',
              minWidth: used > 0 ? '4px' : '0',
            }}
          />
        </div>
      </div>

      {/* Per-cron cost bars */}
      {cronJobs.length > 0 && (
        <>
          <div
            className="text-xs font-semibold uppercase tracking-wider mb-2 pt-2"
            style={{ color: 'var(--ds-text-secondary)', borderTop: '1px solid var(--ds-border)' }}
          >
            Cost by Cron Job (this cycle)
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-0.5">
            {cronJobs.map(job => (
              <UsageBar
                key={job.name}
                label={job.name}
                value={job.cost}
                max={maxCronCost}
                color="var(--ds-health-info)"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
