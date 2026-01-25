# One-Command Setup (30 Seconds)

## If You Have SSH Access to HA

Run this ONE command from your dev machine (WSL2):

```bash
ssh root@192.168.1.2 "mkdir -p /config/packages && cat > /config/packages/family_dashboard.yaml" << 'EOF'
# Family Dashboard Panel
panel_iframe:
  family_dashboard:
    title: "Family Dashboard"
    icon: mdi:calendar-heart
    url: "http://192.168.1.2:8099"
    require_admin: false
EOF
```

Then add packages to configuration.yaml and restart HA (see below).

---

## If You DON'T Have SSH Access (Use File Editor)

### Option 1: Via Home Assistant File Editor (2 Minutes)

1. **Open File Editor in HA**
   - Go to HA sidebar → File editor (install from Add-on Store if not there)

2. **Create the file** (copy-paste this)
   - Navigate to `config` folder
   - Create folder: `packages` (if it doesn't exist)
   - In packages folder, create file: `family_dashboard.yaml`
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

3. **Enable packages**
   - In File Editor, open `configuration.yaml`
   - Find the `homeassistant:` section (usually at the top)
   - Add this line under it (with 2 spaces indent):
   ```yaml
   homeassistant:
     packages: !include_dir_named packages
   ```
   - Save

4. **Restart HA**
   - Settings → System → Restart
   - Wait 30 seconds

5. **Done!**
   - Look in sidebar
   - Click "Family Dashboard"

---

## After Either Method: Enable Packages and Restart

### 1. Enable Packages in configuration.yaml

**Via File Editor:**
- Open `configuration.yaml`
- Find `homeassistant:` at the top
- Add underneath (2 spaces indent):
  ```yaml
  homeassistant:
    packages: !include_dir_named packages
  ```
- Save

**Via SSH:**
```bash
ssh root@192.168.1.2 "sed -i '/^homeassistant:/a \ \ packages: !include_dir_named packages' /config/configuration.yaml"
```

### 2. Restart Home Assistant

**Via Web UI:**
- Settings → System → Restart

**Via API** (I can do this for you):
```bash
curl -X POST "http://192.168.1.2:8123/api/services/homeassistant/restart" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhNTFjMzFkNzA4MzM0NzdkODNmNmE0NzUwZGE2NDZkMCIsImlhdCI6MTc2ODY1ODc1NSwiZXhwIjoyMDg0MDE4NzU1fQ.ULPVcBjPdaqDV0fp1CiUqGOomTSibjZW7Lqt-ikUBqQ" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Verification

After HA restarts (30 seconds):

1. **Check sidebar** - "Family Dashboard" should appear
2. **Click it** - Calendar dashboard loads
3. **Test remote** - https://ha.99swanlane.uk → same dashboard

---

## If "Family Dashboard" Doesn't Appear

### Debug Checklist

1. **Check file exists:**
   ```bash
   ssh root@192.168.1.2 "cat /config/packages/family_dashboard.yaml"
   ```
   Should show the YAML content

2. **Check packages enabled:**
   ```bash
   ssh root@192.168.1.2 "grep -A2 'homeassistant:' /config/configuration.yaml"
   ```
   Should show `packages: !include_dir_named packages`

3. **Check HA logs:**
   - Settings → System → Logs
   - Search for "panel_iframe" or "family_dashboard"
   - Look for YAML syntax errors

4. **Common fixes:**
   - Verify YAML indentation (2 spaces, not tabs)
   - Ensure no extra spaces at line ends
   - Restart HA again

---

## What You'll See

After successful setup:

```
Home Assistant Sidebar:
├── Overview
├── Map
├── Logbook
├── History
├── Energy
├── Media
├── Family Dashboard  ← NEW! Click here
└── Settings
```

Clicking "Family Dashboard" opens your calendar in an iframe.

Works:
- ✅ Locally (http://192.168.1.2:8123)
- ✅ Remotely (https://ha.99swanlane.uk)
- ✅ HA Companion App
- ✅ Android wall panel

---

## Tell Me Which Method You Used

After you complete the setup, just tell me:
- "done via ssh" or
- "done via file editor"

Then I'll verify it worked and take screenshots to confirm!
