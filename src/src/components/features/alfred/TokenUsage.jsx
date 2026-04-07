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

function formatNumber(n) {
  if (n == null) return '--';
  return n.toLocaleString();
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
      <div className="text-xl font-bold" style={{ color: 'var(--ds-text)' }}>{formatNumber(data.requests)} <span className="text-sm font-medium" style={{ color: 'var(--ds-text-secondary)' }}>reqs</span></div>
      <div className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>{formatTokens(data.totalTokens)} tokens · ${data.cost?.toFixed(2)}</div>
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

  const maxCronCost = cronJobs.length > 0 ? cronJobs[0].cost : 1;

  return (
    <div className="ds-card h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Zap size={16} style={{ color: 'var(--ds-accent)' }} />
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--ds-text-secondary)' }}
        >
          Token Usage (OpenAI)
        </span>
      </div>
      <div className="text-xs mb-3" style={{ color: 'var(--ds-text-secondary)' }}>
        Plus plan · No token limits · Cycle resets Monday
      </div>

      {/* Three period headline */}
      <div className="flex gap-4 mb-3">
        <PeriodBlock label="Last Cycle" data={lastCycle} />
        <PeriodBlock label="This Cycle" data={thisCycle} />
        <PeriodBlock label="Today" data={today} />
      </div>

      {/* Model breakdown */}
      {models.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--ds-text-secondary)' }}>Models</div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
            {models.slice(0, 4).map(m => (
              <div key={m.name} className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
                <span style={{ color: 'var(--ds-text)' }}>{m.name.split('/').pop()}</span>
                {' '}{formatTokens(m.tokens)} · ${m.cost.toFixed(2)}
              </div>
            ))}
          </div>
        </div>
      )}

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
