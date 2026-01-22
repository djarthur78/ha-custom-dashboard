# Home Assistant Custom Dashboard

Modern, tablet-optimized web application replacing the existing HA "family calendar - panel" dashboard.

**Primary Device:** iPad (Kitchen Calendar tablet)
**Started:** 2026-01-17
**Current Phase:** Calendar Complete + Deployment Ready ✅

---

## 📌 Quick Start

**For Original Developer (Arthu) - Resuming Work:**
1. Read `SESSION-NOTES.md` (your personal notes)
2. Continue from where you left off

**For New Engineers - First Day:**
1. Read this `README.md` (project overview) ← You are here
2. Read `ARCHITECTURE.md` (how it's built)
3. Read `DEVELOPMENT.md` (how to set up and develop)
4. Read `CHANGELOG.md` (what's been done)
5. Read `specs/00-mvp-definition.md` (overall plan)

**Not Sure Which File to Read?**
- See `FILE-GUIDE.md` for quick reference

---

## Project Status

- ✅ **Phase 1: Foundation** - React + Vite + HA WebSocket (COMPLETE)
- ✅ **Phase 2A: Calendar** - Family calendar feature (COMPLETE)
- ✅ **Deployment: Add-on** - Home Assistant add-on ready (READY TO DEPLOY)
- 🔄 **Phase 2B: Meal Planner** - Meal planning (NEXT)
- ⏳ **Phase 2C: Games Room** - Games room controls (Pending)
- ⏳ **Phase 2D: Cameras** - Camera feeds (Pending)

### Calendar Features (Complete)
- ✅ 6 view modes: Day/List, Day/Schedule, Week/List, Week/Schedule, Month, Day
- ✅ Event creation, editing, deletion
- ✅ Recurring weekly events
- ✅ Weather integration with colorful icons
- ✅ 8 Google calendars with filtering
- ✅ Calendar color coding
- ✅ Waste collection countdown
- ✅ Touch-optimized for iPad
- ✅ Real-time updates via WebSocket

## Deployment to Home Assistant

The dashboard is packaged as a Home Assistant add-on and ready to deploy!

### Quick Deploy (Recommended)

1. In Home Assistant: **Settings** → **Add-ons** → **Add-on Store**
2. Click ⋮ menu → **Repositories**
3. Add: `https://github.com/djarthur78/ha-custom-dashboard`
4. Refresh, find "Family Dashboard", click **Install**
5. Start the add-on, enable "Show in sidebar"
6. Access from HA sidebar!

**See `DEPLOYMENT.md` for detailed instructions and troubleshooting.**

### Build Add-on Locally

```bash
./build-addon.sh  # Builds React app and prepares add-on
# Then copy family-dashboard/ folder to HA or push to GitHub
```

## Development Quick Start

### Local Development
```bash
cd src
npm install
npm run dev
```

### Access
- **Local:** http://localhost:5173/
- **iPad:** http://192.168.1.6:5173/

### Home Assistant
- **URL:** http://192.168.1.2:8123
- **Token:** Stored in `src/.env` (not in git)

## Documentation

| Document | Purpose | For Whom |
|----------|---------|----------|
| `README.md` | Project overview, quick start | Everyone (start here) |
| `DEPLOYMENT.md` | How to deploy to Home Assistant | Deployment (start here for deployment) |
| `FILE-GUIDE.md` | Which file to use when | Everyone (quick reference) |
| `SESSION-NOTES.md` | Working notes, how to resume | Original developer only |
| `ARCHITECTURE.md` | Technical design, decisions | Engineers (reference) |
| `DEVELOPMENT.md` | Setup guide, how to build | Engineers (daily use) |
| `CHANGELOG.md` | Features built, bugs fixed | Everyone (track progress) |
| `DIAGRAMS.md` | Architecture diagrams (Mermaid) | Everyone (visual reference) |
| `CLAUDE.md` | Instructions for Claude Code | AI assistant guidance |

---

## File Structure

### 📋 Build Prompts (Use these with Claude Code)
- `00-DISCOVERY-PROMPT.md` - Initial discovery phase
- `01-BUILD-PHASE-1-FOUNDATION.md` - Foundation build
- `02-BUILD-PHASE-2-CALENDAR.md` - Calendar feature (coming next)

### 📝 Working Notes
- `SESSION-NOTES.md` - How to resume work, session history

### 📚 Reference Documentation
- `discovery/` - All discovery findings
- `specs/` - Feature specifications (detailed requirements)
- `config/` - Entity mappings and automation details
- `operations/` - Testing, deployment, security plans

### 💻 Source Code
- `src/` - React application
  - `src/src/` - Application code
  - `src/src/components/` - React components
  - `src/src/services/` - HA WebSocket & REST services
  - `src/src/hooks/` - React hooks

## How to Resume

1. Read `SESSION-NOTES.md` to see what's been done
2. Check the current phase in this README
3. Read the corresponding build prompt (e.g., `02-BUILD-PHASE-2-CALENDAR.md`)
4. Start Claude Code and begin building

## Tech Stack

- **Frontend:** React 19 + Vite
- **Styling:** Tailwind CSS v4
- **HA Integration:** WebSocket + REST API
- **Icons:** Lucide React
- **Date/Time:** date-fns

## Network Setup (WSL2)

Port forwarding configured for iPad access:
```powershell
# Already configured - port 5173 forwarded to WSL2
netsh interface portproxy show all
```

## Git Tags

- `discovery-complete` - Discovery phase complete
- `phase-1-complete` - Foundation complete
- `calendar-complete` - Calendar feature complete (current)

## Next Steps

### Immediate
1. **Deploy to Home Assistant** - Follow `DEPLOYMENT.md` to install the add-on
2. **Test on iPad** - Verify calendar works on wall panel
3. **Add to Home Screen** - Create fullscreen iPad app

### Next Phase: Meal Planner (Phase 2B)
- Read `specs/02-meal-planner-spec.md`
- Build meals page with This Week/Next Week views
- Editable meal planning with HA input_text entities
- Shopping list integration
