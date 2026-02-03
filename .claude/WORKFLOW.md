# Claude Development Workflow

Standard operating procedure for AI-assisted development sessions.

---

## The Golden Rule

> **PLAN → SAVE → EXECUTE → SAVE**
>
> Never start executing without a saved plan. Never end without saving state.

---

## Session Lifecycle

### 1. SESSION START (First 5 minutes)

**Read context files in order:**

```bash
# 1. Read main instructions
cat CLAUDE.md

# 2. Read current task state
cat .claude/CURRENT-TASK.md

# 3. Read recent session history
cat .claude/SESSION-LOG.md

# 4. Check git status
git status
git log --oneline -5
```

**Update CURRENT-TASK.md:**
- Set `Status: IN_PROGRESS`
- Update `Last Updated` date
- Note what you're about to work on

### 2. BEFORE ANY MAJOR TASK

**Create a plan first:**

For complex tasks (>30 min estimated):
1. Create/update a `*-PLAN.md` file
2. Break task into phases
3. List specific files to modify
4. Define success criteria
5. Document rollback procedure

For simple tasks:
1. Add to CURRENT-TASK.md checklist
2. Note expected changes

**Example planning block:**
```markdown
## Task: Add user authentication

### Plan
1. Create auth service (`src/services/auth.js`)
2. Add login hook (`src/hooks/useAuth.js`)
3. Create login page (`src/pages/LoginPage.jsx`)
4. Update App.jsx with protected routes

### Success Criteria
- [ ] User can log in
- [ ] Invalid credentials show error
- [ ] Session persists on refresh

### Rollback
git reset --hard HEAD~1
```

### 3. DURING EXECUTION

**Commit frequently:**
- Commit after each logical unit of work
- Use descriptive commit messages
- Push to remote branch regularly

**Update progress:**
- Check off completed items in CURRENT-TASK.md
- Note any blockers or decisions

**If running low on context/tokens:**
1. STOP current work
2. Commit any changes
3. Update CURRENT-TASK.md with exact stopping point
4. Update SESSION-LOG.md with session summary
5. Push to remote

### 4. SESSION END

**Always perform these steps:**

```bash
# 1. Commit any uncommitted work
git status
git add <files>
git commit -m "WIP: <description>"

# 2. Push to remote
git push
```

**Update context files:**

1. **CURRENT-TASK.md:**
   - Update progress checklist
   - Note "Context for Next Session"
   - Set status (COMPLETED/IN_PROGRESS/BLOCKED)

2. **SESSION-LOG.md:**
   - Add session entry with date
   - List what was completed
   - List commits made
   - Note next steps

---

## File Purposes

| File | When to Read | When to Write |
|------|--------------|---------------|
| `CLAUDE.md` | Session start | When project structure changes |
| `.claude/CURRENT-TASK.md` | Session start | Before/after every task |
| `.claude/SESSION-LOG.md` | Session start | Session end |
| `*-PLAN.md` files | Before executing that plan | Before complex tasks |
| `CHANGELOG.md` | When checking history | After releases |

---

## Preventing Context Rot

### Signs of Context Rot
- Forgetting what was already done
- Re-reading files unnecessarily
- Making changes that conflict with previous work
- Losing track of the current goal

### Prevention Strategies

1. **Checkpoint frequently**
   - Update CURRENT-TASK.md every 30 minutes
   - Commit every logical unit of work

2. **Use specific references**
   - Note exact file paths: `src/services/auth.js:42`
   - Reference commit hashes: `Fixed in a1b2c3d`

3. **Keep active context small**
   - Focus on one task at a time
   - Complete and close before starting new work

4. **Document decisions immediately**
   - Why was this approach chosen?
   - What alternatives were considered?

---

## Quick Reference Commands

```bash
# Start of session
cat .claude/CURRENT-TASK.md
git status

# Before complex task
# Create/update plan file first

# During work
git add <files> && git commit -m "message"

# End of session
git status
git push
# Update .claude/CURRENT-TASK.md
# Update .claude/SESSION-LOG.md
```

---

## Emergency Recovery

If context is lost mid-session:

1. **Check git log:**
   ```bash
   git log --oneline -10
   git diff HEAD~1
   ```

2. **Read context files:**
   ```bash
   cat .claude/CURRENT-TASK.md
   cat .claude/SESSION-LOG.md
   ```

3. **Check for WIP commits:**
   ```bash
   git log --grep="WIP" --oneline
   ```

4. **Review recent file changes:**
   ```bash
   git diff --stat HEAD~5
   ```
