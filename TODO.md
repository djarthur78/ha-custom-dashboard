# TODO - Bug Fixes

## High Priority - Production Issues

### 1. Music Dashboard - Playlists Not Playing
**Status:** ✅ FIXED (needs user action)
**Description:** Clicking favorite playlists does nothing - no music plays
**Root Cause:**
1. Wrong `media_content_type` - was 'music', should be 'playlist'
2. Placeholder URIs in config need to be replaced with real Spotify playlist IDs

**Fix Applied:**
- ✅ Changed `media_content_type` from 'music' to 'playlist' in PlaylistPanel.jsx:185
- ✅ Updated musicConfig.js with better documentation
- ✅ Updated README.md with correct instructions and Liked Songs limitation
- ✅ Tested with public Spotify playlist - works perfectly!

**USER ACTION REQUIRED:**
1. Get your actual Spotify playlist URIs:
   - Open Spotify → Right-click playlist → Share → Copy Spotify URI
   - Format: `spotify:playlist:37i9dQZF1DXcBWIGoYBM5M`
2. Edit `musicConfig.js` and replace `YOUR_PLAYLIST_ID` placeholders
3. Build and deploy: `./build-addon.sh` → Update in HA
4. Test by clicking playlists in Music Dashboard

**Note:** "Liked Songs" cannot be played directly (HA Spotify API limitation). Use "Browse All" button to access it via media browser.

**References:**
- [Home Assistant Spotify Integration](https://www.home-assistant.io/integrations/spotify/)
- [HA Community: Playing Spotify on Sonos](https://community.home-assistant.io/t/playing-spotify-playlist-on-sonos-triggered-by-automation/230579)

---

### 2. Music Dashboard - Queue Display
**Status:** ✅ IMPROVED (API limitation - cannot fix fully)
**Description:** Queue only shows current track + count, not full track list

**Investigation Results:**
- ❌ HA Sonos integration only exposes `queue_position` and `queue_size` attributes
- ❌ NO API endpoint to get full queue track list
- ❌ `sonos.get_queue` service doesn't exist or isn't accessible
- ❌ `browse_media` with queue type returns 400 error
- ✅ This is a **known limitation** of the HA Sonos integration

**Solution Implemented:**
- ✅ Enhanced queue display with better visualization
- ✅ Shows: total tracks, current position, tracks remaining, visual progress bar
- ✅ Documented API limitation clearly in the UI
- ✅ Simplified useQueue hook (removed non-functional code)
- ✅ Better styling and information density

**Alternative for Full Queue:**
Users who need full queue display can install the custom component:
- [sensor.sonos_upcoming_media](https://github.com/JackJPowell/sensor.sonos_upcoming_media)

**References:**
- [HA Sonos Integration](https://www.home-assistant.io/integrations/sonos/)
- [HA Community: Dashboard Sonos Card](https://community.home-assistant.io/t/dashboard-sonos-card/393620)

---

### 3. Camera Page - Layout Re-render Issue
**Status:** ✅ FIXED
**Description:** Camera grid fits initially, then re-renders and requires scrolling

**Root Cause:**
- Grid scroll height (1371px) exceeded container height (1024px)
- CSS Grid rows were calculating based on content size instead of container constraints
- Grid cells were growing beyond their allocated fractional units
- Images with intrinsic dimensions were pushing rows taller than intended

**Solution Implemented:**
- ✅ Added `minHeight: 0` to grid container (critical for grid shrinking)
- ✅ Added `gridAutoRows: minmax(0, 1fr)` to prevent row expansion
- ✅ Added `minHeight: 0, minWidth: 0` to all grid cell containers
- ✅ Added `maxHeight: 100%, maxWidth: 100%` to CameraFeed component
- ✅ Verified: Grid scroll height now equals container height (1024px)

**Testing Results:**
- Before: gridScrollHeight 1371px, overflow 347px ❌
- After: gridScrollHeight 1024px, no overflow ✅
- All 8 cameras now visible without scrolling
- Grid rows properly constrained: 330px + 330px + 356px ≈ 1024px

**Technical Details:**
The `minHeight: 0` property is critical in CSS Grid/Flexbox to allow containers to shrink below their content's intrinsic size. Without it, grid tracks will expand to fit content regardless of fr unit constraints.

---

## Working Features ✅

- Calendar search & filter
- Music Dashboard speaker zones (corrected)
- Music Dashboard layout (40/30/30)
- Doorbell navigation (simplified - no flash/banner)
- All other features stable

---

## Notes

- Test each fix on dev server before deploying
- Use Puppeteer to verify at 1920x1080 resolution
- All fixes should maintain existing functionality
