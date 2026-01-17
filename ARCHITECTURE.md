# Architecture Documentation

**Project:** Home Assistant Custom Dashboard
**Last Updated:** 2026-01-17 (Phase 1 Complete)

> 📊 **Visual Diagrams:** See `DIAGRAMS.md` for professional Mermaid diagrams (system architecture, data flow, sequence diagrams, etc.)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        iPad (Client)                        │
│                   http://192.168.1.6:5173                   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            React 19 App (Vite)                       │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │ Components │  │   Hooks    │  │  Services  │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │ │                                │
└──────────────────────────┼─┼────────────────────────────────┘
                           │ │
                  ┌────────┘ └────────┐
                  │                   │
            WebSocket              REST API
          (Real-time)           (One-time queries)
                  │                   │
                  ▼                   ▼
    ┌─────────────────────────────────────────────┐
    │      Home Assistant Server                  │
    │      ws://192.168.1.2:8123/api/websocket   │
    │      http://192.168.1.2:8123/api           │
    │                                             │
    │  - Entities (lights, sensors, etc.)        │
    │  - Calendars (8 Google calendars)          │
    │  - Automations                             │
    │  - Cameras (9 feeds)                       │
    └─────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework:** React 19 (latest stable)
- **Build Tool:** Vite 7.3.1
- **Styling:** Tailwind CSS v4 (PostCSS plugin)
- **Icons:** Lucide React
- **Date/Time:** date-fns (not yet implemented)
- **State Management:** React hooks + singleton services (no Zustand/Redux yet)

### Development Environment
- **Platform:** WSL2 Ubuntu on Windows 11
- **Node.js:** v22+ (check with `node --version`)
- **Package Manager:** npm
- **IDE:** VS Code

### Home Assistant Integration
- **Connection:** WebSocket (primary) + REST API (backup)
- **Authentication:** Long-lived access token
- **Protocol:** Home Assistant WebSocket API v1

---

## Design Decisions

### 1. WebSocket as Primary Connection Method
**Decision:** Use WebSocket for real-time updates, REST for one-time queries
**Rationale:**
- WebSocket provides real-time entity state updates
- No polling required (more efficient)
- Single persistent connection
- Automatic reconnection on disconnect

**Implementation:** `src/src/services/ha-websocket.js` (singleton service)

### 2. Singleton Service Pattern
**Decision:** Single WebSocket instance shared across all components
**Rationale:**
- Only one connection to HA needed
- Shared state across app
- Centralized reconnection logic

**Critical Fix Applied:** React hooks now initialize state from singleton service to prevent stale state issues (see Bug #1 in CHANGELOG.md)

### 3. No Calendar Google OAuth (For MVP)
**Decision:** Use HA's existing calendar entities, not direct Google Calendar API
**Rationale:**
- HA already has calendar integration configured
- Simpler authentication (no OAuth setup)
- Faster MVP delivery
- Can enhance later with direct Google API

**Future Enhancement:** Direct Google Calendar API in v1.1

### 4. React Hooks for HA Integration
**Decision:** Custom hooks (`useHAConnection`, `useEntity`, `useServiceCall`)
**Rationale:**
- Clean component API
- Reusable logic
- Easy to test
- Follows React best practices

### 5. WSL2 + Port Forwarding
**Decision:** Develop in WSL2, forward ports to Windows host
**Rationale:**
- Linux-native development experience
- Better npm/Node.js performance
- Access from iPad on LAN via Windows host IP

**Implementation:**
```powershell
# Port forwarding: Windows (192.168.1.6) → WSL2 (172.27.69.40)
netsh interface portproxy add v4tov4 listenport=5173 listenaddress=0.0.0.0 connectport=5173 connectaddress=172.27.69.40

# Firewall rule
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

---

## Application Architecture

### Component Hierarchy (Phase 1)
```
App.jsx
├── ConnectionStatus.jsx (header, always visible)
├── LoadingSpinner.jsx (during connection)
├── TestEntity.jsx (demo entity card)
│   ├── useEntity(entityId)
│   └── useServiceCall()
└── ErrorBoundary.jsx (wraps entire app)
```

### Service Layer

**`ha-websocket.js`** - WebSocket Connection Manager
- Singleton instance
- Handles connection, authentication, reconnection
- Manages message ID tracking
- Provides subscription mechanism for entity updates
- Implements exponential backoff for reconnection (1s, 2s, 4s, 8s... max 30s)
- 10-second timeout on all requests

**`ha-rest.js`** - REST API Client (not yet used)
- Backup for one-time queries
- Future use for configuration updates

### Hook Layer

**`useHAConnection()`**
- Returns connection status, error, reconnect info
- Subscribes to connection state changes
- **Critical:** Initializes state from service to prevent stale state

**`useEntity(entityId)`**
- Fetches initial entity state
- Subscribes to real-time updates
- Returns: `{ state, attributes, loading, error }`

**`useServiceCall()`**
- Provides `toggle(entityId)` function
- Handles turn_on/turn_off service calls
- Returns: `{ toggle, loading }`

---

## Data Flow

### Entity State Updates
```
1. Home Assistant → WebSocket message
2. ha-websocket.js receives message
3. ha-websocket.js notifies subscribers
4. useEntity hook receives update
5. Component re-renders with new state
```

### Service Calls (Toggle Light)
```
1. User clicks toggle button
2. Component calls toggle(entityId)
3. useServiceCall → ha-websocket.callService()
4. WebSocket sends call_service message
5. HA processes command
6. HA broadcasts state_changed event
7. useEntity receives update (via flow above)
8. Component re-renders showing new state
```

### Connection Flow
```
1. App mounts → useHAConnection initializes
2. useHAConnection calls haWebSocket.connect()
3. WebSocket opens → HA sends auth_required
4. haWebSocket sends auth token
5. HA sends auth_ok
6. haWebSocket subscribes to state_changed events
7. useHAConnection sets status to 'connected'
8. Components can now fetch entities
```

---

## Error Handling

### Connection Errors
- **Timeout:** 10-second timeout on all WebSocket requests
- **Reconnection:** Exponential backoff (max 10 attempts)
- **Auth Failure:** Display error, offer retry button
- **Network Interruption:** Auto-reconnect when network returns

### Component Errors
- **ErrorBoundary:** Catches React errors, displays fallback UI
- **Loading States:** Show spinner during data fetch
- **Entity Not Found:** Display error message in card

---

## Security Considerations

### Authentication
- **Token Storage:** `.env` file (not in git)
- **Token Type:** Long-lived access token from HA
- **Transmission:** WebSocket/HTTP (no TLS in local network)

**Production Note:** For internet access, use HTTPS/WSS and HA remote access (https://ha.99swanlane.uk)

### Network Security
- **Local Network:** iPad and PC on trusted 192.168.1.x network
- **No Authentication:** Dev server has no auth (local dev only)

**Production Note:** Add authentication layer before internet deployment

---

## Performance Considerations

### WebSocket Efficiency
- Single connection for entire app (not per-component)
- Only subscribe to entities actually in use
- Unsubscribe when components unmount

### Rendering Optimization
- Minimal re-renders (only on state changes)
- No optimization applied yet (future: React.memo, useMemo)

### Bundle Size
- Not optimized yet (Phase 1 focus on functionality)
- Future: Code splitting, tree shaking, lazy loading

---

## Testing Strategy (Not Yet Implemented)

### Planned Testing
- **Unit Tests:** Vitest for hooks and services
- **Integration Tests:** Test HA WebSocket communication
- **E2E Tests:** Playwright for iPad UI testing
- **Manual Testing:** iPad testing checklist

### Current Testing
- Manual testing on localhost and iPad
- Entity toggle verification
- Connection/reconnection testing

---

## Deployment Strategy

### Development
- **Local:** http://localhost:5173/ (WSL2)
- **iPad:** http://192.168.1.6:5173/ (via port forwarding)

### Production (Future)
- **Option 1:** Serve from Raspberry Pi on LAN
- **Option 2:** Deploy to HA add-on
- **Option 3:** Host on local web server (nginx)

**Not Decided Yet:** Will determine in Phase 3

---

## Known Limitations (Phase 1)

1. **No TypeScript** - Using JavaScript for faster MVP
2. **No Tests** - Manual testing only
3. **No Error Logging** - Console logs only
4. **No Analytics** - No usage tracking
5. **No Offline Support** - Requires HA connection
6. **HTTP Only** - No HTTPS (local network only)
7. **Single User** - No multi-user support

---

## Future Enhancements

### Phase 2+ Features
- Calendar integration (HA calendar entities)
- Meal planner (input_text entities)
- Games room controls (climate, Harmony hub)
- Camera feeds (9 camera entities)

### Technical Improvements
- TypeScript migration
- Automated testing
- CI/CD pipeline
- Docker deployment
- HTTPS/WSS for remote access
- Direct Google Calendar API (post-MVP)

---

## Troubleshooting Guide

### iPad Can't Connect
1. Check port forwarding: `powershell.exe "netsh interface portproxy show all"`
2. Check firewall: `powershell.exe "Get-NetFirewallRule -DisplayName 'Vite Dev Server'"`
3. Verify dev server running: `curl http://localhost:5173`
4. Check Windows IP: Should be 192.168.1.6

### WebSocket Won't Connect
1. Check HA is running: http://192.168.1.2:8123
2. Check `.env` has valid token
3. Check browser console for errors
4. Try reconnecting (retry button)

### Entity Loading Stuck
1. Check connection status indicator (should be green)
2. Check browser console for `[useEntity]` logs
3. Verify entity exists in HA
4. Hard refresh page (Ctrl+Shift+R)

---

## Contact & Resources

**GitHub:** https://github.com/djarthur78/ha-custom-dashboard
**HA Community:** https://community.home-assistant.io/
**React Docs:** https://react.dev/
**Tailwind Docs:** https://tailwindcss.com/
**HA WebSocket API:** https://developers.home-assistant.io/docs/api/websocket

---

**Last Updated:** 2026-01-17 (Phase 1 Complete)
**Next Review:** Phase 2A Start (Calendar Feature)
