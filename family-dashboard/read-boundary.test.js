const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const { createReadBoundaryServer, runHACommand, validateCommand, validateReadCommand } = require('./read-boundary');

let server;

afterEach(async () => {
  if (!server) return;
  await new Promise((resolve) => server.close(resolve));
  server = undefined;
});

async function start(runCommand) {
  server = createReadBoundaryServer({ runCommand });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

test('only the four approved read commands are accepted', () => {
  assert.equal(validateReadCommand({ type: 'todo/item/list', entity_id: 'todo.family' }).type, 'todo/item/list');
  assert.equal(validateReadCommand({ type: 'media_player/browse_media', entity_id: 'media_player.kitchen' }).type, 'media_player/browse_media');
  assert.equal(validateReadCommand({ type: 'weather/subscribe_forecast', entity_id: 'weather.home' }).type, 'weather/subscribe_forecast');
  assert.equal(validateReadCommand({ type: 'history/history_during_period', entity_ids: ['sensor.one'] }).type, 'history/history_during_period');
});

test('only the dashboard control commands are accepted as mutations', () => {
  assert.equal(validateCommand({ type: 'config_entries/reload', entry_id: 'anything' }).type, 'config_entries/reload');
  assert.equal(validateCommand({ type: 'calendar/event/delete', entity_id: 'calendar.family', uid: 'event-1' }).type, 'calendar/event/delete');
  assert.throws(() => validateReadCommand({ type: 'config_entries/reload', entry_id: 'anything' }), /not read-only/);
  assert.throws(() => validateCommand({ type: 'call_service', domain: 'switch', service: 'turn_on' }), /not supported/);
  assert.throws(() => validateReadCommand({ type: 'todo/item/list', entity_id: 'todo.family', access_token: 'forbidden' }), /unexpected/);
});

test('control commands authenticate with the control identity', async () => {
  const sent = [];
  class FakeWebSocket {
    addEventListener(type, callback) {
      if (type === 'message') this.onMessage = callback;
      if (type === 'error') this.onError = callback;
      if (type === 'message') queueMicrotask(() => callback({ data: JSON.stringify({ type: 'auth_required' }) }));
    }
    send(payload) {
      sent.push(JSON.parse(payload));
      const message = sent.at(-1);
      if (message.type === 'auth') queueMicrotask(() => this.onMessage({ data: JSON.stringify({ type: 'auth_ok' }) }));
      else queueMicrotask(() => this.onMessage({ data: JSON.stringify({ type: 'result', id: 1, success: true, result: null }) }));
    }
    close() {}
  }
  await runHACommand(
    { type: 'config_entries/reload', entry_id: 'entry-1' },
    { readToken: 'read-only-token', controlToken: 'control-token', wsUrl: 'ws://test', WebSocketCtor: FakeWebSocket },
  );
  assert.equal(sent[0].access_token, 'control-token');
});

test('HTTP boundary forwards only the sanitized command', async () => {
  let received;
  const base = await start(async (command) => { received = command; return { items: [] }; });
  const response = await fetch(`${base}/ws-command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'todo/item/list', entity_id: 'todo.family' }),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(received, { type: 'todo/item/list', entity_id: 'todo.family' });
});

test('HTTP boundary accepts supported mutation and rejects unknown routes', async () => {
  const base = await start(async () => null);
  const mutation = await fetch(`${base}/ws-command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'config_entries/reload', entry_id: 'test-entry' }),
  });
  assert.equal(mutation.status, 200);
  const unsupported = await fetch(`${base}/ws-command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'unknown/mutation' }),
  });
  assert.equal(unsupported.status, 400);
  assert.equal((await fetch(`${base}/api/states`)).status, 404);
});
