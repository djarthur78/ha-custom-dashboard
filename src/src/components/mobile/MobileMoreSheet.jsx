/**
 * MobileMoreSheet Component
 * Slide-up bottom sheet with additional navigation items
 */

import { useNavigate } from 'react-router-dom';
import { Home, Utensils, Gamepad2, Heart, Snowflake, X } from 'lucide-react';

const moreItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/meals', icon: Utensils, label: 'Meals' },
  { to: '/games-room', icon: Gamepad2, label: 'Games Room' },
  { to: '/health', icon: Heart, label: 'Health' },
  { to: '/cold-plunge', icon: Snowflake, label: 'Cold Plunge' },
];

export function MobileMoreSheet({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-2xl"
        style={{
          backgroundColor: 'var(--ds-card)',
          paddingBottom: 'calc(56px + env(safe-area-inset-bottom))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2">
          <h3 className="text-base font-semibold text-[var(--ds-text)]">More</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} className="text-[var(--ds-text-secondary)]" />
          </button>
        </div>

        {/* Items */}
        <div className="px-2 pb-4">
          {moreItems.map(({ to, icon: Icon, label }) => (
            <button
              key={to}
              onClick={() => {
                navigate(to);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(181,69,58,0.08)' }}
              >
                <Icon size={18} style={{ color: 'var(--ds-accent)' }} />
              </div>
              <span className="text-sm font-medium text-[var(--ds-text)]">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
