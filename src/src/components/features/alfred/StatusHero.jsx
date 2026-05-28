/**
 * StatusHero Component
 * Left panel: Alfred status, task stats, memory, Discord, restart button
 */

import { useState } from 'react';
import { createElement } from 'react';
import { AlertTriangle, Bot, Database, Brain, RefreshCw, RotateCcw, Loader2, MessageCircle } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { ALFRED_GATEWAY, ALFRED_DATA, ALFRED_OPS, getOpsBg, getOpsColor } from './alfredConfig';

function ConnBadge({ label, connected }) {
  const isOn = connected === true || connected === 'true';
  const isUnknown = connected == null || connected === 'unknown';
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
      style={{
        backgroundColor: isUnknown ? 'var(--ds-warm-inactive-bg)' : isOn ? 'var(--ds-state-on-bg)' : 'var(--ds-state-off-bg)',
        color: isUnknown ? 'var(--ds-warm-inactive-text)' : isOn ? 'var(--ds-state-on)' : 'var(--ds-state-off)',
      }}
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: isUnknown ? 'var(--ds-warm-inactive-text)' : isOn ? 'var(--ds-state-on)' : 'var(--ds-state-off)' }}
      />
      {label}
    </div>
  );
}

function StatBox({ label, value, icon: Icon }) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      {createElement(Icon, { size: 16, style: { color: 'var(--ds-text-secondary)' } })}
      <div className="text-lg font-bold" style={{ color: 'var(--ds-text)' }}>{value ?? '--'}</div>
      <div className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>{label}</div>
    </div>
  );
}

export function StatusHero({ refreshing, error, onRefresh }) {
  const health = useEntity(ALFRED_GATEWAY.health);
  const status = useEntity(ALFRED_GATEWAY.status);
  const ops = useEntity(ALFRED_OPS.dashboard);
  const memory = useEntity(ALFRED_DATA.memoryStatus);
  const taskStats = useEntity('sensor.alfred_task_stats');

  const [restarting, setRestarting] = useState(false);
  const [restartResult, setRestartResult] = useState(null); // 'ok' | 'error' | null

  const opsAttrs = ops.attributes || {};
  const hasOps = ops.state && ops.state !== 'unknown' && ops.state !== 'unavailable';
  const legacyOnline = health.state && health.state !== 'unavailable' && health.state !== 'unknown' && health.state !== 'offline';
  const overall = hasOps ? (opsAttrs.overall || ops.state) : legacyOnline ? 'healthy' : 'unknown';
  const gateway = hasOps ? (opsAttrs.gateway || {}) : {
    version: health.attributes?.version,
    status_text: health.state,
  };
  const discord = hasOps ? (opsAttrs.discord || {}) : {
    connected: status.attributes?.discord_connected === true ? true : null,
  };
  const issues = Array.isArray(opsAttrs.issues) ? opsAttrs.issues : [];
  const isOnline = overall === 'healthy' || overall === 'warning' || legacyOnline;
  const attrs = status.attributes || {};
  const memAttrs = memory.attributes || {};
  const tasks = taskStats.attributes || {};
  const tokenEntity = useEntity('sensor.alfred_token_usage');
  const rolling14d = tokenEntity.attributes?.rolling14d || {};

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
          ? `linear-gradient(135deg, ${getOpsBg(overall)}, rgba(255,255,255,0.02))`
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
          style={{ color: getOpsColor(overall) }}
        />
        <div className="text-2xl font-bold mb-1" style={{ color: 'var(--ds-text)' }}>Alfred</div>

        {/* Overall status */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: getOpsColor(overall) }}
          />
          <span
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: getOpsColor(overall) }}
          >
            {overall}
          </span>
        </div>

        {/* Gateway version */}
        <div className="text-sm mb-1" style={{ color: 'var(--ds-text-secondary)' }}>
          {gateway.version ? `Gateway ${gateway.version}` : attrs.model || 'OpenClaw'}
        </div>
        {attrs.uptime && (
          <div className="text-xs mb-4" style={{ color: 'var(--ds-text-secondary)' }}>
            Uptime: {attrs.uptime}
          </div>
        )}

        <div className="flex gap-2 mb-4 justify-center flex-wrap">
          <ConnBadge label={discord.connected == null ? 'Discord pending' : 'Discord'} connected={discord.connected} />
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: issues.length ? getOpsBg(issues.some(i => i.severity === 'critical') ? 'critical' : 'warning') : 'var(--ds-state-on-bg)',
              color: issues.length ? getOpsColor(issues.some(i => i.severity === 'critical') ? 'critical' : 'warning') : 'var(--ds-state-on)',
            }}
          >
            <AlertTriangle size={14} />
            {issues.length ? `${issues.length} issues` : 'No issues'}
          </div>
          {discord.last_inbound && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--ds-warm-inactive-bg)', color: 'var(--ds-warm-inactive-text)' }}>
              <MessageCircle size={14} />
              {discord.last_inbound}
            </div>
          )}
        </div>

        {/* 14-Day Health */}
        {(() => {
          const rate = rolling14d.successRate ?? null;
          const activeCount = (tasks.active || 0) + (tasks.running || 0);
          const rateLimitHits = rolling14d.rateLimitHits ?? 0;
          const avgReqs = rolling14d.avgRequestsPerDay ?? 0;
          return (
            <div className="mb-4 text-center">
              {rate != null && (
                <div className="text-3xl font-bold" style={{ color: rate >= 95 ? 'var(--ds-state-on)' : rate >= 80 ? 'var(--ds-health-warn)' : 'var(--ds-state-off)' }}>
                  {rate}%
                  <span className="text-xs font-medium ml-1" style={{ color: 'var(--ds-text-secondary)' }}>success</span>
                </div>
              )}
              {activeCount > 0 && (
                <div className="text-sm font-medium" style={{ color: 'var(--ds-health-info)' }}>
                  {activeCount} active now
                </div>
              )}
              <div className="text-xs mt-1" style={{ color: 'var(--ds-text-secondary)' }}>
                {rateLimitHits} rate limit hits · ~{avgReqs} req/day (14d)
              </div>
            </div>
          );
        })()}

        {/* Memory Stats */}
        <div className="flex gap-4 mb-4 w-full justify-center">
          <StatBox label="Files" value={memAttrs.total_files} icon={Database} />
          <StatBox label="Chunks" value={memAttrs.total_chunks} icon={Brain} />
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
            Run Doctor
          </>
        )}
      </button>
    </div>
  );
}
