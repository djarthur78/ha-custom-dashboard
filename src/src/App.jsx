/**
 * Main App Component
 * Phase 1: Foundation - Home Assistant Connection Testing
 */

import { ConnectionStatus } from './components/common/ConnectionStatus';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { useHAConnection } from './hooks/useHAConnection';
import { useEntity } from './hooks/useEntity';
import { useServiceCall } from './hooks/useServiceCall';
import { Power, Lightbulb } from 'lucide-react';

function TestEntity({ entityId }) {
  const { state, attributes, loading, error } = useEntity(entityId);
  const { toggle, loading: toggleLoading } = useServiceCall();

  if (loading) {
    return <LoadingSpinner message={`Loading ${entityId}...`} size={20} />;
  }

  if (error) {
    return (
      <div className="p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)] rounded-lg">
        <p className="text-sm text-[var(--color-error)]">Error: {error}</p>
      </div>
    );
  }

  const isOn = state === 'on';
  const domain = entityId.split('.')[0];
  const friendlyName = attributes?.friendly_name || entityId;

  const handleToggle = async () => {
    try {
      await toggle(entityId);
    } catch (err) {
      console.error('Failed to toggle entity:', err);
    }
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-lg p-6 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {domain === 'light' ? (
            <Lightbulb
              size={24}
              className={isOn ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-secondary)]'}
            />
          ) : (
            <Power
              size={24}
              className={isOn ? 'text-[var(--color-success)]' : 'text-[var(--color-text-secondary)]'}
            />
          )}
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text)]">
              {friendlyName}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {entityId}
            </p>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            isOn
              ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
              : 'bg-[var(--color-surface-variant)] text-[var(--color-text-secondary)]'
          }`}
        >
          {state}
        </div>
      </div>

      {attributes && (
        <div className="mb-4 space-y-1">
          {attributes.brightness && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              Brightness: {Math.round((attributes.brightness / 255) * 100)}%
            </p>
          )}
        </div>
      )}

      <button
        onClick={handleToggle}
        disabled={toggleLoading}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          isOn
            ? 'bg-[var(--color-surface-variant)] hover:bg-[var(--color-border)] text-[var(--color-text)]'
            : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {toggleLoading ? 'Toggling...' : isOn ? 'Turn Off' : 'Turn On'}
      </button>
    </div>
  );
}

function App() {
  const { isConnected, isConnecting } = useHAConnection();

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      {/* Header */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Home Assistant Dashboard
          </h1>
          <ConnectionStatus />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isConnecting && (
          <LoadingSpinner message="Connecting to Home Assistant..." />
        )}

        {isConnected && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2 text-[var(--color-text)]">
                Phase 1: Foundation Test
              </h2>
              <p className="text-[var(--color-text-secondary)]">
                Testing Home Assistant WebSocket connection and entity control.
                Replace the entity ID below with any light or switch from your HA instance.
              </p>
            </div>

            <div className="grid gap-4">
              {/* Test Entity - Replace with your own entity ID */}
              <TestEntity entityId="light.reading_light" />

              {/* Add more test entities here if needed */}
              {/* <TestEntity entityId="switch.living_room" /> */}
            </div>

            <div className="mt-8 p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
              <h3 className="text-lg font-semibold mb-2 text-[var(--color-text)]">
                Testing Checklist
              </h3>
              <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                <li>✓ WebSocket connection established</li>
                <li>✓ Real-time entity state updates working</li>
                <li>✓ Service calls (turn_on/turn_off) functional</li>
                <li>✓ Dark theme applied</li>
                <li>✓ Responsive layout</li>
                <li>→ Test on iPad at http://192.168.1.6:5173</li>
              </ul>
            </div>
          </div>
        )}

        {!isConnected && !isConnecting && (
          <div className="max-w-md mx-auto mt-12 p-6 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
            <h2 className="text-xl font-semibold mb-4 text-[var(--color-text)]">
              Not Connected
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-4">
              Unable to connect to Home Assistant. Please check:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li>Home Assistant is running at {import.meta.env.VITE_HA_URL}</li>
              <li>Access token is valid in .env file</li>
              <li>Network connectivity is working</li>
            </ul>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[var(--color-surface)] border-t border-[var(--color-border)] mt-12">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-[var(--color-text-secondary)]">
          Phase 1: Foundation - Built with React + Vite + Tailwind
        </div>
      </footer>
    </div>
  );
}

export default App;
