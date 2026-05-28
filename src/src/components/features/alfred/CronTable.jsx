/**
 * CronTable Component
 * Compact table of OpenClaw cron jobs with status indicators
 */

import { Clock, AlertCircle } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { ALFRED_DATA, ALFRED_OPS, formatRelativeTime, getOpsBg, getOpsColor, getSeverityRank } from './alfredConfig';

function StatusDot({ status }) {
  const passed = status === 'ok' || status === 'success' || status === true || status === 'healthy';
  return (
    <div
      className="w-2.5 h-2.5 rounded-full"
      style={{ backgroundColor: passed ? 'var(--ds-state-on)' : getOpsColor(status) }}
      title={passed ? 'Passed' : 'Failed'}
    />
  );
}

export function CronTable() {
  const opsEntity = useEntity(ALFRED_OPS.dashboard);
  const cronEntity = useEntity(ALFRED_DATA.cronList);
  const opsCron = opsEntity.attributes?.cron || null;
  const attrs = cronEntity.attributes || {};

  // Cron data may be in attributes.jobs (array) or the attributes itself may be the array
  const fallbackJobs = Array.isArray(attrs.jobs) ? attrs.jobs : (Array.isArray(attrs) ? attrs : null);
  const jobs = Array.isArray(opsCron?.jobs) ? opsCron.jobs : fallbackJobs;
  const issueCount = opsCron ? (opsCron.warning || 0) + (opsCron.error || 0) : jobs?.filter(job => job.status !== 'ok' && job.status !== 'success').length || 0;
  const sortedJobs = jobs
    ? [...jobs].sort((a, b) => getSeverityRank(a.risk || a.status) - getSeverityRank(b.risk || b.status) || (a.next_run_ms || a.next_run || Infinity) - (b.next_run_ms || b.next_run || Infinity))
    : null;

  if (!jobs) {
    return (
      <div className="ds-card h-full flex flex-col items-center justify-center gap-3">
        <AlertCircle size={32} style={{ color: 'var(--ds-text-secondary)' }} />
        <div className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
          Awaiting cron data...
        </div>
        <div className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
          Sensor: {ALFRED_DATA.cronList}
        </div>
      </div>
    );
  }

  return (
    <div className="ds-card h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Clock size={16} style={{ color: 'var(--ds-accent)' }} />
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--ds-text-secondary)' }}
        >
          Cron Jobs
        </span>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: getOpsBg(issueCount ? (opsCron?.error ? 'critical' : 'warning') : 'ok'),
            color: getOpsColor(issueCount ? (opsCron?.error ? 'critical' : 'warning') : 'ok'),
          }}
        >
          {issueCount ? `${issueCount} issues` : 'All clear'}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto -mx-1">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-xs uppercase tracking-wider"
              style={{ color: 'var(--ds-text-secondary)' }}
            >
              <th className="text-left py-1.5 px-2 font-semibold">Name</th>
              <th className="text-left py-1.5 px-2 font-semibold">Next</th>
              <th className="text-left py-1.5 px-2 font-semibold">Last Run</th>
              <th className="text-left py-1.5 px-2 font-semibold">Delivery</th>
              <th className="text-center py-1.5 px-2 font-semibold w-10">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedJobs.map((job, i) => {
              const status = job.risk || job.status;
              return (
              <tr
                key={job.name || i}
                className="transition-colors"
                style={{
                  backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)',
                  height: '36px',
                }}
              >
                <td className="py-1.5 px-2 font-medium" style={{ color: 'var(--ds-text)' }}>
                  {job.name || job.label || `Job ${i + 1}`}
                </td>
                <td className="py-1.5 px-2" style={{ color: 'var(--ds-text-secondary)' }}>
                  {formatRelativeTime(job.next_run_ms || job.next_run)}
                </td>
                <td className="py-1.5 px-2" style={{ color: 'var(--ds-text-secondary)' }}>
                  {formatRelativeTime(job.last_run_ms || job.last_run)}
                </td>
                <td
                  className="py-1.5 px-2 text-xs truncate max-w-64"
                  style={{ color: job.risk ? getOpsColor(job.risk) : 'var(--ds-text-secondary)' }}
                  title={job.delivery || job.risk || '--'}
                >
                  {job.risk || job.delivery || '--'}
                </td>
                <td className="py-1.5 px-2 flex justify-center items-center" style={{ height: '36px' }}>
                  <StatusDot status={status} />
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
