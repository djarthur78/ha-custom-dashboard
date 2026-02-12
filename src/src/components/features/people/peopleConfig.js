/**
 * People & Location Dashboard Configuration
 */

export const FAMILY_MEMBERS = [
  {
    id: 'daz',
    personEntity: 'person.darren',
    label: 'Daz',
    sensorPrefix: 'darrens_iphone',
    color: '#3b82f6', // blue
    avatarFallback: 'D'
  },
  {
    id: 'nic',
    personEntity: 'person.nic',
    label: 'Nic',
    sensorPrefix: 'nicholas_iphone_2',
    color: '#ec4899', // pink
    avatarFallback: 'N'
  },
  {
    id: 'dex',
    personEntity: 'person.dex',
    label: 'Dex',
    sensorPrefix: 'dexters_iphone',
    color: '#10b981', // emerald
    avatarFallback: 'D'
  },
  {
    id: 'cerys',
    personEntity: 'person.cerys',
    label: 'Cerys',
    sensorPrefix: 'ceryss_iphone',
    color: '#f59e0b', // amber
    avatarFallback: 'C'
  }
];

export const ZONES = [
  {
    entityId: 'zone.home',
    label: 'Home',
    color: '#10b981', // green
    icon: 'Home',
    latitude: 51.619455,
    longitude: 0.520416,
    radius: 33
  },
  {
    entityId: 'zone.school',
    label: 'School',
    color: '#3b82f6', // blue
    icon: 'GraduationCap',
    latitude: 51.613060,
    longitude: 0.541065,
    radius: 141
  },
  {
    entityId: 'zone.ec3a',
    label: 'Work',
    color: '#f97316', // orange
    icon: 'Briefcase',
    latitude: 51.514460,
    longitude: -0.080331,
    radius: 30
  }
];

export const ZONE_BADGE_COLORS = {
  home: 'bg-green-500/20 text-green-400 border-green-500/40',
  school: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  ec3a: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  not_home: 'bg-red-500/20 text-red-400 border-red-500/40'
};

export const ZONE_LABELS = {
  home: 'Home',
  school: 'School',
  ec3a: 'Work',
  not_home: 'Away'
};

export const PHONE_SENSORS = [
  'battery_level',
  'battery_state',
  'steps',
  'distance',
  'activity',
  'ssid',
  'connection_type',
  'geocoded_location'
];

/**
 * Helper to construct sensor entity ID
 */
export function getSensorId(prefix, type) {
  if (type === 'focus') {
    return `binary_sensor.${prefix}_focus`;
  }
  return `sensor.${prefix}_${type}`;
}

// Map configuration
export const MAP_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
export const MAP_DEFAULT_ZOOM = 15;
export const MAP_MAX_ZOOM = 18;
export const MAP_FIT_PADDING = [50, 50];
