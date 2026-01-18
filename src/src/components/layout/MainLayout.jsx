/**
 * MainLayout Component
 * Main application layout with navigation
 */

import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import { ConnectionStatus } from '../common/ConnectionStatus';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      {/* Header */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Family Dashboard
          </h1>
          <ConnectionStatus />
        </div>
      </header>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[var(--color-surface)] border-t border-[var(--color-border)] mt-12">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-[var(--color-text-secondary)]">
          Family Dashboard - Built with React + Home Assistant
        </div>
      </footer>
    </div>
  );
}

export default MainLayout;
