import { AlertTriangle, MessageCircle, Server, ShieldCheck, Wifi } from 'lucide-react';
import { createElement } from 'react';
import { useEntity } from '../../../hooks/useEntity';
import { ALFRED_GATEWAY, ALFRED_OPS, formatRelativeTime, getOpsBg, getOpsColor } from './alfredConfig';

function StateBadge({ state }) {
  const label = state ? state.charAt(0).toUpperCase() + state.slice(1) : 'Unknown';
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase"
      style={{ backgroundColor: getOpsBg(state), color: getOpsColor(state) }}
    >
      {label}
    </span>
  );
}

function MetricRow({ icon: Icon, label, value, state }) {
  return (
    <div className="flex items-center gap-2 min-w-0" style={{ height: '30px' }}>
      {createElement(Icon, { size: 15, style: { color: getOpsColor(state) } })}
      <span className="text-sm font-medium" style={{ color: 'var(--ds-text)' }}>{label}</span>
      <span className="ml-auto text-sm truncate" style={{ color: 'var(--ds-text-secondary)' }} title={value}>
        {value || '--'}
      </span>
    </div>
  );
}

export function OpsOverview() {
  const ops = useEntity(ALFRED_OPS.dashboard);
  const health = useEntity(ALFRED_GATEWAY.health);
  const status = useEntity(ALFRED_GATEWAY.status);
  const attrs = ops.attributes || {};
  const statusAttrs = status.attributes || {};
  const healthAttrs = health.attributes || {};
  const hasOps = ops.state && ops.state !== 'unknown' && ops.state !== 'unavailable';
  const issues = Array.isArray(attrs.issues) ? attrs.issues : [];
  const legacyOnline = health.state && health.state !== 'unavailable' && health.state !== 'unknown' && health.state !== 'offline';
  const gateway = hasOps ? (attrs.gateway || {}) : {
    running: legacyOnline,
    probe_ok: legacyOnline,
    version: healthAttrs.version,
    status_text: health.state || 'unknown',
  };
  const discord = hasOps ? (attrs.discord || {}) : {
    connected: statusAttrs.discord_connected === true ? true : null,
    bot: 'Discord',
  };
  const overall = hasOps ? (attrs.overall || ops.state) : legacyOnline ? 'healthy' : 'unknown';
  const summary = hasOps
    ? attrs.summary
    : legacyOnline
      ? 'Gateway online. Ops aggregate sensor pending from the updated Alfred API.'
      : 'Awaiting Alfred ops data...';

  return (
    <div className="ds-card h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck size={16} style={{ color: getOpsColor(overall) }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ds-text-secondary)' }}>
          Ops Overview
        </span>
        <div className="ml-auto"><StateBadge state={overall} /></div>
      </div>

      <div className="text-sm mb-3" style={{ color: 'var(--ds-text)' }}>
        {summary}
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-0 mb-3">
        <MetricRow
          icon={Server}
          label="Gateway"
          value={`${gateway.status_text || 'unknown'}${gateway.version ? ` · ${gateway.version}` : ''}`}
          state={gateway.running && gateway.probe_ok ? 'ok' : 'critical'}
        />
        <MetricRow
          icon={Wifi}
          label="Probe"
          value={gateway.probe_ok ? 'ok' : 'failed'}
          state={gateway.probe_ok ? 'ok' : 'critical'}
        />
        <MetricRow
          icon={MessageCircle}
          label="Discord"
          value={discord.connected == null ? 'pending' : discord.connected ? `${discord.bot || 'connected'}${discord.last_inbound ? ` · ${discord.last_inbound}` : ''}` : 'disconnected'}
          state={discord.connected == null ? 'unknown' : discord.connected ? 'ok' : 'critical'}
        />
        <MetricRow
          icon={AlertTriangle}
          label="Issues"
          value={issues.length ? `${issues.length} visible` : 'All clear'}
          state={issues.some(i => i.severity === 'critical') ? 'critical' : issues.length ? 'warning' : 'ok'}
        />
      </div>

      <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--ds-text-secondary)' }}>
        Active Issues
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {issues.length === 0 ? (
          <div className="text-sm py-2" style={{ color: 'var(--ds-text-secondary)' }}>No active operational issues.</div>
        ) : (
          issues.slice(0, 3).map((item, index) => (
            <div key={`${item.title}-${index}`} className="py-1.5" style={{ borderTop: index ? '1px solid var(--ds-border)' : 'none' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getOpsColor(item.severity) }} />
                <span className="text-sm font-medium truncate" style={{ color: 'var(--ds-text)' }} title={item.title}>{item.title}</span>
              </div>
              <div className="text-xs truncate ml-4" style={{ color: 'var(--ds-text-secondary)' }} title={item.detail}>{item.detail}</div>
            </div>
          ))
        )}
      </div>

      <div className="text-xs pt-2" style={{ color: 'var(--ds-text-secondary)', borderTop: '1px solid var(--ds-border)' }}>
        Generated {hasOps ? formatRelativeTime(attrs.generated_at) : 'pending'}
      </div>
    </div>
  );
}
