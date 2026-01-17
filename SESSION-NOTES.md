# Session Notes - HA Dashboard Rebuild

**Date:** 2026-01-17 (Saturday)
**Project:** ha-custom-dashboard
**Status:** Discovery Complete, Ready to Build

---

## What We Did Today

### ✅ Completed
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
├── 00-DISCOVERY-PROMPT.md
├── 01-BUILD-PHASE-1-FOUNDATION.md    ← Build prompt ready
├── SESSION-NOTES.md                   ← This file
├── discovery/                         ← All discovery docs
├── specs/                             ← Feature specifications
├── operations/                        ← Testing/deployment plans
├── config/                            ← Entity mappings (JSON)
└── NEXT-STEPS.md                      ← Summary
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
- Used for discovery phase

**Verify MCP:**
```bash
claude mcp list
# Should show: hass-mcp
```

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

### 1. Navigate to Project
```bash
cd ~/projects/ha-custom-dashboard
```

### 2. Check What's Done
```bash
# Review progress
cat discovery/00-progress.md

# Check current state
git status
git log --oneline
git tag
```

### 3. Review Key Specs
```bash
# MVP plan
cat specs/00-mvp-definition.md

# Next steps
cat NEXT-STEPS.md
```

### 4. Start Building Phase 1
```bash
# Open VS Code
code .

# Start Claude Code (in VS Code terminal)
claude

# Tell Claude:
"Read 01-BUILD-PHASE-1-FOUNDATION.md and begin building Phase 1: Foundation"
```

### 5. Or Continue Discovery (if needed)
```bash
claude

# Tell Claude:
"Read discovery/00-progress.md and continue discovery from where we left off"
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
