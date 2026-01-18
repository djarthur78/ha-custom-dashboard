# Claude Code Efficiency Guide

**Quick reference for maximizing Claude Code effectiveness while minimizing token usage**

---

## 🎯 Golden Rules

1. **Always check for skills first** (`/help`)
2. **Use `/commit` for ALL git commits**
3. **Use Task/Explore for codebase searching**
4. **Choose the right model for the task**
5. **Ask for efficiency suggestions when unsure**

---

## ⚡ Quick Decision Trees

### Should I Use a Skill?

```
Want to commit code?
  → YES: Use /commit

Want to review a PR?
  → YES: Use /review-pr [PR_NUMBER]

Want to explain code?
  → YES: Use /explain

Want to check usage?
  → YES: Use /usage
```

**Key Insight:** Skills are optimized and usually more efficient than manual operations.

---

### Which Model Should I Use?

```
SIMPLE TASKS (Use Haiku - 70% cheaper):
  ✅ Fix a typo
  ✅ Add a console.log
  ✅ Read a single file
  ✅ Simple grep/glob
  ✅ Format code
  ✅ Add comments
  ✅ Rename variables

COMPLEX TASKS (Use Sonnet - Current default):
  ✅ Debug unknown issues
  ✅ Architecture decisions
  ✅ Design new features
  ✅ Complex refactoring
  ✅ Write comprehensive docs
  ✅ Fix tricky bugs
  ✅ Code reviews
```

**How to specify:**
```javascript
"Use Haiku to add console.log statements to the useEntity hook"
```
Claude will use the Haiku model for that task.

---

### Should I Use Task Tool or Do It Manually?

```
EXPLORATION TASKS (Use Task with subagent_type=Explore):
  ✅ "Find where isConnected is defined"
  ✅ "Search for all calendar-related components"
  ✅ "How does authentication work in this codebase?"
  ✅ "Find all files that import useEntity"
  ✅ "What are the different entity types used?"

NEEDLE QUERIES (Do it manually - faster):
  ✅ "Read src/App.jsx"
  ✅ "Find files matching *.test.js"
  ✅ "Grep for 'TODO' in current directory"

PLANNING TASKS (Use Task with subagent_type=Plan):
  ✅ "Plan how to implement calendar feature"
  ✅ "Design the meal planner architecture"
  ✅ "Create implementation strategy for camera feeds"
```

**Example:**
```
❌ BAD: "Read all files and find where calendar entities are used"
✅ GOOD: "Use Explore agent to find where calendar entities are used"
```

---

## 🛠️ Essential Skills & Commands

### Git Operations

| Task | Command | Savings |
|------|---------|---------|
| Commit changes | `/commit` | ~1,000 tokens |
| Review PR | `/review-pr 123` | ~500 tokens |
| Create PR | `/pr` | Variable |

**Example:**
```
Instead of:
  "Stage all files, commit with message about bug fix, push to GitHub"

Just type:
  /commit
```

---

### Code Exploration

| Task | Tool/Agent | Syntax |
|------|------------|--------|
| Search codebase | Task (Explore) | "Use Explore agent to find..." |
| Read specific file | Read tool | "Read src/App.jsx" |
| Find pattern | Grep tool | "Grep for 'useEntity' in src/" |
| List files | Glob tool | "Glob **/*.jsx" |

**Example:**
```
❌ INEFFICIENT:
"Read src/hooks/useEntity.js then useHAConnection.js then useServiceCall.js
and tell me how they work together"

✅ EFFICIENT:
"Use Explore agent to explain how the hooks in src/hooks/ work together"
```

---

### Documentation

| Task | When | Tool/Approach |
|------|------|---------------|
| Create docs | MVP complete | Manual or ask Claude |
| Update docs | Feature complete | Manual edit |
| Generate API docs | Codebase large | Consider external tools |
| Diagrams | As needed | Mermaid (text-based) |

**Example:**
```
❌ INEFFICIENT:
"Create comprehensive documentation for Phase 1"

✅ EFFICIENT:
"Create essential docs (README, ARCHITECTURE basics) for Phase 1.
Full docs suite when MVP is complete."
```

---

## 📋 Efficiency Patterns

### Pattern 1: Batch Operations

```javascript
❌ INEFFICIENT (Sequential):
"Read src/App.jsx"
[wait for response]
"Now read src/hooks/useEntity.js"
[wait for response]
"Now read src/services/ha-websocket.js"

✅ EFFICIENT (Parallel):
"Read these files in parallel:
- src/App.jsx
- src/hooks/useEntity.js
- src/services/ha-websocket.js"
```

**Savings:** 2-3x faster, similar tokens

---

### Pattern 2: Targeted Debugging

```javascript
❌ INEFFICIENT:
"Add console.log to every function to debug"
[Add 20 logs]
[Test]
[Remove 20 logs]

✅ EFFICIENT:
"Add targeted logging to:
1. useEntity hook - when state changes
2. ha-websocket.js - when messages received
Keep logs minimal and informative."
```

**Savings:** ~2,000 tokens

---

### Pattern 3: Incremental Documentation

```javascript
❌ INEFFICIENT:
Phase 1: Create full doc suite (5 files, 2000 lines)

✅ EFFICIENT:
Phase 1: README + Basic ARCHITECTURE
Phase 2: Add feature-specific docs
MVP: Complete DEVELOPMENT + CHANGELOG
v1.0: Full documentation suite
```

**Savings:** ~20,000 tokens deferred, still get full docs eventually

---

### Pattern 4: Grep Before Read

```javascript
❌ INEFFICIENT:
"Read all 50 component files and find which ones use useEntity"

✅ EFFICIENT:
"Grep for 'useEntity' in src/components/**/*.jsx"
[Get list of 5 files]
"Now read those 5 files"
```

**Savings:** ~10,000 tokens (avoided reading 45 unnecessary files)

---

### Pattern 5: Use MCP When Available

```javascript
❌ INEFFICIENT:
"Go to HA web UI and check if light.reading_light exists"

✅ EFFICIENT:
"Use hass-mcp to get entity light.reading_light"
```

**Savings:** No browser context needed, cleaner, faster

---

## 🎓 Advanced Tips

### 1. **Ask for Concise Responses**

```
"Fix the typo in README.md. Just confirm when done, no explanation needed."
```

vs.

```
"Fix the typo in README.md"
[Gets 500-word explanation of the typo, why it matters, etc.]
```

**When to use:**
- Simple tasks you understand
- Routine operations
- When you trust Claude to do it right

**When NOT to use:**
- Complex bugs
- Architecture decisions
- Learning new patterns

---

### 2. **Specify Output Format**

```
❌ VERBOSE:
"List all the calendar entities"
[Gets formatted table, explanations, counts, summaries]

✅ CONCISE:
"List calendar entities as a simple bullet list, entity IDs only"
```

---

### 3. **Use Context Efficiently**

```
❌ REPEAT CONTEXT:
Session 1: "The entity loading is stuck because..."
Session 2: "Remember yesterday when the entity loading was stuck because..."

✅ REFERENCE DOCS:
Session 2: "Check CHANGELOG.md for Bug #1, I'm seeing similar behavior"
```

---

### 4. **Break Large Tasks Into Phases**

```
❌ LARGE REQUEST:
"Build the entire calendar feature with week/day/month views,
8 calendars, filtering, color coding, touch UI, and full documentation"

✅ PHASED:
Phase 1: "Build basic calendar week view, single calendar"
Phase 2: "Add day/month view toggles"
Phase 3: "Add multi-calendar support with filtering"
Phase 4: "Polish UI and document"
```

**Benefits:**
- Can use Haiku for simple phases
- Easier to debug
- More flexible
- Better git history

---

## 📊 Token Usage Estimates

| Operation | Tokens (Approx) | Optimized |
|-----------|-----------------|-----------|
| Simple file edit | 2,000 | 500 (Haiku) |
| Complex debugging | 10,000 | 10,000 (Sonnet needed) |
| Codebase exploration (manual) | 5,000 | 2,000 (Explore agent) |
| Git commit (manual) | 1,000 | 100 (use /commit) |
| Read 5 files (sequential) | 8,000 | 3,000 (parallel) |
| Full documentation suite | 25,000 | Defer until needed |
| Architecture diagram | 5,000 | 5,000 (Mermaid is optimal) |

---

## 🚀 Session Startup Checklist

**At the start of each session:**

1. **Check available skills**
   ```bash
   /help
   ```

2. **Check MCP servers**
   ```bash
   claude mcp list
   ```

3. **Review session notes**
   ```
   "Read SESSION-NOTES.md and summarize what's next"
   ```

4. **Set expectations**
   ```
   "For this session:
   - Use concise responses for simple tasks
   - Use /commit for all git operations
   - Ask me before large documentation efforts"
   ```

---

## ⚠️ Common Mistakes to Avoid

### 1. **Not Using /commit**
```
❌ "git add ., commit, and push with message about X"
✅ /commit
```

### 2. **Over-documenting Too Early**
```
❌ Phase 1: Create 5 documentation files
✅ Phase 1: Essential docs only
```

### 3. **Sequential File Reads**
```
❌ "Read App.jsx" → "Read useEntity.js" → "Read ha-websocket.js"
✅ "Read App.jsx, useEntity.js, and ha-websocket.js in parallel"
```

### 4. **Not Using Explore Agent**
```
❌ "Read all files in src/ and find where X is used"
✅ "Use Explore agent to find where X is used"
```

### 5. **Using Sonnet for Simple Tasks**
```
❌ "Fix this typo: 'teh' → 'the'" [Uses Sonnet - expensive]
✅ "Use Haiku to fix this typo: 'teh' → 'the'"
```

---

## 🎯 Model Selection Quick Reference

### Always Use Haiku For:
- Typos
- Formatting
- Adding logs
- Simple refactors
- Reading small files
- Basic grep/glob
- Adding comments

### Always Use Sonnet For:
- Unknown bugs
- Architecture design
- Complex refactors
- Large codebase analysis
- Code reviews
- Writing algorithms
- Performance optimization

### Ask Claude Which to Use:
- Medium complexity tasks
- Unsure of difficulty
- First time doing something

---

## 💡 Pro Tips

### Tip 1: Front-load Clarifications
```
❌ Start working → Hit blocker → Ask question → Wait → Continue
✅ "Before I start, what approach should I use for X?"
```

### Tip 2: Use Task Tool for Long-Running Work
```
"Use Plan agent to design calendar feature implementation,
then present the plan for approval before building"
```

### Tip 3: Leverage Git History
```
"Look at recent commits to understand the pattern,
then apply the same pattern to this new feature"
```

### Tip 4: Use Examples
```
❌ "Add a new hook for calendar entities"
✅ "Add a new hook for calendar entities, following the same pattern as useEntity.js"
```

### Tip 5: Be Specific About Scope
```
❌ "Improve the code"
✅ "Refactor useEntity hook to reduce re-renders, keep API same"
```

---

## 📈 Track Your Efficiency

### Check Token Usage
```bash
/usage
```

### Review Session
After each session, ask:
1. Did I use /commit? (If no → why not?)
2. Did I batch operations? (Sequential reads?)
3. Did I use the right model? (Simple tasks with Sonnet?)
4. Could I have used Task/Explore? (Manual searching?)
5. Did I over-document? (Too early?)

---

## 🎓 Efficiency Scorecard

Rate your session efficiency:

**A+ (90-100% efficient):**
- Used /commit for all commits
- Used Haiku for simple tasks
- Used Task/Explore appropriately
- Batched operations
- Concise responses when appropriate

**B (70-89% efficient):**
- Used some skills
- Mostly right model choices
- Some batching
- Could be more concise

**C (50-69% efficient):**
- Forgot to use /commit
- Used Sonnet for everything
- Sequential operations
- Over-documented

**D (<50% efficient):**
- Manual git operations
- No skill usage
- No batching
- Verbose when not needed

---

## 📝 Session Template

**Copy this at start of each session:**

```
SESSION START CHECKLIST:

[ ] Checked available skills (/help)
[ ] Checked MCP servers (claude mcp list)
[ ] Read SESSION-NOTES.md
[ ] Set expectations (concise responses? Haiku for simple tasks?)

EFFICIENCY REMINDERS:
- Use /commit for ALL commits
- Use Explore agent for codebase searching
- Batch file operations
- Choose right model (Haiku vs Sonnet)
- Document incrementally, not all at once

GOALS FOR THIS SESSION:
[Write your goals here]
```

---

## 🔗 Quick Links

**During Session:**
- `/help` - List available skills
- `/usage` - Check token usage
- `claude mcp list` - Check MCP servers

**Documentation:**
- `SESSION-NOTES.md` - Resume work
- `CHANGELOG.md` - What's been done
- `ARCHITECTURE.md` - How it works
- `DEVELOPMENT.md` - How to build

---

## 🎯 TL;DR - Top 5 Efficiency Wins

1. **Always use `/commit`** (Saves ~1,000 tokens/commit)
2. **Use Task/Explore for searching** (Saves ~3,000 tokens)
3. **Use Haiku for simple tasks** (Saves ~70% cost)
4. **Batch operations in parallel** (Saves time + tokens)
5. **Document incrementally** (Defer ~20,000 tokens)

**Total Potential Savings:** ~30-40% per session

---

**Last Updated:** 2026-01-17
**For:** ha-custom-dashboard project
**Maintained by:** Original Developer + Claude Code

---

## 📞 When in Doubt

Ask Claude:
> "What's the most efficient way to [task]?"

Claude will suggest:
- Which skill to use (if any)
- Which model (Haiku vs Sonnet)
- Whether to use Task/Explore
- How to batch the operation

**Remember:** Claude wants to help you be efficient! Just ask. 🚀
