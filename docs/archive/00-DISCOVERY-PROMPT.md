# First commit
git add .gitignore 00-DISCOVERY-PROMPT.md
git commit -m "Initial project setup"

# Verify structure
ls -la
# Should see: .git/ .gitignore 00-DISCOVERY-PROMPT.md

# Now you're ready for discovery
claude
```

---

## Your Clean Project Structure
```
~/projects/ha-custom-dashboard/
├── .git/                          ← Git repo
├── .gitignore                     ← Ignore rules
├── 00-DISCOVERY-PROMPT.md         ← Your saved prompt
│
├── discovery/                     ← Claude will create
│   ├── 00-progress.md
│   ├── 01-dashboard-current.md
│   └── ...
│
├── specs/                         ← Claude will create
│   ├── 00-mvp-definition.md
│   └── ...
│
├── operations/                    ← Claude will create
│   └── ...
│
├── config/                        ← Claude will create
│   └── entities.json
│
├── NEXT-STEPS.md                  ← Claude will create
│
└── src/                           ← Future: React app
    ├── components/
    ├── services/
    └── ...
