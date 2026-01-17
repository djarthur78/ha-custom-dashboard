# Development Guide

**For engineers working on this project**

---

## Initial Setup

### Prerequisites
- Windows 11 with WSL2 Ubuntu
- Node.js 22+ installed in WSL2
- Home Assistant running at http://192.168.1.2:8123
- Long-lived access token from HA

### First Time Setup

1. **Clone Repository**
```bash
git clone https://github.com/djarthur78/ha-custom-dashboard.git
cd ha-custom-dashboard
```

2. **Install Dependencies**
```bash
cd src
npm install
```

3. **Configure Environment**
```bash
cp .env.example .env
# Edit .env and add your HA token
nano .env
```

`.env` should contain:
```env
VITE_HA_URL=http://192.168.1.2:8123
VITE_HA_TOKEN=your_long_lived_token_here
```

4. **Setup Network Access (WSL2 → Windows)**

In Windows PowerShell (as Administrator):
```powershell
# Port forwarding
netsh interface portproxy add v4tov4 listenport=5173 listenaddress=0.0.0.0 connectport=5173 connectaddress=172.27.69.40

# Firewall rule
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

**Note:** Replace `172.27.69.40` with your WSL2 IP if different. Get it with:
```bash
ip addr show eth0 | grep "inet " | awk '{print $2}' | cut -d/ -f1
```

5. **Start Development Server**
```bash
npm run dev
```

Access at:
- Local: http://localhost:5173/
- iPad: http://192.168.1.6:5173/ (replace with your Windows host IP)

---

## Development Workflow

### Daily Development

1. **Start Dev Server**
```bash
cd ~/projects/ha-custom-dashboard/src
npm run dev
```

2. **Make Changes**
- Edit files in `src/src/`
- Hot reload will update browser automatically

3. **Test Changes**
- Test on http://localhost:5173/
- Test on iPad http://192.168.1.6:5173/
- Check browser console for errors

4. **Commit Changes**
```bash
git add .
git commit -m "Description of changes

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Working with Claude Code

**Session Format:**
- Use numbered build prompts: `01-BUILD-PHASE-1-FOUNDATION.md`, `02-BUILD-...`
- Update `SESSION-NOTES.md` after each session
- Update `CHANGELOG.md` when features complete

**Resuming Work:**
1. Read `SESSION-NOTES.md` (your personal notes)
2. Check current phase in `README.md`
3. Read relevant spec in `specs/`
4. Start Claude Code: `claude`
5. Tell Claude to resume from session notes

---

## Project Structure

```
ha-custom-dashboard/
├── 00-DISCOVERY-PROMPT.md           # Discovery phase prompt
├── 01-BUILD-PHASE-1-FOUNDATION.md   # Phase 1 build prompt
├── README.md                        # Project overview (for new engineers)
├── SESSION-NOTES.md                 # Working notes (for original developer)
├── ARCHITECTURE.md                  # Technical design and decisions
├── DEVELOPMENT.md                   # This file (how to build)
├── CHANGELOG.md                     # What's been built
│
├── discovery/                       # Discovery documentation
│   ├── 01-dashboard-current.md      # Current dashboard analysis
│   ├── 02-complete-inventory.md     # Full HA entity inventory
│   └── 03-feature-analysis.md       # Feature breakdown
│
├── specs/                           # Feature specifications
│   ├── 00-mvp-definition.md         # Overall MVP plan (7 weeks)
│   ├── 01-calendar-spec.md          # Calendar feature spec
│   ├── 02-meal-planner-spec.md      # Meal planner spec
│   ├── 03-games-room-spec.md        # Games room spec
│   └── 04-cameras-spec.md           # Camera feeds spec
│
├── config/                          # Entity mappings
│   ├── entities.json                # All HA entities
│   └── automations.json             # Automation details
│
├── operations/                      # Operational docs
│   ├── testing-plan.md              # Testing strategy
│   ├── deployment-plan.md           # Deployment guide
│   └── security-checklist.md        # Security review
│
└── src/                             # React application
    ├── .env                         # Environment variables (gitignored)
    ├── .env.example                 # Environment template
    ├── package.json                 # Dependencies
    ├── vite.config.js               # Vite configuration
    ├── postcss.config.js            # PostCSS/Tailwind config
    ├── index.html                   # HTML entry point
    │
    └── src/                         # Application code
        ├── main.jsx                 # React entry point
        ├── App.jsx                  # Root component
        ├── index.css                # Global styles + Tailwind
        │
        ├── components/              # React components
        │   └── common/              # Shared components
        │       ├── ConnectionStatus.jsx
        │       ├── LoadingSpinner.jsx
        │       └── ErrorBoundary.jsx
        │
        ├── services/                # External services
        │   ├── ha-websocket.js      # HA WebSocket client (singleton)
        │   └── ha-rest.js           # HA REST API client
        │
        └── hooks/                   # React hooks
            ├── useHAConnection.js   # Connection status hook
            ├── useEntity.js         # Entity state hook
            └── useServiceCall.js    # Service call hook
```

---

## Common Tasks

### Add a New Component

1. Create file in `src/src/components/`
```jsx
// src/src/components/MyComponent.jsx
export function MyComponent({ prop1, prop2 }) {
  return (
    <div className="p-4">
      {/* Your component */}
    </div>
  );
}
```

2. Import in parent component
```jsx
import { MyComponent } from './components/MyComponent';
```

### Add a New Hook

1. Create file in `src/src/hooks/`
```javascript
// src/src/hooks/useMyHook.js
import { useState, useEffect } from 'react';

export function useMyHook(param) {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Hook logic
  }, [param]);

  return { state };
}
```

2. Use in component
```jsx
import { useMyHook } from '../hooks/useMyHook';

function MyComponent() {
  const { state } = useMyHook('param');
  // ...
}
```

### Query a New Entity Type

1. Use `useEntity` hook
```jsx
import { useEntity } from '../hooks/useEntity';

function SensorCard({ entityId }) {
  const { state, attributes, loading, error } = useEntity(entityId);

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;

  return <div>{state}</div>;
}
```

2. Entity updates automatically via WebSocket

### Call a HA Service

1. Use `useServiceCall` hook
```jsx
import { useServiceCall } from '../hooks/useServiceCall';

function LightControl({ entityId }) {
  const { toggle, loading } = useServiceCall();

  return (
    <button onClick={() => toggle(entityId)} disabled={loading}>
      Toggle Light
    </button>
  );
}
```

### Add Tailwind Styles

Use Tailwind classes directly:
```jsx
<div className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600">
  Styled with Tailwind
</div>
```

Use CSS variables for HA theme colors:
```jsx
<div className="bg-[var(--color-primary)] text-[var(--color-text)]">
  Uses HA theme colors
</div>
```

Theme colors defined in `src/src/index.css`:
- `--color-background`
- `--color-surface`
- `--color-primary`
- `--color-text`
- `--color-success`
- `--color-warning`
- `--color-error`

---

## Testing

### Manual Testing Checklist

**Localhost Testing:**
- [ ] App loads at http://localhost:5173/
- [ ] Connection status shows "Connected" (green)
- [ ] Test entity loads and displays state
- [ ] Toggle button works
- [ ] Real-time updates when toggled
- [ ] No console errors

**iPad Testing:**
- [ ] App loads at http://192.168.1.6:5173/
- [ ] Connection status shows "Connected"
- [ ] Touch interactions work
- [ ] Layout looks good on iPad
- [ ] Toggle functionality works
- [ ] No layout issues

**Edge Case Testing:**
- [ ] HA offline → shows connection error
- [ ] HA restarts → auto-reconnects
- [ ] Network interruption → reconnects
- [ ] Invalid token → shows auth error
- [ ] Entity doesn't exist → shows error

### Future: Automated Tests

Not implemented yet. Planned:
- Vitest for unit tests
- Playwright for E2E tests

---

## Debugging

### Check Connection Status

**WebSocket state:**
```javascript
// In browser console
window.haWebSocket = require('./services/ha-websocket').default;
console.log(haWebSocket.getStatus());
```

**Connection logs:**
Look for these in browser console:
- `[HA WebSocket] Connection opened`
- `[HA WebSocket] Authentication successful`
- `[useHAConnection] Status changed: connected`

### Check Entity State

**In browser console:**
```javascript
// View all current states
haWebSocket.getStates().then(states => console.log(states));

// View specific entity
haWebSocket.getState('light.reading_light').then(state => console.log(state));
```

### Common Issues

**"Loading..." stuck:**
- Check connection status (should be green)
- Hard refresh page (Ctrl+Shift+R)
- Check entity exists in HA
- Check browser console for errors

**WebSocket connection fails:**
- Verify HA is running: http://192.168.1.2:8123
- Check `.env` has correct URL and token
- Check token is valid (create new one if needed)
- Check network connectivity

**iPad can't access:**
- Check port forwarding: `netsh interface portproxy show all`
- Check firewall rule exists
- Verify Windows IP is 192.168.1.6
- Try accessing from Windows browser first

---

## Building for Production

**Not yet implemented.** Phase 1 is development only.

**Future build process:**
```bash
npm run build
# Output: dist/ folder with static files
```

**Deployment options (TBD):**
1. Serve from Raspberry Pi
2. Deploy as HA add-on
3. Host on local nginx server

---

## Git Workflow

### Branching Strategy
Currently using `main` branch only (single developer).

Future:
- `main` - production-ready code
- `develop` - integration branch
- `feature/*` - feature branches

### Commit Messages

Format:
```
Short summary (50 chars or less)

Detailed explanation of what changed and why.
Include design decisions, bug fixes, etc.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Tags

- `discovery-complete` - Discovery phase done
- `phase-1-complete` - Foundation complete
- `phase-2a-complete` - Calendar feature (future)
- etc.

---

## Environment Variables

### Development (.env)
```env
VITE_HA_URL=http://192.168.1.2:8123
VITE_HA_TOKEN=eyJhbG...  # Long-lived token
```

### Production (.env.production - future)
```env
VITE_HA_URL=https://ha.99swanlane.uk
VITE_HA_TOKEN=...  # Different token for remote access
```

**Security Note:** Never commit `.env` to git. It's in `.gitignore`.

---

## Getting Help

### Documentation
1. Read `ARCHITECTURE.md` for design decisions
2. Read `specs/` for feature requirements
3. Read `discovery/` for HA entity details
4. Check `SESSION-NOTES.md` for recent changes

### External Resources
- **Home Assistant WebSocket API:** https://developers.home-assistant.io/docs/api/websocket
- **React Docs:** https://react.dev/
- **Vite Docs:** https://vite.dev/
- **Tailwind CSS:** https://tailwindcss.com/

### Contact
- **GitHub Issues:** https://github.com/djarthur78/ha-custom-dashboard/issues
- **HA Community:** https://community.home-assistant.io/

---

**Last Updated:** 2026-01-17 (Phase 1 Complete)
