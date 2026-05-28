import { ListChecks } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { ALFRED_OPS, getOpsColor, getSeverityRank } from './alfredConfig';

export function LaunchAgentStatus() {
  const ops = useEntity(ALFRED_OPS.dashboard);
  const launchAgents = ops.attributes?.launch_agents || {};
  const agents = Array.isArray(launchAgents.agents) ? launchAgents.agents : [];
  const visibleAgents = agents
    .filter(agent => agent.status !== 'ok')
    .sort((a, b) => getSeverityRank(a.status) - getSeverityRank(b.status))
    .slice(0, 7);

  return (
    <div className="pt-3 mt-3" style={{ borderTop: '1px solid var(--ds-border)' }}>
      <div className="flex items-center gap-2 mb-2">
        <ListChecks size={14} style={{ color: 'var(--ds-accent)' }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ds-text-secondary)' }}>
          LaunchAgents
        </span>
        <span className="ml-auto text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
          {launchAgents.ok ?? 0} ok
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        {visibleAgents.length === 0 ? (
          <div className="text-sm" style={{ color: 'var(--ds-text-secondary)', height: '28px' }}>
            No LaunchAgent failures.
          </div>
        ) : (
          visibleAgents.map(agent => (
            <div key={agent.label} className="flex items-center gap-2 min-w-0" style={{ height: '30px' }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getOpsColor(agent.status) }} />
              <span className="text-sm truncate" style={{ color: 'var(--ds-text)' }} title={agent.label}>
                {agent.label.replace(/^com\.alfred\.|^ai\.openclaw\.|^com\.daz\./, '')}
              </span>
              <span className="ml-auto text-xs font-medium" style={{ color: getOpsColor(agent.status) }}>
                {agent.last_exit_status ?? 'missing'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
