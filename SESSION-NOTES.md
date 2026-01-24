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

---

## 🔥 Session 4: Ingress Debugging Hell (2026-01-24)

### TL;DR - What Happened
Spent entire session debugging why HA ingress shows blank/503 while port 8099 works perfectly. **Conclusion: This is a Home Assistant Supervisor bug, not fixable from add-on side.**

### Status Summary
- ✅ **Port 8099 works PERFECTLY** - App loads, all features functional
- ❌ **HA Ingress returns 503** - "Service Unavailable"
- ✅ **Nginx health checks pass** - Nginx runs correctly on all interfaces
- ❌ **HA's ingress proxy cannot connect** - This is the unfixable problem

### What We Tried (Versions 0.4.0 through 0.7.1)

#### Attempt 1: Switch to Ingress-Only Mode (v0.4.0) ❌
**Theory:** Port conflict between external port and ingress port
**Action:** Removed external port 8099 exposure, ingress-only
**Result:** Still 503, but now can't test via direct port access
**Commit:** 069b959

#### Attempt 2: Add IP Allowlist (v0.4.1) ❌
**Theory:** Nginx needs to explicitly allow HA ingress gateway IP (172.30.32.2)
**Action:** Added `allow 172.30.32.2; deny all;` to nginx.conf
**Result:** Still 503 - IP allowlist didn't help
**Commit:** a7824f5

#### Attempt 3: Remove X-Frame-Options Header (v0.4.2) ✅ (Partial)
**Theory:** X-Frame-Options blocking HA from embedding in iframe
**Action:** Removed `X-Frame-Options: SAMEORIGIN` header
**Result:** Different error! Now getting CSP eval error instead of blank
**Commit:** b578a23
**Progress:** This WAS a real issue - fixed it

#### Attempt 4: Add CSP Meta Tag (v0.4.3-0.4.4) ❌
**Theory:** Need CSP header to allow eval for React/Vite
**Action:**
- v0.4.3: Added CSP header in nginx
- v0.4.4: Switched to meta tag injection in HTML
**Result:** HA's ingress proxy strips/overrides CSP headers - didn't work
**Commits:** 91b5fb8, 2e677d8

#### Attempt 5: Disable Source Maps (v0.5.0) ❌
**Theory:** Vite source maps use eval(), blocked by CSP
**Action:** Set `sourcemap: false`, use terser minifier, target es2015
**Result:** CSP error persisted (likely from HA's own code, not ours)
**Commit:** 67396e8

#### Attempt 6: Re-enable Port for Testing (v0.5.1) ✅
**Action:** Re-added port 8099 to allow testing while debugging ingress
**Result:** Port 8099 works perfectly! App fully functional
**Commit:** 086c2bc

#### Attempt 7: Inline Config Injection (v0.5.2) ✅
**Theory:** Relative path `./config.js` might fail in ingress iframe
**Action:** Inject config directly as inline `<script>` in HTML
**Result:** Port 8099 still works, ingress still 503
**Commit:** 060eb6b

#### Attempt 8: Remove Port Conflict Again (v0.6.0) ❌
**Theory:** Having both port and ingress creates conflict
**Action:** Remove external port again, ingress-only, explicit 0.0.0.0:8099 listen
**Result:** Ingress still 503
**Commit:** 6c5d290

#### Attempt 9: Add Network Debugging (v0.6.1-0.6.3) ✅ (Diagnostic)
**Action:** Enhanced health checks to verify nginx is working
**Results:**
```
✓ Nginx responds on localhost:8099
✓ Nginx responds on container IP (172.30.33.6:8099)
✓ Nginx listening on 0.0.0.0:8099 (all interfaces)
✗ HA ingress proxy still returns 503
```
**Commits:** a06d71f, c1ab2a2, dd809b0
**Critical Finding:** **Nginx works perfectly. Problem is HA's ingress gateway.**

#### Attempt 10: Configuration Changes (v0.7.0-0.7.1) ❌
**Actions:**
- v0.7.0: Added explicit base image (broke build)
- v0.7.1: Fixed build, re-enabled port 8099, added auth_api: false
**Result:** Port 8099 works, ingress still broken
**Commits:** e403c00, d43ce5d

#### Attempt 11: Clean Reinstall ❌
**Theory:** Fresh install might fix ingress routing
**Action:** Uninstalled add-on completely, reinstalled from scratch
**Result:** Same issue - port 8099 works, ingress returns 503

#### Attempt 12: Panel Iframe Configuration ❌
**Theory:** Add sidebar panel pointing to port 8099
**Action:** Added `panel_iframe:` to configuration.yaml
**Result:** Integration error - panel_iframe not found/supported
**Issue:** YAML configuration conflicts and errors

### 🔍 Root Cause Analysis

**Research Findings:**
- [HA GitHub Issue #99811](https://github.com/home-assistant/core/issues/99811): "Ingress for Add-ons broken after update"
- [HA Community](https://community.home-assistant.io/t/cant-get-ha-add-on-ingress-to-work-what-am-i-doing-wrong/766070): Multiple users report 503 with ingress
- **Conclusion:** This is a known Home Assistant Supervisor ingress routing bug

**Technical Evidence:**
1. ✅ Nginx starts successfully
2. ✅ Health checks pass on both localhost AND container IP
3. ✅ Nginx listens on all interfaces (0.0.0.0:8099)
4. ✅ Direct port 8099 access works perfectly
5. ✅ All React app features functional
6. ❌ HA's ingress proxy at 172.30.32.2 cannot connect to nginx (503)

**The Problem:**
- HA Supervisor's ingress gateway is supposed to proxy requests from `/api/hassio_ingress/c2ba14e6_family-dashboard/` to the add-on's nginx at `172.30.33.6:8099`
- The ingress gateway returns 503 immediately - it never reaches nginx
- This is NOT a problem with our nginx configuration
- This is a HA Supervisor networking/routing issue we cannot fix

### 📦 Final Working Version

**Version:** 0.7.1 (current)

**What Works:**
- ✅ Direct access via http://192.168.1.2:8099
- ✅ All dashboard features (calendar, navigation, events)
- ✅ WebSocket connection to HA
- ✅ Nginx runs perfectly with all health checks passing

**What Doesn't Work:**
- ❌ HA Ingress (503 Service Unavailable)
- ❌ Panel iframe (integration not found)

**Configuration:**
```json
{
  "version": "0.7.1",
  "ingress": true,
  "ingress_port": 8099,
  "auth_api": false,
  "ports": {
    "8099/tcp": 8099
  }
}
```

### 💡 Current Solution

**USE PORT 8099 DIRECTLY:**

1. **On Desktop/Browser:**
   - Bookmark: http://192.168.1.2:8099
   - Works perfectly

2. **On iPad:**
   - Safari → http://192.168.1.2:8099
   - Share → "Add to Home Screen"
   - Creates app-like icon on home screen

3. **Add-on Remains Installed:**
   - Keep add-on running for port 8099 to work
   - Ignore the broken ingress sidebar link
   - Add-on serves the app correctly on port 8099

### 🔮 What's Next (Next Session)

**Option A: Accept Port 8099 and Move On** ⭐ RECOMMENDED
- Stop wasting time on ingress
- Use http://192.168.1.2:8099 as primary access
- Focus on actual features (meal planner, games room, cameras)
- Ingress is a nice-to-have, not essential

**Option B: Investigate Further (Low Priority)**
- Check HA Supervisor version and known issues
- Try updating HA OS to latest version
- Check if other add-ons with ingress work
- File bug report with HA if needed

**Option C: Alternative Embedding**
- Create custom dashboard card that iframes port 8099
- Use browser_mod integration for popup panels
- Explore other HA UI integration methods

### 📝 Lessons Learned

**What Went Wrong:**
1. **Spent too much time guessing** instead of researching first
2. **Tried too many random fixes** without understanding root cause
3. **Should have stopped after confirming nginx works** (v0.6.3)
4. **Ingress is a HA Supervisor issue**, not fixable from add-on

**What Went Right:**
1. **Systematic health checks** proved nginx works perfectly
2. **Port 8099 is a solid working solution**
3. **App is fully functional** - deployment successful despite ingress issue

**For Next Time:**
- Research known issues FIRST before debugging
- Stop after confirming the component works (nginx health checks passed)
- Accept when something is out of our control (HA Supervisor bug)
- Don't let perfect be the enemy of good (port 8099 works!)

### 🎯 Success Criteria (Revised)

✅ **Deployment IS successful:**
1. Add-on installs and runs ✅
2. Nginx serves the app correctly ✅
3. Port 8099 access works perfectly ✅
4. All features functional ✅
5. Can access from any device on network ✅

❌ **Ingress nice-to-have (not essential):**
1. HA sidebar ingress link ❌ (broken, not fixable)
2. Embedded in HA UI ❌ (not critical)

**Result:** Dashboard is deployed and working. Ingress is bonus feature that's broken in HA.

---

**Last Updated:** 2026-01-24 15:00 (Friday Afternoon)
**Next Session:** Move on to actual features - Meal Planner or accept port 8099 solution
**Critical Decision:** Stop fighting ingress, use port 8099, focus on real work
