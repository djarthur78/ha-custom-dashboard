# Deployment Guide

**Version:** 3.2.3
**Status:** Deployed and working

## Access Methods

| Method | URL | Notes |
|--------|-----|-------|
| Direct (local) | http://192.168.1.2:8099 | Desktop dashboard |
| Mobile (local) | http://192.168.1.2:8099/mobile/ | iPhone dashboard |
| Home Assistant | http://192.168.1.2:8123 | "Arthur Dashboard" in sidebar (native ingress) |
| Remote | https://ha.99swanlane.uk | Via Cloudflare tunnel |

## How It Works

The dashboard runs as a Home Assistant add-on in a Docker container:
- **Add-on:** Family Dashboard (`c2ba14e6_family-dashboard`)
- **Port:** 8099
- **Stack:** React SPA served by Nginx (desktop + mobile entry points)
- **Container:** Built from `family-dashboard/Dockerfile`
- **Sidebar:** Native ingress panel ("Arthur Dashboard") — no iframe or panel_custom needed
- **Phone redirect:** Client-side redirect in `index.html` sends phones (width < 768) to `/mobile/`

## Updating the Dashboard

### Step 1: Build

```bash
cd src && npm run build && cd ..
./build-addon.sh
```

### Step 2: Version bump

Update version in **three** files:
- `family-dashboard/config.json` (line 3)
- `src/package.json` (line 4)
- `src/src/pages/HomePage.jsx` (version display)

### Step 3: Push

```bash
git add -A
git commit -m "feat: description (vX.X.X)"
git push
```

### Step 4: Update addon

**Via HA UI:**
Settings -> Add-ons -> Family Dashboard -> Check for updates -> Update

**Via Puppeteer (automated):**
```js
const hass = document.querySelector('home-assistant').hass;
await hass.callWS({ type: 'supervisor/api', endpoint: '/store/reload', method: 'post' });
// Wait 3-5 seconds
await hass.callWS({ type: 'supervisor/api', endpoint: '/addons/c2ba14e6_family-dashboard/update', method: 'post' });
// Wait 15 seconds for rebuild
```

### Step 5: Verify

- Desktop: http://192.168.1.2:8099 — check version number
- Mobile: http://192.168.1.2:8099/mobile/ — check mobile layout
- Sidebar: Open HA → "Arthur Dashboard" in sidebar

## Wall Panel Setup

1. Open browser → http://192.168.1.2:8099
2. Add to Home Screen for fullscreen app experience
3. Dashboard auto-redirects to Calendar after 5 minutes of inactivity

## Mobile Access

Phones are automatically redirected to the mobile dashboard via client-side detection in `index.html`. The mobile dashboard has:
- Bottom tab bar navigation (5 tabs + More sheet)
- No inactivity timer
- Touch-optimized layouts

## HA Sidebar Panel (Ingress)

The "Arthur Dashboard" sidebar panel is a native HA ingress panel configured in `family-dashboard/config.json`:
```json
{
  "ingress": true,
  "ingress_port": 8099,
  "panel_icon": "mdi:view-dashboard",
  "panel_title": "Arthur Dashboard"
}
```

This works through HTTPS/Cloudflare without mixed-content issues.

## Remote Access (Cloudflare Tunnel)

The dashboard is accessible remotely via Cloudflare tunnel at https://ha.99swanlane.uk.

## Troubleshooting

### Dashboard won't load (port 8099)
1. Check add-on is running: Settings -> Add-ons -> Family Dashboard
2. Check logs in the add-on page
3. Restart the add-on

### "Disconnected" in header
1. Check HA is accessible: http://192.168.1.2:8123
2. Verify token in add-on configuration
3. Restart add-on
4. Hard refresh browser

### Addon won't update
1. Ensure git push completed
2. Run store reload: `hass.callWS({ type: 'supervisor/api', endpoint: '/store/reload', method: 'post' })`
3. Wait 5 seconds, then check addon info
4. If version_latest hasn't changed, the git push may not have included `family-dashboard/config.json`

### Same-version redeployment
Use rebuild instead of update:
```js
const hass = document.querySelector('home-assistant').hass;
await hass.callWS({ type: 'supervisor/api', endpoint: '/store/reload', method: 'post' });
// Wait 5 seconds
await hass.callWS({ type: 'supervisor/api', endpoint: '/addons/c2ba14e6_family-dashboard/rebuild', method: 'post' });
```

## SSH Access

```bash
ssh hassio@192.168.1.2
# Password: hassio
```
