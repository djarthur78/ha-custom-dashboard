# Session Notes - HA Dashboard Rebuild

> **📌 For Original Developer (Arthu) Only**
> These are YOUR working notes to resume between sessions.
> For new engineers, they should read README.md → ARCHITECTURE.md → DEVELOPMENT.md

**Date:** 2026-01-17 (Saturday)
**Project:** ha-custom-dashboard
**Status:** Phase 1 Foundation - ✅ COMPLETE

---

## Latest Session: Phase 1 Complete (2026-01-17 Afternoon/Evening)

### ✅ Phase 1 Foundation - COMPLETE ✅

**Built Complete React App:**
- ✅ Vite + React 19 project in `src/`
- ✅ Tailwind CSS v4 with dark theme (HA colors)
- ✅ PostCSS configured with `@tailwindcss/postcss`
- ✅ Environment variables (.env with HA token)
- ✅ Full project structure (components, services, hooks, config)

**HA Integration Complete:**
- ✅ WebSocket service with auto-reconnect (`ha-websocket.js`)
- ✅ REST API service (`ha-rest.js`)
- ✅ React hooks (useHAConnection, useEntity, useServiceCall)
- ✅ Connection status indicator component
- ✅ Error boundaries and loading states

**Critical Bug Fixed:**
- ✅ Entity loading stuck - RESOLVED
- Root cause: `useHAConnection` hook starting with hardcoded 'disconnected' state
- Multiple hook instances not syncing with singleton WebSocket service
- Fixed by initializing state from service: `useState(() => haWebSocket.getStatus())`

**Network Setup Complete:**
- ✅ Dev server at http://localhost:5173/
- ✅ WSL2 port forwarding: 192.168.1.6:5173 → 172.27.69.40:5173
- ✅ Windows Firewall rule for inbound TCP 5173
- ✅ iPad access working at http://192.168.1.6:5173/
- ✅ WebSocket connecting and authenticating successfully
- ✅ Entity state loading working

**Test Entity Working:**
- ✅ `light.reading_light` (Office Reading Lamp)
- ✅ Displays current state (on/off)
- ✅ Toggle button works
- ✅ Real-time updates working

---

## What We Did Today

### ✅ Session 1: Discovery (Morning)
1. **Project Setup**
   - Created `~/projects/ha-custom-dashboard/`
   - Initialized git repo
   - Saved discovery prompt to `00-DISCOVERY-PROMPT.md`
   - Set up .gitignore
   - Pushed to GitHub: https://github.com/djarthur78/ha-custom-dashboard

2. **Discovery Phase**
   - Ran comprehensive discovery using Claude Code (Sonnet 4.5)
   - Used hass-mcp MCP server to query HA
   - Generated complete documentation in markdown files
   - Created detailed specs for all features
   - Defined 7-week MVP plan

3. **Key Decisions Made**
   - Use HA calendar entities (not Google API) for MVP
   - Start with Calendar feature (highest priority)
   - 7-week phased approach
   - Primary device: iPad (Kitchen Calendar tablet)
   - Tech stack: React + Vite + Tailwind + HA WebSocket

4. **Git Commits**
   - Initial setup commit
   - Discovery complete commit
   - Tagged: `discovery-complete`

---

## Current State

### Project Structure
```
~/projects/ha-custom-dashboard/
├── .git/
├── .gitignore
├── .mcp.json                          ← MCP config (Puppeteer)
├── 00-DISCOVERY-PROMPT.md
├── 01-BUILD-PHASE-1-FOUNDATION.md
├── SESSION-NOTES.md                   ← This file
├── discovery/                         ← All discovery docs
├── specs/                             ← Feature specifications
├── operations/                        ← Testing/deployment plans
├── config/                            ← Entity mappings (JSON)
├── NEXT-STEPS.md
└── src/                               ← React app (Phase 1) ✅
    ├── .env                           ← HA token (gitignored)
    ├── .env.example
    ├── package.json
    ├── vite.config.js
    ├── postcss.config.js
    ├── README.md
    └── src/
        ├── components/
        │   └── common/                ← Reusable components
        ├── services/
        │   ├── ha-websocket.js        ← WebSocket client
        │   └── ha-rest.js             ← REST API client
        ├── hooks/
        │   ├── useHAConnection.js
        │   ├── useEntity.js
        │   └── useServiceCall.js
        ├── App.jsx                    ← Main app
        ├── main.jsx
        └── index.css                  ← Tailwind + theme
```

### Key Files to Review
- `specs/00-mvp-definition.md` - The master plan (7-week timeline)
- `specs/01-calendar-spec.md` - Calendar feature details
- `specs/02-meal-planner-spec.md` - Meal planning details
- `specs/03-games-room-spec.md` - Games room controls
- `specs/04-cameras-spec.md` - Camera feeds
- `NEXT-STEPS.md` - What to do next

---

## Home Assistant Details

**HA Instance:** http://192.168.1.2:8123  
**Remote Access:** https://ha.99swanlane.uk/  
**Access Token:** Stored in 1Password (or wherever you keep it)

**Key Features:**
- 8 Google Calendars (family members + special calendars)
- Meal Planner (This week/Next week, 4 meals × 7 days)
- Games Room Controls (Climate, Harmony, devices)
- 9 Camera Feeds

**Important Automations:**
- Games Room Start Movie
- Setup Games Room for Movie
- Setup Games Room for Sonos

---

## Development Environment

**Location:** `~/projects/ha-custom-dashboard/`  
**WSL2 Path:** `/home/arthu/projects/ha-custom-dashboard`  
**Windows Path:** `\\wsl$\Ubuntu\home\arthu\projects\ha-custom-dashboard`

**VS Code:** Opened with `code .` from project directory

**Terminal Setup:**
- Top terminal: Claude Code
- Bottom terminal: `npm run dev` (after Phase 1 built)

**Network:**
- PC IP: `192.168.1.6`
- iPad access: `http://192.168.1.6:5173`
- HA IP: `192.168.1.2`

---

## MCP Server Configuration

**hass-mcp:** Configured and working ✅
- Docker image: `voska/hass-mcp:latest`
- Connected to HA at http://192.168.1.2:8123
- Used for discovery and entity verification

**puppeteer:** Configured in `.mcp.json` ✅
- Package: `@modelcontextprotocol/server-puppeteer`
- Used for browser automation and debugging
- Requires Claude Code restart to activate

**Verify MCP:**
```bash
claude mcp list
# Should show: hass-mcp, puppeteer (after restart)
```

**Configuration File:** `.mcp.json` in project root

---

## Git Configuration

**User:**
```bash
git config --global user.name "arthu"
git config --global user.email "arthurdarren@gmail.com"
```

**Remote:** https://github.com/djarthur78/ha-custom-dashboard.git  
**Branch:** main

**Tags:**
- `discovery-complete` - After discovery phase

---

## Next Session - How to Resume

### Option A: Continue Phase 1 Debugging (RECOMMENDED)

**What:** Debug entity loading issue with Puppeteer browser tools

```bash
# 1. Navigate to project
cd ~/projects/ha-custom-dashboard

# 2. Start dev server (if not running)
cd src
npm run dev
# (Leave running in terminal)

# 3. In a NEW terminal, start Claude Code
claude

# 4. Tell Claude:
"Resume Phase 1 debugging. The dev server is at http://localhost:5173/ and entity loading is stuck. Use Puppeteer to inspect browser console."
```

**Expected:** Claude will use Puppeteer MCP to open browser, inspect console, and fix the entity loading issue.

### Option B: Check Phase 1 Status

```bash
# Navigate to project
cd ~/projects/ha-custom-dashboard

# Check what's been built
ls -la src/src/

# Review session notes
cat SESSION-NOTES.md

# Start Claude Code
claude

# Tell Claude:
"Show me Phase 1 status and what's left to complete"
```

### Option C: Start Fresh Build (if needed)

```bash
cd ~/projects/ha-custom-dashboard

# Start Claude Code
claude

# Tell Claude:
"Read 01-BUILD-PHASE-1-FOUNDATION.md and begin building Phase 1: Foundation"
```

---

## Phase 1 - Next Steps (When Ready)

**Goal:** Build React + Vite + Tailwind + HA Connection

**Steps:**
1. Read `01-BUILD-PHASE-1-FOUNDATION.md`
2. Start Claude Code
3. Give Claude the build prompt
4. Let it create the React app
5. Test HA connection
6. Test on iPad
7. Commit and tag `phase-1-foundation-complete`

**Expected Output:**
- Working React app at `src/`
- HA WebSocket connection working
- Can read entities and call services
- Tested on iPad at http://192.168.1.6:5173

---

## Important Commands Reference

### Git
```bash
# Status
git status
git log --oneline
git tag

# Commit
git add .
git commit -m "Your message"
git tag tagname

# Push to GitHub
git push origin main
git push --tags
```

### Claude Code
```bash
# Start
claude

# Check model
What model are you?

# Check usage
/usage

# Exit
/exit
```

### MCP
```bash
# List servers
claude mcp list

# Test connection
docker run -i --rm -e HA_URL=http://192.168.1.2:8123 -e HA_TOKEN=your_token voska/hass-mcp
```

### Node/NPM (after Phase 1)
```bash
cd src
npm install
npm run dev
npm run build
```

---

## Decisions for Next Session

### Calendar Approach - DECIDED
✅ Use HA's calendar entities (simpler)  
❌ Direct Google Calendar API (too complex for MVP)  
📝 Can enhance to Google API in v1.1

### Build Order - CONFIRMED
1. Phase 1: Foundation (2 weeks)
2. Phase 2A: Calendar (2 weeks)
3. Phase 2B: Meal Planner (1 week)
4. Phase 2C: Games Room (1 week)
5. Phase 2D: Cameras (1 week)

### Questions to Address Later
- [ ] Should we use TypeScript? (Optional, can add later)
- [ ] State management: Zustand or React Context?
- [ ] Testing: Set up Vitest from start or add later?
- [ ] Production deployment: How to serve on Pi?

---

## Resources

**Documentation:**
- Discovery docs: `discovery/*.md`
- Specs: `specs/*.md`
- Operations: `operations/*.md`

**HA Info:**
- Entity mappings: `config/entities.json`
- Automations: `config/automations.json`

**Prompts:**
- Discovery: `00-DISCOVERY-PROMPT.md`
- Build Phase 1: `01-BUILD-PHASE-1-FOUNDATION.md`

---

## Session End Checklist

Before closing this session:
- [x] All work committed to git
- [x] Session notes saved
- [x] Build prompt created
- [x] Next steps clear
- [ ] Any open questions documented above

---

## Contact & Support

**GitHub:** https://github.com/djarthur78/ha-custom-dashboard  
**HA Community:** https://community.home-assistant.io/  
**React Docs:** https://react.dev/  
**Tailwind Docs:** https://tailwindcss.com/  

---

**Ready to build when you return!** 🚀

Next session: Read `01-BUILD-PHASE-1-FOUNDATION.md` and start Phase 1.
