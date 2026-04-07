/**
 * StatusHero Component
 * Left panel: Alfred status, Discord connectivity, memory stats
 */

import { Bot, Database, Brain, RefreshCw } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { ALFRED_GATEWAY, ALFRED_DATA } from './alfredConfig';

function ConnBadge({ label, connected }) {
  const isOn = connected === true || connected === 'true';
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
      style={{
        backgroundColor: isOn ? 'var(--ds-state-on-bg)' : 'var(--ds-state-off-bg)',
        color: isOn ? 'var(--ds-state-on)' : 'var(--ds-state-off)',
      }}
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: isOn ? 'var(--ds-state-on)' : 'var(--ds-state-off)' }}
      />
      {label}
    </div>
  );
}

function StatBox({ label, value, icon: Icon }) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <Icon size={16} style={{ color: 'var(--ds-text-secondary)' }} />
      <div className="text-lg font-bold" style={{ color: 'var(--ds-text)' }}>{value ?? '--'}</div>
      <div className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>{label}</div>
    </div>
  );
}

export function StatusHero({ refreshing, error, onRefresh }) {
  const health = useEntity(ALFRED_GATEWAY.health);
  const status = useEntity(ALFRED_GATEWAY.status);
  const memory = useEntity(ALFRED_DATA.memoryStatus);

  const isOnline = health.state && health.state !== 'unavailable' && health.state !== 'unknown' && health.state !== 'offline';
  const attrs = status.attributes || {};
  const memAttrs = memory.attributes || {};

  return (
    <div
      className="ds-card h-full flex flex-col"
      style={{
        background: isOnline
          ? 'linear-gradient(135deg, rgba(74,154,74,0.06), rgba(74,154,74,0.02))'
          : 'linear-gradient(135deg, rgba(181,69,58,0.06), rgba(181,69,58,0.02))',
      }}
    >
      {/* Refresh button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="p-1.5 rounded-lg transition-colors"
          style={{
            color: error ? 'var(--ds-state-off)' : 'var(--ds-text-secondary)',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: refreshing ? 'wait' : 'pointer',
          }}
          title={error ? `Refresh failed: ${error}` : 'Refresh data'}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Alfred Identity */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <Bot
          size={48}
          className="mb-2"
          style={{ color: isOnline ? 'var(--ds-state-on)' : 'var(--ds-state-off)' }}
        />
        <div className="text-2xl font-bold mb-1" style={{ color: 'var(--ds-text)' }}>Alfred</div>

        {/* Online status */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: isOnline ? 'var(--ds-state-on)' : 'var(--ds-state-off)' }}
          />
          <span
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: isOnline ? 'var(--ds-state-on)' : 'var(--ds-state-off)' }}
          >
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Model + Uptime */}
        <div className="text-sm mb-1" style={{ color: 'var(--ds-text-secondary)' }}>
          {attrs.model || 'OpenClaw 2026.4.5'}
        </div>
        {attrs.uptime && (
          <div className="text-xs mb-4" style={{ color: 'var(--ds-text-secondary)' }}>
            Uptime: {attrs.uptime}
          </div>
        )}

        {/* Memory Stats */}
        <div className="flex gap-4 mb-6 w-full justify-center">
          <StatBox label="Files" value={memAttrs.total_files} icon={Database} />
          <StatBox label="Chunks" value={memAttrs.total_chunks} icon={Brain} />
        </div>

        {/* Discord Badge */}
        <div className="flex gap-2 mb-4">
          <ConnBadge label="Discord" connected={attrs.discord_connected} />
        </div>
      </div>
    </div>
  );
}
