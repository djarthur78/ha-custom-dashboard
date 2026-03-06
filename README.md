# Family Dashboard

Wall-mounted kitchen dashboard for Home Assistant. React 19 + Vite + Tailwind CSS v4.

**Version:** 2.3.0
**Device:** Android 14 PoE tablet (1920x1080)
**Access:** http://192.168.1.2:8099

## Features

- **Calendar** - 6 view modes, 8 Google calendars, event CRUD, weather integration
- **Meal Planner** - Two-week planning grid with inline editing
- **Games Room** - Harmony Hub scenes, climate control, light toggles
- **Music** - Sonos multi-room control, Spotify playlists, speaker grouping
- **People** - Family location tracking with Leaflet map
- **Health** - Oura Ring data (sleep, activity, heart rate) + cold plunge controls
- **Cameras** - 8 camera feeds (3 MJPEG streams, 5 snapshot), priority loading

## Quick Start

```bash
cd src
npm install
npm run dev          # http://localhost:5173
```

## Build & Deploy

```bash
cd src && npm run build
cd .. && ./build-addon.sh
git add -A && git commit -m "v2.3.0" && git push
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
│   ├── src/
│   │   ├── App.jsx               # Lazy-loaded routes
│   │   ├── components/
│   │   │   ├── layout/           # MainLayout, Navigation
│   │   │   ├── common/           # ErrorBoundary, LoadingSpinner, Toast
│   │   │   └── features/         # calendar, meals, games-room, music, people, health, cameras
│   │   ├── pages/                # Route page wrappers
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
├── config/                       # Entity mappings
└── docs/                         # Archive
```

## Architecture

**Connection:** Singleton WebSocket service manages a persistent connection to HA. All components share this instance via React hooks.

**Data flow:** HA -> WebSocket -> Service subscribers -> React hooks -> Components

**Routes:** All pages lazy-loaded with `React.lazy()` + `Suspense` for code splitting.

**Design:** Clean minimal - white cards, 1px `#e0e0e0` borders, 8px radius, no shadows. Accent colors via left stripe.

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
- **Remote:** https://ha.99swanlane.uk (Cloudflare tunnel)

## License

Private family project.
