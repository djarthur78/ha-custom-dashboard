# Project Status - 2026-02-15

## Current Version: v2.0.40 ✅ DEPLOYED

### Recent Changes (Feb 15, 2026)

#### ✅ Completed: Mac Migration
- **Issue**: Shell scripts used Linux `sed -i` syntax, incompatible with macOS
- **Solution**: Added OS detection, scripts now work on both macOS and Linux
- **Files Modified**:
  - `build-addon.sh`
  - `deploy.sh`
  - `family-dashboard/run.sh`
- **Result**: Can now build and deploy from Mac mini

#### ✅ Completed: Navigation Improvements
- **Issue**: Home page was default, user wanted Calendar as landing page
- **Solution**:
  - Changed default route from `/` → `/home` (Home) to `/` → `/calendar`
  - Added 5-minute inactivity timer that returns to Calendar
  - Created `useInactivityTimer.js` hook
- **Files Modified**:
  - `src/src/App.jsx` - routing config
  - `src/src/components/layout/MainLayout.jsx` - integrated inactivity timer
  - `src/src/hooks/useInactivityTimer.js` - NEW FILE
- **Result**: Users always land on Calendar, auto-return after inactivity

#### ✅ Completed: Git Configuration
- **Issue**: SSH key not configured on Mac mini, couldn't push
- **Solution**: Switched from SSH to HTTPS, stored GitHub Personal Access Token
- **Token Location**: `/Users/darrenbrain/projects/.ssh/id_ed25519` (actually a PAT)
- **Result**: Can now push to GitHub from Mac mini

---

## Known Issues (Not Yet Fixed)

### 🔴 Camera Performance Problems
**Symptoms:**
- Cameras slow to load (sometimes 30+ seconds)
- Black screens appearing
- No error messages when cameras offline

**Root Cause Analysis** (from exploration):
- All 9 cameras wait sequentially for entity attributes (access_token)
- Each entity fetch has 10s timeout → compounds across cameras
- No progressive loading (front door camera waits same as back cameras)
- MJPEG streams have 24-hour nginx timeout → never fail fast
- No component-level timeout handling
- Modal always uses MJPEG even for snapshot-configured cameras

**Proposed Solution** (planned but not implemented):
- Create `usePriorityEntity` hook with priority-based delays
- Front cameras (priority 1-3) load immediately
- Back cameras (priority 4-8) load with staggered delays
- Add 5s timeout at component level
- Show error states for offline cameras
- Reduce nginx MJPEG timeout from 24h → 30s
- Modal respects camera config (stream vs snapshot)

**Plan Location**: `.claude/plans/quiet-wondering-hamming.md`

**Decision**: User skipped camera fixes for now - will implement later

---

## Development Setup (Mac Mini)

### Environment
- **Machine**: Mac mini at 192.168.1.150
- **Home Assistant**: 192.168.1.2:8123
- **Dashboard**: http://192.168.1.2:8099 (production)
- **Dev Server**: http://192.168.1.150:5173 (local development)

### Build & Deploy Workflow
```bash
# 1. Make changes in src/src/
# 2. Build
cd /Users/darrenbrain/projects/ha-custom-dashboard
./build-addon.sh

# 3. Deploy (auto-increments version, commits, pushes)
./deploy.sh

# 4. Update in HA
ssh hassio@192.168.1.2
ha addons update c2ba14e6_family-dashboard

# Or via HA UI: Settings → Add-ons → Family Dashboard → Update
```

### Git Configuration
- **Remote**: https://github.com/djarthur78/ha-custom-dashboard.git
- **Auth**: HTTPS with Personal Access Token
- **Credentials**: Stored in `~/.git-credentials`

---

## File Locations

### Important Configs
- `.env` - Environment variables (HA URL, token) - `/Users/darrenbrain/projects/ha-custom-dashboard/src/.env`
- SSH/PAT - GitHub token - `/Users/darrenbrain/projects/.ssh/id_ed25519`
- Build output - `/Users/darrenbrain/projects/ha-custom-dashboard/family-dashboard/build/`

### New Files Created (v2.0.40)
- `src/src/hooks/useInactivityTimer.js` - 5-minute inactivity detection

### Plans & Documentation
- Camera performance plan - `.claude/plans/quiet-wondering-hamming.md`
- Project instructions - `CLAUDE.md`
- This status file - `STATUS.md`

---

## Next Session Priorities

1. **Camera Performance** (when ready)
   - Implement `usePriorityEntity` hook
   - Update camera hooks and components
   - Test with offline cameras
   - Deploy and verify on wall panel

2. **Other Potential Improvements**
   - Review other dashboard features
   - Performance optimization
   - Additional user requests

---

## Testing Notes

### Verification Checklist for v2.0.40
- [x] Build completes without errors on macOS
- [x] Git push works with HTTPS
- [ ] Calendar is default page on fresh load
- [ ] Inactivity timer redirects after 5 minutes
- [ ] Home page accessible at `/home`
- [ ] Wall panel shows correct behavior (192.168.1.2:8099)

**Note**: Deployed to GitHub but not yet verified on production wall panel.
