# Cloudflare Tunnel Setup for Dashboard

## Current Setup

You already have a Cloudflare Tunnel configured for Home Assistant:
- **URL:** https://ha.99swanlane.uk
- **Target:** http://192.168.1.2:8123 (HA Pi)

## Adding Dashboard Subdomain

You need to add a second route to your existing Cloudflare Tunnel to point to the dashboard on the PiHole Pi.

### Option 1: Using Cloudflare Dashboard (Recommended)

1. **Log in to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Select your domain: `99swanlane.uk`

2. **Navigate to Cloudflare Tunnel**
   - Click "Zero Trust" in the sidebar
   - Go to "Access" → "Tunnels"
   - Find your existing tunnel (the one routing to HA)
   - Click "Configure"

3. **Add Public Hostname**
   - Click "Public Hostnames" tab
   - Click "Add a public hostname"

   **Configuration:**
   - **Subdomain:** `dashboard`
   - **Domain:** `99swanlane.uk` (select from dropdown)
   - **Type:** HTTP
   - **URL:** `192.168.1.3:80`

   **Additional Settings (expand "Additional application settings"):**
   - No TLS Verify: OFF (keep default)
   - HTTP2 Connection: ON (recommended)

   - Click "Save hostname"

4. **Test Access**
   - Wait 30-60 seconds for DNS propagation
   - Visit: https://dashboard.99swanlane.uk
   - Should load your React dashboard

### Option 2: Using Cloudflare Tunnel Config File

If you manage your tunnel via config file (more advanced):

**Find your tunnel config file location:**
```bash
# Usually located at:
# /etc/cloudflared/config.yml
# or ~/.cloudflared/config.yml
```

**Edit the config file:**
```yaml
tunnel: <your-tunnel-id>
credentials-file: /path/to/<tunnel-id>.json

ingress:
  # Existing HA route
  - hostname: ha.99swanlane.uk
    service: http://192.168.1.2:8123

  # NEW: Dashboard route
  - hostname: dashboard.99swanlane.uk
    service: http://192.168.1.3:80
    originRequest:
      noTLSVerify: false
      http2Origin: true

  # Catch-all (must be last)
  - service: http_status:404
```

**Restart cloudflared:**
```bash
# If running as service
sudo systemctl restart cloudflared

# If running in Docker
docker restart cloudflared
```

### Option 3: Using CLI

If you have `cloudflared` CLI installed:

```bash
cloudflared tunnel route dns <tunnel-name> dashboard.99swanlane.uk
```

Then update the tunnel ingress rules via dashboard or config file.

## Verification

### Check DNS Resolution
```bash
dig dashboard.99swanlane.uk
# Should show Cloudflare IPs (104.x.x.x or 172.x.x.x)
```

### Check Local Access First
```bash
curl -I http://192.168.1.3
# Should return 200 OK with nginx headers
```

### Check Remote Access
```bash
curl -I https://dashboard.99swanlane.uk
# Should return 200 OK
```

### Browser Test
1. **Local network:** http://192.168.1.3 - Should work immediately
2. **Remote access:** https://dashboard.99swanlane.uk - Should work after Cloudflare config

## Troubleshooting

### Dashboard subdomain shows 502 Bad Gateway
- **Cause:** Cloudflare can't reach 192.168.1.3:80
- **Fix:**
  - Check dashboard container is running: `docker ps`
  - Check nginx is listening: `docker logs family-dashboard`
  - Check firewall on PiHole Pi: `sudo ufw status`

### Dashboard subdomain shows 404
- **Cause:** Cloudflare route not configured correctly
- **Fix:** Double-check hostname is `dashboard.99swanlane.uk` and service is `http://192.168.1.3:80`

### Dashboard subdomain doesn't resolve
- **Cause:** DNS not updated yet
- **Fix:** Wait 5-10 minutes for DNS propagation, clear browser cache

### Works locally but not remotely
- **Cause:** Cloudflare tunnel not routing correctly
- **Fix:**
  - Check tunnel is running: `cloudflared tunnel info <tunnel-name>`
  - Verify ingress rules include dashboard route
  - Check Cloudflare Tunnel logs

## Access Methods Summary

After setup, you'll have:

| Access Method | URL | Notes |
|---------------|-----|-------|
| **Local (same network)** | http://192.168.1.3 | Fast, direct access |
| **Remote (via Cloudflare)** | https://dashboard.99swanlane.uk | Secure, works anywhere |
| **HA Integration** | Add as panel_iframe | Can link from HA sidebar |

## Security Notes

- Cloudflare provides automatic HTTPS (https://dashboard.99swanlane.uk)
- No need to expose port 80 to internet directly
- Traffic is encrypted between browser and Cloudflare
- Tunnel is encrypted between Cloudflare and your Pi
- Consider adding Cloudflare Access (zero-trust) for additional authentication

## Next Steps

Once Cloudflare is configured:
1. Add bookmark on all devices: https://dashboard.99swanlane.uk
2. Add to iPad home screen for app-like experience
3. Optionally add to HA via panel_iframe (see DEPLOYMENT.md)
