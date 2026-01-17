# Current Dashboard Analysis - "family calendar - panel"

**Discovery Date:** 2026-01-17
**HA Version:** 2025.12.5
**Total Entities:** 2,215

## Overview
The "family calendar - panel" dashboard is a comprehensive family management interface running on Home Assistant. This document details all discovered entities and configurations needed to rebuild this dashboard as a modern React application.

---

## 1. Family Calendar Module

### Architecture Decision: Direct Google Calendar API

**Status:** Current dashboard (Atomic Calendar Revive) works perfectly with Google Calendar.

**For New React Dashboard:**
- Connect directly to Google Calendar API (not through HA)
- Use OAuth 2.0 client-side authentication
- Independent of HA calendar integration
- Calendar works even if HA is offline

### Calendar Sources (Google Calendar)
- `99swanlane@gmail.com` - Main family calendar
- `arthurdarren@gmail.com` - Daz's personal calendar
- `nicholaarthur@gmail.com` - Nic's personal calendar
- `arthurcerys@gmail.com` - Cerys's personal calendar
- `arthurdexter08@gmail.com` - Dex's personal calendar
- Birthdays calendar
- UK Holidays calendar
- Basildon Council calendar

**HA Calendar Entities (Reference Only - Not Used):**
The following HA entities exist but show "unavailable". The new dashboard will bypass these and connect to Google Calendar directly:
- `calendar.99swanlane_gmail_com`
- `calendar.arthurdarren_gmail_com`
- `calendar.nicholaarthur_gmail_com`
- `calendar.arthurcerys_gmail_com`
- `calendar.arthurdexter08_gmail_com`
- `calendar.birthdays`
- `calendar.holidays_in_the_united_kingdom`
- `calendar.basildon_council`

### Calendar Control Entities

**View Controls:**
- `input_select.calendar_view` - View selector (Week/Day/Month)
  - Current state: "Week"
- `input_select.calendar_select` - Active calendar selector
  - Current state: "Daz"

**Navigation:**
- `input_number.calendar_nav_offset` - Day offset for navigation (current: 0.0)
- `sensor.calendar_period_label_computed` - Computed period label (current: "12 Jan - 18 Jan")
- `input_text.calendar_period_label` - Manual period label override

**Event Creation/Edit:**
- `input_text.calendar_event_title` - Event title
- `input_text.calendar_event_description` - Event description
- `input_datetime.calendar_event_start` - Event start time
- `input_datetime.calendar_event_end` - Event end time
- `input_datetime.calendar_day_event_start` - All-day event start
- `input_datetime.calendar_day_event_end` - All-day event end
- `input_boolean.calendar_all_day_event` - All-day event toggle

**Per-Person Filters:**
- `input_text.daz_calendar_filter` - Regex filter for Daz (current: "^$")
- `input_text.nic_calendar_filter` - Regex filter for Nic (current: "^$")
- `input_text.cerys_calendar_filter` - Regex filter for Cerys (current: "^$")
- `input_text.dex_calendar_filter` - Regex filter for Dex (current: "^$")
- `input_text.birthdays_calendar_filter` - Birthday filter

**Scripts:**
- `script.daz_calendar_visible_filter` - Toggle Daz calendar visibility
- `script.nic_calendar_visible_filter` - Toggle Nic calendar visibility
- `script.cerys_calendar_visible_filter` - Toggle Cerys calendar visibility
- `script.dex_calendar_visible_filter` - Toggle Dex calendar visibility
- `script.calendar_nav_prev` - Navigate to previous period
- `script.calendar_nav_next` - Navigate to next period
- `script.calendar_nav_reset` - Reset to current period
- `script.add_google_calendar_event` - Add calendar event

**Automations:**
- `automation.family_calendar_sync_period_label` - Syncs period label display

### Kitchen Calendar Device
- `device_tracker.kitchen_calendar` - Physical tablet device
- `sensor.kitchen_calendar_battery_level` - 35% battery
- `sensor.kitchen_calendar_battery_state` - "Not Charging"
- `sensor.kitchen_calendar_app_version` - 2025.12.1

---

## 2. Meal Planner Module

### Structure
The meal planner uses a 2-week rotating system with `input_text` entities.

**Pattern:** `input_text.meal_w{week}_{day}_{meal}`
- **Weeks:** w1 (this week), w2 (next week)
- **Days:** thu, fri, sat, sun, mon, tue, wed
- **Meals:** breakfast, lunch, dinner, cakes

### Week Selection
- `input_select.meal_plan_week` - Current/Next week selector
  - Current state: "Next week"

### Sample Data (Current State)
**Week 1 (This Week):**
- Thu Dinner: "Salmon, sweet potato fries & asparagus"
- Fri Dinner: "Chicken curry & rice"
- Sat Dinner: "Pizza"
- Sun Dinner: "Roast chicken"
- Mon Dinner: "Paprika chicken, rice & beans"
- Tue Dinner: "Special fried rice / dex make do"
- Wed Dinner: "Bologense"

**Week 2 (Next Week):**
- Thu Dinner: "Salmon, sweet potato & asparagus"
- Fri Dinner: "Bangers, mash & veg"
- Sat Breakfast: "Leigh breakie"
- Sat Dinner: "Family Indian takeaway"
- Sun Dinner: "Spaghetti meatballs"
- Mon Dinner: "Ham, egg & chips"

**Automation:**
- `input_button.meal_copy_next_to_this` - Copy next week to this week

### Total Entities
- 56 meal input_text entities (2 weeks × 7 days × 4 meals)

---

## 3. Camera Feeds Module

### Camera Entities (UniFi Protect)
All cameras are recording with high-resolution channels:

1. **Front Right** - `camera.front_right_high_resolution_channel`
   - 4K (3840×2160), 30fps, 16Mbps

2. **Front Left** - `camera.front_left_high_resolution_channel`
   - 4K (3840×2160), 30fps, 16Mbps

3. **Front Door** - `camera.front_door_high_resolution_channel`
   - 1600×1200, 30fps, 6Mbps
   - Package Camera: `camera.front_door_package_camera` (1600×1200, 2fps)

4. **Side Gate** - `camera.side_gate_high_resolution_channel`
   - 2688×1512, 30fps, 10Mbps

5. **Outdoor Kitchen** - `camera.outdoor_kitchen_high_resolution_channel`
   - 2688×1512, 30fps, 10Mbps

6. **Back Shed** - `camera.back_shed_high_resolution_channel`
   - 2688×1512, 30fps, 10Mbps

7. **Back Gym** - `camera.back_gym_high_resolution_channel`
   - 2688×1512, 30fps, 10Mbps

8. **Kitchen** - `camera.kitchen_high_resolution_channel`
   - 1920×1080, 30fps, 3Mbps
   - Current state: "idle"

### Camera Events
- `event.front_door_doorbell` - Last: 2026-01-17 07:42:05
- `event.front_right_vehicle` - Last: 2026-01-17 13:12:03

---

## 4. Games Room Controls Module

### Overview
Extensive home theater and gaming setup with climate control.

### Media Players
- `media_player.games_room_tv` - Main TV (off)
- `media_player.denon_avc_x3800h_games_room` - Denon AVR (unavailable)
- Sonos Port (via smart plug)
- Sonos AMP (via smart plug)
- Kodi (via smart plug)

### Harmony Remote
- `remote.games_room_harmony` - Logitech Harmony Hub
- `select.games_room_harmony_activities` - Activity selector (current: "power_off")

### Climate Control
- `climate.games_room` - Sensibo climate control (off, target: 25°C)
- `sensor.games_room_temperature_feels_like` - 15.3°C
- `number.games_room_temperature_calibration` - -2.5°C offset
- `number.games_room_humidity_calibration` - 0.0
- `switch.games_room_timer` - Timer control
- `switch.games_room_climate_react` - Climate React mode
- `binary_sensor.games_room_filter_clean_required` - Filter status (on = needs cleaning)
- `button.games_room_reset_filter` - Reset filter timer

### Lights
- `light.games_room_uap_nanohd_led` - UniFi AP LED (on)
- `switch.iport_area_4` - Light Symphony Games Room Outdoor

### Smart Plugs (TP-Link P304M)
**Games Room Sonos Port:**
- `switch.unnamed_p304m_games_room_kodi` - Power control (on)
- `sensor.unnamed_p304m_games_room_kodi_current_consumption` - 3.4W
- `sensor.unnamed_p304m_games_room_kodi_voltage` - 238.9V

**Games Room Kodi:**
- `switch.unnamed_p304m_smart_plug_2` - Power control (on)
- `sensor.unnamed_p304m_smart_plug_2_current_consumption` - 2.4W

**Games Room Sonos AMP:**
- `switch.unnamed_p304m_games_room_sonos_amp` - Power control (on)
- `sensor.unnamed_p304m_games_room_sonos_amp_current_consumption` - 6.1W

**Games Room Fridge:**
- `switch.games_room_fridge` - Power control (on)
- `sensor.games_room_fridge_current_consumption` - 8.4W
- `sensor.games_room_fridge_today_s_consumption` - 0.333 kWh

**Chromecast Controls:**
- `switch.symphony` - Games Room Chromecast (on)
- `switch.symphony_led` - LED control (on)

**Sky Box:**
- `switch.sky_games_room` - Sky box (on)
- `switch.sky_games_room_led` - LED control (on)

### Automations
- `automation.turn_off_games_room` - Auto-off routine (on)
  - Last triggered: 2026-01-17 02:00:00
- `automation.setup_games_room_for_movie` - Movie setup (on)
  - Last triggered: 2026-01-16 19:09:44
- `automation.games_room_start_movie` - Movie start (on)
  - Last triggered: 2026-01-16 19:19:28
- `automation.setup_games_room_for_sonos` - Sonos setup (on)

### Scripts
- `script.prepare_for_movie_in_games_room` - Movie preparation sequence

### Scenes
- `scene.watch_movie` - Watch Movie scene
  - Last activated: 2025-12-21 16:55:40

### Network Infrastructure
- `device_tracker.games_room_uap_nanohd` - UniFi AP
- `device_tracker.games_room_switch_8_60_w` - Network switch
- Multiple device trackers for all equipment

---

## 5. Additional Entities

### Person Tracking
- `person.swanlane` - home
- `person.darren` (Daz) - home
- `person.nic` - home
- 7 person entities total

### Shopping List
- `todo.shopping_list` - 0 items

### System Monitoring
- Multiple uptime sensors
- Network device trackers (233 total)
- Binary sensors for connectivity monitoring

---

## Technical Notes

### Integration Dependencies
- **Google Calendar** - OAuth authentication required
- **UniFi Protect** - For camera feeds
- **Sensibo** - Climate control
- **Logitech Harmony** - Remote control
- **TP-Link Kasa** - Smart plugs
- **Sonos** - Media players
- **Atomic Calendar Revive** - Custom calendar card (needs update)

### Performance Considerations
- 2,215 total entities in system
- 842 sensors (highest domain count)
- Real-time WebSocket updates critical for:
  - Camera feeds
  - Games room controls
  - Calendar sync

### Color Scheme
**Note:** Color scheme needs to be extracted from actual YAML dashboard configuration. The current discovery shows entity states but not the visual theming.

**To-Do:** Access dashboard YAML file to extract:
- Calendar event color codes
- Button styling
- Background colors
- Font specifications

---

## Next Discovery Steps

1. **Set up Google Calendar API:**
   - Create Google Cloud project
   - Enable Google Calendar API
   - Configure OAuth 2.0 credentials
   - Get Client ID for React app
   - Set up authorized redirect URIs

2. **Access Dashboard YAML (Optional):**
   - Locate `ui-lovelace.yaml` or dashboard config
   - Extract Atomic Calendar Revive color configuration
   - Document exact color hex codes
   - Extract layout structure

3. **Document Mobile Device:**
   - Kitchen Calendar tablet configuration
   - Screen resolution and orientation
   - Touch target sizes

4. **Create Entity Groups:**
   - Logical grouping for React components
   - Identify which entities are read-only vs controllable

---

## Questions Answered

✅ **What calendar integration is used?**
→ Google Calendar with multiple personal calendars per family member

✅ **Calendar Architecture Decision?**
→ Direct Google Calendar API integration (not through HA entities)
→ OAuth 2.0 client-side authentication
→ Calendar works independently of HA

✅ **How are meal plans currently stored?**
→ Input_text entities with 2-week rotating pattern

✅ **What's the complete entity list?**
→ Documented above, 2,215 total entities

✅ **What automation logic needs to be preserved?**
→ Calendar sync, games room auto-off, movie setup sequences

✅ **Are there custom HA components?**
→ Yes: Atomic Calendar Revive (needs update), UniFi Protect, Sensibo

## Questions Remaining

❓ **What colors are used for calendar events?**
→ Need to extract from YAML dashboard configuration

❓ **What's the exact layout structure?**
→ Need to view actual dashboard YAML

❓ **What's the tablet screen resolution?**
→ Kitchen Calendar device - need to check HA Companion app settings
