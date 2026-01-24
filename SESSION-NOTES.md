# Session Notes - HA Dashboard Rebuild

> **📌 For Original Developer (Arthu) Only**
> These are YOUR working notes to resume between sessions.

**Date:** 2026-01-22 (Wednesday Evening)
**Project:** ha-custom-dashboard
**Status:** 🚧 IN PROGRESS - Deploying Add-on to Home Assistant

---

## 🎯 Current Session: Deploying Home Assistant Add-on (2026-01-22)

### What We're Trying To Do
Deploy the calendar dashboard as a Home Assistant add-on so it can run on the Raspberry Pi wall panel (Android 14, 15.9" 1920x1080).

### Where We Are NOW ⚠️
- ✅ Calendar feature fully working in development mode
- ✅ Add-on structure created and pushed to GitHub
- 🚧 **DEPLOYING**: Multiple issues found and fixed, testing v0.3.0
- ❌ **NOT YET TESTED**: Need to update to v0.3.0 and verify it loads

### Issues Fixed Today (in order)

#### Issue 1: Repository Not Valid ❌→✅
**Error:** `https://github.com/djarthur78/ha-custom-dashboard is not a valid add-on repository`

**Root Cause:** HA requires specific structure:
- Missing `repository.json` at root
- Directory was named `addon/` instead of matching slug `family-dashboard/`

**Fix:**
- Added `repository.json` at root
- Renamed `addon/` → `family-dashboard/`
- Updated all references in docs and build scripts
- **Commit:** 77cb42b

#### Issue 2: Docker Image 403 Error ❌→✅
**Error:** `Can't install ghcr.io/djarthur78/ha-family-dashboard-aarch64:0.1.0: denied`

**Root Cause:** `config.json` was trying to pull pre-built image from GitHub Container Registry that doesn't exist.

**Fix:**
- Removed `"image"` field from config.json
- HA now builds Docker image locally from Dockerfile
- **Commit:** 9d26c9e

#### Issue 3: Blank Screen (Absolute Paths) ❌→✅
**Error:** Blank screen when accessing dashboard through ingress

**Root Cause:** Vite was building with absolute paths (`/assets/...`) which don't work with HA ingress URLs like `/c2ba14e6_family-dashboard/ingress/`

**Fix:**
- Added `base: './'` to vite.config.js
- Rebuilt with relative paths (`./assets/...`)
- **Commit:** d8588b8

#### Issue 4: Still Blank (Missing Environment Variables) ❌→✅
**Error:** Blank screen persisted - React app loading but no HA connection

**Root Cause:** `.env` file with `VITE_HA_URL` and `VITE_HA_TOKEN` is gitignored, so Docker container doesn't have these values.

**Fix (Iteration 1 - User Token):**
- Added runtime config injection
- Add-on options for user to provide long-lived token
- `run.sh` creates `config.js` with token
- WebSocket service checks `window.HA_CONFIG`
- **Commit:** 3eac119

**Fix (Iteration 2 - Supervisor Token):**
- Simplified: Use built-in `SUPERVISOR_TOKEN` environment variable
- Removed user configuration requirement
- Works automatically with `homeassistant_api: true`
- **Commit:** 0b6a439

#### Issue 5: STILL Blank (Nginx Crashing) ❌→🚧
**Error:** Blank screen still showing, logs show nginx starting then immediately stopping/restarting

**Symptoms:**
```
[INFO] Starting nginx...
s6-rc: info: service legacy-services: stopping
s6-rc: info: service legacy-services successfully stopped
[restarts immediately]
```

**Root Cause:** HA add-on containers run as non-root user, but nginx needs write permissions for:
- `/var/run/nginx.pid` (pid file)
- `/var/log/nginx/` (logs)
- `/var/lib/nginx/tmp` (temp files)

**Fix:**
- Created directories: `/run/nginx`, `/var/log/nginx`, `/var/lib/nginx/tmp`
- Set ownership: `chown nginx:nginx` on all directories
- Changed pid path to `/run/nginx/nginx.pid`
- Version bumped to **0.3.0**
- **Commit:** 6f58fa4 ⬅️ **LATEST**

### 📦 Current Add-on Version

**Version:** 0.3.0 (latest, pushed to GitHub)

**What's In It:**
- ✅ Proper repository structure (`repository.json`, `family-dashboard/`)
- ✅ Local Docker build (no external image pull)
- ✅ Relative asset paths for ingress
- ✅ Runtime config injection (`config.js`)
- ✅ Automatic Supervisor token authentication
- ✅ Nginx permission fixes
- ✅ Built React app (325KB JS + 27KB CSS)

**Files:**
```
family-dashboard/
├── build/                    # Built React app
│   ├── assets/
│   │   ├── index-B6fyKSRW.js
│   │   └── index-DFz0ybDt.css
│   ├── index.html           # Has <script src="./config.js"></script> injected
│   └── vite.svg
├── config.json              # v0.3.0, homeassistant_api: true
├── Dockerfile               # nginx with proper permissions
├── nginx.conf               # Port 8099, ingress-ready
├── run.sh                   # Creates config.js with SUPERVISOR_TOKEN
├── build.json               # Multi-arch support
└── README.md                # User docs
```

### 🔄 What Needs To Happen Next

**IMMEDIATE (tomorrow morning):**

1. **Update Add-on in HA:**
   - Settings → Add-ons → Family Dashboard
   - Click ⋮ → **Update** (should show v0.3.0 available)
   - OR **Rebuild** if update doesn't appear
   - Click **Restart**

2. **Check Logs:**
   - Should see:
     ```
     [INFO] Starting Family Dashboard...
     [INFO] Creating runtime configuration...
     [INFO] Configuration created with Supervisor token
     [INFO] Starting nginx...
     ```
   - Should **stay running** (no crash/restart loop)

3. **Test Dashboard:**
   - Click "Family Dashboard" in HA sidebar
   - Should load with calendar
   - If blank: F12 → Console → check for errors
   - If errors: Report back for next fix

4. **If It Works:**
   - Set up Android tablet with HA Companion App
   - Configure kiosk mode
   - Test on 1920x1080 display
   - Consider switching to Fully Kiosk Browser for motion detection

### 💻 Development Environment

**Current State:**
- Dev server still running: http://localhost:5173/ (background task baa1d44)
- Works perfectly in development mode
- Git: All changes committed and pushed to main

**Key Files Modified Today:**
- `src/vite.config.js` - Added `base: './'` for relative paths
- `src/src/services/ha-websocket.js` - Auto-detect environment (dev vs add-on)
- `family-dashboard/Dockerfile` - Permission fixes for nginx
- `family-dashboard/nginx.conf` - PID file path change
- `family-dashboard/config.json` - Version 0.1.0 → 0.3.0
- `family-dashboard/run.sh` - Inject config.js with Supervisor token
- `build-addon.sh` - Inject config.js script tag into index.html
- `repository.json` - NEW file for HA add-on repository

**Git Status:**
- Branch: main
- Latest commit: 6f58fa4 (nginx permissions fix)
- All changes pushed ✅

### 🐛 Debugging Tips for Tomorrow

**If still blank after v0.3.0 update:**

1. **Check if nginx is running:**
   - Logs should NOT show crash/restart loop
   - Should see "Starting nginx..." and then stay running

2. **Check browser console:**
   ```javascript
   // In F12 Console:
   window.HA_CONFIG  // Should show {token: "...", useIngress: true}
   ```

3. **Check network tab:**
   - Is `config.js` loading? (200 status)
   - Are `assets/index-*.js` files loading? (200 status)
   - Any 404 errors?

4. **Check nginx is serving files:**
   - Try accessing: `http://192.168.1.2:8099` (direct, won't work due to ingress, but worth checking)
   - Ingress URL: `http://192.168.1.2:8123/c2ba14e6_family-dashboard/ingress`

5. **Check add-on logs carefully:**
   - Look for nginx error messages
   - Look for permission denied errors
   - Look for "Configuration created with Supervisor token"

### 📝 Commands for Tomorrow

```bash
# If you need to rebuild add-on
cd /home/arthu/projects/ha-custom-dashboard
./build-addon.sh
git add family-dashboard/build
git commit -m "Update dashboard"
git push

# Check dev server status
tail -f /tmp/claude/-home-arthu-projects-ha-custom-dashboard/tasks/baa1d44.output

# Test locally (still works)
cd src && npm run dev
# Access: http://localhost:5173/
```

### 🎯 Success Criteria

✅ **We're done when:**
1. Add-on installs and stays running (no crash loop)
2. Clicking "Family Dashboard" in HA sidebar loads the calendar
3. All calendar features work (views, events, weather)
4. Can access from Android tablet via HA Companion App
5. Wall panel displays fullscreen at 1920x1080

### 🔧 Fallback Options

**If add-on approach fails:**
1. **Standalone mode:** Run dev server on Windows, access from tablet via http://192.168.1.6:5173
2. **HA iframe:** Embed dev server in HA dashboard iframe card
3. **Static hosting:** Build and serve via HA's `www` folder

**But add-on is the right approach** - just need to get nginx working properly!

---

## Previous Work (Before Today)

### Session 3: Calendar Complete (2026-01-22 Morning/Afternoon)
- ✅ Completed full calendar implementation
- ✅ 6 view modes: Day/List, Day/Schedule, Week/List, Week/Schedule, Month, DayView
- ✅ Event management (create/edit/delete/recurring)
- ✅ Weather integration with colorful Lucide icons
- ✅ UI consistency across all views
- ✅ Header improvements (date/time/weather)
- ✅ Event modal UX (quick duration, recurring, :00 defaults)
- ✅ Created initial add-on structure

### Session 2: Phase 1 Complete (2026-01-17)
- ✅ Built React + Vite foundation
- ✅ HA WebSocket integration
- ✅ Fixed critical entity loading bug
- ✅ Tested on localhost and iPad

### Session 1: Discovery (2026-01-17 Morning)
- ✅ Analyzed existing HA dashboard
- ✅ Inventoried 2,215 HA entities
- ✅ Created specifications

---

## 🏠 Home Assistant Details

**HA Instance:**
- URL: http://192.168.1.2:8123
- Platform: Raspberry Pi with HA OS
- Google Calendar integration: ✅ Working
- Weather integration: ✅ Working

**Wall Panel:**
- Device: Android 14 dedicated tablet
- Screen: 15.9" 1920x1080 landscape
- Current approach: HA Companion App
- Future: Maybe Fully Kiosk Browser (motion detection, screensaver)

**Add-on Status:**
- Repository: https://github.com/djarthur78/ha-custom-dashboard
- Installed: Yes
- Version: 0.2.0 (needs update to 0.3.0)
- Status: Running but nginx crashing (needs v0.3.0 fix)

---

## 🚀 Next Phase After Deployment

Once add-on is working and tested on wall panel:

**Phase 2B: Meal Planner**
- Build Meals page
- Show This Week / Next Week meal plans
- Editable via HA input_text entities (28 entities)
- Shopping list integration
- Similar UI consistency to Calendar

**Reference:**
- Spec: `specs/02-meal-planner-spec.md`
- HA entities: `input_text.meals_*`
- Days: Monday-Sunday × 2 weeks
- Meals: Breakfast, Lunch, Dinner, Snacks

---

**Last Updated:** 2026-01-22 21:00 (Wednesday Evening)
**Next Session:** Deploy v0.3.0 and test if nginx stays running and dashboard loads
**Critical Next Step:** Update add-on to v0.3.0 in HA and check logs + browser
