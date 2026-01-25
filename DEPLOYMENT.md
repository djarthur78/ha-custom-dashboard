# Dashboard Deployment & Access Guide

**Current Version:** 0.9.0
**Status:** ✅ DEPLOYED AND WORKING
**Last Updated:** Jan 25, 2026

---

## 🚀 Quick Access

### Method 1: Direct Access (Recommended)
**URL:** http://192.168.1.2:8099

**Works for:**
- iPad (kitchen tablet)
- Desktop browsers
- Mobile devices on same network

### Method 2: Via Home Assistant (HA Companion App)
**Dashboard:** "Arthur Dashboard" in HA sidebar
**URL:** http://192.168.1.2:8123/arthur-dashboard

**How it works:**
- Dedicated Lovelace dashboard
- Fullscreen iframe to port 8099
- Works in HA Companion App on iOS/Android
- Accessible locally and remotely via Cloudflare tunnel

---

## 📱 iPad Setup (Kitchen Tablet)

### Option A: Direct Access (Standalone App)
1. Open Safari → http://192.168.1.2:8099
2. Tap Share button → "Add to Home Screen"
3. Name it "Family Dashboard"
4. Tap icon on home screen → Opens as fullscreen app

### Option B: Via HA Companion App
1. Install HA Companion App from App Store
2. Login to your Home Assistant
3. Tap "Arthur Dashboard" in sidebar
4. Dashboard loads fullscreen

**Recommended:** Use Option A for best performance

---

## 🏠 How the Dashboard is Deployed

The dashboard runs as a **Home Assistant add-on** in a Docker container:

- **Name:** Family Dashboard
- **Version:** 0.9.0
- **Port:** 8099
- **Stack:** React + Nginx
- **Location:** Raspberry Pi @ 192.168.1.2

### Architecture
```
┌─────────────────────────────────────────┐
│  Client Device (iPad/Desktop/Phone)    │
└───────────┬─────────────────────────────┘
            │
     ┌──────┴───────┐
     │              │
  Direct:      HA Dashboard:
  :8099        :8123/arthur-dashboard
     │              │
     └──────┬───────┘
            │
┌───────────▼─────────────────────────────┐
│  Home Assistant Pi (192.168.1.2)        │
│  ┌──────────────────────────────────┐   │
│  │ Family Dashboard Add-on (:8099)  │   │
│  │  - React SPA                     │   │
│  │  - WebSocket → HA Core           │   │
│  │  - Nginx serving static files    │   │
│  └──────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

---

## 🔧 Updating the Dashboard

### From GitHub (Production Method)

1. **Push changes to GitHub:**
   ```bash
   cd /home/arthu/projects/ha-custom-dashboard
   # Make your changes
   npm run build  # Build React app
   ./build-addon.sh  # Copy to add-on directory
   git add -A
   git commit -m "Your update message"
   git push
   ```

2. **Update in Home Assistant:**
   - Settings → Add-ons → Family Dashboard
   - Click "Check for updates"
   - Click "Update" if available
   - Click "Restart" to apply changes

### Manual Update (Development)

If you need to test before pushing to GitHub:

```bash
# 1. Build locally
cd src
npm run build

# 2. Copy to add-on
rm -rf ../family-dashboard/build
cp -r dist ../family-dashboard/build

# 3. Bump version in config.json
# Edit family-dashboard/config.json, increment version

# 4. Commit and push
git add -A
git commit -m "Manual update"
git push

# 5. Rebuild add-on in HA
# Settings → Add-ons → Family Dashboard → Rebuild
```

---

## 🎯 Arthur Dashboard (HA Integration)

The "Arthur Dashboard" in Home Assistant sidebar provides fullscreen access to the React app.

### How it Works

**Lovelace Dashboard Configuration:**
```json
{
  "title": "Arthur Dashboard",
  "views": [{
    "panel": true,
    "cards": [{
      "type": "iframe",
      "url": "http://192.168.1.2:8099",
      "aspect_ratio": "100%"
    }]
  }]
}
```

**Location:** `/config/.storage/lovelace.arthur_dashboard` on HA Pi

### Recreating Arthur Dashboard

If you need to recreate it:

1. **SSH to HA Pi:**
   ```bash
   ssh hassio@192.168.1.2
   # Password: hassio
   ```

2. **Create dashboard file:**
   ```bash
   sudo tee /config/.storage/lovelace.arthur_dashboard > /dev/null << 'EOF'
   {
     "version": 1,
     "minor_version": 1,
     "key": "lovelace.arthur_dashboard",
     "data": {
       "config": {
         "title": "Arthur Dashboard",
         "views": [{
           "panel": true,
           "cards": [{
             "type": "iframe",
             "url": "http://192.168.1.2:8099",
             "aspect_ratio": "100%"
           }]
         }]
       }
     }
   }
   EOF
   ```

3. **Restart Home Assistant:**
   - Settings → System → Restart

4. **Verify:**
   - Check sidebar for "Arthur Dashboard"
   - Click it - should load fullscreen React app

---

## 🐛 Troubleshooting

### Dashboard Won't Load (Port 8099)

**Check add-on is running:**
1. Settings → Add-ons → Family Dashboard
2. Look for "Running" status
3. If stopped, click "Start"

**Check logs:**
1. In Family Dashboard add-on page
2. Click "Log" tab
3. Look for errors

**Restart add-on:**
1. Click "Restart" button
2. Wait 10 seconds
3. Try accessing again

### Arthur Dashboard Shows Blank Screen

**Symptom:** HA sidebar shows dashboard but iframe is blank

**Fix:**
1. Verify add-on is running (see above)
2. Test direct URL works: http://192.168.1.2:8099
3. If direct URL works but iframe doesn't, hard refresh:
   - Desktop: Ctrl+F5 or Cmd+Shift+R
   - Mobile: Pull down to refresh

**Still broken:** Recreate dashboard (see "Recreating Arthur Dashboard" above)

### "Connected" Status Shows Red

**Symptom:** Dashboard loads but shows "Disconnected" in header

**Cause:** WebSocket connection to Home Assistant failed

**Fix:**
1. Check Home Assistant is accessible: http://192.168.1.2:8123
2. Verify token in add-on configuration:
   - Settings → Add-ons → Family Dashboard → Configuration
   - Check "ha_token" is set (should be auto-configured)
3. Restart add-on
4. Hard refresh browser

### Remote Access Not Working

**Symptom:** Works locally but not via Cloudflare

**Check Cloudflare tunnel:**
1. HA Settings → Add-ons → Cloudflare Tunnel
2. Verify it's running
3. Test: https://ha.99swanlane.uk

**Arthur Dashboard via Cloudflare:**
1. https://ha.99swanlane.uk → Opens HA
2. Click "Arthur Dashboard" in sidebar
3. iframe loads from client's network context
4. If you're on VPN or local network, :8099 is accessible
5. If remote without VPN, only HA (:8123) is accessible

---

## 📋 Development Workflow

### Local Development
```bash
cd src
npm run dev
# Access: http://localhost:5173
```

### Build for Production
```bash
cd src
npm run build
# Output: src/dist/
```

### Deploy to HA Add-on
```bash
# From project root
./build-addon.sh
# Then push to GitHub or copy to HA manually
```

### Version Management

**Version numbers:**
- React app: `src/package.json`
- Add-on: `family-dashboard/config.json`

**Keep them in sync:**
```bash
# After updating features
cd src
npm version patch  # or minor/major
cd ..
# Update family-dashboard/config.json to match
```

---

## 🔗 Related Documentation

- **ROADMAP.md** - Complete feature plan and phases
- **DEVELOPMENT.md** - Setup and development guide
- **ARCHITECTURE.md** - Technical design decisions
- **CHANGELOG.md** - Version history

---

## ✅ Current Setup (Working Configuration)

**What you have:**
- ✅ Family Dashboard add-on v0.9.0 running on port 8099
- ✅ Arthur Dashboard in HA sidebar (iframe to :8099)
- ✅ Direct access via http://192.168.1.2:8099
- ✅ HA Companion App access via Arthur Dashboard
- ✅ Remote access via Cloudflare tunnel
- ✅ Compact header with icon navigation
- ✅ Date/time/weather in header
- ✅ 6 calendar view modes + biweekly view
- ✅ Event creation, editing, deletion
- ✅ Real-time updates via WebSocket

**Access methods tested and working:**
- ✅ Safari on iPad @ http://192.168.1.2:8099
- ✅ Desktop browser @ http://192.168.1.2:8099
- ✅ HA Companion App → Arthur Dashboard
- ✅ Remote via Cloudflare → Arthur Dashboard

**Last verified:** Jan 25, 2026
