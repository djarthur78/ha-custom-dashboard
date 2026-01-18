/**
 * HomePage Component
 * Dashboard overview page
 */

import { Link } from 'react-router-dom';
import { Calendar, Utensils, Gamepad2, Camera } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { useEntity } from '../hooks/useEntity';

const features = [
  {
    to: '/calendar',
    icon: Calendar,
    title: 'Family Calendar',
    description: 'View all family calendars in one place',
    color: 'from-blue-500 to-blue-600',
  },
  {
    to: '/meals',
    icon: Utensils,
    title: 'Meal Planner',
    description: 'Plan meals for this week and next week',
    color: 'from-green-500 to-green-600',
  },
  {
    to: '/games-room',
    icon: Gamepad2,
    title: 'Games Room',
    description: 'Control climate, media, and devices',
    color: 'from-purple-500 to-purple-600',
  },
  {
    to: '/cameras',
    icon: Camera,
    title: 'Camera Feeds',
    description: 'View all camera feeds',
    color: 'from-red-500 to-red-600',
  },
];

export function HomePage() {
  const { state: testLightState } = useEntity('light.reading_light');

  return (
    <PageContainer
      title="Family Dashboard"
      subtitle="Welcome! Select a feature to get started."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {features.map(({ to, icon: Icon, title, description, color }) => (
          <Link
            key={to}
            to={to}
            className={`block p-6 bg-gradient-to-br ${color} rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Icon size={32} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
                <p className="text-white/90 text-sm">{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Status */}
      <div className="bg-[var(--color-surface)] rounded-lg p-6 border border-[var(--color-border)]">
        <h3 className="text-lg font-semibold mb-4">Quick Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Test Light</p>
            <p className="text-lg font-semibold">
              {testLightState === 'on' ? '✅ On' : '⭕ Off'}
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default HomePage;
