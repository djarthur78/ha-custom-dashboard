# Claude Context Management

This directory contains files for maintaining context and state across AI development sessions.

## Purpose

Prevents "context rot" - the gradual loss of understanding that occurs when:
- Sessions end unexpectedly (token limits, timeouts)
- Multiple sessions work on the same codebase
- Complex tasks span multiple days
- Context window fills with irrelevant information

## Files

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `CURRENT-TASK.md` | Active task state and progress | Before/after every task |
| `SESSION-LOG.md` | Historical record of all sessions | End of each session |
| `WORKFLOW.md` | Standard operating procedures | When process changes |
| `README.md` | This file - system overview | Rarely |

## Quick Start

### Starting a New Session

```bash
# Read current state
cat .claude/CURRENT-TASK.md
cat .claude/SESSION-LOG.md

# Check git status
git status
git log --oneline -5
```

### During Work

1. Keep `CURRENT-TASK.md` updated with progress
2. Commit frequently with descriptive messages
3. Push to remote regularly

### Ending a Session

1. Commit all work (even WIP)
2. Update `CURRENT-TASK.md` with stopping point
3. Add entry to `SESSION-LOG.md`
4. Push to remote

## The Workflow

```
┌─────────────────────────────────────────────────────────┐
│                    SESSION START                         │
├─────────────────────────────────────────────────────────┤
│  1. Read CLAUDE.md (project overview)                   │
│  2. Read CURRENT-TASK.md (what's in progress)           │
│  3. Read SESSION-LOG.md (recent history)                │
│  4. Check git status                                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    PLAN FIRST                            │
├─────────────────────────────────────────────────────────┤
│  • For complex tasks: Create *-PLAN.md                  │
│  • For simple tasks: Update CURRENT-TASK.md checklist   │
│  • Never execute without a documented plan              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    EXECUTE                               │
├─────────────────────────────────────────────────────────┤
│  • Work through plan step by step                       │
│  • Commit after each logical unit                       │
│  • Update CURRENT-TASK.md progress                      │
│  • Push frequently                                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    SESSION END                           │
├─────────────────────────────────────────────────────────┤
│  1. Commit all changes (even WIP)                       │
│  2. Push to remote                                       │
│  3. Update CURRENT-TASK.md with state                   │
│  4. Add entry to SESSION-LOG.md                         │
└─────────────────────────────────────────────────────────┘
```

## File Templates

### CURRENT-TASK.md Structure

```markdown
# Current Task

> **Last Updated:** YYYY-MM-DD
> **Status:** IN_PROGRESS | COMPLETED | BLOCKED
> **Branch:** `branch-name`

## Active Task
[What you're working on]

## Progress Checklist
- [x] Completed item
- [ ] Pending item

## Context for Next Session
[What the next session needs to know]
```

### SESSION-LOG.md Entry

```markdown
## Session: YYYY-MM-DD

**Branch:** `branch-name`
**Focus:** Brief description

### Completed
1. Task completed

### Commits
```
hash message
```

### Next Steps
1. What to do next
```

## Integration with CLAUDE.md

The main `CLAUDE.md` file in the repository root references this context system. When the AI starts a session, it should:

1. Read `CLAUDE.md` for project understanding
2. Read `.claude/CURRENT-TASK.md` for current state
3. Read `.claude/SESSION-LOG.md` for recent context
4. Begin work following `.claude/WORKFLOW.md`
