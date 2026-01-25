# Deploy Dashboard on HA Pi - Final Solution

## What We're Doing

Deploying your React dashboard on the HA Pi (192.168.1.2) so it works through your existing Cloudflare tunnel with NO security changes.

**Access:**
- Local: `http://192.168.1.2/dashboard`
- Remote: `https://ha.99swanlane.uk/dashboard`

## Step-by-Step Instructions

### Step 1: Update Add-on in Home Assistant

The add-on code is pushed to GitHub with:
- ✅ Responsive CSS for phone optimization
- ✅ Port 8099 configured
- ✅ Latest React build with calendar

**In Home Assistant:**

1. Go to: **Settings → Add-ons → Add-on Store**
2. Click **⋮ menu** (top right) → **Reload**
3. Find "**Family Dashboard**" in your installed add-ons
4. Click it
5. Click **Update** (if available) OR **Rebuild**
6. Wait for build to complete
7. Click **START**
8. Check logs - should see:
   ```
   Starting Family Dashboard...
   Creating runtime configuration...
   Configuration created with Supervisor token
   Starting nginx...
   ```

**Test direct access:**
- Open browser: `http://192.168.1.2:8099`
- Should load your calendar dashboard

### Step 2: Install Nginx Proxy Manager

This lets us proxy `/dashboard` → `localhost:8099` so Cloudflare works.

**In Home Assistant:**

1. Go to: **Settings → Add-ons → Add-on Store**
2. Click **⋮ menu** → **Repositories**
3. Add: `https://github.com/hassio-addons/repository`
4. Click **Close**
5. Refresh the page
6. Search for "**Nginx Proxy Manager**"
7. Click it → **Install**
8. After install: **Start**
9. Enable: **Show in sidebar**

### Step 3: Configure Nginx Proxy Manager

**Access NPM:**
- In HA sidebar, click "**Nginx Proxy Manager**"
- First time login:
  - Email: `admin@example.com`
  - Password: `changeme`
  - It will prompt you to change password - do it now

**Add Proxy Host:**

1. Click **Hosts** → **Proxy Hosts**
2. Click **Add Proxy Host**

**Details tab:**
- **Domain Names:** `192.168.1.2` (press Enter after typing)
- **Scheme:** `http`
- **Forward Hostname / IP:** `127.0.0.1`
- **Forward Port:** `8099`
- **Cache Assets:** ON
- **Block Common Exploits:** ON
- **Websockets Support:** ON

**Custom Locations tab:**
- Click **Add Location**
- **Location:** `/dashboard`
- **Scheme:** `http`
- **Forward Hostname / IP:** `127.0.0.1`
- **Forward Port:** `8099`
- **Websockets Support:** ON

**Advanced tab:**
```nginx
# Remove the leading /dashboard from the path before forwarding
rewrite ^/dashboard/(.*) /$1 break;
rewrite ^/dashboard$ / break;

# WebSocket support
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";

# Headers
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

3. Click **Save**

### Step 4: Test Access

**Local Access:**
- Browser: `http://192.168.1.2/dashboard`
- Should load your calendar dashboard
- Try on phone and tablet - responsive design should adapt

**Remote Access (via Cloudflare):**
- Browser: `https://ha.99swanlane.uk/dashboard`
- Should work immediately (Cloudflare already routes to HA Pi)
- Test on phone while NOT on home WiFi

### Step 5: Add Token (If Needed)

If you see "Connection Error" in the dashboard:

1. Go to HA: `http://192.168.1.2:8123/profile`
2. Scroll down to "**Long-Lived Access Tokens**"
3. Click "**Create Token**"
4. Name: `Family Dashboard`
5. Copy the token
6. Go to: **Settings → Add-ons → Family Dashboard**
7. Click **Configuration** tab
8. Paste token in `ha_token` field
9. Click **Save**
10. **Restart** the add-on

## Troubleshooting

### Dashboard not loading at /dashboard
- Check NPM proxy host is configured correctly
- Check NPM add-on is running
- Try direct access first: `http://192.168.1.2:8099`

### Connection error in dashboard
- Add HA token (see Step 5 above)
- Check HA is accessible at `http://192.168.1.2:8123`
- Check add-on logs for errors

### Remote access not working
- Make sure local `/dashboard` works first
- Cloudflare tunnel should already route to HA Pi
- No Cloudflare config changes needed
- Check Cloudflare tunnel is running

### Phone view doesn't look right
- Clear browser cache
- Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- Responsive CSS is built-in now

## Architecture

```
┌──────────────────────────────────────┐
│  Your Devices (Phone, iPad)          │
└────────┬─────────────────────────────┘
         │
         ├─ Local: http://192.168.1.2/dashboard
         │
         └─ Remote: https://ha.99swanlane.uk/dashboard
                    ↓
            ┌───────────────────┐
            │ Cloudflare Tunnel │
            └─────────┬─────────┘
                      │
┌─────────────────────▼──────────────────────┐
│  HA Pi (192.168.1.2)                       │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ Nginx Proxy Manager Add-on           │  │
│  │  - Routes /dashboard → :8099         │  │
│  └────────────────┬─────────────────────┘  │
│                   │                        │
│  ┌────────────────▼─────────────────────┐  │
│  │ Family Dashboard Add-on (:8099)      │  │
│  │  - React SPA                         │  │
│  │  - Responsive (phone + tablet)       │  │
│  │  - WebSocket to HA                   │  │
│  └────────────────┬─────────────────────┘  │
│                   │                        │
│  ┌────────────────▼─────────────────────┐  │
│  │ Home Assistant Core (:8123)          │  │
│  │  - Calendar integration              │  │
│  │  - All other integrations            │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

## Security

✅ **No changes to your Cloudflare tunnel** - still only points to HA Pi
✅ **No external exposure of PiHole Pi** - your security boundary maintained
✅ **HA authentication** - Nginx Proxy Manager runs within HA
✅ **HTTPS via Cloudflare** - encrypted remote access

## What's Next

Once deployed and working:

1. **Test on all devices:**
   - iPad (wall panel)
   - Phone (local and remote)
   - Desktop browser

2. **Build Meal Planner:**
   - Add meals page
   - Use HA input_text entities
   - Same responsive design

3. **Future features:**
   - Games room controls
   - Camera feeds
   - Maps
   - Cinema schedules

All will work through the same `/dashboard` URL, local and remote!
