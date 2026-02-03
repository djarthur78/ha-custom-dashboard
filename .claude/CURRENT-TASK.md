# Current Task

> **Last Updated:** 2026-02-03
> **Status:** IN_PROGRESS
> **Branch:** `claude/testing-ml5py25uui3t4xm4-VwukA`

---

## Project Background

React dashboard for Home Assistant, replacing the default Lovelace UI. Runs on a wall-mounted 1920x1080 panel. Key features: Calendar, Meal Planner, Games Room controls, Camera feeds.

**Tech:** React 19, Vite 7.3, Tailwind CSS v4
**Production URL:** http://192.168.1.2:8099
**Login:** swanlane / swanlane

---

## Previous Session (2026-01-26)

### Completed
- Meal Planner v1.0.2 - Fixed data loading, persistence, WebSocket timing bugs
- All meal features working and deployed

### Left Unfinished - Calendar CRUD Bugs ⚠️ HIGH PRIORITY

```
Error: Validation error: An action which does not return responses
       can't be called with return_response=True
```

**Affects:** Create, Edit, Delete calendar events

**Root Cause:** `return_response: true` being passed to HA service calls that don't support it.

**Supposedly Fixed:** Commit `d1fb98f` removed `return_response: true` from calendar-service.js - but user reports errors persist.

**Files to check:**
- `src/src/services/calendar-service.js` - Lines 123, 158, 194
- `src/src/components/features/calendar/EventModal.jsx`
- `src/src/services/ha-websocket.js`

---

## Current Session (2026-02-03)

### Completed This Session

1. **Testing Infrastructure** ✅
   - Vitest config, test scripts, mocks
   - 99 tests passing (ha-websocket, useEntity, useServiceCall, calendar-service)
   - Commit: `1383be5`

2. **Repository Analysis** ✅
   - Found nested `src/src/` structure issue
   - Found 19 obsolete archived docs (143KB)
   - Found duplicate deployment configs in 3 locations

3. **MIGRATION-PLAN.md** ✅
   - 5-phase restructure plan with rollback procedures
   - Commit: `af69e8a`

4. **Context Management System** ✅ (finalizing)
   - Created `.claude/` directory
   - CURRENT-TASK.md (this file)
   - SESSION-LOG.md, WORKFLOW.md, README.md
   - Updated CLAUDE.md with workflow

---

## Outstanding Work (Priority Order)

### 1. HIGH - Calendar CRUD Bugs

**Status:** Not yet started this session

**Next Steps:**
1. Search for `return_response` in codebase
2. Test at http://192.168.1.2:8099/calendar
3. Check browser console for actual error
4. Fix and redeploy

### 2. MEDIUM - Repository Restructure

**Plan:** `MIGRATION-PLAN.md`

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | PENDING | Safe cleanup - delete duplicates, archive old docs |
| Phase 2 | PENDING | Rename: src→app, family-dashboard→addon |
| Phase 3 | PENDING | Documentation consolidation |
| Phase 4 | PENDING | Add .editorconfig, .prettierrc |
| Phase 5 | PENDING | Update CLAUDE.md with new paths |

### 3. LOW - Future Features

- Camera feeds page
- Games room controls
- Weather widget improvements

---

## Progress Checklist (All Time)

### Completed
- [x] Discovery phase
- [x] Phase 1 foundation (React app, WebSocket, routing)
- [x] Meal planner feature (v1.0.2)
- [x] Testing infrastructure (99 tests)
- [x] Repository analysis
- [x] MIGRATION-PLAN.md created
- [x] Context management system setup

### In Progress
- [ ] Calendar CRUD bug fix (HIGH PRIORITY)
- [ ] Finalize context management in CLAUDE.md

### Pending
- [ ] Repository restructure Phase 1-5
- [ ] Camera feeds page
- [ ] Games room controls

---

## Context for Next Session

**Read order:**
1. `CLAUDE.md` - Project overview (includes context management instructions)
2. `.claude/CURRENT-TASK.md` - This file
3. `.claude/SESSION-LOG.md` - Session history
4. `MIGRATION-PLAN.md` - If doing restructure work

**Priority:**
1. Fix Calendar CRUD bugs first - this is blocking basic functionality
2. Then proceed with repository restructure

**Key insight:** The new tests cover calendar-service.js. We can verify the `return_response` fix with tests before deploying.

---

## Key Files

| File | Purpose |
|------|---------|
| `MIGRATION-PLAN.md` | 5-phase restructure plan |
| `CURRENT-SESSION-STATE.md` | Previous session notes (deprecated, use this file instead) |
| `CLAUDE.md` | Main AI instructions |
| `CHANGELOG.md` | Version history |
| `src/src/services/calendar-service.js` | Calendar API - check for `return_response` |
