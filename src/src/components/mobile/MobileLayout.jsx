/**
 * MobileLayout Component
 * Mobile app shell with header + content + bottom tab bar
 */

import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useHAConnection } from '../../hooks/useHAConnection';
import { MobileBottomTabBar } from './MobileBottomTabBar';

const PAGE_TITLES = {
  '/': 'Calendar',
  '/calendar': 'Calendar',
  '/home': 'Home',
  '/meals': 'Meals',
  '/games-room': 'Games Room',
  '/music': 'Music',
  '/people': 'People',
  '/health': 'Health',
  '/cameras': 'Cameras',
  '/cold-plunge': 'Cold Plunge',
  '/todo': 'To-Do',
  '/weather': 'Weather',
  '/heating': 'Heating',
  '/lawn': 'Lawn',
};

export function MobileLayout() {
  const { isConnected } = useHAConnection();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Dashboard';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-text)]">
      {/* Header - 44px */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-4"
        style={{
          height: 44,
          backgroundColor: '#2c2e2e',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <h1 className="text-base font-semibold text-white">{title}</h1>
        <div className="flex items-center gap-2">
          <div
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: isConnected ? '#4ade80' : '#f87171',
            }}
          />
        </div>
      </header>

      {/* Main Content - scrollable */}
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: 'calc(56px + env(safe-area-inset-bottom))',
        }}
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center" style={{ height: 200 }}>
              <div
                className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: '#e2e2e6', borderTopColor: 'var(--ds-accent)' }}
              />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      {/* Bottom Tab Bar */}
      <MobileBottomTabBar />
    </div>
  );
}

export default MobileLayout;
