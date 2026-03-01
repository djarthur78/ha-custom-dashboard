/**
 * HomePage Component
 * Dashboard overview page
 */

import { Link } from 'react-router-dom';
import { Calendar, Utensils, Gamepad2, Camera, Music, Users, Heart } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';

const features = [
  {
    to: '/calendar',
    icon: Calendar,
    title: 'Family Calendar',
    description: 'View all family calendars in one place',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  },
  {
    to: '/meals',
    icon: Utensils,
    title: 'Meal Planner',
    description: 'Plan meals for this week and next week',
    gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
  },
  {
    to: '/games-room',
    icon: Gamepad2,
    title: 'Games Room',
    description: 'Control climate, media, and devices',
    gradient: 'linear-gradient(135deg, #a855f7, #9333ea)',
  },
  {
    to: '/music',
    icon: Music,
    title: 'Music',
    description: 'Control Sonos speakers and playlists',
    gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
  },
  {
    to: '/people',
    icon: Users,
    title: 'People & Location',
    description: 'Track family members and locations',
    gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
  },
  {
    to: '/health',
    icon: Heart,
    title: 'Health & Wellness',
    description: 'Oura Ring data and Cold Plunge controls',
    gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
  },
  {
    to: '/cameras',
    icon: Camera,
    title: 'Camera Feeds',
    description: 'View all camera feeds',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
  },
];

export function HomePage() {
  return (
    <PageContainer>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* eslint-disable-next-line no-unused-vars */}
        {features.map(({ to, icon: Icon, title, description, gradient }) => (
          <Link
            key={to}
            to={to}
            className="block rounded-xl transition-all transform hover:-translate-y-1 hover:scale-[1.02]"
            style={{
              background: gradient,
              padding: '1.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)';
            }}
          >
            <div className="flex items-start gap-4">
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '0.75rem' }}>
                <Icon size={32} style={{ color: 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>{title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)' }}>{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Version Info */}
      <div
        className="bg-[var(--color-surface)] rounded-xl p-4 text-center"
        style={{
          border: 'none',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        }}
      >
        <p className="text-sm text-[var(--color-text-secondary)]">
          Family Dashboard <span className="font-semibold text-[var(--color-text)]">v2.1.0</span>
        </p>
      </div>
    </PageContainer>
  );
}

export default HomePage;
