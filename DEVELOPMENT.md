# Development Guide

## Prerequisites

- Node.js 22+
- Home Assistant at http://192.168.1.2:8123
- Long-lived access token from HA

## Setup

```bash
git clone https://github.com/djarthur78/ha-custom-dashboard.git
cd ha-custom-dashboard/src
npm install
```

Create `.env` in the `src/` directory:
```env
VITE_HA_URL=http://192.168.1.2:8123
VITE_HA_TOKEN=<your-long-lived-token>
```

## Development

```bash
cd src
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run preview      # Preview production build
```

### Access URLs (Dev)

| URL | What |
|-----|------|
| http://localhost:5173 | Desktop dashboard |
| http://localhost:5173/mobile/ | Mobile dashboard |

The Vite dev server includes a custom `mobile-spa-fallback` plugin that rewrites `/mobile*` routes to `mobile.html` for SPA routing.

## Testing

Manual testing on localhost and production wall panel. Check browser console for `[HA WebSocket]` logs.

```bash
cd src && npx vitest run    # Run any existing tests
```

### Testing both layouts
1. Desktop: http://localhost:5173 — test at 1920x1080
2. Mobile: http://localhost:5173/mobile/ — test with mobile viewport or iPhone

## Deployment

### Full workflow:

```bash
# 1. Update version in THREE places:
#    - family-dashboard/config.json
#    - src/package.json
#    - src/src/pages/HomePage.jsx

# 2. Build
cd src && npm run build && cd ..

# 3. Package addon
./build-addon.sh

# 4. Commit and push
git add -A
git commit -m "feat: description (vX.X.X)"
git push

# 5. Update addon in HA (via Puppeteer or UI)
# 6. Verify desktop: http://192.168.1.2:8099
# 7. Verify mobile:  http://192.168.1.2:8099/mobile/
```

### Addon update via HA UI:
Settings -> Add-ons -> Family Dashboard -> Check for updates -> Update -> Restart

### Addon update via Puppeteer:
```js
const hass = document.querySelector('home-assistant').hass;
await hass.callWS({ type: 'supervisor/api', endpoint: '/store/reload', method: 'post' });
// wait 3s
await hass.callWS({ type: 'supervisor/api', endpoint: '/addons/c2ba14e6_family-dashboard/update', method: 'post' });
```

## Access URLs (Production)

| Environment | URL |
|-------------|-----|
| Desktop | http://192.168.1.2:8099 |
| Mobile | http://192.168.1.2:8099/mobile/ |
| Home Assistant | http://192.168.1.2:8123 |
| Remote | https://ha.99swanlane.uk |

## Common Tasks

### Add a new page
1. Create page component in `src/pages/` (desktop) and optionally `src/pages/mobile/` (mobile)
2. Add lazy import and route in `App.jsx` (desktop) and/or `MobileApp.jsx` (mobile)
3. Add nav link in `Navigation.jsx` (desktop header) and/or `MobileBottomTabBar.jsx` / `MobileMoreSheet.jsx`

### Add a new entity
```jsx
import { useEntity } from '../hooks/useEntity';
const { state, attributes, loading, error } = useEntity('sensor.my_sensor');
```

### Call an HA service
```jsx
import { useServiceCall } from '../hooks/useServiceCall';
const { callService } = useServiceCall();
callService('light', 'turn_on', { entity_id: 'light.my_light' });
```

## Environment

- **Machine:** Mac mini at 192.168.1.150
- **HA:** Raspberry Pi at 192.168.1.2
- **Wall panel:** 1920x1080
- **Git:** HTTPS with PAT stored in `~/.git-credentials`

## Tailwind v4 Gotcha

Do NOT use dynamic Tailwind class interpolation like `` `${color}` `` where color is `from-blue-500 to-blue-600`. Tailwind v4 JIT can't detect these at build time. Use inline styles for dynamic values.
