/**
 * MainLayout Component
 * Main application layout with compact header navigation
 */

import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Calendar, Utensils, Gamepad2, Camera, Home, Music } from 'lucide-react';
import { useWeather } from '../../hooks/useWeather';
import { useHAConnection } from '../../hooks/useHAConnection';
import { getWeatherIcon } from '../../utils/weather';
import { Clock } from './Clock';
import { ToastContainer } from '../common/Toast';
import { useToast } from '../../hooks/useToast';
import { useDoorbellAlert } from '../features/cameras/hooks/useDoorbellAlert';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/meals', icon: Utensils, label: 'Meals' },
  { to: '/games-room', icon: Gamepad2, label: 'Games Room' },
  { to: '/music', icon: Music, label: 'Music' },
  { to: '/cameras', icon: Camera, label: 'Cameras' },
];

export function MainLayout() {
  const weather = useWeather();
  const { isConnected } = useHAConnection();
  const { toasts, dismissToast } = useToast();
  const location = useLocation();
  const { alertMode, dismissAlert } = useDoorbellAlert();

  // Camera, Games Room, and Music pages need full viewport - no padding/footer
  const isFullViewport = ['/cameras', '/games-room', '/music'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      {/* Compact Blue Header */}
      <header
        className="sticky top-0 z-50"
        style={{
          backgroundColor: 'var(--color-primary)',
          borderBottom: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          {/* Left: Icon Navigation */}
          <nav className="flex items-center gap-1">
            {/* eslint-disable-next-line no-unused-vars */}
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                title={label}
                className={({ isActive }) =>
                  `flex items-center justify-center p-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/20'
                      : 'hover:bg-white/10'
                  }`
                }
                style={{ color: 'white' }}
              >
                <Icon size={28} />
              </NavLink>
            ))}
          </nav>

          {/* Center-Left: Compact Date, Time, Weather */}
          <div className="flex items-center gap-3 text-white text-xl">
            <span className="font-medium">
              Arthur Family
            </span>
            <Clock />
            {weather.temperature && weather.condition && (
              <>
                <span className="font-medium">
                  {Math.round(weather.temperature)}°
                </span>
                {getWeatherIcon(weather.condition)}
              </>
            )}
          </div>

          {/* Right: Connected Status */}
          <div className="flex items-center gap-2 text-white text-sm font-medium">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={isFullViewport ? '' : 'mx-auto px-4 py-6'}>
        <Outlet context={{ alertMode, dismissAlert }} />
      </main>

      {/* Footer - hide on full viewport pages */}
      {!isFullViewport && (
        <footer className="bg-[var(--color-surface)] border-t border-[var(--color-border)] mt-12">
          <div className="container mx-auto px-4 py-4 text-center text-sm text-[var(--color-text-secondary)]">
            Family Dashboard - Built with React + Home Assistant
          </div>
        </footer>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default MainLayout;
