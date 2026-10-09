const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const { afterEach, mock, test } = require('node:test');

const execSyncMock = mock.method(childProcess, 'execSync', () => 'unexpected command invocation');
const {
  ALFRED_PUBLISH_PATHS,
  ALFRED_API_HOST,
  collectData,
  createAlfredApiServer,
  pushToHA,
  startLocalPublisher,
} = require('./alfred-api');

let server;

test('the diagnostic API is configured for loopback only', () => {
  assert.equal(ALFRED_API_HOST, '127.0.0.1');
});

afterEach(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  server = undefined;
});

async function startServer(options = {}) {
  server = createAlfredApiServer(options);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

test('the removed repair path is unavailable for GET and POST', async () => {
  execSyncMock.mock.resetCalls();
  const baseUrl = await startServer();

  const responses = await Promise.all([
    fetch(`${baseUrl}/alfred/restart`),
    fetch(`${baseUrl}/alfred/restart`, { method: 'POST' }),
  ]);

  assert.deepEqual(responses.map(({ status }) => status), [404, 404]);
  assert.equal(execSyncMock.mock.callCount(), 0);
});

test('health remains available without collecting status or running commands', async () => {
  execSyncMock.mock.resetCalls();
  const baseUrl = await startServer({
    collectDataFn: () => {
      throw new Error('health must not collect status');
    },
  });

  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(execSyncMock.mock.callCount(), 0);
});

test('loopback Alfred status is read-only and does not publish to Home Assistant', async () => {
  execSyncMock.mock.resetCalls();
  const baseUrl = await startServer({
    collectDataFn: () => ({ gateway: { status: 'available' } }),
  });

  const response = await fetch(`${baseUrl}/alfred`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.deepEqual(body.gateway, { status: 'available' });
  assert.equal(execSyncMock.mock.callCount(), 0);
});

test('the browser refresh route and cross-origin access are retired', async () => {
  const baseUrl = await startServer();

  const refresh = await fetch(`${baseUrl}/alfred/refresh`);
  const preflight = await fetch(`${baseUrl}/alfred`, { method: 'OPTIONS' });
  const status = await fetch(`${baseUrl}/alfred`);

  assert.equal(refresh.status, 404);
  assert.equal(preflight.status, 404);
  assert.equal(status.headers.get('access-control-allow-origin'), null);
  assert.equal(status.headers.get('access-control-allow-methods'), null);
});

test('Alfred publication is constrained to the thirteen owned targets', async () => {
  assert.equal(Object.keys(ALFRED_PUBLISH_PATHS).length, 13);
  const requests = [];
  const fetchFn = async (url, options) => {
    requests.push({ url, options });
    return { ok: true };
  };
  const config = { base_url: 'http://boundary.test', alfred_secret: 'narrow-secret' };

  const published = await pushToHA('sensor.alfred_ops_dashboard', { state: 'ok' }, { fetchFn, config });

  assert.equal(published, true);
  assert.equal(requests[0].url, 'http://boundary.test/publish/alfred/ops-dashboard');
  assert.equal(requests[0].options.headers['X-Alfred-Publisher-Key'], 'narrow-secret');
  assert.equal(requests[0].options.headers.Authorization, undefined);
  assert.throws(
    () => pushToHA('switch.arbitrary_target', { state: 'on' }, { fetchFn, config }),
    /not owned/,
  );
});

test('local collection publishes only when the daemon supplies its publisher', () => {
  const published = [];

  const snapshot = collectData({
    publishFn: (entityId, payload) => published.push({ entityId, payload }),
  });

  assert.ok(snapshot.ops);
  assert.ok(published.some(({ entityId }) => entityId === 'sensor.alfred_ops_dashboard'));
  assert.ok(published.some(({ entityId }) => entityId === 'binary_sensor.alfred_gateway'));
});

test('the local daemon publishes immediately and every minute', () => {
  const publishFn = () => {};
  const calls = [];
  let scheduled;

  const timer = startLocalPublisher({
    collectDataFn: (options) => calls.push(options),
    publishFn,
    setIntervalFn: (callback, intervalMs) => {
      scheduled = callback;
      assert.equal(intervalMs, 60_000);
      return 'publisher-timer';
    },
  });

  assert.equal(timer, 'publisher-timer');
  assert.deepEqual(calls, [{ publishFn }]);
  scheduled();
  assert.deepEqual(calls, [{ publishFn }, { publishFn }]);
});
