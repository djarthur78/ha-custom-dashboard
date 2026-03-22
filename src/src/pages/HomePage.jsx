/**
 * HomePage Component
 * Dashboard overview with warm earthy cards and live data previews
 */

import { Link } from 'react-router-dom';
import { Calendar, Utensils, Gamepad2, Camera, Music, Users, Heart } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { useEntity } from '../hooks/useEntity';

const TINTS = {
  calendar: 'var(--ds-tint-calendar)',
  meals: 'var(--ds-tint-meals)',
  games: 'var(--ds-tint-games)',
  music: 'var(--ds-tint-music)',
  people: 'var(--ds-tint-people)',
  health: 'var(--ds-tint-health)',
  cameras: 'var(--ds-tint-cameras)',
};

function HomeCard({ to, icon: Icon, title, tint, children }) {
  return (
    <Link
      to={to}
      className="ds-card block hover:shadow-md transition-all"
      style={{ backgroundColor: tint }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(159, 86, 68, 0.1)' }}>
          <Icon size={22} style={{ color: 'var(--ds-accent)' }} />
        </div>
        <h3 className="text-base font-semibold" style={{ color: 'var(--ds-text)' }}>{title}</h3>
      </div>
      <div className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
        {children}
      </div>
    </Link>
  );
}

function MusicPreview() {
  const { state, attributes } = useEntity('media_player.sonos_lounge');
  if (state === 'playing' && attributes?.media_title) {
    return <span>Now playing: {attributes.media_title}</span>;
  }
  return <span>{state === 'playing' ? 'Playing' : 'Idle'}</span>;
}

function GamesRoomPreview() {
  const { state, attributes } = useEntity('climate.games_room');
  if (!state || state === 'unavailable') return <span>Unavailable</span>;
  const temp = attributes?.current_temperature;
  return <span>{state === 'off' ? 'Off' : `${state}`}{temp ? ` · ${temp}°C` : ''}</span>;
}

function HealthPreview() {
  const sleep = useEntity('sensor.oura_ring_sleep_score');
  const steps = useEntity('sensor.oura_ring_steps');
  const parts = [];
  if (sleep.state && sleep.state !== 'unavailable') parts.push(`Sleep: ${sleep.state}`);
  if (steps.state && steps.state !== 'unavailable') parts.push(`Steps: ${Number(steps.state).toLocaleString()}`);
  return <span>{parts.length > 0 ? parts.join(' · ') : 'Loading...'}</span>;
}

export function HomePage() {
  return (
    <PageContainer>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <HomeCard to="/calendar" icon={Calendar} title="Family Calendar" tint={TINTS.calendar}>
          View all family calendars in one place
        </HomeCard>

        <HomeCard to="/meals" icon={Utensils} title="Meal Planner" tint={TINTS.meals}>
          Plan meals for this week and next
        </HomeCard>

        <HomeCard to="/games-room" icon={Gamepad2} title="Games Room" tint={TINTS.games}>
          <GamesRoomPreview />
        </HomeCard>

        <HomeCard to="/music" icon={Music} title="Music" tint={TINTS.music}>
          <MusicPreview />
        </HomeCard>

        <HomeCard to="/people" icon={Users} title="People & Location" tint={TINTS.people}>
          Track family members
        </HomeCard>

        <HomeCard to="/health" icon={Heart} title="Health & Wellness" tint={TINTS.health}>
          <HealthPreview />
        </HomeCard>

        <HomeCard to="/cameras" icon={Camera} title="Camera Feeds" tint={TINTS.cameras}>
          8 camera feeds
        </HomeCard>
      </div>

      <div className="text-center text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
        Family Dashboard <span className="font-semibold" style={{ color: 'var(--ds-text)' }}>v3.2.1</span>
      </div>
    </PageContainer>
  );
}

export default HomePage;
