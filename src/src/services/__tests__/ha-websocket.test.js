import { beforeEach, describe, expect, it, vi } from 'vitest';

const getStates = vi.fn();
const getState = vi.fn();

vi.mock('../ha-rest.js', () => ({
  default: { getStates, getState },
}));
vi.mock('../../utils/ha-config', () => ({
  getHAConfig: () => ({ apiBase: '/ha-read', readOnly: true, token: null }),
}));
vi.mock('../../utils/logger', () => ({
  default: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

describe('HA read boundary compatibility service', () => {
  let service;

  beforeEach(async () => {
    vi.resetModules();
    getStates.mockReset();
    getState.mockReset();
    service = (await import('../ha-websocket.js')).default;
  });

  it('starts disconnected and becomes connected after a server-side state read', async () => {
    getStates.mockResolvedValue([{ entity_id: 'sensor.temp', state: '22', last_updated: 'now' }]);
    expect(service.getStatus()).toBe('disconnected');
    await service.connect();
    expect(service.getStatus()).toBe('connected');
    expect(service.getCachedState('sensor.temp').state).toBe('22');
    service.disconnect();
  });

  it('notifies subscribers when polling observes a changed state', async () => {
    getStates
      .mockResolvedValueOnce([{ entity_id: 'sensor.temp', state: '21', last_updated: 'one' }])
      .mockResolvedValueOnce([{ entity_id: 'sensor.temp', state: '22', last_updated: 'two' }]);
    await service.connect();
    const subscriber = vi.fn();
    service.subscribeToEntity('sensor.temp', subscriber);
    await service.refreshStates();
    expect(subscriber).toHaveBeenCalledWith({ entity_id: 'sensor.temp', state: '22', last_updated: 'two' });
    service.disconnect();
  });

  it('rejects service and configuration mutation without making a request', async () => {
    globalThis.fetch = vi.fn();
    await expect(service.callService('switch', 'turn_on', { entity_id: 'switch.test' })).rejects.toThrow(/read-only/);
    await expect(service.send({ type: 'config_entries/reload', entry_id: 'x' })).rejects.toThrow(/read-only/);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('forwards an allowlisted read command without an Authorization header', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
    await service.send({ type: 'todo/item/list', entity_id: 'todo.family' });
    const [url, options] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('/ha-read/ws-command');
    expect(options.headers.Authorization).toBeUndefined();
  });

  it('clears state and subscribers on disconnect', () => {
    service.stateCache.set('sensor.temp', { state: '22' });
    service.subscribeToEntity('sensor.temp', vi.fn());
    service.disconnect();
    expect(service.getStatus()).toBe('disconnected');
    expect(service.stateCache.size).toBe(0);
    expect(service.stateSubscribers.size).toBe(0);
  });
});
