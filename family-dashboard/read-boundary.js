#!/usr/bin/env node
/** Fixed read-only bridge for HA WebSocket commands used by the dashboard. */

const http = require('node:http');

const PORT = Number(process.env.READ_BOUNDARY_PORT || 8098);
const HA_WS_URL = process.env.HA_WS_URL || 'ws://supervisor/core/api/websocket';
const HA_READ_TOKEN = process.env.HA_READ_TOKEN || '';
const MAX_BODY_BYTES = 32768;
const ENTITY_ID = /^[a-z0-9_]+\.[a-z0-9_]+$/;

const COMMAND_FIELDS = Object.freeze({
  'history/history_during_period': new Set([
    'type', 'start_time', 'end_time', 'entity_ids', 'minimal_response',
    'no_attributes', 'significant_changes_only',
  ]),
  'media_player/browse_media': new Set(['type', 'entity_id', 'media_content_id', 'media_content_type']),
  'todo/item/list': new Set(['type', 'entity_id']),
  'weather/subscribe_forecast': new Set(['type', 'entity_id', 'forecast_type']),
});

function assertString(value, name, maxLength = 1024) {
  if (typeof value !== 'string' || !value || value.length > maxLength) throw new Error(`invalid ${name}`);
}

function validateReadCommand(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid command');
  const allowed = COMMAND_FIELDS[input.type];
  if (!allowed) throw new Error('command is not read-only');
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) throw new Error('unexpected command field');
  }

  const command = { type: input.type };
  if (input.entity_id !== undefined) {
    assertString(input.entity_id, 'entity_id', 128);
    if (!ENTITY_ID.test(input.entity_id)) throw new Error('invalid entity_id');
    command.entity_id = input.entity_id;
  }

  if (input.type === 'history/history_during_period') {
    if (!Array.isArray(input.entity_ids) || input.entity_ids.length < 1 || input.entity_ids.length > 64) {
      throw new Error('invalid entity_ids');
    }
    if (!input.entity_ids.every((entityId) => typeof entityId === 'string' && ENTITY_ID.test(entityId))) {
      throw new Error('invalid entity_ids');
    }
    command.entity_ids = [...input.entity_ids];
    for (const key of ['start_time', 'end_time']) {
      if (input[key] !== undefined) { assertString(input[key], key, 64); command[key] = input[key]; }
    }
    for (const key of ['minimal_response', 'no_attributes', 'significant_changes_only']) {
      if (input[key] !== undefined) command[key] = Boolean(input[key]);
    }
  }

  if (input.type === 'media_player/browse_media') {
    for (const key of ['media_content_id', 'media_content_type']) {
      if (input[key] !== undefined) { assertString(input[key], key); command[key] = input[key]; }
    }
  }

  if (input.type === 'weather/subscribe_forecast') {
    const forecastType = input.forecast_type || 'daily';
    if (!['daily', 'hourly', 'twice_daily'].includes(forecastType)) throw new Error('invalid forecast_type');
    command.forecast_type = forecastType;
  }

  return command;
}

function runHAReadCommand(command, { token = HA_READ_TOKEN, wsUrl = HA_WS_URL, timeoutMs = 15000 } = {}) {
  if (!token) return Promise.reject(new Error('read boundary is not configured'));
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => finish(new Error('read command timeout')), timeoutMs);
    let sent = false;

    function finish(error, result) {
      clearTimeout(timer);
      try { ws.close(); } catch { /* already closed */ }
      if (error) reject(error); else resolve(result);
    }

    ws.addEventListener('message', (event) => {
      let message;
      try { message = JSON.parse(event.data); } catch { finish(new Error('invalid HA response')); return; }
      if (message.type === 'auth_required') {
        ws.send(JSON.stringify({ type: 'auth', access_token: token }));
      } else if (message.type === 'auth_invalid') {
        finish(new Error('HA read authentication failed'));
      } else if (message.type === 'auth_ok' && !sent) {
        sent = true;
        ws.send(JSON.stringify({ ...command, id: 1 }));
      } else if (message.type === 'result' && message.id === 1 && !message.success) {
        finish(new Error('HA denied read command'));
      } else if (message.type === 'result' && message.id === 1 && command.type !== 'weather/subscribe_forecast') {
        finish(null, message.result);
      } else if (message.type === 'event' && message.id === 1 && command.type === 'weather/subscribe_forecast') {
        finish(null, message.event?.forecast || []);
      }
    });
    ws.addEventListener('error', () => finish(new Error('HA read connection failed')));
  });
}

function createReadBoundaryServer({ runCommand = runHAReadCommand } = {}) {
  return http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, mode: 'read-only' }));
      return;
    }
    if (req.method !== 'POST' || req.url !== '/ws-command') {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) req.destroy();
    });
    req.on('end', async () => {
      try {
        const command = validateReadCommand(JSON.parse(body));
        const result = await runCommand(command);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result ?? null));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'read command rejected' }));
      }
    });
  });
}

if (require.main === module) {
  createReadBoundaryServer().listen(PORT, '127.0.0.1', () => {
    console.log(`HA read boundary listening on 127.0.0.1:${PORT}`);
  });
}

module.exports = { COMMAND_FIELDS, createReadBoundaryServer, validateReadCommand };
