import { Footprints, Wifi, Moon, MapPin, Car, User, Zap, Timer, Home as HomeIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AvatarPhoto } from './AvatarPhoto';
import { BatteryIndicator } from './BatteryIndicator';

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Home coordinates (from zone.home)
const HOME_LAT = 51.619455;
const HOME_LON = 0.520416;

/**
 * Person Card Component
 * Clean ds-card design with avatar ring color, Home/Away pill badge
 */
export function PersonCard({ person, isSelected, onSelect, compact = false }) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(person.id);
    }
  };

  const isAway = person.state !== 'home';

  // Parse last changed
  let timeAtLocation = '';
  if (person.lastChanged) {
    try {
      timeAtLocation = formatDistanceToNow(new Date(person.lastChanged));
    } catch (e) {
      timeAtLocation = '';
    }
  }

  // Calculate distance from home
  let distanceFromHome = null;
  if (person.latitude && person.longitude && isAway) {
    const dist = calculateDistance(HOME_LAT, HOME_LON, person.latitude, person.longitude);
    distanceFromHome = dist < 0.1 ? 'Nearby' : `${dist.toFixed(1)} mi away`;
  }

  // Check if connected to home WiFi (contains "arthur" in SSID)
  const isHomeWifi = person.ssid && person.ssid.toLowerCase().includes('arthur');

  // Check if moving (activity is automotive or walking)
  const isMoving = person.activity && ['automotive', 'walking', 'running'].includes(person.activity.toLowerCase());

  // Check if battery is low
  const isLowBattery = person.batteryLevel !== null && person.batteryLevel < 20;

  // Check if charging
  const isCharging = person.batteryState === 'Charging' || person.batteryState === 'Full';

  // Compact view shows minimal info
  if (compact) {
    return (
      <div
        className="ds-card cursor-pointer transition-all hover:shadow-md flex items-center gap-3"
        style={{
          padding: '10px 12px',
          ...(isSelected ? { boxShadow: '0 0 0 2px var(--ds-accent)' } : {}),
        }}
        onClick={handleClick}
      >
        <div className="relative">
          <div style={{ border: `3px solid ${person.color}`, borderRadius: '50%', padding: '1px' }}>
            <AvatarPhoto
              entityPicture={person.entityPicture}
              fallbackInitial={person.avatarFallback}
              color={person.color}
              size={32}
            />
          </div>
          {isCharging && (
            <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-0.5">
              <Zap size={8} className="text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold" style={{ color: 'var(--ds-text)' }}>{person.label}</div>
        </div>
        {/* Home/Away pill */}
        <div
          className="px-2 py-0.5 rounded-xl text-xs font-semibold"
          style={!isAway ? {
            backgroundColor: 'var(--ds-health-good)',
            color: 'white',
          } : {
            backgroundColor: 'var(--ds-warm-inactive-bg)',
            color: 'var(--ds-warm-inactive-text)',
          }}
        >
          {isAway ? 'Away' : 'Home'}
        </div>
      </div>
    );
  }

  return (
    <div
      className="ds-card cursor-pointer transition-all hover:shadow-md relative"
      style={{
        ...(isSelected ? { boxShadow: '0 0 0 2px var(--ds-accent)' } : {}),
      }}
      onClick={handleClick}
    >
      {/* Movement pulse indicator */}
      {isMoving && (
        <div className="absolute top-3 right-3">
          <div className="relative">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping absolute"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      )}

      {/* Header: Avatar + Name + Location */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <div style={{ border: `3px solid ${person.color}`, borderRadius: '50%', padding: '2px' }}>
            <AvatarPhoto
              entityPicture={person.entityPicture}
              fallbackInitial={person.avatarFallback}
              color={person.color}
              size={56}
            />
          </div>
          {isCharging && (
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
              <Zap size={12} className="text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--ds-text)' }}>{person.label}</h3>
          {/* Home/Away pill badge */}
          {!isAway ? (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: 'var(--ds-health-good)', color: 'white' }}
            >
              <HomeIcon size={14} />
              Home
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: 'var(--ds-warm-inactive-bg)', color: 'var(--ds-warm-inactive-text)' }}
            >
              <MapPin size={14} />
              {person.geocodedLocation || person.state || 'Away'}
            </span>
          )}
        </div>
      </div>

      {/* Battery - compact */}
      <div className="mb-2">
        <BatteryIndicator level={person.batteryLevel} state={person.batteryState} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
        {person.steps !== null && person.steps !== undefined && (
          <div className="flex items-center gap-1">
            <Footprints size={12} />
            <span>{person.steps.toLocaleString()}</span>
          </div>
        )}

        {distanceFromHome && (
          <div className="flex items-center gap-1" style={{ color: 'var(--ds-health-warn)' }}>
            <MapPin size={12} />
            <span>{distanceFromHome}</span>
          </div>
        )}

        {person.activity && (
          <div className="flex items-center gap-1">
            {person.activity.toLowerCase() === 'automotive' ? <Car size={12} /> : <User size={12} />}
            <span className="capitalize">{person.activity}</span>
          </div>
        )}

        {isHomeWifi && (
          <div className="flex items-center gap-1" style={{ color: 'var(--ds-health-good)' }}>
            <Wifi size={12} />
            <span>Home WiFi</span>
          </div>
        )}

        {timeAtLocation && (
          <div className="flex items-center gap-1">
            <Timer size={12} />
            <span>Here {timeAtLocation}</span>
          </div>
        )}

        {person.focus && (
          <div className="flex items-center gap-1" style={{ color: 'var(--ds-health-accent)' }}>
            <Moon size={12} />
            <span>Focus</span>
          </div>
        )}
      </div>

      {/* Low battery warning */}
      {isLowBattery && (
        <div className="mt-2 text-xs font-semibold" style={{ color: 'var(--ds-health-bad)' }}>
          Low battery
        </div>
      )}
    </div>
  );
}
