/**
 * CronTable Component
 * Compact table of OpenClaw cron jobs with status indicators
 */

import { Clock, AlertCircle } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { ALFRED_DATA, formatRelativeTime } from './alfredConfig';

function StatusDot({ status }) {
  const passed = status === 'ok' || status === 'success' || status === true;
  return (
    <div
      className="w-2.5 h-2.5 rounded-full"
      style={{ backgroundColor: passed ? 'var(--ds-state-on)' : 'var(--ds-state-off)' }}
      title={passed ? 'Passed' : 'Failed'}
    />
  );
}

export function CronTable() {
  const cronEntity = useEntity(ALFRED_DATA.cronList);
  const attrs = cronEntity.attributes || {};

  // Cron data may be in attributes.jobs (array) or the attributes itself may be the array
  const jobs = Array.isArray(attrs.jobs) ? attrs.jobs : (Array.isArray(attrs) ? attrs : null);

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
            backgroundColor: 'var(--ds-state-on-bg)',
            color: 'var(--ds-state-on)',
          }}
        >
          {jobs.length} active
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
              <th className="text-center py-1.5 px-2 font-semibold w-10">Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, i) => (
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
                  {job.next_run || job.schedule || '--'}
                </td>
                <td className="py-1.5 px-2" style={{ color: 'var(--ds-text-secondary)' }}>
                  {formatRelativeTime(job.last_run)}
                </td>
                <td className="py-1.5 px-2 flex justify-center items-center" style={{ height: '36px' }}>
                  <StatusDot status={job.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
