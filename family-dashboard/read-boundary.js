#!/usr/bin/env node
/** Fixed read/control bridge for HA WebSocket commands used by the dashboard. */

const http = require('node:http');
const WebSocketClient = globalThis.WebSocket || require('ws');

const PORT = Number(process.env.READ_BOUNDARY_PORT || 8098);
const HA_READ_WS_URL = process.env.HA_READ_WS_URL || 'ws://192.168.1.2:8123/api/websocket';
const HA_CONTROL_WS_URL = process.env.HA_CONTROL_WS_URL || 'ws://192.168.1.2:8123/api/websocket';
const HA_READ_TOKEN = process.env.HA_READ_TOKEN || '';
const HA_CONTROL_TOKEN = process.env.HA_CONTROL_TOKEN || '';
const MAX_BODY_BYTES = 32768;
const ENTITY_ID = /^[a-z0-9_]+\.[a-z0-9_]+$/;

const READ_COMMAND_FIELDS = Object.freeze({
  'history/history_during_period': new Set([
    'type', 'start_time', 'end_time', 'entity_ids', 'minimal_response',
    'no_attributes', 'significant_changes_only',
  ]),
  'media_player/browse_media': new Set(['type', 'entity_id', 'media_content_id', 'media_content_type']),
  'todo/item/list': new Set(['type', 'entity_id']),
  'weather/subscribe_forecast': new Set(['type', 'entity_id', 'forecast_type']),
});

const CONTROL_COMMAND_FIELDS = Object.freeze({
  'calendar/event/delete': new Set(['type', 'entity_id', 'uid', 'recurrence_id']),
  'config_entries/reload': new Set(['type', 'entry_id']),
});

const COMMAND_FIELDS = Object.freeze({ ...READ_COMMAND_FIELDS, ...CONTROL_COMMAND_FIELDS });

function assertString(value, name, maxLength = 1024) {
  if (typeof value !== 'string' || !value || value.length > maxLength) throw new Error(`invalid ${name}`);
}

function validateCommand(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid command');
  const allowed = COMMAND_FIELDS[input.type];
  if (!allowed) throw new Error('command is not supported');
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

  if (input.type === 'calendar/event/delete') {
    assertString(input.entity_id, 'entity_id', 128);
    if (!ENTITY_ID.test(input.entity_id)) throw new Error('invalid entity_id');
    assertString(input.uid, 'uid', 1024);
    command.entity_id = input.entity_id;
    command.uid = input.uid;
    if (input.recurrence_id !== undefined) {
      assertString(input.recurrence_id, 'recurrence_id', 1024);
      command.recurrence_id = input.recurrence_id;
    }
  }

  if (input.type === 'config_entries/reload') {
    assertString(input.entry_id, 'entry_id', 128);
    command.entry_id = input.entry_id;
  }

  return command;
}

function validateReadCommand(input) {
  const command = validateCommand(input);
  if (CONTROL_COMMAND_FIELDS[command.type]) throw new Error('command is not read-only');
  return command;
}

function runHACommand(command, {
  readToken = HA_READ_TOKEN,
  controlToken = HA_CONTROL_TOKEN,
  wsUrl,
  readWsUrl = HA_READ_WS_URL,
  controlWsUrl = HA_CONTROL_WS_URL,
  timeoutMs = 15000,
  WebSocketCtor = WebSocketClient,
} = {}) {
  const token = CONTROL_COMMAND_FIELDS[command.type] ? controlToken : readToken;
  const commandWsUrl = wsUrl || (CONTROL_COMMAND_FIELDS[command.type] ? controlWsUrl : readWsUrl);
  if (!token) return Promise.reject(new Error('HA command boundary is not configured'));
  return new Promise((resolve, reject) => {
    const ws = new WebSocketCtor(commandWsUrl);
    const timer = setTimeout(() => finish(new Error('HA command timeout')), timeoutMs);
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
        finish(new Error('HA authentication failed'));
      } else if (message.type === 'auth_ok' && !sent) {
        sent = true;
        ws.send(JSON.stringify({ ...command, id: 1 }));
      } else if (message.type === 'result' && message.id === 1 && !message.success) {
        finish(new Error('HA denied command'));
      } else if (message.type === 'result' && message.id === 1 && command.type !== 'weather/subscribe_forecast') {
        finish(null, message.result);
      } else if (message.type === 'event' && message.id === 1 && command.type === 'weather/subscribe_forecast') {
        finish(null, message.event?.forecast || []);
      }
    });
    ws.addEventListener('error', () => finish(new Error('HA connection failed')));
  });
}

function createReadBoundaryServer({ runCommand = runHACommand } = {}) {
  return http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, mode: 'read-write' }));
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
        const command = validateCommand(JSON.parse(body));
        const result = await runCommand(command);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result ?? null));
      } catch (error) {
        console.error(`[WARN] HA command rejected: ${error.message}`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'command rejected' }));
      }
    });
  });
}

if (require.main === module) {
  createReadBoundaryServer().listen(PORT, '127.0.0.1', () => {
    console.log(`HA read/control boundary listening on 127.0.0.1:${PORT}`);
  });
}

module.exports = {
  COMMAND_FIELDS,
  CONTROL_COMMAND_FIELDS,
  READ_COMMAND_FIELDS,
  createReadBoundaryServer,
  runHACommand,
  validateCommand,
  validateReadCommand,
};
