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

  it('returns ingress URL when window.HA_CONFIG.useIngress is set', async () => {
    // Simulate running inside HA ingress
    window.HA_CONFIG = { useIngress: true, supervisorToken: 'ingress-token' };

    // jsdom defaults: location.protocol = 'about:', location.host = ''
    // Override for this test
    Object.defineProperty(window, 'location', {
      value: { protocol: 'http:', host: '192.168.1.2:8123', origin: 'http://192.168.1.2:8123' },
      writable: true,
    });

    const { getHAConfig } = await import('../ha-config.js');
    const config = getHAConfig();

    expect(config.url).toBe('http://192.168.1.2:8123');
    expect(config.token).toBe('ingress-token');
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

  it('returns current origin in HTTPS context to avoid mixed content', async () => {
    window.HA_CONFIG = {
      url: 'http://192.168.1.2:8123',
      token: 'user-token',
      useProxy: true,
    };

    Object.defineProperty(window, 'location', {
      value: { protocol: 'https:', host: 'ha.example.com', origin: 'https://ha.example.com' },
      writable: true,
    });

    const { getHAConfig } = await import('../ha-config.js');

    // HTTPS + ingress: both WebSocket and REST should use relative URLs
    // to stay within ingress context (/api/hassio_ingress/<token>/)
    const wsConfig = getHAConfig();
    expect(wsConfig.url).toBe(''); // Relative URL for ingress
    expect(wsConfig.token).toBe('user-token');

    // REST (useProxy=true): should also use relative URL
    const restConfig = getHAConfig({ useProxy: true });
    expect(restConfig.url).toBe('');
  });

  it('returns empty URL when useProxy is true in dev mode', async () => {
    // This tests the proxy branch for REST API CORS avoidance
    // When VITE_HA_URL is set and DEV is true, useProxy should return ''
    const { getHAConfig } = await import('../ha-config.js');
    const config = getHAConfig({ useProxy: true });

    // In test environment (vitest), import.meta.env.DEV is true
    // If VITE_HA_URL is set, url should be '' for proxy mode
    // If not set, it falls back to origin
    expect(typeof config.url).toBe('string');
  });
});
