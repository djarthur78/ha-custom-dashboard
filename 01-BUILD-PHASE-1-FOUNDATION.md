# Build Phase 1: Foundation

**Context:** I have completed discovery. All findings are in:
- `discovery/` - Current dashboard analysis and HA inventory
- `specs/` - Detailed specifications for each feature
- `operations/` - Testing, deployment, security plans
- `specs/00-mvp-definition.md` - The master plan

**Goal:** Build Phase 1 (Foundation) - React + Vite + Tailwind + HA Connection

---

## Phase 1 Requirements (Week 1-2)

From `specs/00-mvp-definition.md`, Phase 1 Foundation must include:

### Required Components

1. **React + Vite Project Setup**
   - Initialize Vite with React template
   - Install dependencies (React 18+, Tailwind CSS 3+)
   - Configure Vite for development
   - Set up hot module replacement

2. **Tailwind CSS Configuration**
   - Install and configure Tailwind
   - Set up dark theme (matching current HA theme)
   - Configure responsive breakpoints (320px to 2048px)
   - Import Tailwind utilities

3. **Home Assistant Integration**
   - WebSocket connection to HA at http://192.168.1.2:8123
   - REST API integration
   - Long-lived access token from .env
   - Auto-reconnect with exponential backoff
   - Connection status indicator

4. **Project Structure**
```
   src/
   ├── components/
   │   └── common/
   │       ├── LoadingSpinner.jsx
   │       ├── ErrorBoundary.jsx
   │       └── ConnectionStatus.jsx
   ├── services/
   │   ├── ha-websocket.js      # WebSocket connection
   │   ├── ha-rest.js           # REST API calls
   │   └── entity-mapper.js     # Load entity maps from config
   ├── hooks/
   │   ├── useHAConnection.js   # WebSocket hook
   │   ├── useEntity.js         # Subscribe to entity state
   │   └── useServiceCall.js    # Call HA services
   ├── config/
   │   └── theme.js             # Dark theme config
   ├── App.jsx
   ├── main.jsx
   └── index.css
```

5. **Environment Setup**
   - Create `.env.example` with template
   - Create `.env` with actual token (gitignored)
   - Environment variable for HA_URL and HA_TOKEN

6. **Error Handling**
   - Error boundaries for React components
   - Loading states (skeleton screens)
   - Connection error handling with retry
   - Toast notifications for errors

7. **Basic UI**
   - Dark theme matching HA
   - Responsive layout container
   - Navigation placeholder (for future tabs)
   - Connection status indicator
   - Basic styling with Tailwind

### Success Criteria (Phase 1 Gate)

- [ ] HA connection working via WebSocket
- [ ] Can read entity states in real-time
- [ ] Can call HA services (turn_on, turn_off)
- [ ] Basic dark-themed UI renders on iPad
- [ ] Auto-reconnect works when HA restarts
- [ ] Error boundaries catch and display errors
- [ ] Loading states show during data fetch
- [ ] No console errors
- [ ] Can test on iPad at http://192.168.1.6:5173

---

## Implementation Instructions

1. **Create React App**
```bash
   # In ~/projects/ha-custom-dashboard/
   npm create vite@latest src -- --template react
   cd src
   npm install
```

2. **Install Dependencies**
```bash
   npm install tailwindcss postcss autoprefixer
   npm install lucide-react date-fns
   npx tailwindcss init -p
```

3. **Configure Environment**
   - Create `.env.example`:
```
     VITE_HA_URL=http://192.168.1.2:8123
     VITE_HA_TOKEN=your_token_here
```
   - Create `.env` with actual token
   - Add `.env` to `.gitignore`

4. **Build HA WebSocket Service**
   - Connect to `ws://192.168.1.2:8123/api/websocket`
   - Authenticate with token
   - Subscribe to state changes
   - Handle reconnection
   - Export hooks: `useHAConnection`, `useEntity`, `useServiceCall`

5. **Create Basic Layout**
   - Dark theme using Tailwind
   - Responsive container
   - Header with connection status
   - Main content area (placeholder)
   - Footer (optional)

6. **Test HA Integration**
   - Subscribe to a test entity (any light or switch)
   - Display entity state
   - Create a button to toggle the entity
   - Verify real-time updates work

7. **Error Handling**
   - Wrap app in ErrorBoundary
   - Show loading spinner during connection
   - Display connection errors with retry button
   - Toast for service call failures

---

## Testing Checklist

### Local Development
- [ ] `npm run dev` starts without errors
- [ ] App loads at http://localhost:5173
- [ ] WebSocket connects to HA
- [ ] Can see entity states updating
- [ ] Can call services (toggle a light)
- [ ] Errors are caught and displayed
- [ ] Hot reload works

### iPad Testing
- [ ] Access http://192.168.1.6:5173 from iPad
- [ ] UI renders correctly
- [ ] Touch interactions work
- [ ] Connection status visible
- [ ] Can interact with test entity
- [ ] No layout issues

### Edge Cases
- [ ] HA offline - shows connection error
- [ ] HA restarts - auto-reconnects
- [ ] Invalid token - shows auth error
- [ ] Network interruption - reconnects
- [ ] Entity unavailable - shows unavailable state

---

## File References

**Use these files for entity/automation details:**
- `config/entities.json` - All HA entities
- `config/automations.json` - Automation details
- `discovery/02-complete-inventory.md` - Full HA inventory
- `specs/00-mvp-definition.md` - Overall plan

**Calendar entities (for Phase 2):**
- Reference `specs/01-calendar-spec.md` when ready

**Meal planner entities (for Phase 2):**
- Reference `specs/02-meal-planner-spec.md` when ready

---

## Deliverables

When Phase 1 is complete:
1. Working React app with HA connection
2. README.md with setup instructions
3. All files committed to git
4. Tagged as `phase-1-foundation-complete`
5. Tested on iPad successfully
6. Demo video/screenshots (optional)

---

## Next Phase

After Phase 1 gate is passed:
- Review with user
- Get approval
- Proceed to Phase 2A: Family Calendar (Week 3-4)

---

## Notes

- Use HA's existing calendar entities (don't do Google OAuth yet)
- Keep it simple - this is foundation only
- Focus on solid HA connection and error handling
- Don't build actual features yet (Calendar/Meal/Games/Camera)
- Just prove the tech stack works

---

## Ready to Build

Read this file, then:
1. Create the React + Vite project
2. Set up Tailwind CSS
3. Build HA WebSocket service
4. Create basic UI
5. Test HA connection
6. Verify on iPad
7. Commit and tag

Let's build! 🚀
