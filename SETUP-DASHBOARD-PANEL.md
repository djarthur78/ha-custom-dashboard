# Setup Family Dashboard in Home Assistant (2 Minutes)

## What This Does

Adds "Family Dashboard" to your HA sidebar that works:
- ✅ Locally on network
- ✅ Remotely via https://ha.99swanlane.uk (Cloudflare tunnel)
- ✅ In HA Companion App on phone/tablet
- ✅ On Android wall panel

## Quick Setup (Choose ONE method)

### Method 1: File Editor (Easiest - 2 minutes)

1. **Open File Editor in HA**
   - Settings → Add-ons → Store
   - Search: "File editor"
   - Install if not already installed
   - Open File Editor from sidebar

2. **Enable packages (if not already)**
   - In File Editor, open `configuration.yaml`
   - Find the `homeassistant:` section (usually at top)
   - Add this line under it (indented with 2 spaces):
   ```yaml
   homeassistant:
     packages: !include_dir_named packages
   ```
   - Save the file

3. **Create packages folder**
   - In File Editor, click folder icon
   - Click "New Folder" button
   - Name it: `packages`
   - Click "Create"

4. **Create dashboard configuration**
   - In File Editor, navigate to the `packages` folder
   - Click "New File" button (+ icon)
   - Name it: `family_dashboard.yaml`
   - Paste this content:
   ```yaml
   # Family Dashboard Panel
   panel_iframe:
     family_dashboard:
       title: "Family Dashboard"
       icon: mdi:calendar-heart
       url: "http://192.168.1.2:8099"
       require_admin: false
   ```
   - Save the file

5. **Restart Home Assistant**
   - Settings → System → Restart
   - Wait for HA to restart (~30 seconds)

6. **Done!**
   - Look in your sidebar
   - You should see "Family Dashboard" with calendar heart icon
   - Click it to open

### Method 2: SSH/Terminal (Advanced - 1 minute)

If you have SSH access to your HA:

```bash
# SSH to HA
ssh root@192.168.1.2

# Create packages folder
mkdir -p /config/packages

# Create dashboard config
cat > /config/packages/family_dashboard.yaml << 'EOF'
# Family Dashboard Panel
panel_iframe:
  family_dashboard:
    title: "Family Dashboard"
    icon: mdi:calendar-heart
    url: "http://192.168.1.2:8099"
    require_admin: false
EOF

# Add packages to configuration.yaml (if not already there)
if ! grep -q "packages:" /config/configuration.yaml; then
  sed -i '/^homeassistant:/a \ \ packages: !include_dir_named packages' /config/configuration.yaml
fi

# Restart HA
ha core restart
```

## Testing

### Test Locally

1. On any device on your network
2. Open http://192.168.1.2:8123
3. Login to HA
4. Click "Family Dashboard" in sidebar
5. Should see your calendar dashboard

### Test Remotely

1. On your phone (NOT on home WiFi)
2. Open https://ha.99swanlane.uk
3. Login via Cloudflare Access (email verification)
4. Open HA Companion App or browser
5. Click "Family Dashboard" in sidebar
6. Should see your calendar dashboard

### Test on Android Wall Panel

1. Install HA Companion App on tablet
2. Login to your HA instance
3. Enable kiosk mode (optional)
4. Click "Family Dashboard" in sidebar
5. Dashboard opens in full screen

## Troubleshooting

### "Family Dashboard" doesn't appear in sidebar

**Check 1: Verify configuration file exists**
- File Editor → `packages/family_dashboard.yaml` should exist
- Check the content matches the example above

**Check 2: Verify packages are enabled**
- File Editor → `configuration.yaml`
- Should have:
  ```yaml
  homeassistant:
    packages: !include_dir_named packages
  ```

**Check 3: Check for errors**
- Settings → System → Logs
- Look for errors related to "panel_iframe" or "family_dashboard"
- Common error: YAML indentation (must use 2 spaces, not tabs)

**Fix:** Double-check indentation in YAML files, restart HA

### Panel shows "Unable to connect"

**Cause:** Family Dashboard add-on is not running

**Fix:**
1. Settings → Add-ons → Family Dashboard
2. Click "Start"
3. Check logs for errors
4. Test direct access: http://192.168.1.2:8099

### Panel shows blank page

**Cause:** Add-on needs token configuration

**Fix:**
1. Settings → Add-ons → Family Dashboard → Configuration
2. In `ha_token` field, paste your long-lived token
   - Get token from: http://192.168.1.2:8123/profile (scroll to bottom)
3. Save and restart add-on

### Remote access shows mixed content warning

**This is normal.** The iframe loads HTTP content (port 8099) inside HTTPS (Cloudflare).

**Solution for browsers:** HA Companion App handles this automatically

**Solution for desktop:** Access via HA Companion App or bookmark http://192.168.1.2:8099 for local use

## How It Works

```
Remote Device
     ↓
https://ha.99swanlane.uk (Cloudflare Tunnel)
     ↓
HA Pi (192.168.1.2:8123)
     ↓
HA Sidebar: "Family Dashboard" (panel_iframe)
     ↓
Loads: http://192.168.1.2:8099
     ↓
Family Dashboard Add-on
```

## Benefits

✅ Single access point (HA sidebar)
✅ Works everywhere (local + remote)
✅ No Nginx Proxy Manager complexity
✅ No additional routing needed
✅ Uses existing Cloudflare tunnel
✅ Works in HA Companion App
✅ Responsive design (phone + tablet + desktop)

## Next Steps

Once working:
- [ ] Test all calendar features work
- [ ] Test on Android wall panel (kiosk mode)
- [ ] Test remote access on phone
- [ ] Build Meal Planner feature next
- [ ] Add other dashboard features (Games Room, Cameras)

## Alternative: Direct Lovelace Dashboard (If panel_iframe doesn't work)

If panel_iframe gives errors, create a Lovelace dashboard with iframe card instead:

1. Settings → Dashboards
2. Click "+ ADD DASHBOARD"
3. Name: `Family Dashboard`
4. Icon: `mdi:calendar-heart`
5. Show in sidebar: ON
6. Click "CREATE"
7. Click on "Family Dashboard" in sidebar
8. Click "..." → "Edit Dashboard"
9. Click "+ ADD CARD"
10. Search: "Webpage Card"
11. URL: `http://192.168.1.2:8099`
12. Save

This gives the same result but requires manual UI steps instead of configuration file.

## Support

If you encounter issues:
- Check HA logs: Settings → System → Logs
- Check add-on logs: Settings → Add-ons → Family Dashboard → Logs
- Test direct access works: http://192.168.1.2:8099
- Verify add-on is running and healthy

---

**Estimated setup time:** 2 minutes
**Requires restart:** Yes (after config changes)
**Difficulty:** Beginner-friendly
