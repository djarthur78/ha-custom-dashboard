# Family Dashboard Add-on

Modern React-based family calendar and dashboard for Home Assistant.

## Features

- **Calendar Integration**: View all family Google calendars in one place
- **Multiple Views**: Day/Week/Month with List and Schedule layouts
- **Weather Integration**: Real-time weather forecasts
- **Event Management**: Create, edit, and delete events
- **Recurring Events**: Support for weekly recurring events
- **Waste Collection**: Countdown to next bin collection
- **Real-time Updates**: WebSocket connection for instant updates

## Installation

### Option 1: Local Add-on (Recommended for Development)

1. Copy the entire `addon` folder to your Home Assistant config directory:
   - Path: `/config/addons/family-dashboard/`
   - You can use File Editor, Samba, or SSH

2. In Home Assistant, go to **Settings** → **Add-ons** → **Add-on Store**

3. Click the ⋮ menu (top right) → **Repositories**

4. Add the local repository path: `/config/addons/family-dashboard`

5. Refresh the page, find "Family Dashboard" and click **Install**

6. Once installed, click **Start**

7. The dashboard will appear in your sidebar as "Family Dashboard"

### Option 2: GitHub Repository (For Updates)

1. In Home Assistant, go to **Settings** → **Add-ons** → **Add-on Store**

2. Click the ⋮ menu (top right) → **Repositories**

3. Add: `https://github.com/djarthur78/ha-custom-dashboard`

4. Refresh, find "Family Dashboard" and install

## Configuration

No configuration needed! The add-on uses your existing Home Assistant connection.

## Requirements

- Home Assistant OS or Supervised
- Google Calendar integration configured
- Weather integration (for weather display)

## Support

For issues and feature requests, visit:
https://github.com/djarthur78/ha-custom-dashboard/issues
