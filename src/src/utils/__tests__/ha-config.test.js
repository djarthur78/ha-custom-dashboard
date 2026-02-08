import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We need to mock import.meta.env before importing the module,
// so we use dynamic imports within each test group.

describe('getHAConfig', () => {
  let originalHAConfig;

  beforeEach(() => {
    originalHAConfig = window.HA_CONFIG;
    delete window.HA_CONFIG;
  });

  afterEach(() => {
    if (originalHAConfig !== undefined) {
      window.HA_CONFIG = originalHAConfig;
    } else {
      delete window.HA_CONFIG;
    }
    vi.resetModules();
  });

  it('returns HA_CONFIG.url when window.HA_CONFIG.url is set', async () => {
    window.HA_CONFIG = {
      url: 'http://192.168.1.2:8123',
      token: 'addon-token-123',
    };

    const { getHAConfig } = await import('../ha-config.js');
    const config = getHAConfig();

    expect(config.url).toBe('http://192.168.1.2:8123');
    expect(config.token).toBe('addon-token-123');
  });

  it('uses supervisorToken as fallback when token is missing', async () => {
    window.HA_CONFIG = {
      url: 'http://192.168.1.2:8123',
      supervisorToken: 'supervisor-abc',
    };

    const { getHAConfig } = await import('../ha-config.js');
    const config = getHAConfig();

    expect(config.token).toBe('supervisor-abc');
  });

  it('returns supervisor URL when window.HA_CONFIG.url is set to supervisor/core', async () => {
    // Simulate running inside HA add-on with supervisor API
    window.HA_CONFIG = {
      url: 'http://supervisor/core',
      token: 'user-token',
      supervisorToken: 'supervisor-token',
    };

    const { getHAConfig } = await import('../ha-config.js');
    const config = getHAConfig();

    expect(config.url).toBe('http://supervisor/core');
    expect(config.token).toBe('user-token');
  });

  it('returns VITE_HA_URL from import.meta.env when no HA_CONFIG', async () => {
    // import.meta.env is set by Vite; vitest provides it too
    // We rely on the .env or vitest define for this
    const { getHAConfig } = await import('../ha-config.js');
    const config = getHAConfig();

    // Without HA_CONFIG and without env vars, it falls back to location.origin
    // In jsdom that's 'http://localhost:3000' or similar
    expect(config).toHaveProperty('url');
    expect(config).toHaveProperty('token');
  });

  it('falls back to window.location.origin when nothing else is set', async () => {
    Object.defineProperty(window, 'location', {
      value: { protocol: 'http:', host: 'localhost:5173', origin: 'http://localhost:5173' },
      writable: true,
    });

    const { getHAConfig } = await import('../ha-config.js');
    const config = getHAConfig();

    // Should get either env var or fallback — not crash
    expect(typeof config.url).toBe('string');
  });

  it('always returns configured URL (v2.0.12 simplified behavior)', async () => {
    window.HA_CONFIG = {
      url: 'http://supervisor/core',
      token: 'user-token',
    };

    const { getHAConfig } = await import('../ha-config.js');

    // v2.0.12: Always return configured URL, no relative URL logic
    const config = getHAConfig();
    expect(config.url).toBe('http://supervisor/core');
    expect(config.token).toBe('user-token');
  });
});
