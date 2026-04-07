/**
 * ChannelActivity Component
 * Horizontal bar chart of Discord channel message counts
 */

import { Hash, AlertCircle } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { ALFRED_GATEWAY } from './alfredConfig';

function ChannelBar({ name, count, maxCount }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;

  return (
    <div className="flex items-center gap-2" style={{ height: '28px' }}>
      <div
        className="w-24 text-xs font-medium truncate text-right"
        style={{ color: 'var(--ds-text-secondary)' }}
        title={name}
      >
        #{name}
      </div>
      <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ds-warm-inactive-bg)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: 'var(--ds-accent)',
            transition: 'width 0.7s ease-out',
            minWidth: count > 0 ? '4px' : '0',
          }}
        />
      </div>
      <div
        className="w-8 text-xs font-semibold text-right"
        style={{ color: count > 0 ? 'var(--ds-text)' : 'var(--ds-text-secondary)' }}
      >
        {count}
      </div>
    </div>
  );
}

export function ChannelActivity() {
  const statusEntity = useEntity(ALFRED_GATEWAY.status);
  const attrs = statusEntity.attributes || {};

  // Channel data may be in attributes.channels (object: { name: count })
  const channelsRaw = attrs.channels || null;

  if (!channelsRaw || typeof channelsRaw !== 'object') {
    return (
      <div className="ds-card h-full flex flex-col items-center justify-center gap-3">
        <AlertCircle size={32} style={{ color: 'var(--ds-text-secondary)' }} />
        <div className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
          Awaiting channel data...
        </div>
      </div>
    );
  }

  // Sort by count descending
  const channels = Object.entries(channelsRaw)
    .map(([name, count]) => ({ name, count: Number(count) || 0 }))
    .sort((a, b) => b.count - a.count);

  const maxCount = channels.length > 0 ? channels[0].count : 0;

  return (
    <div className="ds-card h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Hash size={16} style={{ color: 'var(--ds-accent)' }} />
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--ds-text-secondary)' }}
        >
          Channel Activity
        </span>
        <span className="ml-auto text-xs" style={{ color: 'var(--ds-text-secondary)' }}>today</span>
      </div>

      {/* Bars */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1">
        {channels.map(({ name, count }) => (
          <ChannelBar key={name} name={name} count={count} maxCount={maxCount} />
        ))}
      </div>
    </div>
  );
}
