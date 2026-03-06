/**
 * HomePage Component
 * Dashboard overview with clean cards and live data previews
 */

import { Link } from 'react-router-dom';
import { Calendar, Utensils, Gamepad2, Camera, Music, Users, Heart } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { useEntity } from '../hooks/useEntity';

function HomeCard({ to, icon: Icon, title, accent, children }) {
  return (
    <Link
      to={to}
      className="block bg-white rounded-lg border border-[#e0e0e0] overflow-hidden hover:border-[#bbb] transition-colors"
    >
      <div className="flex">
        <div className="w-1 shrink-0" style={{ backgroundColor: accent }} />
        <div className="flex-1 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Icon size={22} style={{ color: accent }} />
            <h3 className="text-base font-semibold text-[var(--color-text)]">{title}</h3>
          </div>
          <div className="text-sm text-[#666]">
            {children}
          </div>
        </div>
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
        <HomeCard to="/calendar" icon={Calendar} title="Family Calendar" accent="#1a73e8">
          View all family calendars in one place
        </HomeCard>

        <HomeCard to="/meals" icon={Utensils} title="Meal Planner" accent="#16a34a">
          Plan meals for this week and next
        </HomeCard>

        <HomeCard to="/games-room" icon={Gamepad2} title="Games Room" accent="#9333ea">
          <GamesRoomPreview />
        </HomeCard>

        <HomeCard to="/music" icon={Music} title="Music" accent="#db2777">
          <MusicPreview />
        </HomeCard>

        <HomeCard to="/people" icon={Users} title="People & Location" accent="#4f46e5">
          Track family members
        </HomeCard>

        <HomeCard to="/health" icon={Heart} title="Health & Wellness" accent="#e11d48">
          <HealthPreview />
        </HomeCard>

        <HomeCard to="/cameras" icon={Camera} title="Camera Feeds" accent="#dc2626">
          8 camera feeds
        </HomeCard>
      </div>

      <div className="text-center text-sm text-[#999]">
        Family Dashboard <span className="font-semibold text-[#666]">v2.3.0</span>
      </div>
    </PageContainer>
  );
}

export default HomePage;
