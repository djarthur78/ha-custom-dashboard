/**
 * Games Room Configuration
 * All entity IDs, scene definitions, and constants for the Games Room dashboard.
 */

// ─── SCENE BUTTONS ────────────────────────────────────────────────────────────

export const SCENES = [
  {
    id: 'movie',
    label: 'Movie',
    icon: 'Clapperboard',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    action: {
      domain: 'automation',
      service: 'trigger',
      data: { entity_id: 'automation.setup_games_room_for_movie' },
    },
    activeWhen: ['Kodi Movies'],
  },
  {
    id: 'skytv',
    label: 'Sky TV',
    icon: 'Satellite',
    color: '#0ea5e9',
    bgColor: '#e0f2fe',
    action: {
      domain: 'select',
      service: 'select_option',
      data: { entity_id: 'select.games_room_harmony_activities', option: 'SkyQ' },
    },
    activeWhen: ['SkyQ'],
  },
  {
    id: 'netflix',
    label: 'Netflix',
    icon: 'MonitorPlay',
    color: '#dc2626',
    bgColor: '#fee2e2',
    action: {
      domain: 'select',
      service: 'select_option',
      data: { entity_id: 'select.games_room_harmony_activities', option: 'Netflix Amazon' },
    },
    activeWhen: ['Netflix Amazon'],
  },
  {
    id: 'sonos',
    label: 'Sonos',
    icon: 'Music',
    color: '#16a34a',
    bgColor: '#dcfce7',
    action: {
      domain: 'automation',
      service: 'trigger',
      data: { entity_id: 'automation.setup_games_room_for_sonos' },
    },
    activeWhen: ['Listen to Sonos Inside'],
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
    activeWhen: ['power_off'],
  },
];

// ─── HARMONY ACTIVITY ─────────────────────────────────────────────────────────

export const HARMONY_ACTIVITY_ENTITY = 'select.games_room_harmony_activities';

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
    label: 'Outdoor',
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
