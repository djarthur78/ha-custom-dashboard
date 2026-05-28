import { CheckCircle2, Film, MessageCircle, Newspaper, Send } from 'lucide-react';
import { createElement } from 'react';
import { useEntity } from '../../../hooks/useEntity';
import { ALFRED_OPS, formatOpsValue, formatRelativeTime, getOpsBg, getOpsColor } from './alfredConfig';

function WorkflowRow({ icon: Icon, title, status, rows }) {
  return (
    <div className="py-2" style={{ borderTop: '1px solid var(--ds-border)' }}>
      <div className="flex items-center gap-2 mb-1">
        {createElement(Icon, { size: 15, style: { color: getOpsColor(status) } })}
        <span className="text-sm font-semibold" style={{ color: 'var(--ds-text)' }}>{title}</span>
        <span
          className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold uppercase"
          style={{ backgroundColor: getOpsBg(status), color: getOpsColor(status) }}
        >
          {status || 'unknown'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex min-w-0 gap-2 text-xs">
            <span className="flex-shrink-0" style={{ color: 'var(--ds-text-secondary)' }}>{label}</span>
            <span className="truncate font-medium" style={{ color: 'var(--ds-text)' }} title={formatOpsValue(value)}>{formatOpsValue(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkflowCards() {
  const ops = useEntity(ALFRED_OPS.dashboard);
  const workflows = ops.attributes?.workflows || {};
  const movie = workflows.movie_approval || {};
  const proactive = workflows.proactive_dispatch || {};
  const morning = workflows.morning_brief || {};
  const discord = workflows.discord_reply_audit || {};

  return (
    <div className="ds-card h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 size={16} style={{ color: 'var(--ds-accent)' }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ds-text-secondary)' }}>
          Workflows
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <WorkflowRow
          icon={Film}
          title="Movie approvals"
          status={movie.status}
          rows={[
            ['Approved', movie.approved_count],
            ['Latest', movie.latest_key],
            ['Last run', formatRelativeTime(movie.last_run_at)],
            ['Processed', movie.processed_count],
          ]}
        />
        <WorkflowRow
          icon={Send}
          title="Proactive dispatch"
          status={proactive.status}
          rows={[
            ['Dedupe', proactive.today_deduped ? 'today set' : 'clear'],
            ['Last run', formatRelativeTime(proactive.last_run_at)],
            ['Error', proactive.last_error || 'none'],
          ]}
        />
        <WorkflowRow
          icon={Newspaper}
          title="Morning brief"
          status={morning.status}
          rows={[
            ['Leakage', morning.leakage_detected ? 'detected' : 'clear'],
            ['Audit', morning.last_audit || 'unknown'],
          ]}
        />
        <WorkflowRow
          icon={MessageCircle}
          title="Discord reply audit"
          status={discord.status}
          rows={[
            ['Failure', discord.latest_delivery_failure || 'none'],
            ['Audit', discord.last_audit || 'unknown'],
          ]}
        />
      </div>
    </div>
  );
}
