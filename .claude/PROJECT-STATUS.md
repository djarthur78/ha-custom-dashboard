# Project Status - Master Reference

> **Last Updated:** 2026-02-03
> **Purpose:** Comprehensive reference of all project context, phases, and plans

---

## Project Summary

**Name:** Family Dashboard for Home Assistant
**Type:** React web application replacing default HA Lovelace UI
**Device:** Wall-mounted 1920x1080 panel
**Production URL:** http://192.168.1.2:8099
**HA URL:** http://192.168.1.2:8123
**Login:** swanlane / swanlane

**Tech Stack:**
- React 19, Vite 7.3, Tailwind CSS v4
- WebSocket for real-time HA connection
- REST API for one-time queries

---

## Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Home Page | ✅ Complete | Dashboard overview |
| Calendar | ⚠️ Partial | View works, CRUD has bugs |
| Meal Planner | ✅ Complete | v1.0.2 deployed |
| Games Room | ❌ Not started | Planned |
| Cameras | ❌ Not started | Planned |
| Weather | ✅ Complete | Basic widget |

---

## Development Phases (Historical)

### Phase 0: Discovery ✅ COMPLETE
- Analyzed existing HA dashboard
- Documented all entities (calendars, cameras, lights, etc.)
- Defined MVP requirements
- Tagged: `discovery-complete`

### Phase 1: Foundation ✅ COMPLETE
- Set up React + Vite + Tailwind
- Implemented WebSocket singleton service
- Created routing with MainLayout
- Added basic pages structure
- Tagged: `phase-1-complete`

### Phase 2: Meal Planner ✅ COMPLETE (v1.0.2)
- Implemented meal grid with week selector
- Fixed data loading bugs
- Fixed WebSocket timing issues
- Deployed and tested

### Phase 3: Calendar (IN PROGRESS - BLOCKED)
- Calendar view implemented (multiple views: day, week, month, timeline)
- Event display working
- **BLOCKED:** CRUD operations failing with `return_response` error

---

## Current Bug: Calendar CRUD

**Error:**
```
Validation error: An action which does not return responses
can't be called with return_response=True
```

**Affects:** Create, Edit, Delete calendar events

**Root Cause:** The `return_response: true` parameter is being passed to HA calendar service calls that don't support returning responses.

**Previous Fix Attempt:** Commit `d1fb98f` removed `return_response: true` from calendar-service.js

**Current Status:** User reports errors still occurring - needs investigation

**Files to Check:**
1. `src/src/services/calendar-service.js` - Look for `return_response`
2. `src/src/components/features/calendar/EventModal.jsx` - Event form
3. `src/src/services/ha-websocket.js` - WebSocket send method

**Testing Approach:**
1. Run calendar-service tests to verify fix
2. Search codebase for any remaining `return_response: true`
3. Test at http://192.168.1.2:8099/calendar
4. Check browser console for actual error

---

## Repository Restructure Plan

**Document:** `MIGRATION-PLAN.md` (880 lines)

### Why Restructure?
1. Nested `src/src/` folder is confusing
2. Duplicate deployment configs in 3 locations
3. 19 archived docs (143KB) bloating repo
4. Scattered HA config files
5. Missing code standards (.editorconfig, .prettierrc)

### The 5 Phases

#### Phase 1: Safe Cleanup (LOW RISK)
- Delete duplicate deployment files from root
- Move 19 archived docs to `.archive/` (git-ignored)
- Consolidate HA configs into `ha-reference/`
- Delete obsolete scripts

**Files to Delete:**
- `Dockerfile.production` (root)
- `docker-compose.yml` (root)
- `nginx.production.conf` (root)
- `.env.pihole` (root)
- `get-docker.sh`
- `setup-dashboard-auto.sh`
- `deploy-to-pihole.sh`
- All files in `docs/archive/`

#### Phase 2: Directory Restructure (HIGH RISK)
- Rename `src/` → `app/`
- Rename `family-dashboard/` → `addon/`
- Rename `deploy-package/` → `deploy/`
- Add path aliases (`@`, `@config`) to vite.config.js
- Update import paths in source files
- Update build-addon.sh

**Key Path Changes:**
```
src/src/services/ha-websocket.js → app/src/services/ha-websocket.js
family-dashboard/config.json → addon/config.json
deploy-package/ → deploy/
```

#### Phase 3: Documentation Consolidation (LOW RISK)
- Move supplementary docs to `docs/` folder
- Delete redundant `CURRENT-SESSION-STATE.md`
- Update all path references in markdown files

**New Doc Structure:**
```
README.md              # Project overview
CLAUDE.md              # AI instructions
ARCHITECTURE.md        # Technical design
DEPLOYMENT.md          # Deployment guide
DEVELOPMENT.md         # Dev setup
CHANGELOG.md           # Version history
docs/
├── CLOUDFLARE-SETUP.md
├── DIAGRAMS.md
└── ROADMAP.md
```

#### Phase 4: Code Standards (LOW RISK)
- Add `.editorconfig`
- Add `.prettierrc`
- Add `.prettierignore`
- Update `.gitignore`
- Add format scripts to package.json

#### Phase 5: Update CLAUDE.md (LOW RISK)
- Update all paths for new structure
- Add path alias documentation
- Update project structure diagram

---

## Testing Infrastructure

**Added:** 2026-02-03
**Framework:** Vitest 4.0.17 with jsdom

**Test Coverage:**
| File | Tests | Purpose |
|------|-------|---------|
| `ha-websocket.test.js` | 25 | WebSocket service |
| `useEntity.test.js` | 12 | Entity hook |
| `useServiceCall.test.js` | 20 | Service call hook |
| `calendar-service.test.js` | 42 | Calendar API |
| **Total** | **99** | |

**Commands:**
```bash
cd src
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

---

## Context Management System

**Location:** `.claude/` directory

| File | Purpose |
|------|---------|
| `CURRENT-TASK.md` | Active task state - update before/after work |
| `SESSION-LOG.md` | Historical session log - update at session end |
| `WORKFLOW.md` | Standard operating procedures |
| `PROJECT-STATUS.md` | This file - master reference |
| `README.md` | System overview |

**Workflow:**
1. **Session Start:** Read CLAUDE.md → CURRENT-TASK.md → SESSION-LOG.md
2. **Before Major Task:** Create plan, update CURRENT-TASK.md
3. **During Work:** Commit frequently, update progress
4. **Session End:** Commit, push, update CURRENT-TASK.md and SESSION-LOG.md

---

## Key Files Reference

### Configuration
| File | Purpose |
|------|---------|
| `src/package.json` | React app dependencies |
| `src/vite.config.js` | Build configuration |
| `src/vitest.config.js` | Test configuration |
| `src/.env` | Environment variables (gitignored) |
| `family-dashboard/config.json` | HA add-on config |

### Core Services
| File | Purpose |
|------|---------|
| `src/src/services/ha-websocket.js` | WebSocket singleton |
| `src/src/services/ha-rest.js` | REST API client |
| `src/src/services/calendar-service.js` | Calendar API |

### Hooks
| File | Purpose |
|------|---------|
| `src/src/hooks/useEntity.js` | Entity state subscription |
| `src/src/hooks/useServiceCall.js` | HA service calls |
| `src/src/hooks/useHAConnection.js` | Connection management |

### Components
| Directory | Purpose |
|-----------|---------|
| `src/src/components/common/` | Shared components |
| `src/src/components/layout/` | Layout shells |
| `src/src/components/features/calendar/` | Calendar feature |
| `src/src/components/features/meals/` | Meal planner |

---

## Git Information

**Current Branch:** `claude/testing-ml5py25uui3t4xm4-VwukA`
**Main Branch:** `main`

**Tags:**
- `discovery-complete` - Discovery phase done
- `phase-1-complete` - Foundation complete

**Recent Commits (this session):**
```
af69e8a docs: Add comprehensive repository restructure migration plan
1383be5 Add testing infrastructure with Vitest and initial test suite
```

---

## Priority Queue

1. **HIGH:** Fix Calendar CRUD bugs (`return_response` issue)
2. **MEDIUM:** Execute Repository Restructure (MIGRATION-PLAN.md)
3. **LOW:** Implement Camera feeds page
4. **LOW:** Implement Games room controls
