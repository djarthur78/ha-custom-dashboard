#!/usr/bin/env node
/**
 * Alfred Data API — lightweight HTTP server on Mac Mini
 * Serves OpenClaw + system data on-demand when the dashboard requests it.
 * Also pushes data to HA sensors so the WebSocket-subscribed components update.
 *
 * Run: node scripts/alfred-api.js
 * Port: 18800
 */

const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 18800;
const PUBLISHER_CONFIG_PATH = process.env.ALFRED_HA_PUBLISHER_CONFIG
  || path.join(process.env.HOME, '.config/alfred/ha-publishers.json');
const ALFRED_PUBLISH_PATHS = Object.freeze({
  'sensor.alfred_ops_dashboard': '/publish/alfred/ops-dashboard',
  'sensor.alfred_memory_status': '/publish/alfred/memory-status',
  'sensor.mac_mini_cpu_usage': '/publish/alfred/mac-mini-cpu-usage',
  'sensor.mac_mini_ram_usage': '/publish/alfred/mac-mini-ram-usage',
  'sensor.mac_mini_disk_usage': '/publish/alfred/mac-mini-disk-usage',
  'binary_sensor.alfred_gateway': '/publish/alfred/gateway',
  'binary_sensor.alfred_ollama': '/publish/alfred/ollama',
  'binary_sensor.alfred_location_bridge': '/publish/alfred/location-bridge',
  'sensor.alfred_gateway_health': '/publish/alfred/gateway-health',
  'sensor.alfred_gateway_status': '/publish/alfred/gateway-status',
  'sensor.alfred_task_stats': '/publish/alfred/task-stats',
  'sensor.alfred_token_usage': '/publish/alfred/token-usage',
  'sensor.alfred_cron_list': '/publish/alfred/cron-list',
});

const OPENCLAW = `${process.env.HOME}/.npm-global/bin/openclaw`;

const VISIBLE_CRON_JOBS = new Set([
  'Morning Brief',
  'Morning Brief (Weekend)',
  'Evening Email Sweep',
  'Weekly Fitness Digest',
  'Weekly Sleep Analysis',
  'Thursday Lawn Plan',
  'Weekly Plants Check',
  'Weekly Insights',
  'Monthly Health Check-In',
  'Monthly Finance Snapshot',
  'Monthly Infra Health',
]);

const LAUNCH_AGENT_LABELS = [
  'ai.openclaw.gateway',
  'com.alfred.movie-approval-watchdog',
  'com.alfred.proactive-dispatch-lite',
  'com.alfred.day-morning',
  'com.alfred.day-midday',
  'com.alfred.day-afternoon',
  'com.alfred.nightly-health-lite',
  'com.alfred.discord-reply-delivery-audit',
  'com.alfred.morning-brief-delivery-audit',
  'com.alfred.weather-watchdog',
  'com.alfred.knowledge-extraction-lite',
  'com.alfred.gbrain-reindex',
  'com.daz.remux-daily-4k-watch',
  'com.daz.remux-approval-queue',
  'com.daz.remux-nas-mounts',
];

const CRITICAL_LAUNCH_AGENTS = new Set([
  'ai.openclaw.gateway',
  'com.alfred.movie-approval-watchdog',
  'com.alfred.proactive-dispatch-lite',
  'com.alfred.day-morning',
]);

const STATE_FILES = {
  movieWatchdog: '/Users/darrenbrain/.openclaw/workspace/scripts/cron/.movie-approval-watchdog-state.json',
  movieState: '/Users/darrenbrain/.openclaw/workspace/scripts/.movie-state.json',
  proactive: '/Users/darrenbrain/.openclaw/workspace/scripts/cron/.proactive-dispatch-lite-state.json',
  morningAudit: '/Users/darrenbrain/.openclaw/workspace/scripts/cron/.morning-brief-delivery-audit-state.json',
  discordAudit: '/Users/darrenbrain/.openclaw/workspace/scripts/cron/.discord-reply-delivery-audit-state.json',
  nightlyHealth: '/Users/darrenbrain/.openclaw/workspace/scripts/cron/.nightly-health-lite-state.json',
};

function run(cmd, timeout = 15000) {
  try {
    const out = execSync(cmd, { timeout, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return out;
  } catch {
    return null;
  }
}

function parseOpenclawJson(raw) {
  if (!raw) return null;
  // Strip ANSI codes and [plugins] log lines
  const cleaned = raw.replace(/\x1b\[[0-9;]*m/g, '').split('\n').filter(l => !l.startsWith('[plugins]')).join('\n').trim();
  try { return JSON.parse(cleaned); } catch { return null; }
}

function nowIso() {
  return new Date().toISOString();
}

function toEpochMs(value) {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function issue(severity, source, title, detail, action = null) {
  return { severity, source, title, detail, action };
}

function severityRank(value) {
  if (value === 'critical' || value === 'error') return 0;
  if (value === 'warning' || value === 'warn') return 1;
  if (value === 'healthy' || value === 'ok' || value === 'success') return 2;
  return 3;
}

function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function getNested(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] != null) return obj[key];
  }
  return null;
}

function recentError(value) {
  if (!value) return null;
  const errorText = typeof value === 'string' ? value : JSON.stringify(value);
  const ts = toEpochMs(value.timestamp || value.at || value.time || value.created_at || value.createdAt);
  if (ts && Date.now() - ts > 86400000) return null;
  return errorText;
}

function collectGatewayOps() {
  const raw = run(`${OPENCLAW} gateway status`, 5000) || '';
  const healthRaw = run('curl -s --connect-timeout 2 http://localhost:18789/health', 3000);
  const running = /Runtime:\s*running/i.test(raw);
  const probeOk = /Connectivity probe:\s*ok/i.test(raw) || !!healthRaw;
  const pidMatch = raw.match(/Runtime:\s*running\s*\(pid\s+(\d+)/i);
  const versionMatch = raw.match(/(?:CLI|Gateway|Runtime|Version)[^\n:]*:\s*([0-9]{4}\.[0-9.]+)/i);
  const eventLoopDegraded = /degraded|event_loop_delay|event_loop_utilization/i.test(raw);

  return {
    running,
    pid: pidMatch ? Number(pidMatch[1]) : null,
    version: versionMatch ? versionMatch[1] : null,
    probe_ok: probeOk,
    event_loop_degraded: eventLoopDegraded,
    status_text: running ? 'running' : (raw ? 'not running' : 'unknown'),
    raw_ok: !!raw,
  };
}

function collectDiscordOps() {
  const raw = run(`${OPENCLAW} channels status`, 8000) || '';
  const discordLine = raw.split('\n').find(line => /Discord default:/i.test(line)) || '';
  const reachable = /Gateway reachable/i.test(raw);
  const configured = /configured/i.test(discordLine);
  const running = /running/i.test(discordLine);
  const connected = /connected/i.test(discordLine) && !/disconnected|not connected/i.test(discordLine);
  const botMatch = raw.match(/(?:bot|user|as)\s*[:=]\s*(@?[A-Za-z0-9_.-]+)/i);
  const inboundMatch = raw.match(/\bin:([0-9]+[smhd]\s+ago)/i);

  return {
    configured,
    running,
    connected: reachable && configured && running && connected,
    bot: botMatch ? botMatch[1] : null,
    last_inbound: inboundMatch ? inboundMatch[1] : null,
    raw_ok: !!raw,
  };
}

function normalizeCronJob(job) {
  const state = job.state || {};
  const name = job.name || job.label || job.id || 'Unknown';
  const delivery = job.delivery || job.channel || job.destination || job.deliverTo || state.delivery || null;
  const status = state.lastStatus || job.status || job.last_status || 'unknown';
  const consecutiveErrors = Number(state.consecutiveErrors ?? job.consecutive_errors ?? job.consecutiveErrors ?? 0);
  const lastRunMs = toEpochMs(state.lastRunAtMs ?? state.lastRunAt ?? job.last_run_ms ?? job.last_run);
  const nextRunMs = toEpochMs(state.nextRunAtMs ?? state.nextRunAt ?? job.next_run_ms ?? job.next_run);
  const latestText = JSON.stringify({ status, delivery, lastError: state.lastError || job.last_error || job.summary || job.history || '' }).toLowerCase();

  let risk = null;
  if (String(status).toLowerCase() === 'error') risk = 'critical';
  else if (consecutiveErrors > 0) risk = 'warning';
  else if (VISIBLE_CRON_JOBS.has(name) && /not requested/i.test(String(delivery || ''))) risk = 'warning';
  else if (/approval|rate_limit|stream disconnected|not-delivered/.test(latestText)) risk = 'warning';

  return {
    name,
    enabled: job.enabled ?? true,
    status,
    delivery,
    last_run_ms: lastRunMs,
    next_run_ms: nextRunMs,
    consecutive_errors: consecutiveErrors,
    risk,
  };
}

function parsePlainCron(raw) {
  if (!raw) return [];
  return raw.split('\n')
    .map(line => line.trim())
    .filter(line => line && !/^name\b/i.test(line))
    .map(line => ({ name: line.replace(/^\W+/, '').split(/\s{2,}/)[0] || line, status: /error|failed/i.test(line) ? 'error' : 'unknown' }));
}

function collectCronOps() {
  const jsonRaw = run(`${OPENCLAW} cron list --json`, 10000);
  const cronData = parseOpenclawJson(jsonRaw);
  const rawJobs = cronData ? (cronData.jobs || cronData) : parsePlainCron(run(`${OPENCLAW} cron list`, 10000));
  const jobs = (Array.isArray(rawJobs) ? rawJobs : []).map(normalizeCronJob);
  const warning = jobs.filter(j => j.risk === 'warning').length;
  const error = jobs.filter(j => j.risk === 'critical' || String(j.status).toLowerCase() === 'error').length;
  const ok = Math.max(0, jobs.length - warning - error);
  const sortedJobs = jobs
    .sort((a, b) => severityRank(a.risk || a.status) - severityRank(b.risk || b.status) || (a.next_run_ms || Infinity) - (b.next_run_ms || Infinity))
    .slice(0, 20);

  return {
    total: jobs.length,
    ok,
    warning,
    error,
    delivery_risks: jobs.filter(j => j.risk).length,
    jobs: sortedJobs,
  };
}

function collectLaunchAgents() {
  const agents = LAUNCH_AGENT_LABELS.map(label => {
    const raw = run(`launchctl list ${label}`, 2000) || '';
    const missing = !raw;
    const statusMatch = raw.match(/"LastExitStatus"\s*=\s*(-?\d+)|LastExitStatus\s*=\s*(-?\d+)/);
    const pidMatch = raw.match(/"PID"\s*=\s*(\d+)|PID\s*=\s*(\d+)/);
    const lastExitStatus = missing ? null : Number(statusMatch?.[1] ?? statusMatch?.[2] ?? 0);
    const critical = CRITICAL_LAUNCH_AGENTS.has(label);
    const status = missing || lastExitStatus !== 0 ? (critical ? 'critical' : 'warning') : 'ok';
    return {
      label,
      status,
      pid: pidMatch ? Number(pidMatch[1] || pidMatch[2]) : null,
      last_exit_status: lastExitStatus,
      expected: true,
    };
  }).sort((a, b) => severityRank(a.status) - severityRank(b.status) || a.label.localeCompare(b.label));

  return {
    ok: agents.filter(a => a.status === 'ok').length,
    warning: agents.filter(a => a.status === 'warning').length,
    error: agents.filter(a => a.status === 'critical').length,
    agents,
  };
}

function workflowStatus(name, state, launchAgents, issues) {
  const lastError = recentError(state?.last_error || state?.lastError || state?.error);
  if (lastError) {
    issues.push(issue(name === 'movie_approval' ? 'critical' : 'warning', 'workflow', `${name.replace(/_/g, ' ')} error`, lastError, 'Check the matching OpenClaw state file and LaunchAgent log.'));
  }
  const launchFailed = name === 'movie_approval'
    ? launchAgents.agents.find(a => a.label === 'com.alfred.movie-approval-watchdog' && a.status !== 'ok')
    : name === 'proactive_dispatch'
      ? launchAgents.agents.find(a => a.label === 'com.alfred.proactive-dispatch-lite' && a.status !== 'ok')
      : null;
  return lastError || launchFailed ? (name === 'movie_approval' ? 'critical' : 'warning') : 'ok';
}

function collectWorkflowOps(launchAgents, issues) {
  const movieWatchdog = readJsonFile(STATE_FILES.movieWatchdog);
  const movieState = readJsonFile(STATE_FILES.movieState);
  const proactive = readJsonFile(STATE_FILES.proactive);
  const morningAudit = readJsonFile(STATE_FILES.morningAudit);
  const discordAudit = readJsonFile(STATE_FILES.discordAudit);

  const movieStatus = workflowStatus('movie_approval', movieWatchdog || movieState, launchAgents, issues);
  const proactiveStatus = workflowStatus('proactive_dispatch', proactive, launchAgents, issues);
  const morningError = recentError(morningAudit?.last_error || morningAudit?.lastError);
  const morningLeak = Boolean(morningAudit?.leakage_detected || morningAudit?.leakageDetected || morningAudit?.missing_post || morningAudit?.missingPost);
  const discordError = recentError(discordAudit?.last_error || discordAudit?.lastError || discordAudit?.latest_delivery_failure || discordAudit?.latestDeliveryFailure);

  if (!morningAudit) issues.push(issue('warning', 'workflow', 'Morning brief audit missing', 'No delivery audit state file was found.', 'Confirm the morning brief delivery audit LaunchAgent has run.'));
  if (morningError || morningLeak) issues.push(issue('warning', 'workflow', 'Morning brief delivery risk', morningError || 'Leakage or missing post flag is set.', 'Review the morning brief delivery audit output.'));
  if (discordError) issues.push(issue('critical', 'workflow', 'Discord reply delivery failure', discordError, 'Review the Discord reply delivery audit output.'));

  return {
    movie_approval: {
      status: movieStatus,
      last_run_at: getNested(movieWatchdog, ['last_run_at', 'lastRunAt', 'updated_at']) || getNested(movieState, ['last_run_at', 'lastRunAt', 'updated_at']),
      last_error: movieWatchdog?.last_error || movieState?.last_error || null,
      approved_count: movieWatchdog?.approved_count ?? movieState?.approved_count ?? movieState?.collection_hunt_count ?? null,
      latest_key: movieWatchdog?.latest_key ?? movieState?.latest_key ?? null,
      processed_count: movieWatchdog?.processed_count ?? movieState?.processed_count ?? null,
      duplicate_count: movieWatchdog?.duplicate_count ?? movieState?.duplicate_count ?? null,
    },
    proactive_dispatch: {
      status: proactiveStatus,
      last_run_at: getNested(proactive, ['last_run_at', 'lastRunAt', 'updated_at']),
      last_error: proactive?.last_error || null,
      today_deduped: Boolean(JSON.stringify(proactive || {}).match(/green-training-window|recovery-compromised-sleep|sleep-protocol/)),
    },
    morning_brief: {
      status: !morningAudit || morningError || morningLeak ? 'warning' : 'ok',
      last_audit: morningAudit?.last_audit || morningAudit?.status || null,
      leakage_detected: morningLeak,
    },
    discord_reply_audit: {
      status: discordError ? 'critical' : 'ok',
      latest_delivery_failure: discordError,
      last_audit: discordAudit?.last_audit || discordAudit?.status || null,
    },
  };
}

function collectOpsDashboard() {
  const issues = [];
  const gateway = collectGatewayOps();
  const discord = collectDiscordOps();
  const cron = collectCronOps();
  const launchAgents = collectLaunchAgents();
  const workflows = collectWorkflowOps(launchAgents, issues);

  if (!gateway.running || !gateway.probe_ok) issues.push(issue('critical', 'gateway', 'Gateway is not healthy', `Runtime: ${gateway.status_text}; probe: ${gateway.probe_ok ? 'ok' : 'failed'}.`, 'Run OpenClaw doctor from the dashboard or inspect the gateway LaunchAgent.'));
  if (gateway.event_loop_degraded) issues.push(issue('warning', 'gateway', 'Gateway event loop degraded', 'Gateway status mentions degraded event loop metrics.', 'Watch for slow replies and inspect gateway logs.'));
  if (!discord.connected) issues.push(issue('critical', 'discord', 'Discord is disconnected', 'OpenClaw channels status does not report a connected Discord default channel.', 'Restart or re-authenticate the Discord channel.'));

  for (const job of cron.jobs) {
    if (job.risk === 'critical' || String(job.status).toLowerCase() === 'error') {
      issues.push(issue('critical', 'cron', `${job.name} latest run failed`, `Status is ${job.status}.`, 'Inspect the latest cron run output.'));
    } else if (job.risk === 'warning') {
      issues.push(issue('warning', 'cron', `${job.name} delivery risk`, job.delivery ? `Delivery: ${job.delivery}.` : 'Latest run history indicates a delivery or approval risk.', 'Review the next scheduled run and latest cron output.'));
    }
  }

  for (const agent of launchAgents.agents.filter(a => a.status !== 'ok')) {
    issues.push(issue(agent.status === 'critical' ? 'critical' : 'warning', 'launch_agent', `${agent.label} ${agent.status}`, `LastExitStatus: ${agent.last_exit_status ?? 'missing'}.`, 'Check launchctl and the agent log on the Mac Mini.'));
  }

  const boundedIssues = issues
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .slice(0, 8);
  const overall = boundedIssues.some(i => i.severity === 'critical')
    ? 'critical'
    : boundedIssues.some(i => i.severity === 'warning')
      ? 'warning'
      : 'healthy';

  return {
    generated_at: nowIso(),
    overall,
    summary: overall === 'healthy'
      ? `Gateway OK, Discord connected, ${cron.ok} crons OK, ${launchAgents.ok} LaunchAgents OK.`
      : `${boundedIssues.filter(i => i.severity === 'critical').length} critical, ${boundedIssues.filter(i => i.severity === 'warning').length} warning issue(s).`,
    gateway,
    discord,
    cron,
    launch_agents: launchAgents,
    workflows,
    issues: boundedIssues,
    last_successful_smoke: {
      discord_read: discord.connected ? nowIso() : null,
      cron_list: cron.total > 0 ? nowIso() : null,
      gateway_probe: gateway.probe_ok ? nowIso() : null,
    },
  };
}

function publisherConfig() {
  const config = readJsonFile(PUBLISHER_CONFIG_PATH);
  if (!config?.base_url || !config?.alfred_secret) return null;
  return config;
}

function pushToHA(entityId, payload, { fetchFn = fetch, config = publisherConfig() } = {}) {
  const route = ALFRED_PUBLISH_PATHS[entityId];
  if (!route) throw new Error(`HA publication target is not owned: ${entityId}`);
  if (!config) return Promise.resolve(false);
  return fetchFn(`${config.base_url}${route}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Alfred-Publisher-Key': config.alfred_secret,
    },
    body: JSON.stringify(payload),
  }).then((response) => response.ok).catch(() => false);
}

function collectTokenUsage() {
  try {
    const sessionsDir = path.join(process.env.HOME, '.openclaw/agents/main/sessions');
    if (!fs.existsSync(sessionsDir)) return null;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    // Monday-based week
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const weekStart = todayStart - (dayOfWeek * 86400000);

    const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));

    // Last cycle = previous Mon-Sun
    const lastCycleStart = weekStart - (7 * 86400000);
    const lastCycleEnd = weekStart;

    const today = { totalTokens: 0, input: 0, output: 0, cost: 0, requests: 0 };
    const thisCycle = { totalTokens: 0, input: 0, output: 0, cost: 0, requests: 0 };
    const lastCycle = { totalTokens: 0, input: 0, output: 0, cost: 0, requests: 0 };
    const byModel = {};   // { "openai-codex/gpt-5.4": { tokens, cost, requests } }
    const byCron = {};     // { "Morning Brief": { tokens, cost, runs } }

    for (const file of files) {
      const filePath = path.join(sessionsDir, file);
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs < lastCycleStart) continue;

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      // Detect cron job name from first user message: [cron:<id> <name>]
      let cronName = null;
      let sessionTokens = 0;
      let sessionCost = 0;

      for (const line of lines) {
        if (!line) continue;
        try {
          const entry = JSON.parse(line);

          // Detect cron session from first user message
          if (!cronName && entry?.type === 'message' && entry?.message?.role === 'user') {
            const text = typeof entry.message.content === 'string'
              ? entry.message.content
              : Array.isArray(entry.message.content)
                ? entry.message.content.find(c => c.type === 'text')?.text || ''
                : '';
            const match = text.match(/^\[cron:[a-f0-9-]+\s+([^\]]+)\]/);
            if (match) cronName = match[1];
          }

          if (!line.includes('"usage"')) continue;
          const usage = entry?.message?.usage;
          if (!usage) continue;

          const ts = entry.timestamp ? new Date(entry.timestamp).getTime() : 0;
          const tokens = (usage.input || 0) + (usage.output || 0);
          const cost = usage.cost?.total || 0;
          const provider = entry.message?.provider || 'unknown';
          const model = entry.message?.model || 'unknown';
          const modelKey = `${provider}/${model}`;

          // Per-model tracking
          if (!byModel[modelKey]) byModel[modelKey] = { tokens: 0, cost: 0, requests: 0 };
          if (ts >= lastCycleStart && ts < lastCycleEnd) {
            lastCycle.totalTokens += tokens;
            lastCycle.input += usage.input || 0;
            lastCycle.output += usage.output || 0;
            lastCycle.cost += cost;
            lastCycle.requests++;
          }
          if (ts >= weekStart) {
            byModel[modelKey].tokens += tokens;
            byModel[modelKey].cost += cost;
            byModel[modelKey].requests++;
            thisCycle.totalTokens += tokens;
            thisCycle.input += usage.input || 0;
            thisCycle.output += usage.output || 0;
            thisCycle.cost += cost;
            thisCycle.requests++;
          }
          if (ts >= todayStart) {
            today.totalTokens += tokens;
            today.input += usage.input || 0;
            today.output += usage.output || 0;
            today.cost += cost;
            today.requests++;
          }

          sessionTokens += tokens;
          sessionCost += cost;
        } catch { /* skip */ }
      }

      // Attribute session to cron job
      if (cronName && sessionTokens > 0) {
        if (!byCron[cronName]) byCron[cronName] = { tokens: 0, cost: 0, runs: 0 };
        byCron[cronName].tokens += sessionTokens;
        byCron[cronName].cost += sessionCost;
        byCron[cronName].runs++;
      }
    }

    // Round costs
    today.cost = Math.round(today.cost * 100) / 100;
    thisCycle.cost = Math.round(thisCycle.cost * 100) / 100;
    lastCycle.cost = Math.round(lastCycle.cost * 100) / 100;

    // Sort models by cost desc
    const models = Object.entries(byModel)
      .filter(([, v]) => v.tokens > 0)
      .map(([name, v]) => ({ name, ...v, cost: Math.round(v.cost * 100) / 100 }))
      .sort((a, b) => b.cost - a.cost);

    // Sort cron jobs by cost desc
    const cronJobs = Object.entries(byCron)
      .map(([name, v]) => ({ name, ...v, cost: Math.round(v.cost * 100) / 100 }))
      .sort((a, b) => b.cost - a.cost);

    // Rolling 14-day stats
    const fourteenDaysAgo = now.getTime() - (14 * 86400000);
    let r14Sessions = 0, r14Succeeded = 0, r14Failed = 0, r14RateLimitHits = 0, r14Requests = 0;

    for (const file of files) {
      const filePath = path.join(sessionsDir, file);
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs < fourteenDaysAgo) continue;

      r14Sessions++;
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      let hasUsage = false;

      for (const line of lines) {
        if (!line) continue;
        try {
          const entry = JSON.parse(line);

          // Count requests with usage data
          if (line.includes('"usage"') && entry?.message?.usage) {
            hasUsage = true;
            const ts = entry.timestamp ? new Date(entry.timestamp).getTime() : 0;
            if (ts >= fourteenDaysAgo) r14Requests++;
          }

          // Check for rate limit hits in custom events
          if (entry?.type === 'custom' || entry?.type === 'event') {
            const eventStr = JSON.stringify(entry).toLowerCase();
            if (eventStr.includes('429') || eventStr.includes('rate_limit') || eventStr.includes('rate limit')) {
              r14RateLimitHits++;
            }
          }
        } catch { /* skip */ }
      }

      if (hasUsage) r14Succeeded++;
    }

    const r14Total = r14Sessions;
    const rolling14d = {
      sessions: r14Sessions,
      succeeded: r14Succeeded,
      failed: r14Total - r14Succeeded,
      rateLimitHits: r14RateLimitHits,
      successRate: r14Total > 0 ? Math.round(r14Succeeded / r14Total * 100) : 0,
      avgRequestsPerDay: Math.round(r14Requests / 14),
    };

    return { today, thisCycle, lastCycle, models, cronJobs, rolling14d };
  } catch {
    return null;
  }
}

function collectData() {
  const data = {};

  data.ops = collectOpsDashboard();
  pushToHA('sensor.alfred_ops_dashboard', {
    state: data.ops.overall,
    attributes: {
      friendly_name: 'Alfred Ops Dashboard',
      icon: data.ops.overall === 'critical'
        ? 'mdi:alert-circle'
        : data.ops.overall === 'warning'
          ? 'mdi:alert'
          : 'mdi:shield-check',
      ...data.ops,
    }
  });

  // Cron jobs
  const cronRaw = run(`${OPENCLAW} cron list --json`);
  const cronData = parseOpenclawJson(cronRaw);
  if (cronData) {
    const jobs = (cronData.jobs || cronData).map(j => ({
      name: j.name || 'Unknown',
      schedule: j.schedule?.expr || '',
      enabled: j.enabled ?? true,
      last_run: j.state?.lastRunAtMs || null,
      next_run: j.state?.nextRunAtMs || null,
      status: j.state?.lastStatus || 'unknown',
      last_duration_ms: j.state?.lastDurationMs || null,
      consecutive_errors: j.state?.consecutiveErrors || 0,
    }));
    data.cron = { count: jobs.length, jobs };
    // pushToHA for cron is deferred until after tokenUsage is collected (see below)
  }

  // Memory status
  const memRaw = run(`${OPENCLAW} memory status --json`);
  const memData = parseOpenclawJson(memRaw);
  if (memData) {
    const agent = Array.isArray(memData) ? memData[0] : memData;
    const status = agent?.status || agent;
    data.memory = {
      total_files: status.files || 0,
      total_chunks: status.chunks || 0,
      provider: status.provider || 'unknown',
      model: status.model || 'unknown',
    };
    pushToHA('sensor.alfred_memory_status', {
      state: String(data.memory.total_files),
      attributes: { friendly_name: 'Alfred Memory Status', icon: 'mdi:brain', unit_of_measurement: 'files', ...data.memory }
    });
  }

  // System stats
  const cpu = run("top -l 1 -n 0 | grep 'CPU usage' | awk '{print 100 - $7}' | tr -d '%'");
  const ram = run("memory_pressure | grep 'System-wide memory free percentage' | awk '{print 100 - $5}' | tr -d '%'");
  const disk = run("df -h / | tail -1 | awk '{print $5}' | tr -d '%'");

  data.system = {
    cpu: cpu ? parseFloat(cpu.trim()) : null,
    ram: ram ? parseFloat(ram.trim()) : null,
    disk: disk ? parseFloat(disk.trim()) : null,
  };

  if (data.system.cpu != null) pushToHA('sensor.mac_mini_cpu_usage', { state: String(data.system.cpu), attributes: { friendly_name: 'Mac Mini CPU Usage', unit_of_measurement: '%', icon: 'mdi:cpu-64-bit' } });
  if (data.system.ram != null) pushToHA('sensor.mac_mini_ram_usage', { state: String(data.system.ram), attributes: { friendly_name: 'Mac Mini RAM Usage', unit_of_measurement: '%', icon: 'mdi:memory' } });
  if (data.system.disk != null) pushToHA('sensor.mac_mini_disk_usage', { state: String(data.system.disk), attributes: { friendly_name: 'Mac Mini Disk Usage', unit_of_measurement: '%', icon: 'mdi:harddisk' } });

  // Service checks
  const gwUp = !!run('curl -s --connect-timeout 2 http://localhost:18789/health');
  const ollamaUp = !!run('curl -s --connect-timeout 2 http://localhost:11434/api/tags');
  const locBridgeUp = !!run('curl -s --connect-timeout 2 http://localhost:18790/health');

  data.services = { gateway: gwUp, ollama: ollamaUp, location_bridge: locBridgeUp };

  pushToHA('binary_sensor.alfred_gateway', { state: gwUp ? 'on' : 'off', attributes: { friendly_name: 'Alfred Gateway', device_class: 'connectivity' } });
  pushToHA('binary_sensor.alfred_ollama', { state: ollamaUp ? 'on' : 'off', attributes: { friendly_name: 'Alfred Ollama', device_class: 'connectivity' } });
  pushToHA('binary_sensor.alfred_location_bridge', { state: locBridgeUp ? 'on' : 'off', attributes: { friendly_name: 'Alfred Location Bridge', device_class: 'connectivity' } });

  // Gateway health + channel connectivity
  const statusRaw = gwUp ? run('curl -s --connect-timeout 2 http://localhost:18789/api/status') : null;
  let gwAttrs = { friendly_name: 'Alfred Gateway Health', icon: gwUp ? 'mdi:server' : 'mdi:server-off' };
  let statusAttrs = { friendly_name: 'Alfred Gateway Status', icon: 'mdi:robot' };

  // Check Discord/channel connectivity from gateway or openclaw status
  let ocStatusRaw;
  try {
    ocStatusRaw = execSync(`${OPENCLAW} status --json`, { timeout: 30000, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, PATH: `${process.env.HOME}/.npm-global/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin` } });
  } catch { ocStatusRaw = null; }
  const ocStatus = parseOpenclawJson(ocStatusRaw);
  if (ocStatus) {
    const channels = ocStatus.channelSummary || [];
    const discordUp = channels.some(c => typeof c === 'string' && c.toLowerCase().includes('discord') && c.toLowerCase().includes('configured'));
    statusAttrs.discord_connected = discordUp;
    statusAttrs.model = `Codex ${ocStatus.runtimeVersion || ''}`;
    if (ocStatus.gateway?.self) {
      gwAttrs.version = ocStatus.runtimeVersion;
      gwAttrs.host = ocStatus.gateway.self.host;
    }
    if (ocStatus.gatewayService) {
      statusAttrs.uptime = ocStatus.gatewayService.runtimeShort;
    }
  }

  pushToHA('sensor.alfred_gateway_health', { state: gwUp ? 'ok' : 'offline', attributes: gwAttrs });
  pushToHA('sensor.alfred_gateway_status', { state: gwUp ? 'online' : 'offline', attributes: statusAttrs });

  // Task stats from openclaw status + rolling 14d health
  if (ocStatus?.tasks) {
    const t = ocStatus.tasks;
    const sessionsCount = ocStatus.sessions?.count ?? ocStatus.agents?.totalSessions ?? null;
    pushToHA('sensor.alfred_task_stats', {
      state: String(t.total || 0),
      attributes: {
        friendly_name: 'Alfred Task Stats',
        icon: 'mdi:clipboard-check-outline',
        unit_of_measurement: 'tasks',
        total: t.total || 0,
        active: t.active || 0,
        running: t.byStatus?.running || 0,
        queued: t.byStatus?.queued || 0,
        sessions_count: sessionsCount,
      }
    });
  }

  // Token usage from session JSONL files
  data.tokenUsage = collectTokenUsage();
  if (data.tokenUsage) {
    pushToHA('sensor.alfred_token_usage', {
      state: String(data.tokenUsage.today.totalTokens) + '.' + Date.now() % 1000,
      attributes: {
        friendly_name: 'Alfred Token Usage',
        icon: 'mdi:counter',
        unit_of_measurement: 'tokens',
        ...data.tokenUsage
      }
    });
  }

  // Enrich cron jobs with per-cron costs from token usage, then push
  if (data.cron && data.tokenUsage?.cronJobs) {
    const costMap = {};
    for (const c of data.tokenUsage.cronJobs) costMap[c.name] = c.cost;
    for (const job of data.cron.jobs) {
      job.cost = costMap[job.name] || 0;
    }
  }
  if (data.cron) {
    pushToHA('sensor.alfred_cron_list', {
      state: String(data.cron.jobs.length),
      attributes: { friendly_name: 'Alfred Cron List', icon: 'mdi:clock-outline', jobs: data.cron.jobs }
    });
  }

  return data;
}

function createAlfredApiServer({ collectDataFn = collectData } = {}) {
  return http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.url === '/alfred' || req.url === '/alfred/refresh') {
      try {
        const data = collectDataFn();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, timestamp: Date.now(), ...data }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
      return;
    }

    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });
}

if (require.main === module) {
  const server = createAlfredApiServer();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Alfred API listening on http://0.0.0.0:${PORT}`);
  });
}

module.exports = { ALFRED_PUBLISH_PATHS, createAlfredApiServer, pushToHA };
