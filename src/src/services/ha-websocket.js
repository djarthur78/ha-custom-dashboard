/**
 * Home Assistant WebSocket Service
 * Manages WebSocket connection to Home Assistant with auto-reconnect
 */

class HAWebSocket {
  constructor() {
    this.ws = null;
    this.messageId = 1;
    this.listeners = new Map();
    this.stateSubscribers = new Map();
    this.connectionListeners = new Set();
    this.isAuthenticated = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectTimeout = null;

    // Auto-detect environment
    // Priority: window.HA_CONFIG (add-on runtime) > env variables (development)
    if (window.HA_CONFIG && window.HA_CONFIG.useIngress) {
      // Running in HA add-on with ingress
      // Connect through HA instance (ingress proxy)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      this.url = `${protocol}//${host}/api/websocket`;
      this.token = window.HA_CONFIG.token;
      console.log('[HA WebSocket] Running in add-on mode with ingress');
    } else if (import.meta.env.VITE_HA_URL) {
      // Development mode
      this.url = import.meta.env.VITE_HA_URL;
      this.token = import.meta.env.VITE_HA_TOKEN;
      console.log('[HA WebSocket] Running in development mode');
    } else {
      // Fallback: try to connect to current host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      this.url = `${protocol}//${host}/api/websocket`;
      this.token = null;
      console.warn('[HA WebSocket] No configuration found, attempting connection without token');
    }
  }

  /**
   * Connect to Home Assistant WebSocket
   */
  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return Promise.resolve();
    }

    this.isConnecting = true;
    this.notifyConnectionListeners('connecting');
    const wsUrl = this.url.replace('http://', 'ws://').replace('https://', 'wss://');

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${wsUrl}/api/websocket`);

        this.ws.onopen = () => {
          console.log('[HA WebSocket] Connection opened');
        };

        this.ws.onmessage = async (event) => {
          const message = JSON.parse(event.data);
          await this.handleMessage(message, resolve, reject);
        };

        this.ws.onerror = (error) => {
          console.error('[HA WebSocket] Error:', error);
          this.isConnecting = false;
          this.notifyConnectionListeners('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[HA WebSocket] Connection closed');
          this.isAuthenticated = false;
          this.isConnecting = false;
          this.notifyConnectionListeners('disconnected');
          this.scheduleReconnect();
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  async handleMessage(message, resolve, reject) {
    switch (message.type) {
      case 'auth_required':
        console.log('[HA WebSocket] Auth required');
        this.authenticate();
        break;

      case 'auth_ok':
        console.log('[HA WebSocket] Authentication successful');
        this.isAuthenticated = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnectionListeners('connected');
        this.subscribeToStates();
        if (resolve) resolve();
        break;

      case 'auth_invalid':
        console.error('[HA WebSocket] Authentication failed');
        this.isConnecting = false;
        this.notifyConnectionListeners('auth_failed');
        if (reject) reject(new Error('Authentication failed'));
        break;

      case 'result':
        this.handleResult(message);
        break;

      case 'event':
        this.handleEvent(message);
        break;

      default:
        console.log('[HA WebSocket] Unknown message type:', message.type);
    }
  }

  /**
   * Authenticate with Home Assistant
   */
  authenticate() {
    this.send({
      type: 'auth',
      access_token: this.token,
    }, false);
  }

  /**
   * Subscribe to state changes
   */
  subscribeToStates() {
    this.send({
      type: 'subscribe_events',
      event_type: 'state_changed',
    });
  }

  /**
   * Handle result messages
   */
  handleResult(message) {
    const listener = this.listeners.get(message.id);
    if (listener) {
      // Clear timeout if it exists
      if (listener.timeout) {
        clearTimeout(listener.timeout);
      }

      if (message.success) {
        listener.resolve(message.result);
      } else {
        listener.reject(new Error(message.error?.message || 'Request failed'));
      }
      this.listeners.delete(message.id);
    }
  }

  /**
   * Handle event messages
   */
  handleEvent(message) {
    // Handle state change events
    if (message.event?.event_type === 'state_changed') {
      const entityId = message.event.data?.entity_id;
      const newState = message.event.data?.new_state;

      if (entityId && newState) {
        const subscribers = this.stateSubscribers.get(entityId);
        if (subscribers) {
          subscribers.forEach(callback => callback(newState));
        }
      }
    }

    // Handle weather forecast subscription events
    if (message.event?.forecast && this.weatherSubscribers) {
      const callback = this.weatherSubscribers.get(message.id);
      if (callback) {
        console.log(`[Weather] Received forecast update for subscription ${message.id}:`, message.event.forecast);
        callback(message.event.forecast);
      } else {
        console.log(`[Weather] Received forecast but no callback found for ID ${message.id}`);
      }
    }
  }

  /**
   * Send a message to Home Assistant
   */
  send(message, needsId = true) {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      // Check authentication for commands (but not for auth message itself)
      if (needsId && !this.isAuthenticated) {
        reject(new Error('Not authenticated'));
        return;
      }

      const id = needsId ? this.messageId++ : null;
      const payload = needsId ? { ...message, id } : message;

      if (needsId) {
        // Add timeout to prevent hanging promises
        const timeout = setTimeout(() => {
          const listener = this.listeners.get(id);
          if (listener) {
            this.listeners.delete(id);
            listener.reject(new Error('Request timeout'));
          }
        }, 10000); // 10 second timeout

        this.listeners.set(id, { resolve, reject, timeout });
      }

      this.ws.send(JSON.stringify(payload));

      if (!needsId) {
        resolve();
      }
    });
  }

  /**
   * Get current state of an entity
   */
  async getState(entityId) {
    const states = await this.send({
      type: 'get_states',
    });
    return states.find(state => state.entity_id === entityId);
  }

  /**
   * Get all states
   */
  async getStates() {
    return this.send({
      type: 'get_states',
    });
  }

  /**
   * Call a Home Assistant service
   */
  async callService(domain, service, serviceData = {}) {
    return this.send({
      type: 'call_service',
      domain,
      service,
      service_data: serviceData,
    });
  }

  /**
   * Subscribe to entity state changes
   */
  subscribeToEntity(entityId, callback) {
    if (!this.stateSubscribers.has(entityId)) {
      this.stateSubscribers.set(entityId, new Set());
    }
    this.stateSubscribers.get(entityId).add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.stateSubscribers.get(entityId);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.stateSubscribers.delete(entityId);
        }
      }
    };
  }

  /**
   * Subscribe to weather forecast updates
   */
  subscribeToWeatherForecast(entityId, forecastType = 'daily', callback) {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isAuthenticated) {
        reject(new Error('WebSocket not connected or not authenticated'));
        return;
      }

      const id = this.messageId++;

      // Initialize weather subscribers map if needed
      if (!this.weatherSubscribers) {
        this.weatherSubscribers = new Map();
      }

      // Store the callback with the message ID
      this.weatherSubscribers.set(id, callback);
      console.log(`[Weather] Subscribing with ID ${id} to ${entityId}`);

      // Set up response listener
      const timeout = setTimeout(() => {
        const listener = this.listeners.get(id);
        if (listener) {
          this.listeners.delete(id);
          this.weatherSubscribers.delete(id);
          reject(new Error('Weather subscription timeout'));
        }
      }, 10000);

      this.listeners.set(id, {
        resolve: () => {
          clearTimeout(timeout);
          console.log(`[Weather] Subscription ${id} confirmed`);
          // Return unsubscribe function
          resolve(() => {
            if (this.weatherSubscribers) {
              this.weatherSubscribers.delete(id);
              console.log(`[Weather] Unsubscribed ${id}`);
            }
          });
        },
        reject: (error) => {
          clearTimeout(timeout);
          this.weatherSubscribers.delete(id);
          reject(error);
        },
        timeout
      });

      // Send subscription message
      this.ws.send(JSON.stringify({
        id,
        type: 'weather/subscribe_forecast',
        entity_id: entityId,
        forecast_type: forecastType,
      }));
    });
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionChange(callback) {
    this.connectionListeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  /**
   * Notify connection status listeners
   */
  notifyConnectionListeners(status, error = null) {
    this.connectionListeners.forEach(callback => {
      callback(status, error);
    });
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[HA WebSocket] Max reconnect attempts reached');
      this.notifyConnectionListeners('max_retries_reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`[HA WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.notifyConnectionListeners('reconnecting', { attempt: this.reconnectAttempts, delay });

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(error => {
        console.error('[HA WebSocket] Reconnect failed:', error);
      });
    }, delay);
  }

  /**
   * Disconnect from Home Assistant
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Clear all pending request timeouts
    this.listeners.forEach((listener) => {
      if (listener.timeout) {
        clearTimeout(listener.timeout);
      }
      listener.reject(new Error('Connection closed'));
    });

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isAuthenticated = false;
    this.isConnecting = false;
    this.listeners.clear();
    this.stateSubscribers.clear();
  }

  /**
   * Get connection status
   */
  getStatus() {
    if (!this.ws) return 'disconnected';
    if (this.isConnecting) return 'connecting';
    if (this.ws.readyState === WebSocket.OPEN && this.isAuthenticated) return 'connected';
    if (this.ws.readyState === WebSocket.CONNECTING) return 'connecting';
    return 'disconnected';
  }
}

// Create singleton instance
const haWebSocket = new HAWebSocket();

export default haWebSocket;
