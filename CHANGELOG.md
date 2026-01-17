# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Phase 1 Complete] - 2026-01-17

### Summary
Foundation phase complete. React + Vite + HA WebSocket integration working on localhost and iPad.

### Added

**Project Setup**
- Initialized Vite + React 19 project in `src/`
- Configured Tailwind CSS v4 with PostCSS plugin
- Created `.env.example` for environment template
- Set up ESLint configuration
- Configured Vite for network access (`host: '0.0.0.0'`)

**Home Assistant Integration**
- WebSocket service (`ha-websocket.js`) with:
  - Auto-reconnect with exponential backoff (1s → 30s max)
  - 10-second request timeout
  - Authentication flow
  - Message ID tracking
  - Event subscription (state_changed)
- REST API service (`ha-rest.js`) - placeholder for future use
- Environment-based configuration (HA_URL, HA_TOKEN)

**React Components**
- `App.jsx` - Root component with test entity
- `ConnectionStatus.jsx` - Connection status indicator (green/yellow/red)
- `LoadingSpinner.jsx` - Loading state component
- `ErrorBoundary.jsx` - Error boundary for React errors
- `TestEntity.jsx` - Demo entity card (shows light state and toggle)

**React Hooks**
- `useHAConnection()` - Connection status management
- `useEntity(entityId)` - Entity state subscription
- `useServiceCall()` - Service call functions (toggle, etc.)

**Styling & Theme**
- Dark theme matching Home Assistant colors
- CSS variables for theme colors in `index.css`
- Responsive layout container
- Tailwind utility classes throughout

**Network Configuration**
- WSL2 port forwarding: `192.168.1.6:5173 → 172.27.69.40:5173`
- Windows Firewall rule for inbound TCP 5173
- MCP configuration (`.mcp.json`) for Puppeteer and hass-mcp

**Documentation**
- `README.md` - Project overview for new engineers
- `ARCHITECTURE.md` - Technical design and decisions
- `DEVELOPMENT.md` - How to build and develop
- `CHANGELOG.md` - This file
- `SESSION-NOTES.md` - Working notes for original developer
- Updated discovery and spec documentation

### Fixed

**Bug #1: Entity Loading Stuck (Critical)**
- **Issue:** Entity cards showed "Loading..." forever even when connection was successful
- **Root Cause:** `useHAConnection` hook initialized with hardcoded `'disconnected'` state. When multiple components used the hook, new instances didn't sync with the already-connected singleton WebSocket service.
- **Impact:** App appeared broken - entities never loaded
- **Fix:** Changed hook to initialize state from service: `useState(() => haWebSocket.getStatus())`
- **Files Changed:** `src/src/hooks/useHAConnection.js:7`
- **Verified:** Entity now loads correctly on both localhost and iPad

**Bug #2: Hanging Promises (Medium)**
- **Issue:** WebSocket requests could hang forever if HA didn't respond
- **Root Cause:** No timeout mechanism on send() promises
- **Impact:** UI stuck in loading state indefinitely
- **Fix:** Added 10-second timeout to all WebSocket requests with proper cleanup
- **Files Changed:** `src/src/services/ha-websocket.js:189-206, 135-145`
- **Verified:** Requests timeout gracefully after 10 seconds

**Bug #3: Commands Sent Before Authentication (Low)**
- **Issue:** Commands could be sent before WebSocket authentication completed
- **Root Cause:** No check for `isAuthenticated` flag in send() method
- **Impact:** Commands would fail silently
- **Fix:** Added authentication check before sending commands (auth message excluded)
- **Files Changed:** `src/src/services/ha-websocket.js:186-190`
- **Verified:** Commands only sent after successful authentication

### Changed

**Initialization Flow**
- useHAConnection now gets initial status from service instead of assuming disconnected
- Prevents stale state when multiple hook instances exist

**Error Handling**
- Proper timeout cleanup on disconnect
- Clear error messages for timeout, auth failure, connection errors

**Logging**
- Added comprehensive console logging during debugging
- Removed debug logs after fixes verified
- Kept essential logs (connection, auth, errors)

### Tested

**Localhost Testing (✅ Passed)**
- [x] App loads at http://localhost:5173/
- [x] WebSocket connects to HA
- [x] Authentication successful
- [x] Connection status shows "Connected" (green)
- [x] Entity loads: `light.reading_light` (Office Reading Lamp)
- [x] Entity displays state (on/off)
- [x] Toggle button works (turn_on/turn_off)
- [x] Real-time updates work
- [x] No console errors

**iPad Testing (✅ Passed)**
- [x] App loads at http://192.168.1.6:5173/
- [x] Connection status shows "Connected"
- [x] Entity loads correctly
- [x] Toggle button works on touch
- [x] Layout renders correctly on iPad
- [x] No layout issues

**Edge Case Testing (✅ Passed)**
- [x] HA offline → Shows connection error
- [x] Auto-reconnect works when HA comes back online
- [x] Hard refresh clears state properly
- [x] Multiple component instances share state correctly

### Git Commits

```
e59a99f Phase 1 Foundation complete: React + Vite + HA WebSocket
990f445 Update session notes: Phase 1 complete and tested
3bd37b2 Clean up project structure and add README
```

**Tags:** `phase-1-complete`

### Known Issues

None. Phase 1 complete and working.

### Dependencies

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "lucide-react": "^0.469.0",
  "date-fns": "^4.1.0",
  "@tailwindcss/postcss": "^4.0.3",
  "tailwindcss": "^4.0.3",
  "vite": "^7.3.1"
}
```

### Statistics

- **Files Created:** 24
- **Lines of Code:** ~1,200 (including comments)
- **Components:** 4
- **Hooks:** 3
- **Services:** 2
- **Bugs Fixed:** 3
- **Time Spent:** ~4 hours (including debugging)

---

## [Discovery Phase] - 2026-01-17 (Morning)

### Summary
Comprehensive discovery of existing HA dashboard and entity inventory.

### Added

**Discovery Documentation**
- `discovery/01-dashboard-current.md` - Current dashboard analysis
- `discovery/02-complete-inventory.md` - Full HA entity inventory (2,215 entities)
- `discovery/03-feature-analysis.md` - Feature breakdown

**Specifications**
- `specs/00-mvp-definition.md` - 7-week MVP plan
- `specs/01-calendar-spec.md` - Calendar feature requirements
- `specs/02-meal-planner-spec.md` - Meal planner requirements
- `specs/03-games-room-spec.md` - Games room control requirements
- `specs/04-cameras-spec.md` - Camera feeds requirements

**Configuration**
- `config/entities.json` - All 2,215 HA entities mapped
- `config/automations.json` - Automation details

**Operations**
- `operations/testing-plan.md` - Testing strategy
- `operations/deployment-plan.md` - Deployment guide
- `operations/security-checklist.md` - Security review

**Build Prompts**
- `00-DISCOVERY-PROMPT.md` - Discovery phase prompt
- `01-BUILD-PHASE-1-FOUNDATION.md` - Phase 1 build prompt

### Analyzed

- 8 Google Calendar entities
- 28 meal planner input_text entities (This Week + Next Week)
- 14 climate entities (Games Room controls)
- 9 camera entities
- 18 automations (3 for Games Room)
- Current dashboard structure and layout

### Decisions Made

- Use HA calendar entities (not direct Google Calendar API) for MVP
- Start with Calendar feature (highest priority)
- 7-week phased approach
- Primary device: iPad (Kitchen Calendar tablet)
- Tech stack: React + Vite + Tailwind + HA WebSocket

### Git Commits

```
813edce Discovery complete: dashboard analysis, inventory, specs
2b020ae Initial project setup
3db6ea8 Add Phase 1 build prompt and session notes for resuming
```

**Tags:** `discovery-complete`

---

## Next Phase

**Phase 2A: Family Calendar** (Planned - 2 weeks)
- Week view (default)
- Day view toggle
- Month view toggle
- Multi-calendar display (8 Google calendars)
- Color coding by calendar
- Event filtering
- Touch-optimized UI

See `specs/01-calendar-spec.md` for details.

---

**Changelog maintained by:** Original Developer + Claude Code
**Last Updated:** 2026-01-17 (Phase 1 Complete)
