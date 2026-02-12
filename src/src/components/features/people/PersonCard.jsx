import { Footprints, Wifi, Moon, MapPin, Signal, Car, User, Zap, Timer } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AvatarPhoto } from './AvatarPhoto';
import { ZoneBadge } from './ZoneBadge';
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
 * Shows person info with avatar, zone, battery, and optional stats
 */
export function PersonCard({ person, isSelected, onSelect, compact = false }) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(person.id);
    }
  };

  const isAway = person.state !== 'home';
  const showGeocodedLocation = isAway && person.geocodedLocation;

  // Parse last changed
  let lastChangedText = '';
  let timeAtLocation = '';
  if (person.lastChanged) {
    try {
      lastChangedText = formatDistanceToNow(new Date(person.lastChanged), { addSuffix: true });
      timeAtLocation = formatDistanceToNow(new Date(person.lastChanged));
    } catch (e) {
      lastChangedText = '';
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
        className={`bg-[var(--color-surface)] rounded-lg p-2 cursor-pointer transition-all relative flex items-center gap-2 ${
          isSelected ? 'ring-2 ring-[var(--color-primary)]' : 'hover:bg-[var(--color-surface)]/80'
        } ${isLowBattery ? 'ring-2 ring-red-500' : ''}`}
        style={{
          borderLeft: `4px solid ${person.color}`
        }}
        onClick={handleClick}
      >
        {isMoving && (
          <div className="absolute top-1 right-1">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
          </div>
        )}
        <div className="relative">
          <AvatarPhoto
            entityPicture={person.entityPicture}
            fallbackInitial={person.avatarFallback}
            color={person.color}
            size={32}
          />
          {isCharging && (
            <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-0.5">
              <Zap size={8} className="text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-[var(--color-text)]">{person.label}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">
            {person.state === 'home' ? '🏠' : person.batteryLevel ? `${person.batteryLevel}%` : '--'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-[var(--color-surface)] rounded-lg p-3 cursor-pointer transition-all relative ${
        isSelected ? 'ring-2 ring-[var(--color-primary)]' : 'hover:bg-[var(--color-surface)]/80'
      } ${isLowBattery ? 'ring-2 ring-red-500' : ''}`}
      style={{
        borderLeft: `4px solid ${person.color}`
      }}
      onClick={handleClick}
    >
      {/* Movement pulse indicator */}
      {isMoving && (
        <div className="absolute top-2 right-2">
          <div className="relative">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping absolute"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      )}

      {/* Header: Avatar + Name + Zone */}
      <div className="flex items-center gap-2 mb-2">
        <div className="relative">
          <AvatarPhoto
            entityPicture={person.entityPicture}
            fallbackInitial={person.avatarFallback}
            color={person.color}
            size={48}
          />
          {isCharging && (
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
              <Zap size={12} className="text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-[var(--color-text)] mb-0.5">{person.label}</h3>
          <ZoneBadge zone={person.state} />
        </div>
      </div>

      {/* Battery */}
      <div className="mb-2">
        <BatteryIndicator level={person.batteryLevel} state={person.batteryState} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-1.5 text-xs text-[var(--color-text-secondary)] mb-2">
        {/* Steps */}
        {person.steps !== null && person.steps !== undefined && (
          <div className="flex items-center gap-1">
            <Footprints size={12} />
            <span>{person.steps.toLocaleString()}</span>
          </div>
        )}

        {/* Distance traveled */}
        {person.distance && (
          <div className="flex items-center gap-1">
            <MapPin size={12} />
            <span>{person.distance}</span>
          </div>
        )}

        {/* Activity status */}
        {person.activity && (
          <div className="flex items-center gap-1">
            {person.activity.toLowerCase() === 'automotive' ? <Car size={12} /> : <User size={12} />}
            <span className="capitalize">{person.activity}</span>
          </div>
        )}

        {/* Connection type */}
        {person.connectionType && (
          <div className="flex items-center gap-1">
            <Signal size={12} />
            <span>{person.connectionType}</span>
          </div>
        )}

        {/* Home WiFi indicator */}
        {isHomeWifi && (
          <div className="flex items-center gap-1 text-green-400">
            <Wifi size={12} />
            <span>Home WiFi</span>
          </div>
        )}

        {/* Focus mode */}
        {person.focus && (
          <div className="flex items-center gap-1 text-purple-400">
            <Moon size={12} />
            <span>Focus</span>
          </div>
        )}

        {/* Time at location */}
        {timeAtLocation && (
          <div className="flex items-center gap-1">
            <Timer size={12} />
            <span>Here {timeAtLocation}</span>
          </div>
        )}

        {/* Distance from home */}
        {distanceFromHome && (
          <div className="flex items-center gap-1 text-amber-400">
            <MapPin size={12} />
            <span>{distanceFromHome}</span>
          </div>
        )}
      </div>

      {/* Geocoded Location (when away) */}
      {showGeocodedLocation && (
        <div className="text-xs text-[var(--color-text-secondary)] mb-1 truncate">
          📍 {person.geocodedLocation}
        </div>
      )}

      {/* Last Changed */}
      {lastChangedText && (
        <div className="text-xs text-[var(--color-text-secondary)] opacity-70">
          Updated {lastChangedText}
        </div>
      )}
    </div>
  );
}
