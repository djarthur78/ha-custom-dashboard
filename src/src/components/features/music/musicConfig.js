/**
 * Music Dashboard Configuration
 * All entity IDs, speaker definitions, Spotify accounts, and constants.
 */

// ─── SONOS SPEAKERS ──────────────────────────────────────────────────────────
// These are the 11 active Sonos media_player entities.
// Each has supported_features: 4127295 (full control).
// The `zone` field is used to visually group speakers in the UI.

export const SONOS_SPEAKERS = [
  { entityId: 'media_player.bedroom',            label: 'Bedroom',      zone: 'upstairs' },
  { entityId: 'media_player.cerys_bedroom',      label: 'Cerys Room',   zone: 'upstairs' },
  { entityId: 'media_player.dexter_bedroom',     label: 'Dexters Room', zone: 'upstairs' },
  { entityId: 'media_player.office',             label: 'Office',       zone: 'downstairs' },
  { entityId: 'media_player.kitchen',            label: 'Kitchen',      zone: 'downstairs' },
  { entityId: 'media_player.dining_room',        label: 'Dining Room',  zone: 'downstairs' },
  { entityId: 'media_player.living_room',        label: 'Living Room',  zone: 'downstairs' },
  { entityId: 'media_player.games_room',         label: 'Games Room',   zone: 'downstairs' },
  { entityId: 'media_player.gym',                label: 'Gym',          zone: 'downstairs' },
  { entityId: 'media_player.garden',             label: 'Garden',       zone: 'outside' },
  { entityId: 'media_player.games_room_outside', label: 'GR Outside',   zone: 'outside' },
];

// ─── PRESET GROUPS ───────────────────────────────────────────────────────────
// Quick-access speaker groupings for common scenarios.
// The first entityId in members array becomes the coordinator.

export const PRESET_GROUPS = [
  {
    id: 'summer',
    label: 'Summer',
    description: 'Kitchen + Garden',
    color: { from: '#10b981', to: '#059669' }, // Green gradient (emerald)
    members: [
      'media_player.kitchen',    // Coordinator
      'media_player.garden',
    ],
  },
  {
    id: 'indoor-party',
    label: 'Indoor House Party',
    description: 'Kitchen, Dining, Living',
    color: { from: '#f97316', to: '#ea580c' }, // Orange gradient (party vibes)
    members: [
      'media_player.kitchen',      // Coordinator
      'media_player.dining_room',
      'media_player.living_room',
    ],
  },
];

// ─── SPOTIFY ACCOUNTS ────────────────────────────────────────────────────────
// browse_media is called on these entity IDs to list playlists.
// Set entityId to null if the account isn't installed yet.

export const SPOTIFY_ACCOUNTS = [
  {
    id: 'daz',
    label: "Daz",
    entityId: 'media_player.spotify_djarthur78',
  },
  {
    id: 'nic',
    label: "Nic",
    entityId: null, // TODO: Update when Nic's Spotify integration is added to HA
  },
];

// ─── FAVORITE PLAYLISTS ──────────────────────────────────────────────────────
// Hardcoded quick-access playlists for each Spotify account.
// These are displayed directly when a tab is opened (no browsing required).
//
// HOW TO GET SPOTIFY PLAYLIST URIs:
// 1. Open Spotify → Right-click playlist → Share → Copy Spotify URI
// 2. URI format: spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
// 3. Or from Spotify web: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
//    → Convert to: spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
//
// IMPORTANT - LIKED SONGS:
// ⚠️ Liked Songs doesn't have a standard URI that works with HA's Spotify integration.
// ⚠️ You must use the media browser or create a real playlist of your liked songs.
// ⚠️ Alternatively, browse to "Liked Songs" using "Browse All" button.
//
// See README.md in this folder for detailed instructions.

export const FAVORITE_PLAYLISTS = {
  daz: [
    // Example: Replace these with your actual Spotify playlist URIs
    {
      name: 'Hip Hop Collector',
      uri: 'spotify:playlist:YOUR_PLAYLIST_ID', // TODO: Replace with your actual playlist URI
      thumbnail: null,
      description: 'Hip hop collection',
    },
    {
      name: 'Underground Classics',
      uri: 'spotify:playlist:YOUR_PLAYLIST_ID', // TODO: Replace with your actual playlist URI
      thumbnail: null,
      description: 'Underground classics',
    },
    // Add more playlists here as needed
  ],
  nic: [
    // TODO: Add Nic's favorite playlists when Spotify integration is connected
  ],
};

// ─── MEDIA PLAYER FEATURE BITMASKS ───────────────────────────────────────────
// Used to check if a speaker supports a specific feature.
// Usage: const canPause = (supportedFeatures & SUPPORT_PAUSE) !== 0;

export const SUPPORT_PAUSE          = 1;
export const SUPPORT_SEEK           = 2;
export const SUPPORT_VOLUME_SET     = 4;
export const SUPPORT_VOLUME_MUTE    = 8;
export const SUPPORT_PREVIOUS_TRACK = 16;
export const SUPPORT_NEXT_TRACK     = 32;
export const SUPPORT_SHUFFLE_SET    = 256;
export const SUPPORT_REPEAT_SET     = 512;
export const SUPPORT_BROWSE_MEDIA   = 2048;
export const SUPPORT_STOP           = 4096;
export const SUPPORT_PLAY           = 16384;
export const SUPPORT_PLAY_MEDIA     = 131072;
export const SUPPORT_GROUPING       = 524288;

// ─── ZONE DEFINITIONS ────────────────────────────────────────────────────────
// Used to group speakers visually in the SpeakerPanel.

export const ZONES = {
  upstairs:   { label: 'Upstairs',   color: '#7c3aed' },
  downstairs: { label: 'Downstairs', color: '#0ea5e9' },
  outside:    { label: 'Outside',    color: '#16a34a' },
};

// ─── VOLUME DEBOUNCE ─────────────────────────────────────────────────────────
export const VOLUME_DEBOUNCE_MS = 200;
