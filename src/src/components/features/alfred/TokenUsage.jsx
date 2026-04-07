/**
 * TokenUsage Component
 * Shows OpenAI token usage for today and this week
 */

import { Zap, AlertCircle } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';

function UsageStat({ label, tokens, cost, requests }) {
  const formattedTokens = tokens != null
    ? tokens > 1000000 ? `${(tokens / 1000000).toFixed(1)}M`
    : tokens > 1000 ? `${(tokens / 1000).toFixed(0)}K`
    : String(tokens)
    : '--';

  return (
    <div className="flex-1">
      <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ds-text-secondary)' }}>
        {label}
      </div>
      <div className="text-2xl font-bold" style={{ color: 'var(--ds-text)' }}>
        {formattedTokens}
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--ds-text-secondary)' }}>tokens</div>
      {cost != null && (
        <div className="text-sm font-semibold mt-2" style={{ color: 'var(--ds-accent)' }}>
          ${cost.toFixed(2)}
        </div>
      )}
      {requests != null && (
        <div className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
          {requests} requests
        </div>
      )}
    </div>
  );
}

function UsageBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const formatted = value > 1000 ? `${(value / 1000).toFixed(0)}K` : String(value || 0);

  return (
    <div className="flex items-center gap-2">
      <div className="w-12 text-xs" style={{ color: 'var(--ds-text-secondary)' }}>{label}</div>
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
      <div className="w-12 text-xs font-semibold text-right" style={{ color: 'var(--ds-text)' }}>
        {formatted}
      </div>
    </div>
  );
}

export function TokenUsage() {
  const entity = useEntity('sensor.alfred_token_usage');
  const attrs = entity.attributes || {};
  const today = attrs.today || null;
  const week = attrs.week || null;

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

  const maxTokens = Math.max(today?.totalTokens || 0, week?.totalTokens || 0, 1);

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

      {/* Today vs Week */}
      <div className="flex gap-4 mb-4">
        {today && <UsageStat label="Today" tokens={today.totalTokens} cost={today.cost} requests={today.requests} />}
        {week && <UsageStat label="This Week" tokens={week.totalTokens} cost={week.cost} requests={week.requests} />}
      </div>

      {/* Breakdown bars */}
      {today && (
        <div className="flex flex-col gap-2">
          <UsageBar label="Input" value={today.input} max={maxTokens} color="var(--ds-health-info)" />
          <UsageBar label="Output" value={today.output} max={maxTokens} color="var(--ds-health-accent)" />
        </div>
      )}
    </div>
  );
}
