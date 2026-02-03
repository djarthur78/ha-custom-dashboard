# Repository Restructure Migration Plan

## Executive Summary

This plan addresses five key structural issues in the ha-custom-dashboard repository:

| Issue | Impact | Risk |
|-------|--------|------|
| Nested `src/src/` structure | Deep import paths, confusing navigation | High |
| Duplicate deployment configs | Maintenance burden, sync issues | Medium |
| 19 archived docs (5,036 lines) | Repository bloat, confusion | Low |
| Scattered HA configs | Hard to find configuration | Low |
| Missing code standards | Inconsistent formatting | Low |

**Estimated Total Time:** 2-3 hours
**Git Operations:** Create migration branch, atomic commits per phase

---

## Pre-Migration Checklist

Before starting, ensure:

- [ ] All changes committed to `main`
- [ ] Create backup branch: `git branch backup/pre-migration`
- [ ] Local dev server stopped
- [ ] No pending deploys to Home Assistant

```bash
# Run from repository root
git checkout main
git pull origin main
git branch backup/pre-migration
git checkout -b refactor/repository-restructure
```

---

## Phase 1: Safe Cleanup (No Code Changes)

**Risk Level:** LOW
**Estimated Time:** 15 minutes
**Rollback:** `git checkout .` or `git reset --hard HEAD`

### 1.1 Delete Duplicate Deployment Files (Root Level)

These files are duplicated in `deploy-package/` and are not used:

```bash
# Files to delete from root (keep deploy-package/ versions)
rm Dockerfile.production
rm docker-compose.yml
rm docker-entrypoint.sh
rm nginx.production.conf
rm .env.pihole

# Delete obsolete build artifacts
rm -f family-dashboard-addon.tar.gz
rm -f family-dashboard-deploy.tar.gz

# Delete obsolete scripts
rm -f get-docker.sh              # Docker install script - not needed
rm -f setup-dashboard-auto.sh    # Superseded by build-addon.sh
rm -f deploy-to-pihole.sh        # Old PiHole deployment - not used
```

### 1.2 Archive Historical Documentation

Move 19 obsolete docs to a git-ignored archive:

```bash
# Create archive outside git tracking
mkdir -p .archive/docs

# Move all archived docs
mv docs/archive/* .archive/docs/

# Remove empty docs directory
rmdir docs/archive
rmdir docs

# Update .gitignore
echo "" >> .gitignore
echo "# Archived documentation (historical reference only)" >> .gitignore
echo ".archive/" >> .gitignore
```

### 1.3 Consolidate HA Configuration Directories

```bash
# Create unified ha-reference directory
mkdir -p ha-reference

# Move HA folder contents (old dashboard YAML)
mv HA/dashboard.yaml ha-reference/original-dashboard.yaml 2>/dev/null || true
mv HA/family_calander_package.yaml ha-reference/family-calendar-package.yaml 2>/dev/null || true
rmdir HA 2>/dev/null || true

# Move ha-config contents
mv ha-config/family_dashboard_panel.yaml ha-reference/ 2>/dev/null || true
rmdir ha-config 2>/dev/null || true
```

### 1.4 Verification Steps

```bash
# Verify no broken symlinks
find . -type l ! -exec test -e {} \; -print

# Verify git status
git status

# Expected result: Only deletions and moves, no content changes
```

### 1.5 Commit Phase 1

```bash
git add -A
git commit -m "chore: Phase 1 cleanup - remove duplicates and archive docs

- Remove duplicate deployment files from root (kept in deploy-package/)
- Remove obsolete build artifacts (tar.gz files)
- Remove unused scripts (get-docker.sh, setup-dashboard-auto.sh, deploy-to-pihole.sh)
- Move 19 archived docs to .archive/ (git-ignored)
- Consolidate HA config directories into ha-reference/"
```

---

## Phase 2: Directory Restructure

**Risk Level:** HIGH
**Estimated Time:** 45-60 minutes
**Rollback:** `git reset --hard HEAD~1` then restore from backup branch

### 2.1 Current vs. New Structure

```
CURRENT:                           NEW:
ha-custom-dashboard/               ha-custom-dashboard/
├── src/                           ├── app/                    # React app root (renamed)
│   ├── node_modules/              │   ├── node_modules/
│   ├── package.json               │   ├── package.json
│   ├── vite.config.js             │   ├── vite.config.js
│   ├── index.html                 │   ├── index.html
│   └── src/                       │   └── src/                # Source code
│       ├── App.jsx                │       ├── App.jsx
│       ├── main.jsx               │       ├── main.jsx
│       ├── components/            │       ├── components/
│       ├── hooks/                 │       ├── hooks/
│       ├── pages/                 │       ├── pages/
│       └── services/              │       └── services/
├── config/                        ├── config/                 # Keep as-is
├── family-dashboard/              ├── addon/                  # Renamed for clarity
├── deploy-package/                ├── deploy/                 # Renamed for clarity
└── ...                            └── ...
```

### 2.2 Rename Directories

```bash
# Rename src/ to app/ (React application)
mv src app

# Rename family-dashboard/ to addon/
mv family-dashboard addon

# Rename deploy-package/ to deploy/
mv deploy-package deploy
```

### 2.3 Update index.html Entry Point

**File:** `app/index.html`

Change the title:
```html
<!-- BEFORE -->
<title>src</title>

<!-- AFTER -->
<title>Family Dashboard</title>
```

Note: The internal `/src/main.jsx` path stays the same - it references `app/src/main.jsx` correctly.

### 2.4 Update package.json

**File:** `app/package.json`

```json
{
  "name": "family-dashboard",
  "version": "1.0.4",
  "description": "Custom Home Assistant dashboard for family calendar and controls",
  ...
}
```

### 2.5 Update vite.config.js with Path Aliases

**File:** `app/vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    sourcemap: false,
    minify: 'terser',
    target: 'es2015',
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@config': path.resolve(__dirname, '../config'),
    },
  },
})
```

### 2.6 Update vitest.config.js

**File:** `app/vitest.config.js`

```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/test/**', 'src/**/*.{test,spec}.{js,jsx}'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@config': path.resolve(__dirname, '../config'),
    },
  },
});
```

### 2.7 Update Import Paths in Source Files

**Files requiring import path updates:**

| File | Current Import | New Import |
|------|----------------|------------|
| `app/src/pages/MealsPage.jsx` | `'../../../config/entities.json'` | `'@config/entities.json'` |
| `app/src/components/features/meals/hooks/useMealData.js` | `'../../../../../../config/entities.json'` | `'@config/entities.json'` |

```javascript
// BEFORE (MealsPage.jsx)
import entitiesConfig from '../../../config/entities.json';

// AFTER
import entitiesConfig from '@config/entities.json';

// BEFORE (useMealData.js)
import entitiesConfig from '../../../../../../config/entities.json';

// AFTER
import entitiesConfig from '@config/entities.json';
```

### 2.8 Update build-addon.sh

**File:** `build-addon.sh`

```bash
#!/bin/bash

# Build script for Family Dashboard Home Assistant Add-on

set -e

echo "Building Family Dashboard Add-on..."

# Step 1: Build the React app
echo "Building React app..."
cd app
npm run build
cd ..

# Step 2: Copy build to addon directory
echo "Copying build to addon directory..."
rm -rf addon/build
cp -r app/dist addon/build

# Step 3: Inject config.js script into index.html
echo "Injecting runtime config loader..."
sed -i 's|<head>|<head>\n    <script src="./config.js"></script>|' addon/build/index.html

VERSION=$(date +%Y.%m.%d)
echo "Version: $VERSION"

echo ""
echo "Add-on build complete!"
echo ""
echo "Next steps:"
echo "1. git add addon/build && git commit -m 'Build addon'"
echo "2. git push"
echo "3. In HA: Settings -> Add-ons -> Check for updates"
```

### 2.9 Verification Steps

```bash
# Verify build works
cd app
npm install
npm run build
npm run lint
npm test
cd ..

# Verify addon build script works
./build-addon.sh

# Verify dev server starts
cd app
npm run dev &
sleep 5
curl -s http://localhost:5173 | head -20
kill %1
cd ..
```

### 2.10 Commit Phase 2

```bash
git add -A
git commit -m "refactor: Restructure directories for clarity

- Rename src/ to app/, family-dashboard/ to addon/, deploy-package/ to deploy/
- Add @ and @config path aliases to vite.config.js
- Update import paths in MealsPage.jsx and useMealData.js
- Update build-addon.sh for new paths
- Update package.json name to 'family-dashboard'"
```

---

## Phase 3: Documentation Consolidation

**Risk Level:** LOW
**Estimated Time:** 30 minutes
**Rollback:** `git checkout -- *.md`

### 3.1 Current Documentation Inventory

| File | Lines | Purpose | Action |
|------|-------|---------|--------|
| README.md | 233 | Project overview | KEEP - update paths |
| CLAUDE.md | 338 | AI assistant guide | KEEP - update paths |
| ARCHITECTURE.md | 351 | Technical design | KEEP - update paths |
| DEPLOYMENT.md | 332 | Deployment guide | KEEP - update paths |
| DEVELOPMENT.md | 458 | Dev setup guide | KEEP - update paths |
| DIAGRAMS.md | 563 | Mermaid diagrams | KEEP - no changes |
| CHANGELOG.md | 725 | Version history | KEEP - add migration note |
| ROADMAP.md | 491 | Feature plans | KEEP - mark outdated sections |
| CURRENT-SESSION-STATE.md | 573 | Working state | DELETE - redundant |
| CLOUDFLARE-SETUP.md | 168 | Remote access | MOVE to docs/ |

### 3.2 Create Organized Documentation Structure

```bash
# Create docs folder for supplementary guides
mkdir -p docs

# Move supplementary documentation
mv CLOUDFLARE-SETUP.md docs/
mv DIAGRAMS.md docs/
mv ROADMAP.md docs/

# Delete redundant session state (superseded by CHANGELOG)
rm CURRENT-SESSION-STATE.md

# Delete redundant nested README
rm app/README.md
```

### 3.3 New Documentation Structure

```
ha-custom-dashboard/
├── README.md              # Quick start, overview
├── CLAUDE.md              # AI assistant guide
├── ARCHITECTURE.md        # Technical design
├── DEPLOYMENT.md          # Production deployment
├── DEVELOPMENT.md         # Local development
├── CHANGELOG.md           # Version history
└── docs/
    ├── CLOUDFLARE-SETUP.md  # Remote access guide
    ├── DIAGRAMS.md          # Architecture diagrams
    └── ROADMAP.md           # Future plans
```

### 3.4 Update Path References in Documentation

Update all documentation files to reflect new paths:

**Common replacements:**
- `src/` -> `app/`
- `src/src/` -> `app/src/`
- `family-dashboard/` -> `addon/`
- `deploy-package/` -> `deploy/`

**Files to update:**
- README.md
- CLAUDE.md
- ARCHITECTURE.md
- DEPLOYMENT.md
- DEVELOPMENT.md
- CHANGELOG.md

### 3.5 Verification Steps

```bash
# Check for broken path references (should return no results after updates)
grep -r "src/src" *.md
grep -r "family-dashboard/" *.md docs/*.md
grep -r "deploy-package/" *.md docs/*.md
```

### 3.6 Commit Phase 3

```bash
git add -A
git commit -m "docs: Consolidate and update documentation

- Move supplementary docs to docs/ folder
- Remove redundant CURRENT-SESSION-STATE.md
- Remove redundant app/README.md
- Update all path references for new structure"
```

---

## Phase 4: Configuration and Standards

**Risk Level:** LOW
**Estimated Time:** 20 minutes
**Rollback:** `git checkout -- .editorconfig .prettierrc`

### 4.1 Add .editorconfig

**File:** `.editorconfig`

```ini
# EditorConfig - https://editorconfig.org

root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.{json,yaml,yml}]
indent_size = 2

[Makefile]
indent_style = tab
```

### 4.2 Add .prettierrc

**File:** `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "arrowParens": "always"
}
```

### 4.3 Add .prettierignore

**File:** `.prettierignore`

```
node_modules
dist
build
addon/build
*.min.js
package-lock.json
```

### 4.4 Update Root .gitignore

**File:** `.gitignore`

```gitignore
# Sensitive data
.env
.env.local
*.token

# Dependencies
node_modules/

# Build outputs
dist/
build/
.vite/

# Exception: Include add-on build files for HA deployment
!addon/build/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Backups
*-backup-*/
*.bak

# Archived documentation (historical reference only)
.archive/

# Build artifacts
*.tar.gz
```

### 4.5 Add npm Scripts for Formatting

Update `app/package.json` to add formatting scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,json,css}\"",
    "format:check": "prettier --check \"src/**/*.{js,jsx,json,css}\"",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

Install prettier:
```bash
cd app
npm install --save-dev prettier
```

### 4.6 Verification Steps

```bash
# Verify editorconfig is valid
cat .editorconfig

# Verify prettier config is valid JSON
cat .prettierrc | python3 -m json.tool

# Test formatting
cd app
npm run format:check
cd ..
```

### 4.7 Commit Phase 4

```bash
git add -A
git commit -m "chore: Add code style configuration

- Add .editorconfig for consistent editor settings
- Add .prettierrc for code formatting
- Add .prettierignore
- Update .gitignore with new structure
- Add format scripts to package.json"
```

---

## Phase 5: CLAUDE.md Update

**Risk Level:** LOW
**Estimated Time:** 20 minutes
**Rollback:** `git checkout -- CLAUDE.md`

### 5.1 Key Sections to Update

#### Essential Commands Section

```markdown
## Essential Commands

### Development
```bash
cd app                   # React app directory
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm test                 # Run tests
```

### Deployment (Add-on)
```bash
./build-addon.sh         # Build React app and prepare add-on
git add addon/build      # Commit built files
git push                 # Push to GitHub
```
```

#### Project Structure Section

```markdown
## Project Structure

```
ha-custom-dashboard/
├── app/                              # React application
│   ├── src/                          # Application source
│   │   ├── App.jsx                   # Router with MainLayout
│   │   ├── main.jsx                  # Entry point
│   │   ├── index.css                 # Global styles + Tailwind
│   │   ├── components/
│   │   │   ├── common/               # Shared components
│   │   │   ├── layout/               # Layout shells
│   │   │   └── features/             # Feature-specific components
│   │   ├── pages/                    # Route pages
│   │   ├── hooks/                    # Generic React hooks
│   │   ├── services/                 # HA integration
│   │   ├── constants/                # App constants
│   │   └── test/                     # Test setup and mocks
│   ├── package.json
│   ├── vite.config.js
│   └── vitest.config.js
│
├── addon/                            # Home Assistant add-on
│   ├── build/                        # Built React app
│   ├── config.json                   # Add-on metadata
│   ├── Dockerfile
│   ├── nginx.conf
│   └── run.sh
│
├── deploy/                           # Standalone deployment
├── config/                           # Entity mappings
├── ha-reference/                     # HA configuration examples
├── docs/                             # Supplementary documentation
│
├── README.md
├── CLAUDE.md                         # This file
├── ARCHITECTURE.md
├── DEPLOYMENT.md
├── DEVELOPMENT.md
├── CHANGELOG.md
├── .editorconfig
└── .prettierrc
```
```

#### Path Aliases Section (New)

```markdown
### Using Path Aliases

```javascript
// Use @ alias for src imports
import { useEntity } from '@/hooks/useEntity';
import { PageContainer } from '@/components/layout/PageContainer';

// Use @config alias for config imports
import entitiesConfig from '@config/entities.json';
```
```

### 5.2 Path Changes Summary

Throughout CLAUDE.md, replace:
- `src/` -> `app/`
- `src/src/` -> `app/src/`
- `family-dashboard/` -> `addon/`
- `deploy-package/` -> `deploy/`

### 5.3 Commit Phase 5

```bash
git add CLAUDE.md
git commit -m "docs: Update CLAUDE.md for new repository structure

- Update all paths to reflect app/, addon/, deploy/ structure
- Add path alias documentation (@, @config)
- Add code formatting commands
- Update project structure diagram"
```

---

## Final Steps

### Merge to Main

```bash
# Ensure all tests pass
cd app
npm test
npm run lint
npm run build
cd ..

# Verify addon builds
./build-addon.sh

# Merge to main
git checkout main
git merge refactor/repository-restructure

# Or squash merge for cleaner history
git merge --squash refactor/repository-restructure
git commit -m "refactor: Complete repository restructure

Summary:
- Rename src/ to app/, family-dashboard/ to addon/, deploy-package/ to deploy/
- Add @ and @config path aliases
- Archive 19 obsolete docs
- Remove duplicate deployment files
- Add .editorconfig and .prettierrc
- Consolidate HA configs into ha-reference/
- Update all documentation with new paths"

# Push
git push origin main
```

### Post-Migration Verification

```bash
# Full verification checklist
cd app && npm test && npm run lint && npm run build && cd ..
./build-addon.sh
ls -la addon/build/

# Check for old path references (should be empty)
grep -r "src/src" . --include="*.md" --include="*.js" --include="*.jsx"
```

### Deploy to Home Assistant

After merge:
1. Push to GitHub
2. In HA: Settings -> Add-ons -> Check for updates
3. Restart Family Dashboard add-on
4. Verify dashboard loads at http://192.168.1.2:8099

---

## Rollback Procedures

### Full Rollback (Before Merge)

```bash
git checkout main
git branch -D refactor/repository-restructure
```

### Rollback After Merge

```bash
git checkout main
git revert HEAD  # Creates revert commit

# Or hard reset (destructive)
git reset --hard backup/pre-migration
git push --force-with-lease origin main
```

### Per-Phase Rollback

Each phase can be individually reverted:

```bash
# Revert most recent commit
git revert HEAD

# Revert specific commit
git log --oneline  # Find commit hash
git revert <commit-hash>
```

---

## Summary

### Files Deleted (Phase 1)
- `Dockerfile.production` (root)
- `docker-compose.yml` (root)
- `docker-entrypoint.sh` (root)
- `nginx.production.conf` (root)
- `.env.pihole` (root)
- `family-dashboard-addon.tar.gz`
- `family-dashboard-deploy.tar.gz`
- `get-docker.sh`
- `setup-dashboard-auto.sh`
- `deploy-to-pihole.sh`
- 19 files in `docs/archive/`

### Directories Renamed (Phase 2)
- `src/` -> `app/`
- `family-dashboard/` -> `addon/`
- `deploy-package/` -> `deploy/`

### Files Modified (Phases 2-5)
- `app/index.html` - title update
- `app/package.json` - name and version
- `app/vite.config.js` - path aliases
- `app/vitest.config.js` - path aliases
- `app/src/pages/MealsPage.jsx` - import paths
- `app/src/components/features/meals/hooks/useMealData.js` - import paths
- `build-addon.sh` - directory references
- `.gitignore` - updated patterns
- All documentation files - path references

### Files Created (Phase 4)
- `.editorconfig`
- `.prettierrc`
- `.prettierignore`

---

## Timeline Estimate

| Phase | Time | Risk |
|-------|------|------|
| Phase 1: Cleanup | 15 min | Low |
| Phase 2: Restructure | 45-60 min | High |
| Phase 3: Documentation | 30 min | Low |
| Phase 4: Standards | 20 min | Low |
| Phase 5: CLAUDE.md | 20 min | Low |
| Testing & Merge | 15 min | Medium |
| **Total** | **2-3 hours** | - |
