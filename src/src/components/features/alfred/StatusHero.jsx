/**
 * StatusHero Component
 * Left panel: Alfred status, task stats, memory, Discord, restart button
 */

import { useState } from 'react';
import { Bot, Database, Brain, RefreshCw, RotateCcw, Loader2 } from 'lucide-react';
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

function TaskStat({ label, value, color }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-xl font-bold" style={{ color }}>{value ?? '--'}</div>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--ds-text-secondary)' }}>{label}</div>
    </div>
  );
}

export function StatusHero({ refreshing, error, onRefresh }) {
  const health = useEntity(ALFRED_GATEWAY.health);
  const status = useEntity(ALFRED_GATEWAY.status);
  const memory = useEntity(ALFRED_DATA.memoryStatus);
  const taskStats = useEntity('sensor.alfred_task_stats');

  const [restarting, setRestarting] = useState(false);
  const [restartResult, setRestartResult] = useState(null); // 'ok' | 'error' | null

  const isOnline = health.state && health.state !== 'unavailable' && health.state !== 'unknown' && health.state !== 'offline';
  const attrs = status.attributes || {};
  const memAttrs = memory.attributes || {};
  const tasks = taskStats.attributes || {};

  async function handleRestart() {
    setRestarting(true);
    setRestartResult(null);
    try {
      const resp = await fetch('http://192.168.1.150:18800/alfred/restart');
      const data = await resp.json();
      setRestartResult(data.ok ? 'ok' : 'error');
    } catch {
      setRestartResult('error');
    } finally {
      setRestarting(false);
      setTimeout(() => setRestartResult(null), 4000);
    }
  }

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
        <div className="flex items-center gap-2 mb-3">
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

        {/* Task Stats */}
        <div
          className="w-full rounded-lg px-3 py-2.5 mb-4"
          style={{ backgroundColor: 'var(--ds-warm-inactive-bg)' }}
        >
          <div
            className="text-[10px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--ds-text-secondary)' }}
          >
            Tasks
          </div>
          <div className="grid grid-cols-4 gap-1 mb-2">
            <TaskStat label="Succeeded" value={tasks.succeeded} color="var(--ds-state-on)" />
            <TaskStat label="Failed" value={tasks.failed} color="var(--ds-state-off)" />
            <TaskStat label="Timed Out" value={tasks.timed_out} color="var(--ds-health-warn)" />
            <TaskStat
              label="Active"
              value={tasks.active > 0 || tasks.running > 0 ? (tasks.active || 0) + (tasks.running || 0) : '--'}
              color="var(--ds-health-info)"
            />
          </div>
          {tasks.sessions_count != null && (
            <div className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
              {tasks.sessions_count} sessions · {tasks.total || 0} total tasks
            </div>
          )}
        </div>

        {/* Memory Stats */}
        <div className="flex gap-4 mb-4 w-full justify-center">
          <StatBox label="Files" value={memAttrs.total_files} icon={Database} />
          <StatBox label="Chunks" value={memAttrs.total_chunks} icon={Brain} />
        </div>

        {/* Discord Badge */}
        <div className="flex gap-2 mb-4">
          <ConnBadge label="Discord" connected={attrs.discord_connected} />
        </div>
      </div>

      {/* Restart Button */}
      <button
        onClick={handleRestart}
        disabled={restarting}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{
          backgroundColor: restartResult === 'ok'
            ? 'var(--ds-state-on-bg)'
            : restartResult === 'error'
              ? 'var(--ds-state-off-bg)'
              : 'transparent',
          color: restartResult === 'ok'
            ? 'var(--ds-state-on)'
            : restartResult === 'error'
              ? 'var(--ds-state-off)'
              : 'var(--ds-text-secondary)',
          border: `1px solid ${restartResult === 'ok' ? 'var(--ds-state-on)' : restartResult === 'error' ? 'var(--ds-state-off)' : 'var(--ds-accent)'}`,
          cursor: restarting ? 'wait' : 'pointer',
          opacity: restarting ? 0.7 : 1,
        }}
      >
        {restarting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Running doctor...
          </>
        ) : restartResult === 'ok' ? (
          'Doctor completed'
        ) : restartResult === 'error' ? (
          'Doctor failed'
        ) : (
          <>
            <RotateCcw size={14} />
            Restart Alfred
          </>
        )}
      </button>
    </div>
  );
}
