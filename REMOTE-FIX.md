# Fix Remote Access for Arthur Dashboard

## Problem
Dashboard works locally but fails remotely via HA Companion App with error:
> "Unable to load iframes pointing at websites using http: if Home Assistant is served over https:."

## Root Cause
- HA accessed via HTTPS: `https://ha.99swanlane.uk` (Cloudflare Tunnel)
- Dashboard iframe uses HTTP: `http://192.168.1.2:8099`
- Browsers block mixed content (HTTP iframe in HTTPS page)

## Solution
Make dashboard accessible via HTTPS using Cloudflare Tunnel.

---

## Step 1: Add Cloudflare Tunnel Route

### Using Cloudflare Dashboard (Easiest)

1. **Log in to Cloudflare:**
   - Go to https://dash.cloudflare.com
   - Select domain: `99swanlane.uk`

2. **Navigate to Tunnel:**
   - Click "Zero Trust" in sidebar
   - Go to "Access" → "Tunnels"
   - Find your existing tunnel (the one routing `ha.99swanlane.uk`)
   - Click "Configure"

3. **Add Public Hostname:**
   - Click "Public Hostnames" tab
   - Click "Add a public hostname"

   **Settings:**
   - **Subdomain:** `dashboard`
   - **Domain:** `99swanlane.uk`
   - **Type:** HTTP
   - **URL:** `192.168.1.2:8099`

   **Additional Settings:**
   - HTTP2 Connection: ON (recommended)
   - No TLS Verify: OFF (keep secure)

   - Click "Save hostname"

4. **Wait 1-2 minutes for DNS propagation**

5. **Test:**
   ```bash
   curl -I https://dashboard.99swanlane.uk
   # Should return 200 OK
   ```

---

## Step 2: Update Lovelace Dashboard Config

### SSH to Home Assistant

```bash
ssh root@192.168.1.2
# Or use Terminal add-on in HA
```

### Edit Dashboard Config

```bash
nano /config/.storage/lovelace.arthur_dashboard
```

**Find this section:**
```json
"url": "http://192.168.1.2:8099",
```

**Change to:**
```json
"url": "https://dashboard.99swanlane.uk",
```

**Save:** Ctrl+X, Y, Enter

### Restart Home Assistant

Via UI:
- Settings → System → Restart

Or via CLI:
```bash
ha core restart
```

---

## Step 3: Test

1. **Open HA Companion App**
2. **Tap "Arthur Dashboard"**
3. **Dashboard should load with no errors**

---

## Verification Checklist

- [ ] Cloudflare route added for `dashboard.99swanlane.uk`
- [ ] DNS resolves: `dig dashboard.99swanlane.uk` returns Cloudflare IPs
- [ ] HTTPS works: `curl -I https://dashboard.99swanlane.uk` returns 200
- [ ] Lovelace config updated to HTTPS URL
- [ ] HA restarted
- [ ] Dashboard loads in HA Companion App without errors

---

## Troubleshooting

### Dashboard.99swanlane.uk shows 502 Bad Gateway
**Cause:** Cloudflare can't reach 192.168.1.2:8099

**Fix:**
```bash
# Check dashboard is running
docker ps | grep family-dashboard

# Check logs
docker logs family-dashboard

# Restart if needed
docker restart family-dashboard
```

### Dashboard shows blank screen
**Cause:** Cached iframe or connection issue

**Fix:**
- Force refresh HA Companion App
- Clear app cache
- Log out and log back in

### Still shows HTTP error
**Cause:** Lovelace config not updated or HA not restarted

**Fix:**
- Verify `/config/.storage/lovelace.arthur_dashboard` shows HTTPS URL
- Restart HA again
- Hard refresh app

---

## What This Changes

**Before:**
- Local: ✅ Works (HTTP to HTTP)
- Remote: ❌ Fails (HTTPS to HTTP = mixed content blocked)

**After:**
- Local: ✅ Works (HTTPS to HTTPS via Cloudflare)
- Remote: ✅ Works (HTTPS to HTTPS via Cloudflare)

**Note:** Local access now routes through Cloudflare tunnel (adds ~20-50ms latency), but this is negligible and ensures consistent behavior everywhere.

---

## Summary

1. Add Cloudflare route: `dashboard.99swanlane.uk → 192.168.1.2:8099`
2. Update Lovelace iframe: `https://dashboard.99swanlane.uk`
3. Restart HA
4. Test in Companion App

**Time:** 5-10 minutes
**Difficulty:** Easy (just config changes, no code)
**Risk:** Low (reversible, no breaking changes)
