# Deployment Guide

**Version:** 2.3.0
**Status:** Deployed and working

## Access Methods

| Method | URL | Notes |
|--------|-----|-------|
| Direct (local) | http://192.168.1.2:8099 | Primary access |
| Home Assistant | http://192.168.1.2:8123 | Arthur Dashboard in sidebar |
| Remote | https://ha.99swanlane.uk | Via Cloudflare tunnel |

## How It Works

The dashboard runs as a Home Assistant add-on in a Docker container:
- **Add-on:** Family Dashboard (`c2ba14e6_family-dashboard`)
- **Port:** 8099
- **Stack:** React SPA served by Nginx
- **Container:** Built from `family-dashboard/Dockerfile`

## Updating the Dashboard

### Step 1: Build

```bash
cd src && npm run build && cd ..
./build-addon.sh
```

### Step 2: Version bump

Update version in **both** files:
- `family-dashboard/config.json` (line 3)
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

Open http://192.168.1.2:8099 and check version number.

## Tablet Setup

### Android Tablet (PoE)

1. Open Chrome -> http://192.168.1.2:8099
2. Menu -> Add to Home Screen -> "Family Dashboard"
3. Launch from home screen for fullscreen app experience

### iPad (alternative)

1. Safari -> http://192.168.1.2:8099
2. Share -> Add to Home Screen

## Remote Access (Cloudflare Tunnel)

The dashboard is accessible remotely via Cloudflare tunnel.

### Setup

1. Log in to https://dash.cloudflare.com
2. Zero Trust -> Access -> Tunnels
3. Configure existing tunnel, add public hostname:
   - Subdomain: `dashboard`
   - Domain: `99swanlane.uk`
   - Type: HTTP
   - URL: `192.168.1.2:8099`

### HA Dashboard (iframe)

The "Arthur Dashboard" in HA sidebar uses an iframe:
```json
{
  "url": "https://dashboard.99swanlane.uk"
}
```

Config location: `/config/.storage/lovelace.arthur_dashboard` on HA

### Mixed Content Fix

If HA is accessed via HTTPS (Cloudflare) but dashboard uses HTTP, browsers block the iframe. Solution: route dashboard through Cloudflare too, so both are HTTPS.

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

## SSH Access

```bash
ssh hassio@192.168.1.2
# Password: hassio
```
