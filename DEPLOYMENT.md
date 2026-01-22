# Deployment Guide - Family Dashboard to Home Assistant

This guide explains how to deploy the Family Dashboard as a Home Assistant Add-on.

## Overview

The dashboard will run as a Home Assistant add-on on your Raspberry Pi (192.168.1.2). It uses:
- **Docker container** running nginx
- **Home Assistant Ingress** for authentication and secure access
- **Sidebar integration** - appears as a menu item in HA

## Prerequisites

- Home Assistant OS running on Raspberry Pi (your current setup ✅)
- SSH access or File Editor add-on installed
- This repository cloned on your development machine (WSL2) ✅

## Deployment Methods

### Method 1: Local Add-on (Recommended for Testing)

Perfect for testing before publishing to GitHub.

#### Step 1: Build the Add-on

On your development machine (WSL2):

```bash
cd /home/arthu/projects/ha-custom-dashboard
./build-addon.sh
```

This will:
- Build the React app for production (`npm run build`)
- Copy the build files to `family-dashboard/build/`
- Prepare everything for deployment

#### Step 2: Copy to Home Assistant

You need to copy the `family-dashboard` folder to your Home Assistant Pi. Choose one method:

**Option A: Using Samba Share**
1. Access your HA via network share: `\\192.168.1.2\config`
2. Create folder: `addons/family-dashboard/`
3. Copy entire `family-dashboard` folder contents there

**Option B: Using SSH/SCP**
```bash
# From your WSL2 machine
scp -r family-dashboard/* root@192.168.1.2:/config/addons/family-dashboard/
```

**Option C: Using File Editor Add-on**
1. Install "File Editor" add-on in HA if not already installed
2. Create folder structure via File Editor
3. Copy files one by one (tedious but works)

#### Step 3: Install the Add-on

1. In Home Assistant web UI: **Settings** → **Add-ons** → **Add-on Store**
2. Click ⋮ menu (top-right) → **Repositories**
3. Add local repository: `/config/addons/family-dashboard`
4. Click **Check for updates** or refresh the page
5. You should see "Family Dashboard" in the local add-ons section
6. Click it, then **Install**
7. Once installed, click **Start**
8. Enable "Show in sidebar" toggle

#### Step 4: Access Your Dashboard

The dashboard will appear in your Home Assistant sidebar as "Family Dashboard". Click it to open!

### Method 2: GitHub Repository (Recommended for Production)

This method allows automatic updates and easier deployment.

#### Step 1: Prepare GitHub Repository

The add-on files are already in your GitHub repo. You just need to build and commit:

```bash
cd /home/arthu/projects/ha-custom-dashboard
./build-addon.sh
git add family-dashboard/
git commit -m "Add Home Assistant add-on with built files"
git push origin main
```

#### Step 2: Add Repository to Home Assistant

1. In Home Assistant: **Settings** → **Add-ons** → **Add-on Store**
2. Click ⋮ menu (top-right) → **Repositories**
3. Add: `https://github.com/djarthur78/ha-custom-dashboard`
4. Refresh the page
5. Find "Family Dashboard" in the available add-ons
6. Click **Install**, then **Start**
7. Enable "Show in sidebar"

#### Step 3: Future Updates

When you make changes:
```bash
cd src
npm run build
cd ..
cp -r src/dist family-dashboard/build
git add family-dashboard/build
git commit -m "Update dashboard"
git push

# Then in HA: Settings → Add-ons → Family Dashboard → Check for updates
```

## Configuration

### Environment Variables

The dashboard uses these environment variables (already in your `.env`):

```env
VITE_HA_URL=http://192.168.1.2:8123
VITE_HA_TOKEN=<your-long-lived-token>
```

**Important**: When running as an add-on with ingress, the app can access HA at `http://supervisor/core` internally, but your current setup with explicit URLs should work fine.

### Home Assistant Ingress

The add-on uses HA Ingress, which:
- Provides automatic authentication (uses your HA login)
- Serves the app securely through HA's web interface
- No need to expose additional ports
- Accessible from: `http://192.168.1.2:8123/api/hassio_ingress/<token>/`

## Troubleshooting

### Add-on doesn't appear after adding repository

1. Check the ⋮ menu → **Reload** option
2. Verify files are in `/config/addons/family-dashboard/`
3. Check `config.json` is valid JSON
4. Look at **Settings** → **System** → **Logs**

### Add-on fails to start

1. Click on the add-on → **Logs** tab
2. Common issues:
   - Missing build files: Run `./build-addon.sh` again
   - nginx config error: Check `family-dashboard/nginx.conf` syntax
   - Port conflict: Change port in `config.json`

### Dashboard shows connection errors

1. Check your long-lived access token is valid
2. Verify HA is accessible at 192.168.1.2:8123
3. Check WebSocket connection in browser console
4. Ensure Google Calendar integration is configured in HA

### Build script fails

```bash
cd src
npm install  # Make sure dependencies are installed
npm run build  # Build manually to see errors
```

## iPad/Wall Panel Setup

Once the add-on is running:

1. Open Safari on your iPad
2. Go to: `http://192.168.1.2:8123`
3. Log in to Home Assistant
4. Click "Family Dashboard" in the sidebar
5. Tap the Share icon → **Add to Home Screen**
6. Now you have a full-screen dashboard app!

## Next Steps

After successful deployment:

- [ ] Test all calendar views work
- [ ] Test event creation/editing
- [ ] Test on iPad wall panel
- [ ] Set up auto-refresh if needed
- [ ] Continue building Phase 2 features (other tabs)

## Architecture Notes

```
┌─────────────────────────────────────────┐
│  iPad (192.168.1.6)                     │
│  ┌─────────────────────────────────┐    │
│  │  Safari → HA Login              │    │
│  │  → Family Dashboard (Sidebar)   │    │
│  └─────────────────────────────────┘    │
└──────────────────┬──────────────────────┘
                   │ HTTP
                   ▼
┌─────────────────────────────────────────┐
│  Raspberry Pi (192.168.1.2)             │
│  Home Assistant OS                      │
│                                         │
│  ┌────────────────────────────────┐     │
│  │  Home Assistant Core           │     │
│  │  - Google Calendar Integration │     │
│  │  - Weather Integration         │     │
│  └────────────────────────────────┘     │
│                                         │
│  ┌────────────────────────────────┐     │
│  │  Family Dashboard Add-on       │     │
│  │  - Docker Container            │     │
│  │  - nginx serving React app     │     │
│  │  - Ingress port 8099           │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

## Development Workflow

1. Make changes in WSL2 (`/home/arthu/projects/ha-custom-dashboard`)
2. Test locally: `cd src && npm run dev`
3. Build add-on: `./build-addon.sh`
4. Push to GitHub: `git push origin main`
5. Update in HA: Settings → Add-ons → Check for updates

Or for local testing:
1. Build: `./build-addon.sh`
2. Copy to HA: `scp -r family-dashboard/* root@192.168.1.2:/config/addons/family-dashboard/`
3. Restart add-on in HA

## Support

If you run into issues:
- Check add-on logs in HA
- Check browser console for errors
- Review HA system logs
- Open issue on GitHub: https://github.com/djarthur78/ha-custom-dashboard/issues
