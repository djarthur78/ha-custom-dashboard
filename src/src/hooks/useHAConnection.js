/**
 * useHAConnection Hook
 * Manages connection to Home Assistant WebSocket
 */

import { useEffect, useState } from 'react';
import haWebSocket from '../services/ha-websocket';

export function useHAConnection() {
  // Get initial status from the service instead of hardcoding 'disconnected'
  const [status, setStatus] = useState(() => haWebSocket.getStatus());
  const [error, setError] = useState(null);
  const [reconnectInfo, setReconnectInfo] = useState(null);

  useEffect(() => {
    // Connect to HA on mount
    haWebSocket.connect().catch(err => {
      console.error('Failed to connect to HA:', err);
      setError(err.message);
    });

    // Subscribe to connection status changes
    const unsubscribe = haWebSocket.onConnectionChange((newStatus, errorInfo) => {
      setStatus(newStatus);

      if (newStatus === 'error' || newStatus === 'auth_failed') {
        setError(errorInfo?.message || 'Connection error');
      } else if (newStatus === 'connected') {
        setError(null);
        setReconnectInfo(null);
      } else if (newStatus === 'reconnecting') {
        setReconnectInfo(errorInfo);
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const retry = () => {
    setError(null);
    haWebSocket.reconnectAttempts = 0;
    haWebSocket.connect().catch(err => {
      setError(err.message);
    });
  };

  return {
    status,
    error,
    reconnectInfo,
    retry,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isReconnecting: status === 'reconnecting',
  };
}

export default useHAConnection;
