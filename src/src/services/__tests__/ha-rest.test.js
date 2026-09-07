import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/ha-config', () => ({
  getHAConfig: () => ({ apiBase: '/ha-read', controlApiBase: '/ha-control' }),
}));

import { callService, getStates, toggle, turnOff, turnOn } from '../ha-rest';

afterEach(() => vi.restoreAllMocks());

describe('HA REST boundaries', () => {
  it('uses the read boundary for state reads', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    await getStates();
    expect(globalThis.fetch).toHaveBeenCalledWith('/ha-read/api/states', expect.objectContaining({ method: 'GET' }));
  });

  it('uses the control boundary for service calls without a browser bearer', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ entity_id: 'switch.test' }] });
    await callService('switch', 'turn_on', { entity_id: 'switch.test' });
    const [url, options] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('/ha-control/api/services/switch/turn_on');
    expect(options).toMatchObject({ method: 'POST', body: JSON.stringify({ entity_id: 'switch.test' }) });
    expect(options.headers.Authorization).toBeUndefined();
  });

  it('preserves the entity convenience control API', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    await turnOn('light.kitchen', { brightness: 128 });
    await turnOff('switch.fan');
    await toggle('input_boolean.guest_mode');
    expect(globalThis.fetch.mock.calls.map(([url, options]) => [url, JSON.parse(options.body)])).toEqual([
      ['/ha-control/api/services/light/turn_on', { entity_id: 'light.kitchen', brightness: 128 }],
      ['/ha-control/api/services/switch/turn_off', { entity_id: 'switch.fan' }],
      ['/ha-control/api/services/input_boolean/toggle', { entity_id: 'input_boolean.guest_mode' }],
    ]);
  });
});
