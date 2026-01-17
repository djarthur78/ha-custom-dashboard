# File Structure Guide

**Quick reference: Which file to use when**

---

## 🎯 For YOU (Original Developer - Arthu)

### When You Resume Work
1. **Read:** `SESSION-NOTES.md` (your personal notes, what you did last time)
2. **Check:** `CHANGELOG.md` (what's been built, bugs fixed)
3. **Start:** Claude Code and continue from where you left off

### When Starting New Phase
1. **Read:** Corresponding build prompt (`02-BUILD-PHASE-2-CALENDAR.md`)
2. **Review:** Spec file in `specs/` for requirements
3. **Update:** `SESSION-NOTES.md` as you work
4. **Update:** `CHANGELOG.md` when features complete

---

## 👥 For NEW ENGINEERS (Handoff/Support)

### First Day Onboarding
1. **Read:** `README.md` (project overview, current status)
2. **Read:** `ARCHITECTURE.md` (how it's built, design decisions)
3. **Read:** `DEVELOPMENT.md` (how to set up and develop)
4. **Read:** `CHANGELOG.md` (what's been done, bugs fixed)
5. **Review:** `specs/00-mvp-definition.md` (overall plan)

### Daily Development
1. **Reference:** `DEVELOPMENT.md` (common tasks, how-tos)
2. **Reference:** `ARCHITECTURE.md` (design patterns, best practices)
3. **Reference:** `specs/` (feature requirements)

### Debugging
1. **Check:** `CHANGELOG.md` (known bugs, fixed bugs)
2. **Check:** `ARCHITECTURE.md` → Troubleshooting section
3. **Check:** Browser console (look for `[HA WebSocket]` logs)

---

## 📋 File Purposes

### Documentation Files

| File | Purpose | For Whom | Update When |
|------|---------|----------|-------------|
| `README.md` | Project overview, quick start | Everyone (start here) | Phase changes, major updates |
| `SESSION-NOTES.md` | Working notes, how to resume | Original developer only | After each session |
| `ARCHITECTURE.md` | Technical design, decisions | Engineers (reference) | Architecture changes |
| `DEVELOPMENT.md` | Setup guide, how-tos | Engineers (daily use) | New patterns, tools, processes |
| `CHANGELOG.md` | What's been built, bugs fixed | Everyone (track changes) | Features complete, bugs fixed |
| `FILE-GUIDE.md` | This file (which file when) | Everyone (quick ref) | File structure changes |

### Build Prompts (For Claude Code)

| File | Purpose | Status |
|------|---------|--------|
| `00-DISCOVERY-PROMPT.md` | Discovery phase instructions | ✅ Complete |
| `01-BUILD-PHASE-1-FOUNDATION.md` | Phase 1 build instructions | ✅ Complete |
| `02-BUILD-PHASE-2-CALENDAR.md` | Phase 2A build instructions | ⏳ Not created yet |

### Reference Documentation

| Folder | Purpose | Updated When |
|--------|---------|--------------|
| `discovery/` | Discovery findings (static) | Discovery phase only |
| `specs/` | Feature requirements | Requirements change |
| `config/` | Entity mappings | Entities added/removed |
| `operations/` | Testing, deployment plans | Process changes |

### Source Code

| Folder | Purpose |
|--------|---------|
| `src/` | React application |
| `src/src/` | Application code |
| `src/src/components/` | React components |
| `src/src/services/` | HA integration services |
| `src/src/hooks/` | React hooks |

---

## 🔄 When to Update What

### After Each Work Session
- ✅ Update `SESSION-NOTES.md` (what you did, what's next)
- ✅ Commit code with good commit message
- ✅ Push to GitHub

### When Feature Complete
- ✅ Update `CHANGELOG.md` (add feature to relevant phase section)
- ✅ Update `README.md` (change phase status)
- ✅ Tag git commit (e.g., `phase-2a-complete`)

### When Bug Fixed
- ✅ Update `CHANGELOG.md` (add to "Fixed" section)
- ✅ Document in commit message
- ✅ Update `ARCHITECTURE.md` if design changed

### When Architecture Changes
- ✅ Update `ARCHITECTURE.md` (design decisions, data flow)
- ✅ Update `DEVELOPMENT.md` (if new patterns added)
- ✅ Update `CHANGELOG.md` (breaking changes)

### When New Phase Starts
- ✅ Create new build prompt (`0X-BUILD-PHASE-X-*.md`)
- ✅ Update `README.md` (phase status)
- ✅ Update `SESSION-NOTES.md` (current focus)

---

## 📖 Reading Order

### For Original Developer Resuming Work
```
SESSION-NOTES.md → Start working
```

### For New Engineer First Day
```
README.md
  ↓
ARCHITECTURE.md
  ↓
DEVELOPMENT.md
  ↓
CHANGELOG.md
  ↓
specs/00-mvp-definition.md
  ↓
Start developing
```

### For Support Engineer Debugging
```
CHANGELOG.md (recent bugs?)
  ↓
ARCHITECTURE.md (troubleshooting section)
  ↓
Browser console (check logs)
  ↓
DEVELOPMENT.md (common issues)
```

---

## 🎓 Examples

### Scenario 1: You're resuming after a weekend
```
1. Read SESSION-NOTES.md
   → "Last session: Fixed entity loading bug, tested on iPad"
2. Check what's next
   → "Next: Start Phase 2A Calendar feature"
3. Read 02-BUILD-PHASE-2-CALENDAR.md (when created)
4. Start building
```

### Scenario 2: New engineer joins project
```
1. Read README.md
   → Understand what the project is
2. Read ARCHITECTURE.md
   → Understand how it's built
3. Read DEVELOPMENT.md
   → Set up environment, start dev server
4. Read CHANGELOG.md
   → See what's been done
5. Make first change following DEVELOPMENT.md patterns
```

### Scenario 3: Support engineer investigates bug
```
1. Read CHANGELOG.md
   → Check known bugs, recent fixes
2. Check ARCHITECTURE.md troubleshooting
   → Common issues and solutions
3. Look at browser console
   → Check for error logs
4. Read DEVELOPMENT.md debugging section
   → Try suggested fixes
```

---

## 💡 Quick Tips

### Don't Read SESSION-NOTES.md If...
- You're a new engineer (read README.md instead)
- You're doing a handoff (read ARCHITECTURE.md instead)
- You're debugging (read CHANGELOG.md first)

### DO Read SESSION-NOTES.md If...
- You're the original developer (Arthu)
- You're resuming after a break
- You want to know what happened last session

### Update CHANGELOG.md When...
- ✅ Feature is complete and tested
- ✅ Bug is fixed and verified
- ✅ Breaking change is made
- ✅ Dependencies are updated

### Update ARCHITECTURE.md When...
- ✅ Design decision is made
- ✅ New pattern is introduced
- ✅ Data flow changes
- ✅ Integration method changes

### Update DEVELOPMENT.md When...
- ✅ New tool is added
- ✅ New common task is identified
- ✅ Setup process changes
- ✅ New debugging technique found

---

## ✅ File Maintenance Checklist

Before ending each session:
- [ ] Code committed with good message
- [ ] SESSION-NOTES.md updated (what you did, what's next)
- [ ] If feature complete: CHANGELOG.md updated
- [ ] If bug fixed: CHANGELOG.md updated
- [ ] If architecture changed: ARCHITECTURE.md updated
- [ ] Changes pushed to GitHub

Before starting new phase:
- [ ] New build prompt created
- [ ] README.md phase status updated
- [ ] SESSION-NOTES.md updated with new focus
- [ ] Review relevant spec file in specs/

---

**Remember:**
- `SESSION-NOTES.md` = Your personal notes
- `README.md` = Everyone's starting point
- `ARCHITECTURE.md` = How it works
- `DEVELOPMENT.md` = How to build
- `CHANGELOG.md` = What's been done

---

**Last Updated:** 2026-01-17
