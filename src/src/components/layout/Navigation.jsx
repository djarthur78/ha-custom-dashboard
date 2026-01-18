/**
 * Navigation Component
 * Tab-based navigation for main features
 */

import { NavLink } from 'react-router-dom';
import { Calendar, Utensils, Gamepad2, Camera, Home } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/meals', icon: Utensils, label: 'Meals' },
  { to: '/games-room', icon: Gamepad2, label: 'Games Room' },
  { to: '/cameras', icon: Camera, label: 'Cameras' },
];

export function Navigation() {
  return (
    <nav className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
      <div className="container mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
