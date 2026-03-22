# Family Dashboard Add-on

Modern React-based family dashboard for Home Assistant.

## Features

- **Calendar Integration**: 8 Google calendars with 6 view modes
- **Meal Planner**: Two-week planning grid with inline editing
- **Games Room**: Harmony Hub scenes, climate, lights
- **Music**: Sonos multi-room control with Spotify playlists and queue building
- **People**: Family location tracking with map
- **Health**: Oura Ring data + cold plunge controls
- **Cameras**: 9 camera feeds with priority loading
- **Weather**: Ecowitt GW3000A sensors + Met Office forecast
- **To-Do**: Todoist integration (3 lists)
- **Mobile Dashboard**: iPhone-optimized layout at `/mobile/`
- **Real-time Updates**: WebSocket connection for instant updates

## Installation

### Option 1: GitHub Repository (Recommended)

1. In Home Assistant, go to **Settings** → **Add-ons** → **Add-on Store**

2. Click the ⋮ menu (top right) → **Repositories**

3. Add: `https://github.com/djarthur78/ha-custom-dashboard`

4. Refresh, find "Family Dashboard" and install

5. Once installed, click **Start**

6. The dashboard will appear in your sidebar as "Arthur Dashboard"

### Option 2: Local Add-on (Development)

1. Copy the entire `family-dashboard` folder to your Home Assistant config directory:
   - Path: `/config/addons/family-dashboard/`
   - You can use File Editor, Samba, or SSH

2. In Home Assistant, go to **Settings** → **Add-ons** → **Add-on Store**

3. Click the ⋮ menu (top right) → **Repositories**

4. Add the local repository path: `/config/addons/family-dashboard`

5. Refresh the page, find "Family Dashboard" and click **Install**

## Configuration

No configuration needed! The add-on uses your existing Home Assistant connection.

## Requirements

- Home Assistant OS or Supervised
- Google Calendar integration configured
- Weather integration (for weather display)

## Support

For issues and feature requests, visit:
https://github.com/djarthur78/ha-custom-dashboard/issues
