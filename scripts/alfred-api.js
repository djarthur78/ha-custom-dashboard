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
const HA_URL = 'http://192.168.1.2:8123';
const HA_TOKEN = process.env.HA_TOKEN || require('fs')
  .readFileSync(require('path').join(__dirname, '../src/.env'), 'utf8')
  .match(/VITE_HA_TOKEN=(.*)/)?.[1]?.trim();

const OPENCLAW = `${process.env.HOME}/.npm-global/bin/openclaw`;

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

function pushToHA(entityId, payload) {
  try {
    const body = JSON.stringify(payload);
    const tmpFile = `/tmp/ha-push-${entityId.replace(/\./g, '-')}.json`;
    fs.writeFileSync(tmpFile, body);
    execSync(`curl -s -X POST '${HA_URL}/api/states/${entityId}' -H 'Authorization: Bearer ${HA_TOKEN}' -H 'Content-Type: application/json' -d @${tmpFile}`, {
      timeout: 5000, stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch { /* best effort */ }
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

    const today = { totalTokens: 0, input: 0, output: 0, cost: 0, requests: 0 };
    const week = { totalTokens: 0, input: 0, output: 0, cost: 0, requests: 0 };
    const byModel = {};   // { "openai-codex/gpt-5.4": { tokens, cost, requests } }
    const byCron = {};     // { "Morning Brief": { tokens, cost, runs } }

    for (const file of files) {
      const filePath = path.join(sessionsDir, file);
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs < weekStart) continue;

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
          if (ts >= weekStart) {
            byModel[modelKey].tokens += tokens;
            byModel[modelKey].cost += cost;
            byModel[modelKey].requests++;
            week.totalTokens += tokens;
            week.input += usage.input || 0;
            week.output += usage.output || 0;
            week.cost += cost;
            week.requests++;
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
    week.cost = Math.round(week.cost * 100) / 100;

    // Sort models by cost desc
    const models = Object.entries(byModel)
      .filter(([, v]) => v.tokens > 0)
      .map(([name, v]) => ({ name, ...v, cost: Math.round(v.cost * 100) / 100 }))
      .sort((a, b) => b.cost - a.cost);

    // Sort cron jobs by cost desc
    const cronJobs = Object.entries(byCron)
      .map(([name, v]) => ({ name, ...v, cost: Math.round(v.cost * 100) / 100 }))
      .sort((a, b) => b.cost - a.cost);

    return { today, week, models, cronJobs };
  } catch {
    return null;
  }
}

function collectData() {
  const data = {};

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
    pushToHA('sensor.alfred_cron_list', {
      state: String(jobs.length),
      attributes: { friendly_name: 'Alfred Cron List', icon: 'mdi:clock-outline', jobs }
    });
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
  const piholeUp = !!run('ping -c 1 -W 2 192.168.1.3');

  data.services = { gateway: gwUp, ollama: ollamaUp, location_bridge: locBridgeUp, ha: true, pihole: piholeUp };

  pushToHA('binary_sensor.alfred_gateway', { state: gwUp ? 'on' : 'off', attributes: { friendly_name: 'Alfred Gateway', device_class: 'connectivity' } });
  pushToHA('binary_sensor.alfred_ollama', { state: ollamaUp ? 'on' : 'off', attributes: { friendly_name: 'Alfred Ollama', device_class: 'connectivity' } });
  pushToHA('binary_sensor.alfred_location_bridge', { state: locBridgeUp ? 'on' : 'off', attributes: { friendly_name: 'Alfred Location Bridge', device_class: 'connectivity' } });
  pushToHA('binary_sensor.alfred_ha_check', { state: 'on', attributes: { friendly_name: 'Home Assistant', device_class: 'connectivity' } });
  pushToHA('binary_sensor.alfred_pihole', { state: piholeUp ? 'on' : 'off', attributes: { friendly_name: 'Pi-hole', device_class: 'connectivity' } });

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

  return data;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.url === '/alfred' || req.url === '/alfred/refresh') {
    try {
      const data = collectData();
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Alfred API listening on http://0.0.0.0:${PORT}`);
});
