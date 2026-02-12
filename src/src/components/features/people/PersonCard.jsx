import { Footprints, Wifi, Moon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AvatarPhoto } from './AvatarPhoto';
import { ZoneBadge } from './ZoneBadge';
import { BatteryIndicator } from './BatteryIndicator';

/**
 * Person Card Component
 * Shows person info with avatar, zone, battery, and optional stats
 */
export function PersonCard({ person, isSelected, onSelect }) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(person.id);
    }
  };

  const isAway = person.state !== 'home';
  const showGeocodedLocation = isAway && person.geocodedLocation;

  // Parse last changed
  let lastChangedText = '';
  if (person.lastChanged) {
    try {
      lastChangedText = formatDistanceToNow(new Date(person.lastChanged), { addSuffix: true });
    } catch (e) {
      lastChangedText = '';
    }
  }

  // Check if connected to home WiFi (contains "arthur" in SSID)
  const isHomeWifi = person.ssid && person.ssid.toLowerCase().includes('arthur');

  return (
    <div
      className={`bg-[var(--color-surface)] rounded-lg p-4 cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-[var(--color-primary)]' : 'hover:bg-[var(--color-surface)]/80'
      }`}
      style={{
        borderLeft: `4px solid ${person.color}`
      }}
      onClick={handleClick}
    >
      {/* Header: Avatar + Name + Zone */}
      <div className="flex items-center gap-3 mb-3">
        <AvatarPhoto
          entityPicture={person.entityPicture}
          fallbackInitial={person.avatarFallback}
          color={person.color}
          size={56}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">{person.label}</h3>
          <ZoneBadge zone={person.state} />
        </div>
      </div>

      {/* Battery */}
      <div className="mb-2">
        <BatteryIndicator level={person.batteryLevel} state={person.batteryState} />
      </div>

      {/* Optional Stats Row */}
      <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)] mb-2">
        {/* Steps */}
        {person.steps !== null && person.steps !== undefined && (
          <div className="flex items-center gap-1">
            <Footprints size={14} />
            <span>{person.steps.toLocaleString()}</span>
          </div>
        )}

        {/* Home WiFi indicator */}
        {isHomeWifi && (
          <div className="flex items-center gap-1 text-green-400">
            <Wifi size={14} />
            <span>Home WiFi</span>
          </div>
        )}

        {/* Focus mode */}
        {person.focus && (
          <div className="flex items-center gap-1 text-purple-400">
            <Moon size={14} />
            <span>Focus</span>
          </div>
        )}
      </div>

      {/* Geocoded Location (when away) */}
      {showGeocodedLocation && (
        <div className="text-sm text-[var(--color-text-secondary)] mb-2 truncate">
          {person.geocodedLocation}
        </div>
      )}

      {/* Last Changed */}
      {lastChangedText && (
        <div className="text-xs text-[var(--color-text-secondary)]">
          Updated {lastChangedText}
        </div>
      )}
    </div>
  );
}
