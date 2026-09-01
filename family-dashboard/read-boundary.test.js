const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const { createReadBoundaryServer, validateReadCommand } = require('./read-boundary');

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

test('service and configuration mutation commands are rejected', () => {
  assert.throws(() => validateReadCommand({ type: 'call_service', domain: 'switch', service: 'turn_on' }), /not read-only/);
  assert.throws(() => validateReadCommand({ type: 'config_entries/reload', entry_id: 'anything' }), /not read-only/);
  assert.throws(() => validateReadCommand({ type: 'todo/item/list', entity_id: 'todo.family', access_token: 'forbidden' }), /unexpected/);
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

test('HTTP boundary rejects mutation and unknown routes', async () => {
  const base = await start(async () => null);
  const mutation = await fetch(`${base}/ws-command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'call_service', domain: 'light', service: 'turn_on' }),
  });
  assert.equal(mutation.status, 400);
  assert.equal((await fetch(`${base}/api/states`)).status, 404);
});
