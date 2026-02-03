/**
 * Vitest Test Setup
 * Global test configuration and mocks
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;

    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) this.onopen({ type: 'open' });
    }, 0);
  }

  send(data) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Store last sent message for test assertions
    this.lastSentMessage = JSON.parse(data);
    MockWebSocket.lastInstance = this;
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose({ type: 'close' });
  }

  // Helper to simulate receiving messages in tests
  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  // Helper to simulate errors in tests
  simulateError(error) {
    if (this.onerror) {
      this.onerror(error);
    }
  }
}

// Store last instance for test access
MockWebSocket.lastInstance = null;

// Make it available globally
global.WebSocket = MockWebSocket;

// Mock import.meta.env for tests
vi.stubGlobal('import.meta', {
  env: {
    VITE_HA_URL: 'http://localhost:8123',
    VITE_HA_TOKEN: 'test-token-12345',
  },
});

// Mock window.HA_CONFIG (add-on mode)
global.window = global.window || {};
window.HA_CONFIG = undefined;

// Clean up between tests
beforeEach(() => {
  MockWebSocket.lastInstance = null;
  vi.clearAllMocks();
});

// Export mock for direct access in tests
export { MockWebSocket };
