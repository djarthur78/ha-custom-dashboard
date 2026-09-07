import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('getHAConfig', () => {
  beforeEach(() => { delete window.HA_CONFIG; });
  afterEach(() => { delete window.HA_CONFIG; vi.resetModules(); });

  it('defaults to same-origin read and control boundaries with no bearer', async () => {
    const { getHAConfig } = await import('../ha-config.js');
    expect(getHAConfig()).toEqual({
      url: '/ha-read', apiBase: '/ha-read', controlApiBase: '/ha-control', readOnly: false, token: null,
    });
  });

  it('accepts only browser-visible boundary paths', async () => {
    window.HA_CONFIG = { apiBase: '/custom-read', controlApiBase: '/custom-control', readOnly: false };
    const { getHAConfig } = await import('../ha-config.js');
    expect(getHAConfig().apiBase).toBe('/custom-read');
    expect(getHAConfig().controlApiBase).toBe('/custom-control');
    expect(getHAConfig().token).toBeNull();
  });

  it('ignores legacy token, supervisor and direct HA URL fields', async () => {
    window.HA_CONFIG = {
      url: 'http://home-assistant.invalid',
      token: 'must-not-be-used',
      supervisorToken: 'must-not-be-used',
      readOnly: false,
    };
    const { getHAConfig } = await import('../ha-config.js');
    expect(getHAConfig()).toEqual({
      url: '/ha-read', apiBase: '/ha-read', controlApiBase: '/ha-control', readOnly: false, token: null,
    });
  });
});
