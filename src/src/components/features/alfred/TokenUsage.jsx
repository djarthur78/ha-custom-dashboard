/**
 * TokenUsage Component
 * Shows OpenAI token usage: today/week totals, model breakdown, per-cron costs
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

export function TokenUsage() {
  const entity = useEntity('sensor.alfred_token_usage');
  const attrs = entity.attributes || {};
  const today = attrs.today || null;
  const week = attrs.week || null;
  const models = attrs.models || [];
  const cronJobs = attrs.cronJobs || [];

  if (!today && !week) {
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
      <div className="flex items-center gap-2 mb-3">
        <Zap size={16} style={{ color: 'var(--ds-accent)' }} />
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--ds-text-secondary)' }}
        >
          Token Usage
        </span>
      </div>

      {/* Today vs Week headline */}
      <div className="flex gap-6 mb-4">
        {today && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--ds-text-secondary)' }}>Today</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--ds-text)' }}>{formatTokens(today.totalTokens)}</div>
            <div className="text-sm font-semibold" style={{ color: 'var(--ds-accent)' }}>${today.cost?.toFixed(2)}</div>
            <div className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>{today.requests} reqs</div>
          </div>
        )}
        {week && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--ds-text-secondary)' }}>This Week</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--ds-text)' }}>{formatTokens(week.totalTokens)}</div>
            <div className="text-sm font-semibold" style={{ color: 'var(--ds-accent)' }}>${week.cost?.toFixed(2)}</div>
            <div className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>{week.requests} reqs</div>
          </div>
        )}
        {/* Model breakdown */}
        {models.length > 0 && (
          <div className="ml-auto text-right">
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

      {/* Per-cron cost bars */}
      {cronJobs.length > 0 && (
        <>
          <div
            className="text-xs font-semibold uppercase tracking-wider mb-2 pt-2"
            style={{ color: 'var(--ds-text-secondary)', borderTop: '1px solid var(--ds-border)' }}
          >
            Cost by Cron Job (this week)
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
