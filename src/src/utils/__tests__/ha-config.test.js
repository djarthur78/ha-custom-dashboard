import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('getHAConfig', () => {
  beforeEach(() => { delete window.HA_CONFIG; });
  afterEach(() => { delete window.HA_CONFIG; vi.resetModules(); });

  it('defaults to the same-origin read boundary with no bearer', async () => {
    const { getHAConfig } = await import('../ha-config.js');
    expect(getHAConfig()).toEqual({
      url: '/ha-read', apiBase: '/ha-read', readOnly: true, token: null,
    });
  });

  it('accepts only a browser-visible API base', async () => {
    window.HA_CONFIG = { apiBase: '/custom-read', readOnly: true };
    const { getHAConfig } = await import('../ha-config.js');
    expect(getHAConfig().apiBase).toBe('/custom-read');
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
      url: '/ha-read', apiBase: '/ha-read', readOnly: true, token: null,
    });
  });
});
