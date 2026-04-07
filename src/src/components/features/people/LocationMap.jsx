import { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getHAConfig } from '../../../utils/ha-config';
import {
  ZONES,
  MAP_TILE_URL,
  MAP_ATTRIBUTION,
  MAP_DEFAULT_ZOOM,
  MAP_MAX_ZOOM,
  MAP_FIT_PADDING
} from './peopleConfig';

/**
 * Create custom avatar icon for map markers
 */
function createAvatarIcon(person) {
  const size = 44;

  // Build HTML for marker
  let html = '';

  if (person.entityPicture) {
    const imageUrl = `${getHAConfig({ useProxy: true }).url}${person.entityPicture}`;
    html = `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-image: url('${imageUrl}');
        background-size: cover;
        background-position: center;
        border: 3px solid ${person.color};
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      "></div>
    `;
  } else {
    // Fallback to initials
    html = `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${person.color};
        border: 3px solid ${person.color};
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: ${size * 0.4}px;
      ">${person.avatarFallback}</div>
    `;
  }

  return L.divIcon({
    html,
    className: 'custom-avatar-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

/**
 * Component to auto-fit map bounds and center on selected person
 */
function MapBoundsUpdater({ people, selectedPersonId }) {
  const map = useMap();

  useEffect(() => {
    // If a person is selected, center on them
    if (selectedPersonId) {
      const person = people.find(p => p.id === selectedPersonId);
      if (person && person.latitude && person.longitude) {
        map.setView([person.latitude, person.longitude], 15, {
          animate: true,
          duration: 0.5
        });
        return;
      }
    }

    // Otherwise, fit all markers with smart centering
    const peopleBounds = [];
    people.forEach(person => {
      if (person.latitude && person.longitude) {
        peopleBounds.push([person.latitude, person.longitude]);
      }
    });

    if (peopleBounds.length === 0) {
      // No people with coords - just show zones
      const zoneBounds = ZONES.map(z => [z.latitude, z.longitude]);
      if (zoneBounds.length > 0) {
        map.fitBounds(zoneBounds, { padding: MAP_FIT_PADDING, maxZoom: 16 });
      }
      return;
    }

    // Calculate spread in km
    let maxSpreadKm = 0;
    if (peopleBounds.length > 1) {
      for (let i = 0; i < peopleBounds.length; i++) {
        for (let j = i + 1; j < peopleBounds.length; j++) {
          const R = 6371; // Earth radius in km
          const dLat = (peopleBounds[j][0] - peopleBounds[i][0]) * Math.PI / 180;
          const dLon = (peopleBounds[j][1] - peopleBounds[i][1]) * Math.PI / 180;
          const a = Math.sin(dLat/2) ** 2 + Math.cos(peopleBounds[i][0] * Math.PI / 180)
            * Math.cos(peopleBounds[j][0] * Math.PI / 180) * Math.sin(dLon/2) ** 2;
          const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          if (dist > maxSpreadKm) maxSpreadKm = dist;
        }
      }
    }

    // Calculate centroid
    const centroid = peopleBounds.reduce(
      (acc, [lat, lon]) => [acc[0] + lat / peopleBounds.length, acc[1] + lon / peopleBounds.length],
      [0, 0]
    );

    // Always fitBounds to show all people — zooms to street level when close,
    // zooms out when spread across cities
    if (peopleBounds.length === 1) {
      // Single person: center on them at street level
      map.setView(peopleBounds[0], 16, { animate: true, duration: 0.5 });
    } else {
      // Multiple people: fit all in view with appropriate padding
      const padding = maxSpreadKm > 50 ? [80, 80] : [60, 60];
      map.fitBounds(peopleBounds, { padding, maxZoom: 17 });
    }
  }, [people, selectedPersonId, map]);

  return null;
}

/**
 * Location Map Component
 * Shows dark Leaflet map with zone circles and person markers
 */
export function LocationMap({ people, selectedPersonId, showZones = true }) {
  // Default center to Home zone
  const homeZone = ZONES.find(z => z.entityId === 'zone.home');
  const center = [homeZone?.latitude || 51.619455, homeZone?.longitude || 0.520416];

  return (
    <MapContainer
      center={center}
      zoom={MAP_DEFAULT_ZOOM}
      zoomControl={false}
      attributionControl={false}
      style={{ width: '100%', height: '100%' }}
      className="rounded-xl"
    >
      {/* Dark tile layer */}
      <TileLayer
        url={MAP_TILE_URL}
        attribution={MAP_ATTRIBUTION}
        maxZoom={MAP_MAX_ZOOM}
      />

      {/* Zone circles - only show if enabled */}
      {showZones && ZONES.map(zone => (
        <Circle
          key={zone.entityId}
          center={[zone.latitude, zone.longitude]}
          radius={zone.radius}
          pathOptions={{
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: 0.2,
            weight: 3,
            dashArray: '10, 10',
            opacity: 0.8
          }}
        >
          {/* Zone tooltip */}
          <circle
            className="zone-tooltip"
            title={zone.label}
          />
        </Circle>
      ))}

      {/* Person markers with GPS accuracy circles */}
      {people.map(person => {
        if (!person.latitude || !person.longitude) return null;

        const position = [person.latitude, person.longitude];
        const isSelected = person.id === selectedPersonId;

        return (
          <div key={person.id}>
            {/* GPS accuracy circle */}
            {person.gpsAccuracy && (
              <Circle
                center={position}
                radius={person.gpsAccuracy}
                pathOptions={{
                  color: person.color,
                  fillColor: person.color,
                  fillOpacity: 0.08,
                  weight: 1,
                  opacity: 0.4
                }}
              />
            )}

            {/* Person marker */}
            <Marker
              position={position}
              icon={createAvatarIcon(person)}
              zIndexOffset={isSelected ? 1000 : 0}
            />
          </div>
        );
      })}

      {/* Auto-fit bounds and center on selection */}
      <MapBoundsUpdater people={people} selectedPersonId={selectedPersonId} />
    </MapContainer>
  );
}
