# Home Assistant Custom Dashboard - Phase 1: Foundation

A modern, responsive dashboard for Home Assistant built with React, Vite, and Tailwind CSS.

## Phase 1 Status

**Goal:** Establish foundation with HA WebSocket connection, basic UI, and entity control.

### Completed Features

- ✅ React + Vite project setup
- ✅ Tailwind CSS with dark theme (matching HA)
- ✅ Home Assistant WebSocket integration
- ✅ Real-time entity state updates
- ✅ Service calls (turn_on, turn_off, toggle)
- ✅ Auto-reconnect with exponential backoff
- ✅ Connection status indicator
- ✅ Error boundaries
- ✅ Loading states
- ✅ Responsive layout
- ✅ Network access for iPad testing

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Home Assistant instance running
- Long-lived access token from Home Assistant

### 1. Install Dependencies

```bash
cd src
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your Home Assistant details:

```env
VITE_HA_URL=http://192.168.1.2:8123
VITE_HA_TOKEN=your_actual_token_here
```

**Getting your token:**
1. Open Home Assistant
2. Click your profile (bottom left sidebar)
3. Scroll to "Long-Lived Access Tokens"
4. Click "Create Token"
5. Copy the token and paste it in `.env`

### 3. Update Test Entity

Edit `src/App.jsx` and replace the test entity ID with one from your HA instance:

```jsx
<TestEntity entityId="light.kitchen_light" />
```

Find entity IDs in Home Assistant Developer Tools → States.

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at:
- **Local:** http://localhost:5173
- **Network (iPad):** http://192.168.1.6:5173

## Project Structure

```
src/
├── components/
│   └── common/
│       ├── LoadingSpinner.jsx    # Loading indicator
│       ├── ErrorBoundary.jsx     # Error handling
│       └── ConnectionStatus.jsx  # HA connection status
├── services/
│   ├── ha-websocket.js           # WebSocket connection manager
│   └── ha-rest.js                # REST API calls
├── hooks/
│   ├── useHAConnection.js        # Connection hook
│   ├── useEntity.js              # Entity state subscription
│   └── useServiceCall.js         # Service call hook
├── App.jsx                       # Main app component
├── main.jsx                      # Entry point
└── index.css                     # Tailwind + theme
```

## Usage

### Using Hooks in Components

```jsx
import { useEntity } from './hooks/useEntity';
import { useServiceCall } from './hooks/useServiceCall';

function MyComponent() {
  const { state, attributes } = useEntity('light.living_room');
  const { toggle } = useServiceCall();

  return (
    <button onClick={() => toggle('light.living_room')}>
      {state === 'on' ? 'Turn Off' : 'Turn On'}
    </button>
  );
}
```

### Connection Status

```jsx
import { useHAConnection } from './hooks/useHAConnection';

function MyComponent() {
  const { isConnected, status, error, retry } = useHAConnection();

  if (!isConnected) {
    return <button onClick={retry}>Reconnect</button>;
  }

  return <div>Connected to HA!</div>;
}
```

## Testing Checklist

### Local Development
- [ ] `npm run dev` starts without errors
- [ ] App loads at http://localhost:5173
- [ ] WebSocket connects to HA
- [ ] Connection status shows "Connected"
- [ ] Can see entity state in UI
- [ ] Toggling entity works
- [ ] Real-time updates reflect in UI
- [ ] No console errors

### iPad Testing
- [ ] Access http://192.168.1.6:5173 from iPad
- [ ] UI renders correctly
- [ ] Touch interactions work
- [ ] Connection status visible
- [ ] Can toggle test entity
- [ ] No layout issues

### Edge Cases
- [ ] HA offline - shows connection error
- [ ] HA restarts - auto-reconnects
- [ ] Invalid token - shows auth error
- [ ] Network interruption - reconnects
- [ ] Entity unavailable - shows error state

## Troubleshooting

### WebSocket Connection Issues

**"WebSocket not connected" error:**
- Verify HA URL is correct in `.env`
- Check that HA is running and accessible
- Ensure token is valid

**Authentication Failed:**
- Generate a new long-lived access token
- Update `.env` with new token
- Restart dev server

**Auto-reconnect not working:**
- Check browser console for errors
- Verify network connectivity
- Try manual retry button

### Network Access Issues

**Can't access from iPad:**
- Verify PC IP is 192.168.1.6: `ip addr show`
- Check firewall allows port 5173
- Ensure devices on same network
- Try `npm run dev` again

### Build Issues

**Tailwind styles not applying:**
- Check `postcss.config.js` exists
- Verify `@import "tailwindcss"` in `index.css`
- Restart dev server

**Module not found errors:**
- Run `npm install` again
- Check import paths are correct
- Verify file exists in project

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Next Steps

After Phase 1 is complete and tested:

1. **Phase 2A: Family Calendar** (Week 3-4)
   - Calendar view for 8 Google calendars
   - Week/month views
   - Event details

2. **Phase 2B: Meal Planner** (Week 5)
   - This week / next week views
   - 4 meals × 7 days
   - Quick add/edit

3. **Phase 2C: Games Room Control** (Week 6)
   - Climate controls
   - Harmony hub integration
   - Quick actions

4. **Phase 2D: Camera Feeds** (Week 7)
   - 9 camera grid
   - Live feeds
   - Controls

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool & dev server
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons
- **date-fns** - Date utilities
- **Home Assistant** - WebSocket & REST API

## License

Private project for personal use.

## Support

For issues or questions about:
- **Home Assistant:** https://community.home-assistant.io/
- **React:** https://react.dev/
- **Vite:** https://vitejs.dev/
- **Tailwind:** https://tailwindcss.com/

---

**Phase 1: Foundation Complete** ✅

Ready to proceed to Phase 2A: Calendar Implementation
