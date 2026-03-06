# Architecture

**Version:** 2.3.0
**Last Updated:** 2026-03-06

## System Overview

```
┌──────────────────────────────────────┐
│  Android Tablet / Browser            │
│  http://192.168.1.2:8099             │
│                                      │
│  React 19 SPA (Vite)                 │
│  ├── Lazy-loaded routes (Suspense)   │
│  ├── Feature components              │
│  ├── Hooks (useEntity, etc.)         │
│  └── Services (singleton WS + REST)  │
└──────────┬───────────┬───────────────┘
           │           │
      WebSocket     REST API
     (real-time)   (one-time)
           │           │
┌──────────▼───────────▼───────────────┐
│  Home Assistant (192.168.1.2:8123)   │
│  ├── 8 Google Calendars              │
│  ├── 8 UniFi Cameras                 │
│  ├── Sonos speakers                  │
│  ├── Climate (games room)            │
│  ├── Oura Ring sensors               │
│  ├── Person tracking                 │
│  └── Harmony Hub                     │
└──────────────────────────────────────┘
```

## Key Design Decisions

### Singleton WebSocket
Single persistent connection shared by all components. Managed by `ha-websocket.js` with auto-reconnect (exponential backoff, max 10 attempts, 30s cap).

**Critical pattern:** Hooks must initialize state from the singleton to avoid stale state:
```js
const [status, setStatus] = useState(() => haWebSocket.getStatus()); // correct
```

### Lazy Routes
All page routes use `React.lazy()` with a `Suspense` boundary in MainLayout. Each page loads its bundle on first visit. Leaflet (39KB) only loads on the People page.

### Camera Priority Loading
Front 3 cameras use MJPEG streams (loaded immediately). Back 5 cameras use snapshot polling with `IntersectionObserver` to pause when off-screen. Snapshot interval: 10s (was 3s).

### Feature-Based Organization
Each feature has its own directory under `components/features/`:
```
features/calendar/
  ├── CalendarViewList.jsx
  ├── DayView.jsx
  ├── hooks/useCalendarEvents.js     (if needed)
  └── utils/eventHelpers.js          (if needed)
```

### Visual Design
Calendar's design language applied everywhere:
- White cards, 1px `#e0e0e0` border, 8px radius
- No drop shadows
- Accent colors via left stripe or purposeful highlights
- Large scannable numbers, secondary text in `#666`

## Component Tree

```
App.jsx (lazy routes)
└── MainLayout
    ├── Header (blue bar, nav icons, clock, weather, status)
    ├── Suspense boundary
    │   ├── CalendarViewList (biweekly default)
    │   ├── HomePage (clean cards with live previews)
    │   ├── MealsPage → MealGrid
    │   ├── GamesRoomPage → GamesRoomDashboard
    │   │   ├── NowPlaying
    │   │   ├── SceneButtons
    │   │   ├── ClimateCard
    │   │   └── PowerGrid
    │   ├── MusicPage → MusicDashboard
    │   │   ├── NowPlayingPanel
    │   │   ├── PlaylistPanel
    │   │   └── SpeakerPanel
    │   ├── PeoplePage → PeopleDashboard
    │   │   ├── PersonCard list
    │   │   └── LocationMap (Leaflet)
    │   ├── HealthPage → HealthDashboard
    │   │   ├── Sleep, Heart, Activity panels
    │   │   └── ColdPlungeControls
    │   └── CamerasPage → CameraGrid
    │       ├── CameraFeed (stream or snapshot)
    │       └── CameraModal
    └── Footer (hidden on full-viewport pages)
```

## Data Flow

### Entity Updates
```
HA state change → WebSocket event → ha-websocket.js
→ notify subscribers → useEntity hook setState → component re-render
```

### Service Calls
```
Component action → useServiceCall.callService()
→ ha-websocket.js → HA → state_changed event → component update
```

### Camera Feeds
- **MJPEG:** Direct stream URL with entity access_token
- **Snapshot:** Polling URL with cache-busting timestamp, paused when off-screen

## Services

| Service | File | Purpose |
|---------|------|---------|
| WebSocket | `ha-websocket.js` | Persistent connection, entity subscriptions, service calls |
| REST | `ha-rest.js` | Calendar events, history queries, one-time data |
| Calendar | `calendar-service.js` | CRUD operations for calendar events |

## Hooks

| Hook | Purpose |
|------|---------|
| `useHAConnection` | Connection status, reconnect |
| `useEntity` | Subscribe to entity state |
| `useServiceCall` | Call HA services |
| `useWeather` | Weather entity |
| `useInactivityTimer` | 5-min redirect to calendar |
| `useDoorbellAlert` | Doorbell event detection |
| `useYesterdayValue` | REST history for comparisons |

## Performance

- Lazy-loaded routes (code splitting per page)
- Camera IntersectionObserver (no off-screen polling)
- Single WebSocket connection (not per-component)
- Debounced volume sliders (200ms)
- 10s snapshot interval for back cameras (was 3s)

## Known Constraints

- JavaScript only (no TypeScript)
- No automated tests (manual testing)
- HTTP only on local network
- Single WebSocket connection (singleton)
- Yesterday comparisons only work in production (CORS in dev)
