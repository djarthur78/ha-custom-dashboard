/**
 * ConnectionStatus Component
 * Displays Home Assistant connection status
 */

import { Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';
import { useHAConnection } from '../../hooks/useHAConnection';

export function ConnectionStatus() {
  const { status, error, reconnectInfo, retry } = useHAConnection();

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected',
          color: 'text-[var(--color-success)]',
          bgColor: 'bg-[var(--color-success)]/10',
        };
      case 'connecting':
        return {
          icon: Loader2,
          text: 'Connecting...',
          color: 'text-[var(--color-warning)]',
          bgColor: 'bg-[var(--color-warning)]/10',
          animate: true,
        };
      case 'reconnecting':
        return {
          icon: Loader2,
          text: reconnectInfo
            ? `Reconnecting... (${reconnectInfo.attempt})`
            : 'Reconnecting...',
          color: 'text-[var(--color-warning)]',
          bgColor: 'bg-[var(--color-warning)]/10',
          animate: true,
        };
      case 'error':
      case 'auth_failed':
      case 'max_retries_reached':
        return {
          icon: AlertCircle,
          text: 'Connection Error',
          color: 'text-[var(--color-error)]',
          bgColor: 'bg-[var(--color-error)]/10',
        };
      default:
        return {
          icon: WifiOff,
          text: 'Disconnected',
          color: 'text-[var(--color-text-secondary)]',
          bgColor: 'bg-[var(--color-surface-variant)]',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor}`}>
        <Icon
          size={16}
          className={`${config.color} ${config.animate ? 'animate-spin' : ''}`}
        />
        <span className={`text-sm font-medium ${config.color}`}>
          {config.text}
        </span>
      </div>

      {error && (
        <button
          onClick={retry}
          className="px-3 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default ConnectionStatus;
