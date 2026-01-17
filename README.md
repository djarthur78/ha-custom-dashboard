# Home Assistant Custom Dashboard

Modern, tablet-optimized web application replacing the existing HA "family calendar - panel" dashboard.

## Project Status

- ✅ **Phase 1: Foundation** - React + Vite + HA WebSocket (COMPLETE)
- 🔄 **Phase 2A: Calendar** - Family calendar feature (NEXT)
- ⏳ **Phase 2B: Meal Planner** - Meal planning (Pending)
- ⏳ **Phase 2C: Games Room** - Games room controls (Pending)
- ⏳ **Phase 2D: Cameras** - Camera feeds (Pending)

## Quick Start

### Development
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
- `phase-1-complete` - Foundation complete (current)

## Next Session

Ready to start **Phase 2A: Family Calendar** (2 weeks)
- Read `specs/01-calendar-spec.md`
- Create `02-BUILD-PHASE-2-CALENDAR.md` build prompt
- Build calendar feature with week/day/month views
