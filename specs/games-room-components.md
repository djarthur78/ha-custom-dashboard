# Games Room — Component & Hook Implementation Guide

This is the developer reference for building each component and hook. Follow these exactly.

---

## PART 1: CONFIG FILE

### `gamesRoomConfig.js`

```javascript
/**
 * Games Room Configuration
 * All entity IDs, scene definitions, and constants for the Games Room dashboard.
 */

// Lucide icon names (import from 'lucide-react')
// Clapperboard, Satellite, MonitorPlay, Music, PowerOff,
// Film, Tv, AudioLines, Speaker, Refrigerator, Cast,
// ThermometerSun, Droplets, Wind, SkipBack, Play, Pause, SkipForward, Volume2, VolumeX

// ─── SCENE BUTTONS ────────────────────────────────────────────────────────────

export const SCENES = [
  {
    id: 'movie',
    label: 'Movie',
    icon: 'Clapperboard',        // Lucide icon component name
    color: '#7c3aed',            // Purple (active bg + text)
    bgColor: '#ede9fe',          // Light purple (inactive bg)
    action: {
      domain: 'automation',
      service: 'trigger',
      data: { entity_id: 'automation.setup_games_room_for_movie' },
    },
    activeWhen: ['Kodi Movies'],  // Harmony activity values that mean this scene is active
  },
  {
    id: 'skytv',
    label: 'Sky TV',
    icon: 'Satellite',
    color: '#0ea5e9',            // Sky blue
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
    color: '#dc2626',            // Netflix red
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
    color: '#16a34a',            // Green
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
    color: '#ef4444',            // Red
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
// Priority: lower number = shown first when multiple are playing

export const MEDIA_PLAYERS = [
  { id: 'media_player.osmc_mediaroom', label: 'Kodi',  icon: 'Film',  priority: 1 },
  { id: 'media_player.games_room',     label: 'Sonos', icon: 'Music', priority: 2 },
  { id: 'media_player.games_room_tv',  label: 'TV',    icon: 'Tv',    priority: 3 },
];

// ─── CLIMATE ──────────────────────────────────────────────────────────────────

export const CLIMATE_ENTITY = 'climate.games_room';
export const FEELS_LIKE_ENTITY = 'sensor.games_room_temperature_feels_like';

// ─── POWER DEVICES ────────────────────────────────────────────────────────────

export const POWER_DEVICES = [
  {
    id: 'sonos_port',
    label: 'Sonos Port',
    icon: 'AudioLines',
    switchEntity: 'switch.unnamed_p304m_games_room_kodi',
    consumptionEntity: 'sensor.unnamed_p304m_games_room_kodi_current_consumption',
  },
  {
    id: 'kodi',
    label: 'Kodi',
    icon: 'MonitorPlay',
    switchEntity: 'switch.unnamed_p304m_smart_plug_2',
    consumptionEntity: 'sensor.unnamed_p304m_smart_plug_2_current_consumption',
  },
  {
    id: 'sonos_amp',
    label: 'Sonos AMP',
    icon: 'Speaker',
    switchEntity: 'switch.unnamed_p304m_games_room_sonos_amp',
    consumptionEntity: 'sensor.unnamed_p304m_games_room_sonos_amp_current_consumption',
  },
  {
    id: 'fridge',
    label: 'Fridge',
    icon: 'Refrigerator',
    switchEntity: 'switch.games_room_fridge',
    consumptionEntity: 'sensor.games_room_fridge_current_consumption',
  },
  {
    id: 'chromecast',
    label: 'Chromecast',
    icon: 'Cast',
    switchEntity: 'switch.symphony',
    consumptionEntity: null,
  },
  {
    id: 'sky',
    label: 'Sky',
    icon: 'Satellite',
    switchEntity: 'switch.sky_games_room',
    consumptionEntity: null,
  },
];

// ─── MEDIA PLAYER FEATURE BITMASKS ───────────────────────────────────────────
// Used to check what controls a media player supports

export const SUPPORT_PAUSE          = 1;
export const SUPPORT_VOLUME_SET     = 4;
export const SUPPORT_VOLUME_MUTE    = 8;
export const SUPPORT_PREVIOUS_TRACK = 16;
export const SUPPORT_NEXT_TRACK     = 32;
export const SUPPORT_STOP           = 4096;
export const SUPPORT_PLAY           = 16384;
```

---

## PART 2: HOOKS

### `hooks/useHarmonyActivity.js`

**Purpose:** Subscribe to the Harmony activity entity to know which scene is active.

```javascript
/**
 * useHarmonyActivity Hook
 * Subscribes to the Harmony Hub activity selector to determine current room mode.
 *
 * Returns:
 *   currentActivity - string like 'power_off', 'SkyQ', 'Kodi Movies', etc.
 *   options         - array of all available activities
 *   loading         - boolean
 *   error           - string or null
 */

import { useEntity } from '../../../../hooks/useEntity';
import { HARMONY_ACTIVITY_ENTITY } from '../gamesRoomConfig';

export function useHarmonyActivity() {
  const { state, attributes, loading, error } = useEntity(HARMONY_ACTIVITY_ENTITY);

  return {
    currentActivity: state || 'power_off',
    options: attributes?.options || [],
    loading,
    error,
  };
}
```

---

### `hooks/useClimate.js`

**Purpose:** Climate entity + feels-like sensor. Provides current/target temp, on/off state, and bounds.

```javascript
/**
 * useClimate Hook
 * Subscribes to climate.games_room and the feels-like temperature sensor.
 *
 * Returns:
 *   state       - 'heat', 'cool', 'off', 'dry', 'fan_only', 'heat_cool'
 *   isOn        - boolean (state !== 'off')
 *   currentTemp - number (e.g., 20.3)
 *   targetTemp  - number (e.g., 25)
 *   humidity    - number (e.g., 59.8)
 *   feelsLike   - number (e.g., 20.3) from separate sensor
 *   fanMode     - string (e.g., 'high')
 *   hvacModes   - string[] available modes
 *   fanModes    - string[] available fan modes
 *   minTemp     - number (10)
 *   maxTemp     - number (32)
 *   tempStep    - number (1)
 *   loading     - boolean
 *   error       - string or null
 */

import { useEntity } from '../../../../hooks/useEntity';
import { CLIMATE_ENTITY, FEELS_LIKE_ENTITY } from '../gamesRoomConfig';

export function useClimate() {
  const climate = useEntity(CLIMATE_ENTITY);
  const feelsLikeSensor = useEntity(FEELS_LIKE_ENTITY);

  return {
    state: climate.state,
    isOn: climate.state !== 'off' && climate.state !== 'unavailable',
    currentTemp: climate.attributes?.current_temperature,
    targetTemp: climate.attributes?.temperature,
    humidity: climate.attributes?.current_humidity,
    feelsLike: feelsLikeSensor.state ? parseFloat(feelsLikeSensor.state) : null,
    fanMode: climate.attributes?.fan_mode,
    hvacModes: climate.attributes?.hvac_modes || [],
    fanModes: climate.attributes?.fan_modes || [],
    minTemp: climate.attributes?.min_temp || 10,
    maxTemp: climate.attributes?.max_temp || 32,
    tempStep: climate.attributes?.target_temp_step || 1,
    loading: climate.loading,
    error: climate.error,
  };
}
```

---

### `hooks/useMediaPlayers.js`

**Purpose:** Subscribe to all 3 media players, determine which one is "active" (playing/paused), return its metadata for the Now Playing display.

```javascript
/**
 * useMediaPlayers Hook
 * Subscribes to Kodi, Sonos, and TV media players.
 * Determines the "active" player (playing > paused > idle).
 *
 * Returns:
 *   activePlayer   - config object from MEDIA_PLAYERS, or null if nothing playing
 *   activeEntity   - { state, attributes, ... } from useEntity for the active player
 *   isPlaying      - boolean: at least one player is playing
 *   isPaused       - boolean: active player is paused (not playing)
 *   mediaTitle     - string or null
 *   mediaArtist    - string or null
 *   entityPicture  - string URL or null (album art / movie poster)
 *   volumeLevel    - number 0-1 or null
 *   isVolumeMuted  - boolean
 *   supportedFeatures - number bitmask
 *   loading        - boolean
 */

import { useEntity } from '../../../../hooks/useEntity';
import { MEDIA_PLAYERS } from '../gamesRoomConfig';

export function useMediaPlayers() {
  // IMPORTANT: hooks must be called unconditionally, so call all 3 always
  const kodi  = useEntity(MEDIA_PLAYERS[0].id);  // media_player.osmc_mediaroom
  const sonos = useEntity(MEDIA_PLAYERS[1].id);  // media_player.games_room
  const tv    = useEntity(MEDIA_PLAYERS[2].id);  // media_player.games_room_tv

  const players = [
    { config: MEDIA_PLAYERS[0], entity: kodi },
    { config: MEDIA_PLAYERS[1], entity: sonos },
    { config: MEDIA_PLAYERS[2], entity: tv },
  ];

  // Find the active player: prefer "playing" over "paused" over nothing
  // Sort by priority (lower = higher priority)
  const playing = players
    .filter(p => p.entity.state === 'playing')
    .sort((a, b) => a.config.priority - b.config.priority);

  const paused = players
    .filter(p => p.entity.state === 'paused')
    .sort((a, b) => a.config.priority - b.config.priority);

  const active = playing[0] || paused[0] || null;

  return {
    activePlayer: active?.config || null,
    activeEntity: active?.entity || null,
    isPlaying: playing.length > 0,
    isPaused: !playing.length && paused.length > 0,
    mediaTitle: active?.entity?.attributes?.media_title || null,
    mediaArtist: active?.entity?.attributes?.media_artist || active?.entity?.attributes?.media_series_title || null,
    entityPicture: active?.entity?.attributes?.entity_picture || null,
    volumeLevel: active?.entity?.attributes?.volume_level ?? null,
    isVolumeMuted: active?.entity?.attributes?.is_volume_muted || false,
    supportedFeatures: active?.entity?.attributes?.supported_features || 0,
    loading: kodi.loading || sonos.loading || tv.loading,
  };
}
```

---

### `hooks/usePowerDevices.js`

**Purpose:** Subscribe to all 6 switch entities and their consumption sensors. Returns an array of device objects with current state and wattage.

**Note:** This hook uses `useEntity` for each entity. Since there are 10 entities (6 switches + 4 consumption sensors), call them all at the top level.

```javascript
/**
 * usePowerDevices Hook
 * Subscribes to all 6 games room power switches and their consumption sensors.
 *
 * Returns: Array of device objects:
 *   [{
 *     ...deviceConfig,   // id, label, icon, switchEntity, consumptionEntity
 *     switchState,       // 'on' | 'off' | 'unavailable'
 *     consumption,       // string like '3.5' or null (watts)
 *     loading,           // boolean
 *   }]
 *
 *   totalConsumption - number (sum of all available consumption values)
 */

import { useEntity } from '../../../../hooks/useEntity';
import { POWER_DEVICES } from '../gamesRoomConfig';

export function usePowerDevices() {
  // IMPORTANT: All useEntity calls MUST be at the top level, unconditional.
  // Cannot use .map() or loops for hooks.

  // Switches (6)
  const sw0 = useEntity(POWER_DEVICES[0].switchEntity);
  const sw1 = useEntity(POWER_DEVICES[1].switchEntity);
  const sw2 = useEntity(POWER_DEVICES[2].switchEntity);
  const sw3 = useEntity(POWER_DEVICES[3].switchEntity);
  const sw4 = useEntity(POWER_DEVICES[4].switchEntity);
  const sw5 = useEntity(POWER_DEVICES[5].switchEntity);

  // Consumption sensors (4 — devices 4 and 5 have null consumptionEntity)
  const con0 = useEntity(POWER_DEVICES[0].consumptionEntity);
  const con1 = useEntity(POWER_DEVICES[1].consumptionEntity);
  const con2 = useEntity(POWER_DEVICES[2].consumptionEntity);
  const con3 = useEntity(POWER_DEVICES[3].consumptionEntity);

  const switches = [sw0, sw1, sw2, sw3, sw4, sw5];
  const consumptions = [con0, con1, con2, con3, null, null];

  const devices = POWER_DEVICES.map((device, i) => ({
    ...device,
    switchState: switches[i].state || 'unavailable',
    consumption: consumptions[i]?.state || null,
    loading: switches[i].loading,
  }));

  const totalConsumption = consumptions
    .filter(c => c && c.state && !isNaN(parseFloat(c.state)))
    .reduce((sum, c) => sum + parseFloat(c.state), 0);

  return { devices, totalConsumption };
}
```

---

## PART 3: COMPONENTS

### `GamesRoomDashboard.jsx` — Main Layout

**Purpose:** Full-width two-row layout. Top = Now Playing hero. Bottom = 3-column controls.

```javascript
/**
 * GamesRoomDashboard
 * Main layout for the Games Room page.
 * Full-width, fills viewport below header. No scrolling.
 */

import { NowPlaying } from './NowPlaying';
import { SceneButtons } from './SceneButtons';
import { ClimateCard } from './ClimateCard';
import { PowerGrid } from './PowerGrid';

export function GamesRoomDashboard() {
  return (
    <div
      className="flex flex-col gap-3 p-3"
      style={{ height: 'calc(100vh - 56px)' }}
    >
      {/* Now Playing — hero, top 55% */}
      <div className="flex-[55] min-h-0">
        <NowPlaying />
      </div>

      {/* Controls — bottom 45%, 3 columns */}
      <div className="flex-[45] min-h-0 grid grid-cols-[30fr_30fr_40fr] gap-3">
        <SceneButtons />
        <ClimateCard />
        <PowerGrid />
      </div>
    </div>
  );
}
```

---

### `NowPlaying.jsx` — Hero Section

**Purpose:** Shows what's currently playing across Kodi/Sonos/TV. Large movie poster or album art. Transport controls and volume.

**Two modes:**

#### Mode 1: Something is playing (or paused)
```
┌────────────────────────────────────────────────────────────────┐
│  ┌─────────────┐                                              │
│  │             │    "The Dark Knight"          [Source: Kodi]  │
│  │  MOVIE      │    Christopher Nolan                         │
│  │  POSTER     │                                              │
│  │  (fills     │     ◄◄     ▶/⏸     ►►                      │
│  │  height)    │                                              │
│  │             │     🔊  ━━━━━━━━━━━━━━━━━━  60%             │
│  └─────────────┘                                              │
└────────────────────────────────────────────────────────────────┘
```

- Album art / movie poster: `entity_picture` attribute → use as `<img src>` (relative URL works through nginx proxy)
- If no `entity_picture`, show a large icon based on `media_content_type` (Film for movies, Music for songs)
- Title: `attributes.media_title`
- Artist: `attributes.media_artist` OR `attributes.media_series_title`
- Source badge: shows which player (Kodi/Sonos/TV) with its icon from config
- Transport controls:
  - Previous: `callService('media_player', 'media_previous_track', { entity_id })`
  - Play/Pause: `callService('media_player', 'media_play_pause', { entity_id })`
  - Next: `callService('media_player', 'media_next_track', { entity_id })`
  - Check `supported_features` bitmask before showing each button
- Volume slider:
  - `<input type="range" min="0" max="1" step="0.01" value={volumeLevel}>`
  - On change: `callService('media_player', 'volume_set', { entity_id, volume_level })`
  - **IMPORTANT:** Debounce volume changes! Use a ref + setTimeout(200ms) to avoid flooding HA
  - Mute toggle: `callService('media_player', 'volume_mute', { entity_id, is_volume_muted: !current })`

#### Mode 2: Nothing playing (idle)
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│         [Large Gamepad2 icon, 80px, muted color]              │
│         "Nothing Playing"                                      │
│         Current mode: Power Off                                │
│         Tap a scene button to get started                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

Shows the current Harmony activity name from `useHarmonyActivity()`.

**Styling:**
- Card: `bg-[var(--color-surface)] rounded-xl h-full`
- When playing: album art on left (aspect-ratio preserved, max-width ~35%), metadata + controls on right
- When idle: centered content, muted text color
- Album art container: `overflow-hidden rounded-lg`, image `object-cover h-full`
- Fallback for broken image: show icon placeholder, use `onError` on `<img>`

**Implementation skeleton:**
```jsx
import { useMediaPlayers } from './hooks/useMediaPlayers';
import { useHarmonyActivity } from './hooks/useHarmonyActivity';
import { useServiceCall } from '../../../hooks/useServiceCall';
import {
  SUPPORT_PAUSE, SUPPORT_PLAY, SUPPORT_NEXT_TRACK,
  SUPPORT_PREVIOUS_TRACK, SUPPORT_VOLUME_SET, SUPPORT_VOLUME_MUTE,
} from './gamesRoomConfig';
import {
  SkipBack, Play, Pause, SkipForward, Volume2, VolumeX, Gamepad2,
  Film, Music, Tv,
} from 'lucide-react';

// Icon map for source badge
const SOURCE_ICONS = { Kodi: Film, Sonos: Music, TV: Tv };
```

---

### `SceneButtons.jsx` — Scene Mode Buttons

**Purpose:** 5 large touch-friendly buttons in a 2x2 grid + full-width "All Off" at bottom.

**Layout:**
```
┌─────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐   │
│  │ 🎬       │  │ 📺       │   │
│  │ Movie    │  │ Sky TV   │   │
│  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐   │
│  │ 🎮       │  │ 🔊       │   │
│  │ Netflix  │  │ Sonos    │   │
│  └──────────┘  └──────────┘   │
│  ┌─────────────────────────┐   │
│  │  ⏻  All Off            │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

**Active state detection:**
- Get `currentActivity` from `useHarmonyActivity()`
- For each scene, check if `scene.activeWhen.includes(currentActivity)`
- Active button: filled with `scene.color`, white text, subtle glow shadow
- Inactive button: `scene.bgColor` background, `scene.color` text/icon

**On click:**
```javascript
const { callService, loading } = useServiceCall();

const handleSceneClick = async (scene) => {
  await callService(scene.action.domain, scene.action.service, scene.action.data);
};
```

**Styling per button:**
```jsx
// Active
style={{
  backgroundColor: scene.color,
  color: 'white',
  boxShadow: `0 0 20px ${scene.color}40`,
}}

// Inactive
style={{
  backgroundColor: scene.bgColor,
  color: scene.color,
}}
```

**Touch targets:** Each button should be at least 80px tall. Use `min-h-[80px]`.

**Implementation skeleton:**
```jsx
import { useHarmonyActivity } from './hooks/useHarmonyActivity';
import { useServiceCall } from '../../../hooks/useServiceCall';
import { SCENES } from './gamesRoomConfig';
import * as LucideIcons from 'lucide-react';

// Dynamic icon lookup
const getIcon = (name) => LucideIcons[name];
```

**IMPORTANT:** The first 4 scenes go in the 2x2 grid, the 5th (All Off) goes full width below. Use:
```jsx
const mainScenes = SCENES.slice(0, 4);  // Movie, Sky TV, Netflix, Sonos
const allOff = SCENES[4];               // All Off
```

---

### `ClimateCard.jsx` — Climate Control

**Purpose:** Temperature display with prominent ON/OFF toggle and +/- controls.

**Layout:**
```
┌─────────────────────────────────┐
│  Climate              [ON|OFF]  │  ← Big toggle, top right
│                                 │
│  🌡 20.3°C                     │  ← Current temp (large)
│  Feels like 20.3°C             │  ← From separate sensor
│                                 │
│  Target                         │
│  [ − ]      25°C      [ + ]   │  ← Large +/- buttons
│                                 │
│  🔥 Heat   💧 59.8%   🌀 High │  ← Mode, humidity, fan
└─────────────────────────────────┘
```

**Service calls:**
```javascript
const { callService } = useServiceCall();
const { state, isOn, currentTemp, targetTemp, ... } = useClimate();

// Toggle ON/OFF
const handleToggle = () => {
  if (isOn) {
    callService('climate', 'turn_off', { entity_id: 'climate.games_room' });
  } else {
    callService('climate', 'turn_on', { entity_id: 'climate.games_room' });
  }
};

// Adjust temperature
const handleTempChange = (delta) => {
  const newTemp = Math.min(maxTemp, Math.max(minTemp, targetTemp + delta));
  callService('climate', 'set_temperature', {
    entity_id: 'climate.games_room',
    temperature: newTemp,
  });
};
```

**ON/OFF toggle styling:**
```jsx
<button
  onClick={handleToggle}
  className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${
    isOn
      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
      : 'bg-gray-200 text-gray-500'
  }`}
>
  {isOn ? 'ON' : 'OFF'}
</button>
```

**+/- buttons:** At least 48px x 48px for wall panel touch targets.

---

### `PowerGrid.jsx` — Power Devices Grid

**Purpose:** 3x2 grid of power device cards, each with a toggle switch and wattage display.

**Layout:**
```
┌─────────────────────────────────────────┐
│  Power Devices           Total: 20.1W  │
│                                         │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐│
│  │🔊 Sonos  │ │🖥 Kodi   │ │🔈 AMP  ││
│  │Port      │ │          │ │         ││
│  │ 3.5W  ●  │ │ 2.4W  ●  │ │ 6.1W  ● ││
│  └──────────┘ └──────────┘ └─────────┘│
│  ┌──────────┐ ┌──────────┐ ┌─────────┐│
│  │🧊 Fridge │ │📺 Chrome │ │📡 Sky  ││
│  │          │ │cast      │ │         ││
│  │ 8.1W  ●  │ │ --   ●   │ │ --   ●  ││
│  └──────────┘ └──────────┘ └─────────┘│
└─────────────────────────────────────────┘
```

**Each device card contains:**
- Icon (Lucide, 20px) + label
- Consumption value (e.g., "3.5W") or "--" if no sensor
- Toggle indicator: green dot when on, gray when off
- **Entire card is clickable** to toggle the device

**On click:**
```javascript
const { toggle } = useServiceCall();
const handleToggle = (device) => {
  toggle(device.switchEntity);
};
```

**Styling per card:**
```jsx
<button
  onClick={() => handleToggle(device)}
  className={`flex flex-col items-center justify-center gap-1 rounded-lg p-2
    transition-all cursor-pointer border
    ${device.switchState === 'on'
      ? 'bg-green-50 border-green-200 text-green-700'
      : 'bg-gray-50 border-gray-200 text-gray-400'
    }`}
>
```

**Total consumption:** Show at the top: `totalConsumption.toFixed(1) + 'W'`

**Use `usePowerDevices()` hook** which returns `{ devices, totalConsumption }`.

**Dynamic icon lookup:**
```jsx
import * as LucideIcons from 'lucide-react';
const Icon = LucideIcons[device.icon];
```

---

## PART 4: PAGE & LAYOUT MODIFICATIONS

### `src/src/pages/GamesRoomPage.jsx` — Replace Placeholder

```javascript
/**
 * GamesRoomPage Component
 * Games room cinema control center
 */

import { GamesRoomDashboard } from '../components/features/games-room/GamesRoomDashboard';

export function GamesRoomPage() {
  return <GamesRoomDashboard />;
}

export default GamesRoomPage;
```

---

### `src/src/components/layout/MainLayout.jsx` — Full Viewport

Add `/games-room` to the full-viewport conditional so it gets no padding and no footer (like cameras page):

**Change this line:**
```javascript
const isCameraPage = location.pathname === '/cameras';
```

**To:**
```javascript
const isFullViewport = ['/cameras', '/games-room'].includes(location.pathname);
```

**Then replace all `isCameraPage` references with `isFullViewport`:**
- `<main className={isFullViewport ? '' : 'mx-auto px-4 py-6'}>`
- `{!isFullViewport && (<footer ...>)}`

---

## PART 5: KEY IMPLEMENTATION NOTES

### 1. Volume Slider Debouncing
The volume slider should update the visual immediately but debounce the HA service call:

```javascript
const volumeTimeoutRef = useRef(null);
const [localVolume, setLocalVolume] = useState(volumeLevel);

// Sync from HA when not dragging
useEffect(() => {
  setLocalVolume(volumeLevel);
}, [volumeLevel]);

const handleVolumeChange = (newVolume) => {
  setLocalVolume(newVolume);  // Immediate visual update

  // Debounce the service call
  clearTimeout(volumeTimeoutRef.current);
  volumeTimeoutRef.current = setTimeout(() => {
    callService('media_player', 'volume_set', {
      entity_id: activePlayer.id,
      volume_level: newVolume,
    });
  }, 200);
};
```

### 2. entity_picture URL
The `entity_picture` attribute returns a path like `/api/media_player_proxy/media_player.osmc_mediaroom?token=xxx&cache=xxx`. This **relative URL works as-is** because:
- In development: Vite proxies `/api` to `http://192.168.1.2:8123`
- In production: nginx proxies `/api` to the HA backend

Just use it directly: `<img src={entityPicture} />`

Add an `onError` handler to show a fallback icon if the image fails to load.

### 3. Supported Features Bitmask
Check if a media player supports a feature before showing its control:

```javascript
const supports = (feature) => (supportedFeatures & feature) !== 0;

// Example: only show Next Track button if supported
{supports(SUPPORT_NEXT_TRACK) && (
  <button onClick={handleNext}><SkipForward /></button>
)}
```

### 4. Import Path Pattern
Hooks within the games-room feature import shared hooks using relative paths:
```javascript
// From hooks/useClimate.js to shared useEntity:
import { useEntity } from '../../../../hooks/useEntity';

// From GamesRoomDashboard.jsx to shared useServiceCall:
import { useServiceCall } from '../../../hooks/useServiceCall';
```

### 5. Lucide Icons Dynamic Import
For components that need icons from config strings:
```javascript
import * as LucideIcons from 'lucide-react';

function DynamicIcon({ name, size = 24, ...props }) {
  const Icon = LucideIcons[name];
  if (!Icon) return null;
  return <Icon size={size} {...props} />;
}
```

### 6. Card Styling Convention
Follow the existing codebase pattern for card components:
```jsx
<div
  className="bg-[var(--color-surface)] rounded-xl h-full"
  style={{
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  }}
>
```

---

## PART 6: TESTING

### Unit Tests (Optional)
If writing tests, follow existing pattern in `src/src/__tests__/`:
```
__tests__/
  games-room/
    useHarmonyActivity.test.js
    useClimate.test.js
    useMediaPlayers.test.js
    usePowerDevices.test.js
```

### Manual Testing Checklist
1. Start dev server: `cd src && npm run dev`
2. Open `http://localhost:5173/games-room`
3. Verify layout fills 1920x1080 (use browser DevTools device toolbar)
4. Check all power device states match HA
5. Toggle a power device → verify state change
6. Tap Movie → verify Harmony activity changes
7. Check climate shows current temp/humidity
8. Tap ON/OFF → verify climate toggles
9. Tap +/- → verify target temp changes
10. If possible, start playing something on Kodi → verify Now Playing shows poster

### Build Check
```bash
cd src && npx vitest run     # All existing tests pass
cd src && npm run build      # No build errors
```
