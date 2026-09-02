# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Production and credential boundary

Normal coding and verification use local fixtures, unit tests, builds, and localhost only.

- Do not request, store, discover, or use Home Assistant or SSH credentials.
- Do not connect to production Home Assistant, its host, or the deployed dashboard.
- Production browser verification, SSH, HA APIs, add-on operations, and external messaging are ASK effects with a separate target-specific approval.
- The repository must remain usable without an HA MCP server or a project `.env` secret.

## Project Overview

Modern React web application replacing an existing Home Assistant dashboard. Primary device is a wall panel (1920x1080 resolution). The app connects to Home Assistant via WebSocket for real-time updates and REST API for one-time queries.

**Display:** 1920x1080 wall panel (landscape orientation)
**Tech Stack:** React 19, Vite 7.3, Tailwind CSS v4, React Router, date-fns, Lucide React

## Essential Commands

### Development
```bash
cd src
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Access URLs
- **Local development:** http://localhost:5173/
- **Wall panel access:** http://192.168.1.2:8099 (production via HA add-on)
- **Dev access from Windows:** http://192.168.1.6:5173/ (via WSL2 port forwarding)
- **Home Assistant:** http://192.168.1.2:8123

### Environment Setup
The browser uses the same-origin `/ha-read` server boundary. Never place a
Home Assistant bearer credential in Vite environment variables or frontend
configuration.

### Build and deployment boundary

AUTO: local tests, lint, `npm run build`, and `./build-addon.sh` when it only creates project-local artifacts.

ASK: version changes, Git push, pull request or merge, Home Assistant login, add-on install/update/restart, SSH, production browser verification, or any deployed-system mutation.

See `DEPLOYMENT.md` for the human-reviewed deployment procedure. A coding session must stop after producing and reviewing local artifacts unless a separate deployment effect is approved.

## Architecture

### Connection Pattern: Singleton WebSocket Service
**Critical:** The app uses a singleton WebSocket service (`src/src/services/ha-websocket.js`) that manages a single persistent connection to Home Assistant. All components share this instance.

**Key Bug Fixed:** React hooks must initialize state from the singleton service to prevent stale state. When creating new hooks that interact with the WebSocket service, always initialize state from the service's current state:

```javascript
// ✅ CORRECT - Initialize from service
const [status, setStatus] = useState(() => haWebSocket.getStatus());

// ❌ WRONG - Will show stale state
const [status, setStatus] = useState('disconnected');
```

### Data Flow
1. **Entity State Updates:** HA → WebSocket → Service subscribers → React hooks → Component re-renders
2. **Service Calls:** Component → Hook → WebSocket service → HA → State change event → Component update
3. **Connection:** App mount → useHAConnection → haWebSocket.connect() → Auth → Subscribe to state_changed → Components ready

### Service Layer
- **`ha-websocket.js`** - Singleton WebSocket manager with auto-reconnect, exponential backoff, 10s timeouts
- **`ha-rest.js`** - REST API client for one-time queries

### Hook Pattern
- **Generic hooks** in `src/hooks/` (useEntity, useHAConnection, useServiceCall)
- **Feature-specific hooks** in `src/components/features/[feature]/hooks/`

## Project Structure

```
ha-custom-dashboard/
├── src/                              # React app root
│   ├── index.html                    # Desktop entry point
│   ├── mobile.html                   # Mobile entry point
│   ├── src/                          # Application source
│   │   ├── App.jsx                   # Desktop router with MainLayout
│   │   ├── MobileApp.jsx             # Mobile router with MobileLayout
│   │   ├── main.jsx                  # Desktop entry
│   │   ├── mobile-main.jsx           # Mobile entry (basename="/mobile")
│   │   ├── index.css                 # Global styles + Tailwind + HA theme
│   │   │
│   │   ├── components/
│   │   │   ├── common/               # Shared components (ErrorBoundary, LoadingSpinner)
│   │   │   ├── layout/               # Desktop layout (MainLayout, Navigation)
│   │   │   ├── mobile/               # Mobile layout (MobileLayout, BottomTabBar, MoreSheet)
│   │   │   └── features/             # Feature-specific components
│   │   │       ├── calendar/         # Calendar feature
│   │   │       ├── meals/            # Meal planner
│   │   │       ├── games-room/       # Games room controls
│   │   │       ├── cameras/          # Camera feeds
│   │   │       ├── weather/          # Weather sensors + forecast
│   │   │       ├── todo/             # Todoist integration
│   │   │       └── cold-plunge/      # Cold plunge controls
│   │   │
│   │   ├── pages/                    # Desktop route pages
│   │   ├── pages/mobile/             # Mobile route pages
│   │   ├── hooks/                    # Generic React hooks
│   │   ├── services/                 # HA integration (WebSocket + REST)
│   │   ├── utils/                    # Helper functions
│   │   └── constants/                # App constants (colors, routes)
│   │
│   ├── .env                          # Environment variables (not in git)
│   ├── package.json
│   └── vite.config.js
│
├── family-dashboard/                 # Home Assistant add-on
│   ├── build/                       # Built React app (created by build-addon.sh)
│   ├── config.json                  # Add-on metadata
│   ├── Dockerfile                   # Container definition
│   ├── nginx.conf                   # Web server config
│   └── run.sh                       # Startup script
├── HA/                               # Home Assistant config files (yaml snapshots)
├── config/                           # Entity mappings (entities.json, automations.json)
│
├── README.md                         # Project overview
├── DEPLOYMENT.md                     # Add-on deployment guide
├── ARCHITECTURE.md                   # Technical design decisions
├── DEVELOPMENT.md                    # Setup and workflow guide
├── FOLDER-STRUCTURE.md               # Frontend organization patterns
├── CHANGELOG.md                      # Build history
└── build-addon.sh                   # Build script for add-on
```

## Feature Organization

Follow feature-based organization (not type-based):

```
features/calendar/
  ├── CalendarView.jsx              # Main component
  ├── EventCard.jsx                 # Sub-components
  ├── hooks/
  │   └── useCalendarEvents.js      # Feature-specific hooks
  └── utils/
      └── eventHelpers.js           # Feature-specific utilities
```

**Keep related code together.** Feature folders can have their own hooks and utils if they're specific to that feature.

## Styling

### Tailwind CSS v4
Use Tailwind utility classes directly in JSX:
```jsx
<div className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600">
```

### HA Theme Colors
CSS variables defined in `src/index.css` match Home Assistant's default light theme:
```jsx
<div className="bg-[var(--color-primary)] text-[var(--color-text)]">
```

Available theme colors:
- `--color-background` - Main background
- `--color-surface` - Card/surface background
- `--color-primary` - Primary brand color
- `--color-text` - Main text
- `--color-success` / `--color-warning` / `--color-error` - Status colors

## Routing

React Router is configured in `App.jsx` with `MainLayout` wrapper:
```jsx
<Routes>
  <Route path="/" element={<MainLayout />}>
    <Route index element={<HomePage />} />
    <Route path="calendar" element={<CalendarViewList />} />
    {/* ... more routes */}
  </Route>
</Routes>
```

Navigation is handled by the `Navigation` component in `MainLayout`.

## Home Assistant Integration

### Authority boundary
Dashboard reads go through the add-on's server-side HA read-only identity.
Browser mutation controls are disabled. Do not add an HA MCP credential or a
frontend bearer-token fallback.

### Entity IDs
All entity IDs are documented in `config/entities.json`. Common patterns:
- Calendars: `calendar.daz`, `calendar.nic`, etc. (8 Google calendars)
- Cameras: `camera.back_door_high`, `camera.front_door_person`, etc. (9 cameras)
- Lights: `light.reading_light`, etc.
- Climate: `climate.games_room`

### Using Entities in Components
```jsx
import { useEntity } from '@/hooks/useEntity';

function LightCard({ entityId }) {
  const { state, attributes, loading, error } = useEntity(entityId);

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;

  return <div>{state}</div>;
}
```

### Calling HA Services
```jsx
import { useServiceCall } from '@/hooks/useServiceCall';

function LightToggle({ entityId }) {
  const { toggle, loading } = useServiceCall();

  return (
    <button onClick={() => toggle(entityId)} disabled={loading}>
      Toggle
    </button>
  );
}
```

## Development Environment

### WSL2 + Port Forwarding
Development runs in WSL2 Ubuntu. Port 5173 is forwarded from Windows host (192.168.1.6) to WSL2 for remote access during development.

**Check port forwarding (PowerShell):**
```powershell
netsh interface portproxy show all
```

**Get WSL2 IP:**
```bash
ip addr show eth0 | grep "inet " | awk '{print $2}' | cut -d/ -f1
```

### Testing
- Manual testing on localhost and wall panel (1920x1080)
- Check browser console for `[HA WebSocket]` and `[useEntity]` logs
- Verify entity updates in real-time by toggling in HA UI

## Common Patterns

### Creating New Pages
1. Create page component in `src/pages/`
2. Add route in `App.jsx`
3. Add navigation link in `Navigation.jsx`

### Adding Calendar Color Mapping
Calendar colors are defined in `src/constants/colors.js`:
```javascript
export const CALENDAR_COLORS = {
  'calendar.daz': '#1a73e8',
  'calendar.nic': '#e67c73',
  // etc.
};
```

## Error Handling

- **ErrorBoundary** wraps the app to catch React errors
- **Connection errors:** Auto-reconnect with exponential backoff (max 10 attempts, 30s max delay)
- **Loading states:** Always show LoadingSpinner during data fetch
- **Entity errors:** Display error message in component

## Documentation Files

### For New Engineers
1. **README.md** - Start here (project overview, quick start)
2. **ARCHITECTURE.md** - Technical design and decisions
3. **DEVELOPMENT.md** - Setup guide and daily workflow
4. **FOLDER-STRUCTURE.md** - Frontend organization patterns

### For Resuming Work
- **CHANGELOG.md** - What's been built
- **HA/** - Home Assistant config file snapshots

### Reference
- **config/** - Entity and automation mappings

## Known Constraints

- No TypeScript (using JavaScript for faster MVP)
- No automated tests yet (manual testing only)
- HTTP only (local network, no HTTPS)
- Single persistent WebSocket connection (singleton pattern)
- Local development requires WSL2 port forwarding for iPad access

## Git Workflow

### Commit Messages
```
Short summary (50 chars or less)

Detailed explanation of changes and why.

Co-Authored-By: Codex Sonnet 4.5 <noreply@anthropic.com>
```

## Security Notes

- Production credentials must not be stored in `.env`, project instructions, Git, or frontend assets
- No authentication on dev server (local dev only)
- Local network only (192.168.1.x trusted network)
- For production/internet access, use HTTPS/WSS and HA remote access (https://ha.99swanlane.uk)
