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
**Status:** 🔴 INCOMPLETE
**Description:** Queue only shows current track + count, not full track list
**Current Display:**
```
Playing on Office — 19 tracks
Now Playing
Bad Touch Example
Company Flow
18 more tracks in queue

Full queue display coming soon
```

**What's Needed:**
- Show all 19 tracks in scrollable list
- Highlight current track
- Show track number/position
- May need alternate HA service to get full queue data

**Possible Approaches:**
- Check if HA exposes queue via attributes
- Use browse_media to get queue items
- Accept limitation if HA/Sonos doesn't expose queue reliably

---

### 3. Camera Page - Layout Re-render Issue
**Status:** 🔴 BROKEN
**Description:** Camera grid fits initially, then re-renders and requires scrolling
**Observed Behavior:**
- Page loads → cameras fit perfectly
- Something triggers re-render
- Grid becomes too tall → need to scroll to bottom cameras

**Attempted Fixes:**
- Added `overflow: hidden` + `maxHeight` → didn't work
- Issue persists in v2.0.31

**Next Steps to Try:**
- Check CameraFeed component for image loading that changes height
- Look for state changes triggering re-render (doorbell alert removed but may be other triggers)
- Investigate if MJPEG stream loading changes container size
- May need to set explicit heights on camera feed containers
- Consider using aspect-ratio CSS property

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
