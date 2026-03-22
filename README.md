# Family Dashboard

Wall-mounted kitchen dashboard for Home Assistant. React 19 + Vite + Tailwind CSS v4.

**Version:** 3.2.3
**Devices:** 1920x1080 wall panel (desktop) + iPhone (mobile dashboard)
**Access:** http://192.168.1.2:8099 (desktop) | http://192.168.1.2:8099/mobile/ (mobile)

## Features

- **Calendar** - 6 view modes, 8 Google calendars, event CRUD, weather integration
- **Meal Planner** - Two-week planning grid with inline editing
- **Games Room** - Harmony Hub scenes, climate control, light toggles
- **Music** - Sonos multi-room control, Spotify playlists, speaker grouping, queue building
- **People** - Family location tracking with Leaflet map
- **Health** - Oura Ring data (sleep, activity, heart rate) + cold plunge controls
- **Cold Plunge** - Water temp, motion sensor, chiller status, device controls
- **Cameras** - 9 camera feeds (3 MJPEG streams, 6 snapshot), priority loading
- **Weather** - Ecowitt GW3000A indoor sensors + Met Office forecast
- **To-Do** - Todoist integration via HA (3 lists: Nic & Daz, This Week, This Month)
- **Mobile Dashboard** - iPhone-optimized layout with bottom tabs and swipe navigation

## Quick Start

```bash
cd src
npm install
npm run dev          # Desktop: http://localhost:5173
                     # Mobile:  http://localhost:5173/mobile/
```

## Build & Deploy

```bash
# Update version in THREE places:
#   family-dashboard/config.json
#   src/package.json
#   src/src/pages/HomePage.jsx

cd src && npm run build && cd ..
./build-addon.sh
git add -A && git commit -m "v3.2.3" && git push
# Then update addon via HA UI or Puppeteer
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment guide.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7.3 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Maps | Leaflet / React-Leaflet |
| Dates | date-fns |
| HA Integration | WebSocket (real-time) + REST API |
| Deployment | Docker (Nginx) as HA add-on |

## Project Structure

```
ha-custom-dashboard/
├── src/                          # React app
│   ├── index.html                # Desktop entry point
│   ├── mobile.html               # Mobile entry point
│   ├── src/
│   │   ├── App.jsx               # Desktop lazy-loaded routes
│   │   ├── MobileApp.jsx         # Mobile lazy-loaded routes
│   │   ├── main.jsx              # Desktop entry
│   │   ├── mobile-main.jsx       # Mobile entry (basename="/mobile")
│   │   ├── components/
│   │   │   ├── layout/           # MainLayout, Navigation
│   │   │   ├── mobile/           # MobileLayout, MobileBottomTabBar, MobileMoreSheet
│   │   │   ├── common/           # ErrorBoundary, LoadingSpinner, Toast
│   │   │   └── features/         # calendar, meals, games-room, music, people, health, cameras, todo, weather, cold-plunge
│   │   ├── pages/                # Desktop route pages
│   │   ├── pages/mobile/         # Mobile route pages (9 pages)
│   │   ├── hooks/                # useEntity, useHAConnection, useServiceCall
│   │   ├── services/             # ha-websocket.js (singleton), ha-rest.js
│   │   ├── utils/                # Helpers (calendar, weather, logger)
│   │   └── constants/            # Colors, calendars, routes
│   ├── package.json
│   └── vite.config.js
├── family-dashboard/             # HA add-on container
│   ├── build/                    # Built React app
│   ├── config.json               # Add-on metadata (version here)
│   ├── Dockerfile
│   ├── nginx.conf
│   └── run.sh
├── HA/                           # Home Assistant config files
└── config/                       # Entity mappings
```

## Architecture

**Connection:** Singleton WebSocket service manages a persistent connection to HA. All components share this instance via React hooks.

**Data flow:** HA -> WebSocket -> Service subscribers -> React hooks -> Components

**Desktop routes:** All pages lazy-loaded with `React.lazy()` + `Suspense` for code splitting.

**Mobile:** Separate Vite entry point (`mobile.html` → `mobile-main.jsx` → `MobileApp.jsx`), shares all hooks/services/features with desktop. Client-side redirect sends phones to `/mobile/`.

**HA Integration:** "Arthur Dashboard" native ingress sidebar panel, works via HTTPS/Cloudflare.

See [ARCHITECTURE.md](ARCHITECTURE.md) for details.

## Documentation

| File | Purpose |
|------|---------|
| [CLAUDE.md](CLAUDE.md) | AI assistant instructions |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical design |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Setup and workflow |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deployment and remote access |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

## Home Assistant

- **URL:** http://192.168.1.2:8123
- **Add-on slug:** `c2ba14e6_family-dashboard`
- **Port:** 8099 (direct access)
- **Sidebar:** "Arthur Dashboard" (native ingress panel)
- **Remote:** https://ha.99swanlane.uk (Cloudflare tunnel)

## License

Private family project.
