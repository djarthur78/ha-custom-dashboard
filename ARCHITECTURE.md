# Architecture

**Version:** 3.2.3
**Last Updated:** 2026-03-22

## System Overview

```
┌──────────────────────────────────────┐
│  Wall Panel / Browser (Desktop)      │
│  http://192.168.1.2:8099             │
│                                      │
│  React 19 SPA (Vite)                 │
│  ├── Lazy-loaded routes (Suspense)   │
│  ├── Feature components              │
│  ├── Hooks (useEntity, etc.)         │
│  └── Services (singleton WS + REST)  │
├──────────────────────────────────────┤
│  iPhone / Mobile Browser             │
│  http://192.168.1.2:8099/mobile/     │
│                                      │
│  Separate Vite entry (mobile.html)   │
│  ├── MobileApp.jsx (lazy routes)     │
│  ├── MobileLayout + bottom tabs      │
│  └── Shares hooks/services/features  │
└──────────┬───────────┬───────────────┘
           │           │
      WebSocket     REST API
     (real-time)   (one-time)
           │           │
┌──────────▼───────────▼───────────────┐
│  Home Assistant (192.168.1.2:8123)   │
│  ├── 8 Google Calendars              │
│  ├── 9 UniFi Cameras                 │
│  ├── Sonos speakers                  │
│  ├── Climate (games room)            │
│  ├── Oura Ring sensors               │
│  ├── Person tracking                 │
│  ├── Harmony Hub                     │
│  ├── Ecowitt GW3000A (weather)       │
│  ├── Todoist (3 lists)               │
│  └── Cold plunge sensors + chiller   │
└──────────────────────────────────────┘
```

## Key Design Decisions

### Singleton WebSocket
Single persistent connection shared by all components. Managed by `ha-websocket.js` with auto-reconnect (exponential backoff, max 10 attempts, 30s cap).

**Critical pattern:** Hooks must initialize state from the singleton to avoid stale state:
```js
const [status, setStatus] = useState(() => haWebSocket.getStatus()); // correct
```

### Multi-Entry Vite Build
Desktop and mobile share all hooks, services, and feature components but have separate entry points:
- `index.html` → `main.jsx` → `App.jsx` → `MainLayout` (desktop)
- `mobile.html` → `mobile-main.jsx` → `MobileApp.jsx` → `MobileLayout` (mobile)

Configured via `rollupOptions.input` in `vite.config.js`. Dev server uses a custom `mobile-spa-fallback` plugin to rewrite `/mobile*` to `/mobile.html`.

### HA Ingress Panel
"Arthur Dashboard" sidebar panel uses native HA ingress (no iframe or panel_custom). Works through HTTPS/Cloudflare. Client-side redirect in `index.html` sends phones to `/mobile/`.

### Lazy Routes
All page routes use `React.lazy()` with a `Suspense` boundary in MainLayout (desktop) and MobileLayout (mobile). Each page loads its bundle on first visit. Leaflet (39KB) only loads on the People page.

### Camera Priority Loading
Front 3 cameras use MJPEG streams (loaded immediately). Back 6 cameras use snapshot polling with `IntersectionObserver` to pause when off-screen. Snapshot interval: 10s.

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
Design system (`design-system.css`) with warm palette:
- `--ds-accent` (#b5453a) for interactive elements
- `--ds-state-on` (#4a9a4a) / `--ds-state-off` (#b5453a) for ON/OFF states
- White cards, subtle borders, 8px radius
- Desktop header: 72px. Mobile header: 44px. Mobile tab bar: 56px.

## Component Tree

### Desktop
```
App.jsx (lazy routes)
└── MainLayout
    ├── Header (blue bar, nav icons, clock, weather, status)
    ├── Suspense boundary
    │   ├── CalendarViewList (biweekly default)
    │   ├── HomePage
    │   ├── MealsPage → MealGrid
    │   ├── WeatherPage → CurrentConditions + Forecast + Sensor cards
    │   ├── GamesRoomPage → SceneButtons, ClimateCard, PowerGrid, NowPlaying
    │   ├── MusicPage → NowPlayingPanel, PlaylistPanel, SpeakerPanel
    │   ├── PeoplePage → PersonCard list + LocationMap
    │   ├── HealthPage → Sleep, Heart, Activity, ColdPlungeControls
    │   ├── ColdPlungePage → Status + device controls
    │   ├── TodoPage → 3-tab todo list with CRUD
    │   └── CamerasPage → CameraGrid + CameraModal
    └── Footer (hidden on full-viewport pages)
```

### Mobile
```
MobileApp.jsx (lazy routes)
└── MobileLayout
    ├── Header (44px, dark charcoal, title + connection dot)
    ├── Content (scrollable)
    │   ├── MobileCalendarPage (day list default, month option)
    │   ├── MobileMealsPage (card-per-day)
    │   ├── MobileGamesRoomPage (vertical scroll)
    │   ├── MobileColdPlungePage (status + device grid)
    │   ├── MobileMusicPage (compact now-playing + tabs)
    │   ├── MobileCamerasPage (single-column stacked)
    │   ├── MobilePeoplePage (tabbed People/Map)
    │   ├── MobileHealthPage (single-column rings)
    │   ├── MobileHomePage (card grid)
    │   ├── MobileTodoPage (3-tab list)
    │   └── MobileWeatherPage (single-column scroll)
    └── BottomTabBar (56px, 5 tabs + More sheet)
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
| `useInactivityTimer` | 5-min redirect to calendar (desktop only) |
| `useDoorbellAlert` | Doorbell event detection |
| `useYesterdayValue` | REST history for comparisons |
| `useTodoList` | Todoist list CRUD via HA |

## Performance

- Lazy-loaded routes (code splitting per page)
- Camera IntersectionObserver (no off-screen polling)
- Single WebSocket connection (not per-component)
- Debounced volume sliders (200ms)
- 10s snapshot interval for back cameras

## Known Constraints

- JavaScript only (no TypeScript)
- No automated tests (manual testing)
- HTTP only on local network (HTTPS via Cloudflare for remote)
- Single WebSocket connection (singleton)
- Yesterday comparisons only work in production (CORS in dev)
- HRV Chart REST endpoint only works via nginx proxy (production)
