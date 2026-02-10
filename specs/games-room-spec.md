# Games Room Dashboard — Complete Implementation Spec

## Overview
Build a full-width cinema/entertainment control center for a 1920x1080 wall-mounted touch panel. This replaces the placeholder at `/games-room` route.

**Target:** 1920x1080 display, touch-friendly (min 44px touch targets)
**Stack:** React 19, Tailwind CSS v4, Lucide React icons
**Page fills viewport:** No scrolling, no PageContainer wrapper, no padding/footer

---

## 1. Layout (1920 x ~1030px below header)

```
+==========================================================================+
| HEADER (56px) — already exists, no changes needed                        |
+==========================================================================+
|                                                                          |
| NOW PLAYING — HERO (full width, flex-[55] of remaining height)           |
| ┌──────────────────────────────────────────────────────────────────────┐ |
| │  ┌───────────┐                                                      │ |
| │  │           │   Title: "The Dark Knight"                           │ |
| │  │  MOVIE    │   Artist/Director: "Christopher Nolan"               │ |
| │  │  POSTER   │   Source: Kodi                                       │ |
| │  │  (280px)  │                                                      │ |
| │  │           │   ◄◄    ▶/⏸    ►►                                   │ |
| │  │           │   ━━━━━━━━━━━━━━━━━━ Volume: 60%                    │ |
| │  └───────────┘                                                      │ |
| └──────────────────────────────────────────────────────────────────────┘ |
|                                                                          |
| CONTROLS — 3 columns (full width, flex-[45] of remaining height)         |
| ┌─────────────────────┐ ┌─────────────────┐ ┌────────────────────────┐  |
| │    SCENE BUTTONS     │ │    CLIMATE      │ │    POWER DEVICES       │  |
| │                      │ │                 │ │                        │  |
| │  [Movie ] [Sky TV ] │ │  🌡 20.3°C     │ │  [Sonos Port  3.5W]  │  |
| │  [Netflix] [Sonos ] │ │  Target: 25°C   │ │  [Kodi        2.4W]  │  |
| │                      │ │  [−]  25°  [+] │ │  [Sonos AMP   6.1W]  │  |
| │  [    All Off      ] │ │  💧 59.8%      │ │  [Fridge      8.1W]  │  |
| │                      │ │  [  ON / OFF  ] │ │  [Chromecast   --]   │  |
| └─────────────────────┘ └─────────────────┘ │  [Sky           --]   │  |
|                                              └────────────────────────┘  |
+==========================================================================+
```

**CSS Grid for main layout:**
```jsx
<div className="flex flex-col gap-3 p-3" style={{ height: 'calc(100vh - 56px)' }}>
  {/* Now Playing — top 55% */}
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
```

---

## 2. Files to Create

All under `src/src/components/features/games-room/`:

```
games-room/
├── gamesRoomConfig.js          # Entity IDs, scene definitions, constants
├── GamesRoomDashboard.jsx      # Main two-row full-width layout
├── NowPlaying.jsx              # Hero media display with art + controls
├── SceneButtons.jsx            # 5 scene/mode buttons with active glow
├── ClimateCard.jsx             # Temperature + on/off toggle + controls
├── PowerGrid.jsx               # 6 device cards with toggle + wattage
└── hooks/
    ├── useHarmonyActivity.js   # Current Harmony activity
    ├── useMediaPlayers.js      # 3 media players, pick active one
    ├── useClimate.js           # Climate entity + feels-like sensor
    └── usePowerDevices.js      # 6 switches + 4 consumption sensors
```

**Files to modify:**
1. `src/src/pages/GamesRoomPage.jsx` — Replace placeholder with `<GamesRoomDashboard />`
2. `src/src/components/layout/MainLayout.jsx` — Add `/games-room` to full-viewport conditional

---

## 3. Entity Reference (verified live 2026-02-08)

### Harmony Activity (determines which scene is active)
| Entity | Current State | Options |
|--------|--------------|---------|
| `select.games_room_harmony_activities` | `power_off` | `power_off`, `Calibrate Audio`, `Kodi Movies`, `Listen to Sonos Inside`, `Netflix Amazon`, `Projector Screen`, `SkyQ`, `Xbox` |

### Media Players
| Entity | State | Key Attributes |
|--------|-------|----------------|
| `media_player.osmc_mediaroom` | idle | `supported_features: 186303`, when playing: `media_title`, `media_artist`, `entity_picture` |
| `media_player.games_room` | idle | Sonos speaker, `volume_level: 0.6`, `supported_features: 4127295` |
| `media_player.games_room_tv` | off | TV, `supported_features: 152449` |

### Climate
| Entity | State | Key Attributes |
|--------|-------|----------------|
| `climate.games_room` | heat | `current_temperature: 20.3`, `temperature: 25` (target), `current_humidity: 59.8`, `fan_mode: high`, `hvac_modes: [cool, dry, heat, heat_cool, fan_only, off]`, `fan_modes: [quiet, low, medium, medium_high, high, auto]`, `min_temp: 10`, `max_temp: 32`, `target_temp_step: 1` |
| `sensor.games_room_temperature_feels_like` | 20.3 | Unit: °C |

### Power Devices (6 smart plugs)
| Label | Switch Entity | Consumption Entity | Current |
|-------|--------------|-------------------|---------|
| Sonos Port | `switch.unnamed_p304m_games_room_kodi` | `sensor.unnamed_p304m_games_room_kodi_current_consumption` | on, 3.5W |
| Kodi | `switch.unnamed_p304m_smart_plug_2` | `sensor.unnamed_p304m_smart_plug_2_current_consumption` | on, 2.4W |
| Sonos AMP | `switch.unnamed_p304m_games_room_sonos_amp` | `sensor.unnamed_p304m_games_room_sonos_amp_current_consumption` | on, 6.1W |
| Fridge | `switch.games_room_fridge` | `sensor.games_room_fridge_current_consumption` | on, 8.1W |
| Chromecast | `switch.symphony` | *(none)* | on |
| Sky | `switch.sky_games_room` | *(none)* | on |

### Automations
| Automation | Entity ID | What It Does |
|-----------|-----------|-------------|
| Movie Setup | `automation.setup_games_room_for_movie` | Turns off lights, fridge, gets projector ready for cinema mode |
| Start Movie | `automation.games_room_start_movie` | Starts the actual movie playback |
| Sonos Setup | `automation.setup_games_room_for_sonos` | Sets up room for music listening |
| All Off | `automation.turn_off_games_room` | Turns everything off in the games room |

---

## 4. Component Specifications

### See `specs/games-room-components.md` for full component-by-component implementation details.

---

## 5. Implementation Order

### Phase 1: Config + Hooks
1. `gamesRoomConfig.js` — All constants and entity mappings
2. `hooks/useHarmonyActivity.js` — Simplest hook (thin useEntity wrapper)
3. `hooks/useClimate.js` — Two useEntity calls
4. `hooks/usePowerDevices.js` — 10 entity subscriptions (direct haWebSocket pattern)
5. `hooks/useMediaPlayers.js` — 3 useEntity calls + active player logic

### Phase 2: Components (bottom-up)
6. `ClimateCard.jsx` — Temperature display + on/off + controls
7. `PowerGrid.jsx` — 6 device cards with toggles
8. `SceneButtons.jsx` — 5 buttons with active glow
9. `NowPlaying.jsx` — Hero section (most complex visual component)
10. `GamesRoomDashboard.jsx` — Layout shell combining all components

### Phase 3: Integration
11. Update `GamesRoomPage.jsx` — Swap placeholder for dashboard
12. Update `MainLayout.jsx` — Full-viewport treatment for `/games-room`

### Phase 4: Test
13. `cd src && npx vitest run` — Existing tests pass
14. `cd src && npm run build` — Builds without errors
15. Test on dev server: `http://localhost:5173/games-room`
16. Puppeteer screenshot at 1920x1080 to verify layout

---

## 6. Verification Checklist
- [ ] Layout fills 1920x1080 with no scrolling
- [ ] Now Playing shows poster/art when Kodi or Sonos is playing
- [ ] Now Playing shows "Nothing playing" with current mode when idle
- [ ] Scene buttons: tap Movie → triggers automation, button shows active glow
- [ ] Scene buttons: tap Sky TV → sets Harmony activity to SkyQ
- [ ] Scene buttons: tap Netflix → sets Harmony activity to Netflix Amazon
- [ ] Scene buttons: active scene detected from Harmony activity state
- [ ] Climate ON/OFF toggle works
- [ ] Climate +/- changes target temperature
- [ ] Power device toggles work (on/off)
- [ ] Power consumption values update in real-time
- [ ] Volume slider on Now Playing controls Sonos/Kodi volume
- [ ] Transport controls (play/pause/next/prev) work
- [ ] All touch targets are at least 44px
