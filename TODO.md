# TODO - Bug Fixes

## High Priority - Production Issues

### 1. Music Dashboard - Playlists Not Playing
**Status:** 🔴 BROKEN
**Description:** Clicking favorite playlists does nothing - no music plays
**Current State:**
- Playlists display correctly in Daz tab
- Click action fires but music doesn't start
- May need different Spotify URI format or service call parameters

**Possible Fixes:**
- Check Spotify URI format (spotify:playlist:... vs spotify://...)
- Verify media_content_type (tried 'music', may need 'spotify' or other)
- Test with direct service call via HA UI to find working format
- May need to use Spotify entity directly instead of Sonos

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
