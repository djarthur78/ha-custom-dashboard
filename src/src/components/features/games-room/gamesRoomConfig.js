/**
 * Games Room Configuration
 * All entity IDs, scene definitions, and constants for the Games Room dashboard.
 */

// ─── SCENE BUTTONS ────────────────────────────────────────────────────────────

export const SCENES = [
  {
    id: 'movie',
    label: 'Movies',
    icon: 'Clapperboard',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    activity: 'Watch Movie',
    activeWhen: ['Watch Movie'],
  },
  {
    id: 'skytv',
    label: 'Sky TV',
    icon: 'Satellite',
    color: '#0ea5e9',
    bgColor: '#e0f2fe',
    activity: 'Watch Sky',
    activeWhen: ['Watch Sky'],
  },
  {
    id: 'netflix',
    label: 'Netflix',
    icon: 'MonitorPlay',
    color: '#dc2626',
    bgColor: '#fee2e2',
    activity: 'Watch Netflix / Amazon',
    activeWhen: ['Watch Netflix / Amazon'],
  },
  {
    id: 'sonos',
    label: 'Sonos',
    icon: 'Music',
    color: '#16a34a',
    bgColor: '#dcfce7',
    activity: 'Listen to SONOS',
    activeWhen: ['Listen to SONOS'],
  },
  {
    id: 'ps5',
    label: 'PS5',
    icon: 'Gamepad2',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    activity: 'PlayStation 5',
    activeWhen: ['PlayStation 5'],
    action: {
      domain: 'script',
      service: 'games_room_prepare_source',
      data: { source: 'PlayStation 5' },
    },
  },
  {
    id: 'alloff',
    label: 'All Off',
    icon: 'PowerOff',
    color: '#ef4444',
    bgColor: '#fef2f2',
    action: {
      domain: 'automation',
      service: 'trigger',
      data: { entity_id: 'automation.turn_off_games_room' },
    },
    activeWhen: ['Powered Off'],
  },
];

// ─── SOFABATON ACTIVITY ───────────────────────────────────────────────────────

export const SOFABATON_ACTIVITY_ENTITY = 'select.192_168_1_230_activity';

export const GAMES_ROOM_COMMON_POWER = [
  'switch.gr_avr',
  'switch.gr_subwoofer',
  'switch.lounge_subwoofer',
  'switch.christmas_front_left',
  'switch.unnamed_p304m_smart_plug_2',
  'switch.unnamed_p304m_games_room_sonos_port',
  'switch.sky_games_room',
];

export const GAMES_ROOM_ACTIVITY_LIGHTS = [
  'switch.iport_area_2',
  'switch.iport_area_3',
];

export const SUN_ENTITY = 'sun.sun';

// ─── MEDIA PLAYERS ────────────────────────────────────────────────────────────

export const MEDIA_PLAYERS = [
  { id: 'media_player.osmc_mediaroom', label: 'Kodi',  icon: 'Film',  priority: 1 },
  { id: 'media_player.games_room',     label: 'Sonos', icon: 'Music', priority: 2 },
  { id: 'media_player.games_room_tv',  label: 'TV',    icon: 'Tv',    priority: 3 },
];

// ─── CLIMATE ──────────────────────────────────────────────────────────────────

export const CLIMATE_ENTITY = 'climate.games_room';
export const FEELS_LIKE_ENTITY = 'sensor.games_room_temperature_feels_like';

// ─── POWER DEVICES (LIGHTS) ───────────────────────────────────────────────────

export const POWER_DEVICES = [
  {
    id: 'cinema',
    label: 'Cinema',
    icon: 'Film',
    switchEntity: 'switch.iport_area_1',
    consumptionEntity: null,
  },
  {
    id: 'pool_table',
    label: 'Pool Table',
    icon: 'Triangle',
    switchEntity: 'switch.iport_area_2',
    consumptionEntity: null,
  },
  {
    id: 'bar',
    label: 'Bar',
    icon: 'Wine',
    switchEntity: 'switch.iport_area_3',
    consumptionEntity: null,
  },
  {
    id: 'outdoor',
    label: 'Garden Lights',
    icon: 'Trees',
    switchEntity: 'switch.iport_area_4',
    consumptionEntity: null,
  },
];

// ─── MEDIA PLAYER FEATURE BITMASKS ───────────────────────────────────────────

export const SUPPORT_PAUSE          = 1;
export const SUPPORT_VOLUME_SET     = 4;
export const SUPPORT_VOLUME_MUTE    = 8;
export const SUPPORT_PREVIOUS_TRACK = 16;
export const SUPPORT_NEXT_TRACK     = 32;
export const SUPPORT_STOP           = 4096;
export const SUPPORT_PLAY           = 16384;
