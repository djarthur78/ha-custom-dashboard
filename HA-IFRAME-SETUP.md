# Setup Family Dashboard as HA iframe Dashboard

## What This Does

Creates a new dashboard in Home Assistant that shows your Family Dashboard via iframe. This works:
- ✅ In HA Companion App (local and remote)
- ✅ Via Cloudflare → HA (your existing tunnel)
- ✅ On Android wall panel
- ✅ On phone remotely

## Setup Steps (5 minutes)

### Step 1: Create New Dashboard

1. In Home Assistant: **Settings → Dashboards**
2. Click **+ ADD DASHBOARD** (bottom right)
3. **Name:** `Family Dashboard`
4. **Icon:** `mdi:calendar-heart`
5. **Show in sidebar:** ✅ ON
6. **Admin only:** ❌ OFF
7. Click **CREATE**

### Step 2: Add iframe Card

1. Click on the new "Family Dashboard" in your sidebar
2. Click **⋮** (three dots, top right) → **Edit Dashboard**
3. Click **+ ADD CARD**
4. Search for: **Webpage Card**
5. Configure:
   - **URL:** `http://192.168.1.2:8099`
   - **Aspect Ratio:** `16x9` (or leave blank for full height)
6. Click **SAVE**
7. Click **DONE** (exit edit mode)

### Step 3: Test

**Local (on network):**
- Click "Family Dashboard" in HA sidebar
- Should show your calendar dashboard in an iframe

**Remote (via Cloudflare):**
- Access HA: `https://ha.99swanlane.uk`
- Login via Cloudflare Access
- Click "Family Dashboard" in sidebar
- Should show your calendar

**Android Wall Panel:**
- Open HA Companion App
- Tap "Family Dashboard" in sidebar
- Full screen calendar dashboard

## How It Works

```
Browser/App
    ↓
https://ha.99swanlane.uk (Cloudflare)
    ↓
HA Pi (192.168.1.2:8123)
    ↓
HA Lovelace Dashboard
    ↓
iframe → http://192.168.1.2:8099
    ↓
Family Dashboard Add-on
```

## Advantages

- ✅ Uses your existing Cloudflare tunnel
- ✅ No security changes needed
- ✅ Works in HA Companion App everywhere
- ✅ Single workflow (local + remote)
- ✅ Responsive design works (phone + tablet)
- ✅ No NPM complexity
- ✅ Simple and reliable

## Optional: Make It Full Screen

If you want the dashboard to take the full screen on the wall panel:

1. Edit the dashboard
2. Click on the iframe card
3. In **Aspect Ratio**, delete the value (leave blank)
4. Add this to the card YAML (click **SHOW CODE EDITOR**):

```yaml
type: iframe
url: http://192.168.1.2:8099
aspect_ratio: 0%
```

Or create a dedicated view:

1. Edit dashboard → **+ ADD VIEW**
2. **Title:** Leave blank (hides header)
3. **Icon:** `mdi:view-dashboard`
4. **Panel mode:** ✅ ON (makes card full screen)
5. Add iframe card with URL: `http://192.168.1.2:8099`

## Troubleshooting

### iframe shows "Unable to connect"
- Check Family Dashboard add-on is running
- Check port 8099 works: `http://192.168.1.2:8099`

### Blank iframe
- Add-on needs the access token configured
- Settings → Add-ons → Family Dashboard → Configuration
- Fill in `ha_token` and restart

### Remote access doesn't work
- This happens if your browser blocks mixed content (HTTPS → HTTP iframe)
- HA Companion App should work fine
- Desktop browsers might block it remotely

## Next Steps

Once working:
- Use this for your wall panel
- Use HA Companion App for remote access
- Build Meal Planner feature next
- All features work through the same iframe
