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
 * Component to auto-fit map bounds
 */
function MapBoundsUpdater({ people }) {
  const map = useMap();

  useEffect(() => {
    const bounds = [];

    // Add people positions
    people.forEach(person => {
      if (person.latitude && person.longitude) {
        bounds.push([person.latitude, person.longitude]);
      }
    });

    // Add zone centers
    ZONES.forEach(zone => {
      bounds.push([zone.latitude, zone.longitude]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, {
        padding: MAP_FIT_PADDING,
        maxZoom: 16
      });
    }
  }, [people, map]);

  return null;
}

/**
 * Location Map Component
 * Shows dark Leaflet map with zone circles and person markers
 */
export function LocationMap({ people, selectedPersonId }) {
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

      {/* Zone circles */}
      {ZONES.map(zone => (
        <Circle
          key={zone.entityId}
          center={[zone.latitude, zone.longitude]}
          radius={zone.radius}
          pathOptions={{
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '5, 5'
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

      {/* Auto-fit bounds */}
      <MapBoundsUpdater people={people} />
    </MapContainer>
  );
}
