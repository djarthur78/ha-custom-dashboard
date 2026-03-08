/**
 * MobileHomePage
 * Single-column card grid for mobile
 */

import { Link } from 'react-router-dom';
import { Calendar, Utensils, Gamepad2, Camera, Music, Users, Heart, Snowflake } from 'lucide-react';
import { MobilePageContainer } from '../../components/mobile/MobilePageContainer';
import { useEntity } from '../../hooks/useEntity';

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
      className="ds-card block"
      style={{ backgroundColor: tint, padding: '14px' }}
    >
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(159, 86, 68, 0.1)' }}>
          <Icon size={18} style={{ color: 'var(--ds-accent)' }} />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ds-text)' }}>{title}</h3>
      </div>
      <div className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
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

export function MobileHomePage() {
  return (
    <MobilePageContainer>
      <div className="space-y-3">
        <HomeCard to="/calendar" icon={Calendar} title="Family Calendar" tint={TINTS.calendar}>
          View all family calendars
        </HomeCard>
        <HomeCard to="/meals" icon={Utensils} title="Meal Planner" tint={TINTS.meals}>
          Plan meals for the week
        </HomeCard>
        <HomeCard to="/games-room" icon={Gamepad2} title="Games Room" tint={TINTS.games}>
          <GamesRoomPreview />
        </HomeCard>
        <HomeCard to="/music" icon={Music} title="Music" tint={TINTS.music}>
          <MusicPreview />
        </HomeCard>
        <HomeCard to="/people" icon={Users} title="People" tint={TINTS.people}>
          Family locations
        </HomeCard>
        <HomeCard to="/health" icon={Heart} title="Health" tint={TINTS.health}>
          Oura health data
        </HomeCard>
        <HomeCard to="/cameras" icon={Camera} title="Cameras" tint={TINTS.cameras}>
          Camera feeds
        </HomeCard>
        <HomeCard to="/cold-plunge" icon={Snowflake} title="Cold Plunge" tint={TINTS.cameras}>
          Cold plunge controls
        </HomeCard>
      </div>

      <div className="text-center text-xs mt-6" style={{ color: 'var(--ds-text-secondary)' }}>
        Arthur Dashboard <span className="font-semibold" style={{ color: 'var(--ds-text)' }}>v3.0.0</span>
      </div>
    </MobilePageContainer>
  );
}

export default MobileHomePage;
