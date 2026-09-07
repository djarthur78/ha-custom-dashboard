const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const nginx = fs.readFileSync(path.join(__dirname, 'nginx.conf'), 'utf8');
const run = fs.readFileSync(path.join(__dirname, 'run.sh'), 'utf8');
const browserConfig = fs.readFileSync(path.join(__dirname, 'browser-config.js'), 'utf8');
const mobileHtml = fs.readFileSync(path.join(__dirname, 'build/mobile.html'), 'utf8');
const addonConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const desktopLayout = fs.readFileSync(path.join(__dirname, '../src/src/components/layout/MainLayout.jsx'), 'utf8');
const mobileLayout = fs.readFileSync(path.join(__dirname, '../src/src/components/mobile/MobileLayout.jsx'), 'utf8');

const IRRIGATION_TARGETS = [
  'sensor.openclaw_irrigation_today_max_temperature',
  'sensor.openclaw_lawn_right_hours_since_run',
  'sensor.openclaw_lawn_left_hours_since_run',
];
const ALFRED_TARGETS = [
  'sensor.alfred_ops_dashboard', 'sensor.alfred_memory_status',
  'sensor.mac_mini_cpu_usage', 'sensor.mac_mini_ram_usage', 'sensor.mac_mini_disk_usage',
  'binary_sensor.alfred_gateway', 'binary_sensor.alfred_ollama',
  'binary_sensor.alfred_location_bridge', 'sensor.alfred_gateway_health',
  'sensor.alfred_gateway_status', 'sensor.alfred_task_stats',
  'sensor.alfred_token_usage', 'sensor.alfred_cron_list',
];

test('nginx contains exactly three irrigation and thirteen Alfred publication routes', () => {
  assert.equal((nginx.match(/location = \/publish\/irrigation\//g) || []).length, 3);
  assert.equal((nginx.match(/location = \/publish\/alfred\//g) || []).length, 13);
  for (const target of [...IRRIGATION_TARGETS, ...ALFRED_TARGETS]) {
    assert.equal((nginx.match(new RegExp(`api/states/${target.replaceAll('.', '\\.')}[;\\n]`, 'g')) || []).length, 1);
  }
});

test('publishers require component secrets and cannot select an HA target', () => {
  assert.equal((nginx.match(/IRRIGATION_PUBLISHER_SECRET/g) || []).length, 3);
  assert.equal((nginx.match(/ALFRED_PUBLISHER_SECRET/g) || []).length, 13);
  assert.doesNotMatch(nginx, /api\/states\/\$|proxy_pass[^;]*\$request_uri/);
});

test('browser HA reads are GET-only, controls are POST-only, and neither receives a runtime credential', () => {
  assert.match(nginx, /location \^~ \/ha-read\/api\/[\s\S]*?request_method !~ \^\(GET\|HEAD\)\$/);
  assert.match(nginx, /location \^~ \/ha-control\/api\/services\/[\s\S]*?request_method != POST/);
  assert.match(nginx, /HA_CONTROL_TOKEN/);
  assert.match(nginx, /proxy_pass http:\/\/192\.168\.1\.2:8123\/api\/services\//);
  assert.doesNotMatch(nginx, /location \/api\//);
  assert.match(run, /browser-config\.js/);
  assert.doesNotMatch(run, /window\.HA_CONFIG[^\n]*(token|secret)/i);
  assert.match(run, /CONTROL_TOKEN="\$PUBLISHER_TOKEN"/);
  assert.match(run, /HA_CONTROL_WS_URL="ws:\/\/192\.168\.1\.2:8123\/api\/websocket"/);
  assert.match(run, /Required boundary configuration is missing:\$MISSING_FIELDS/);
  assert.equal(addonConfig.homeassistant_api, undefined);
});

test('browser read and control boundaries resolve inside Home Assistant ingress', () => {
  const cases = [
    ['/', '/ha-read', '/ha-control'],
    ['/mobile/', '/ha-read', '/ha-control'],
    ['/api/hassio_ingress/session-id/', '/api/hassio_ingress/session-id/ha-read', '/api/hassio_ingress/session-id/ha-control'],
    ['/api/hassio_ingress/session-id/mobile/', '/api/hassio_ingress/session-id/ha-read', '/api/hassio_ingress/session-id/ha-control'],
  ];

  for (const [pathname, expectedRead, expectedControl] of cases) {
    const context = { window: { location: { pathname } } };
    vm.runInNewContext(browserConfig, context);
    assert.equal(context.window.HA_CONFIG.apiBase, expectedRead, pathname);
    assert.equal(context.window.HA_CONFIG.controlApiBase, expectedControl, pathname);
    assert.equal(context.window.HA_CONFIG.readOnly, false, pathname);
    assert.equal('token' in context.window.HA_CONFIG, false, pathname);
  }
});

test('mobile runtime config remains relative to the add-on ingress root', () => {
  assert.match(mobileHtml, /<script src="\.\.\/config\.js"><\/script>/);
  assert.doesNotMatch(mobileHtml, /<script src="\/config\.js"><\/script>/);
});

test('writable dashboard layouts do not display a read-only badge', () => {
  assert.doesNotMatch(desktopLayout, />READ ONLY</);
  assert.doesNotMatch(mobileLayout, />READ ONLY</);
});
