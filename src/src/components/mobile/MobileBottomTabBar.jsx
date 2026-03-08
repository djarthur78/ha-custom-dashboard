/**
 * MobileBottomTabBar Component
 * 5 tabs + More sheet
 */

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Utensils, Gamepad2, Snowflake, MoreHorizontal } from 'lucide-react';
import { MobileMoreSheet } from './MobileMoreSheet';

const tabs = [
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/meals', icon: Utensils, label: 'Meals' },
  { to: '/games-room', icon: Gamepad2, label: 'Games Room' },
  { to: '/cold-plunge', icon: Snowflake, label: 'Cold Plunge' },
];

export function MobileBottomTabBar() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 flex items-stretch z-50"
        style={{
          height: 'calc(56px + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
          backgroundColor: '#2c2e2e',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center justify-center gap-0.5"
            style={({ isActive }) => ({
              color: isActive ? 'var(--ds-accent)' : 'rgba(255,255,255,0.5)',
            })}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5"
          style={{ color: moreOpen ? 'var(--ds-accent)' : 'rgba(255,255,255,0.5)' }}
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      <MobileMoreSheet isOpen={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
