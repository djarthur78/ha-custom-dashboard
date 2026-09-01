const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const { afterEach, mock, test } = require('node:test');

const execSyncMock = mock.method(childProcess, 'execSync', () => 'unexpected command invocation');
const { ALFRED_PUBLISH_PATHS, createAlfredApiServer, pushToHA } = require('./alfred-api');

let server;

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

test('Alfred status and refresh remain available through the same HTTP contract', async () => {
  execSyncMock.mock.resetCalls();
  const baseUrl = await startServer({
    collectDataFn: () => ({ gateway: { status: 'available' } }),
  });

  const responses = await Promise.all([
    fetch(`${baseUrl}/alfred`),
    fetch(`${baseUrl}/alfred/refresh`),
  ]);
  const bodies = await Promise.all(responses.map((response) => response.json()));

  assert.deepEqual(responses.map(({ status }) => status), [200, 200]);
  assert.deepEqual(bodies.map(({ ok }) => ok), [true, true]);
  assert.deepEqual(bodies.map(({ gateway }) => gateway), [
    { status: 'available' },
    { status: 'available' },
  ]);
  assert.equal(execSyncMock.mock.callCount(), 0);
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
