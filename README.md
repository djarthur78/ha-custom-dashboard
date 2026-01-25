# Home Assistant Family Dashboard

Modern React web application for family organization - calendar, meals, entertainment controls, and cameras.

**Version:** 0.9.0
**Status:** Calendar Complete ✅ | Meal Planner Next 🎯
**Primary Device:** iPad (Kitchen Calendar Tablet)

---

## 🚀 Quick Access

**Direct URL:** http://192.168.1.2:8099
**HA Dashboard:** http://192.168.1.2:8123/arthur-dashboard

Works on iPad, desktop browsers, and HA Companion App. See [DEPLOYMENT.md](DEPLOYMENT.md) for full setup.

---

## 📋 Project Status

### ✅ Completed Features (v0.1-0.9)
- **Foundation:** React 19 + Vite + Tailwind v4 + HA WebSocket
- **Calendar:** 6 view modes + biweekly, event CRUD, weather integration, 8 calendars
- **Design:** Compact header with icons, date/time/weather display
- **Deployment:** HA add-on running on port 8099

### 🎯 Next Up
- **Meal Planner:** Two-week meal planning (Phase 2B)
- **Games Room:** Climate and entertainment controls (Phase 2C)
- **Cameras:** 9-camera grid view (Phase 2D)

See [ROADMAP.md](ROADMAP.md) for complete feature plan.

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| **[ROADMAP.md](ROADMAP.md)** | Complete plan - all phases and features |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | How to access and update the dashboard |
| **[CLAUDE.md](CLAUDE.md)** | Instructions for AI assistant (Claude Code) |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Technical design and decisions |
| **[DEVELOPMENT.md](DEVELOPMENT.md)** | Setup guide and development workflow |
| **[CHANGELOG.md](CHANGELOG.md)** | Version history and updates |

---

## 🛠️ Development Quick Start

```bash
# Local development
cd src
npm install
npm run dev
# Access: http://localhost:5173

# Build for production
npm run build

# Deploy to HA add-on
cd ..
./build-addon.sh
git add -A
git commit -m "Update dashboard"
git push
# Then: HA → Settings → Add-ons → Family Dashboard → Check for updates
```

---

## 🏗️ Tech Stack

- **Frontend:** React 19, Vite 7.3
- **Styling:** Tailwind CSS v4
- **HA Integration:** WebSocket (real-time) + REST API (queries)
- **Icons:** Lucide React
- **Date/Time:** date-fns
- **Deployment:** Docker container (Nginx)

---

## 📁 Project Structure

```
ha-custom-dashboard/
├── README.md                 # This file
├── ROADMAP.md                # Complete feature plan ⭐
├── DEPLOYMENT.md             # Access and deployment guide
├── CLAUDE.md                 # AI assistant instructions
├── ARCHITECTURE.md           # Technical design
├── DEVELOPMENT.md            # Development guide
├── CHANGELOG.md              # Version history
│
├── src/                      # React application
│   ├── src/                  # Application code
│   │   ├── components/       # React components
│   │   │   ├── layout/       # MainLayout, Navigation
│   │   │   ├── common/       # Shared components
│   │   │   └── features/     # Calendar, Meals, Games, Cameras
│   │   ├── services/         # HA WebSocket & REST clients
│   │   ├── hooks/            # React hooks (useEntity, useHAConnection)
│   │   └── constants/        # Colors, routes
│   ├── package.json
│   └── vite.config.js
│
├── family-dashboard/         # HA add-on
│   ├── build/                # Built React app (npm run build output)
│   ├── config.json           # Add-on metadata
│   ├── Dockerfile            # Container definition
│   ├── nginx.conf            # Web server config
│   └── run.sh                # Startup script
│
├── docs/                     # Additional documentation
│   └── archive/              # Historical docs (session notes, old attempts)
│
└── config/                   # Entity mappings (entities.json)
```

---

## 🎯 Current Features

### Calendar (Phase 2A - Complete)
- ✅ 6 view modes: Day/List, Day/Schedule, Week/List, Week/Schedule, Biweekly, Month
- ✅ Event creation, editing, deletion with modals
- ✅ Recurring weekly events
- ✅ 8 Google calendars (via HA integration)
- ✅ Person filtering (D, N, C, D buttons)
- ✅ Weather integration with colorful icons
- ✅ Waste collection countdown
- ✅ Real-time updates via WebSocket

### Design (v0.9 - Latest)
- ✅ Compact blue header with icon navigation
- ✅ Date, time, temperature in header
- ✅ Connected status indicator
- ✅ Single-line view selector with border
- ✅ Touch-optimized for iPad

---

## 🔜 Coming Next

### Phase 2B: Meal Planner
- Two-week meal planning grid
- 4 meals per day (Breakfast, Lunch, Dinner, Cakes)
- Inline editing with HA input_text entities
- Copy week function

### Phase 2C: Games Room
- Climate control (temperature, on/off)
- Entertainment system controls (Harmony activities)
- Device power toggles
- Status displays

### Phase 2D: Cameras
- 9-camera grid view
- Auto-refreshing snapshots
- Tap to expand full-screen
- Pinch to zoom

See [ROADMAP.md](ROADMAP.md) for detailed specs.

---

## 📞 Home Assistant Integration

**Connection:**
- URL: http://192.168.1.2:8123
- Auth: Long-lived access token (auto-configured in add-on)
- WebSocket: Real-time entity updates
- REST API: Calendar events, service calls

**Entities Used:**
- 8 Google calendars (calendar.*)
- Weather (weather.home)
- Test light (light.test_light)
- More entities as features are added

See `config/entities.json` for complete mapping.

---

## 🚢 Deployment

The dashboard runs as a Home Assistant add-on:
- **Repository:** https://github.com/djarthur78/ha-custom-dashboard
- **Add-on:** Family Dashboard
- **Port:** 8099 (direct access)
- **HA Dashboard:** Arthur Dashboard (iframe to :8099)

**Update process:**
1. Make changes locally
2. Build: `npm run build`
3. Copy to add-on: `./build-addon.sh`
4. Push to GitHub
5. HA: Settings → Add-ons → Check for updates

See [DEPLOYMENT.md](DEPLOYMENT.md) for full guide.

---

## 🤝 For AI Assistants

If you're Claude Code or another AI assistant helping with this project:
1. Read [CLAUDE.md](CLAUDE.md) - Complete project context and instructions
2. Read [ROADMAP.md](ROADMAP.md) - Understand what's built and what's next
3. Read [ARCHITECTURE.md](ARCHITECTURE.md) - Technical design patterns

**Key patterns:**
- Singleton WebSocket service (`ha-websocket.js`)
- Feature-based component organization
- Hooks for HA integration (`useEntity`, `useServiceCall`)
- Real-time state synchronization

---

## 📜 License

Private family project - not licensed for public use.

---

## 📝 Notes

**Development Environment:** WSL2 Ubuntu on Windows
**WSL2 Port Forwarding:** Port 5173 forwarded to Windows host for iPad access
**Home Assistant:** Running on Raspberry Pi @ 192.168.1.2
**Remote Access:** Cloudflare tunnel @ https://ha.99swanlane.uk

Last Updated: Jan 25, 2026
