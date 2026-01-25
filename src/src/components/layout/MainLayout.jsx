/**
 * MainLayout Component
 * Main application layout with compact header navigation
 */

import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Calendar, Utensils, Gamepad2, Camera, Home, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudLightning, Sun, Moon, CloudFog, Wind, Snowflake } from 'lucide-react';
import { format } from 'date-fns';
import { useWeather } from '../../hooks/useWeather';
import { useHAConnection } from '../../hooks/useHAConnection';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/meals', icon: Utensils, label: 'Meals' },
  { to: '/games-room', icon: Gamepad2, label: 'Games Room' },
  { to: '/cameras', icon: Camera, label: 'Cameras' },
];

const getWeatherIcon = (condition) => {
  const iconMap = {
    'clear-night': { icon: Moon, color: '#FDB813', size: 20 },
    'cloudy': { icon: Cloud, color: '#78909C', size: 20 },
    'fog': { icon: CloudFog, color: '#B0BEC5', size: 20 },
    'hail': { icon: CloudSnow, color: '#81D4FA', size: 20 },
    'lightning': { icon: CloudLightning, color: '#FDD835', size: 20 },
    'lightning-rainy': { icon: CloudLightning, color: '#FFA726', size: 20 },
    'partlycloudy': { icon: Cloud, color: '#90CAF9', size: 20 },
    'pouring': { icon: CloudRain, color: '#42A5F5', size: 20 },
    'rainy': { icon: CloudDrizzle, color: '#5C6BC0', size: 20 },
    'snowy': { icon: Snowflake, color: '#81D4FA', size: 20 },
    'snowy-rainy': { icon: CloudSnow, color: '#64B5F6', size: 20 },
    'sunny': { icon: Sun, color: '#FFB300', size: 20 },
    'windy': { icon: Wind, color: '#90A4AE', size: 20 },
    'windy-variant': { icon: Wind, color: '#78909C', size: 20 },
    'exceptional': { icon: Cloud, color: '#FF5722', size: 20 },
  };

  const config = iconMap[condition] || iconMap['sunny'];
  const IconComponent = config.icon;

  return (
    <IconComponent
      size={config.size}
      style={{ color: config.color }}
      strokeWidth={2}
    />
  );
};

export function MainLayout() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const weather = useWeather();
  const { isConnected } = useHAConnection();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

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
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                title={label}
                className={({ isActive }) =>
                  `flex items-center justify-center p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/20'
                      : 'hover:bg-white/10'
                  }`
                }
                style={{ color: 'white' }}
              >
                <Icon size={24} />
              </NavLink>
            ))}
          </nav>

          {/* Center-Left: Date, Time, Weather */}
          <div className="flex items-center gap-4 text-white">
            <span className="text-lg font-semibold">
              {format(currentTime, 'EEEE, MMMM d, yyyy')}
            </span>
            <span className="text-lg font-semibold">
              {format(currentTime, 'h:mm a')}
            </span>
            {weather.temperature && weather.condition && (
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  {Math.round(weather.temperature)}°
                </span>
                {getWeatherIcon(weather.condition)}
              </div>
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
      <main className="mx-auto px-4 py-6">
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
