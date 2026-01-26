# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.3] - 2026-01-26

### Summary
Critical fix for HTTPS remote access via Cloudflare tunnel - dashboard now works correctly with ingress.

### Fixed

**HTTPS/Ingress Support**
- Fixed "Unable to load iframes pointing at websites using http: if Home Assistant is served over https:" error
- Changed `useIngress: false` to `useIngress: true` in run.sh configuration
- Dashboard now correctly detects HTTPS protocol and uses WSS (secure WebSocket) when accessed remotely
- WebSocket connection automatically adapts to the access method:
  - Local HTTP access: uses ws://192.168.1.2:8123
  - Remote HTTPS access via Cloudflare: uses wss://ha.99swanlane.uk
- No more mixed content blocking when accessing via https://ha.99swanlane.uk

### Technical Details
- run.sh:25 - Changed injected config from `useIngress:false` to `useIngress:true`
- ha-websocket.js:26-32 - Ingress mode now active, uses window.location.protocol for protocol detection
- WebSocket service automatically uses wss:// when page is loaded via https://

### Testing
- Verify local access still works: http://192.168.1.2:8099
- Verify remote access works: https://ha.99swanlane.uk (via ingress)
- Verify WebSocket connects with correct protocol in both scenarios

---

## [1.0.2] - 2026-01-26

### Summary
Critical bug fixes for meal planner data persistence and major visual design improvements.

### Fixed

**Meal Planner Data Loading**
- Fixed critical bug where meals were not loading from Home Assistant entities
- Fixed async state fetching in useMealData hook - now properly awaits `getStates()` call
- Added WebSocket connection status checking to ensure data loads only after connection established
- Fixed persistence issue where meals disappeared after switching between This Week and Next Week
- Meals now correctly load from HA and persist across week switches

**Code Quality**
- Fixed lint error: removed unused `idx` variable in MealGrid.jsx:109
- Fixed React hooks violation: removed setState call from within useEffect body
- Improved error handling with comprehensive console logging for debugging

### Changed

**Meal Planner Visual Design**
- Added colorful gradient headers for each meal type:
  - Breakfast: Orange (#FF6B35) with Coffee icon
  - Lunch: Teal (#4ECDC4) with UtensilsCrossed icon
  - Dinner: Purple (#9B59B6) with Pizza icon
  - Cakes: Pink (#E91E63) with Cake icon
- Added today's row highlighting with gold gradient (#FFD93D to #FFA500) and star emoji
- Color-coded cell backgrounds matching each meal type for better visual organization
- Enhanced hover effects with scale transform (1.02x) and tinted backgrounds
- Improved cell styling with rounded corners (8px) and box shadows
- Better typography and spacing throughout

**Meal Planner Layout**
- Reduced meal column widths from 220px to 180px for better fit on 1920x1080 wall panel
- More compact layout while maintaining readability
- Improved visual hierarchy with gradients and colors

### Technical Details
- useMealData.js: Fixed async state fetching, added connection listener cleanup
- MealGrid.jsx: Added MEAL_CONFIG object with colors and icons
- MealCell.jsx: Color-coded borders and backgrounds based on meal type

### Testing
- Verified meals load correctly from Home Assistant entities
- Verified meals persist when switching between weeks
- Verified inline editing saves successfully to HA
- Verified Clear day button functionality
- Verified layout fits on 1920x1080 wall panel
- No lint errors

### Production Build
- Rebuilt React app: 348.86 KB JS, 31.47 KB CSS (gzipped: 102.72 KB + 6.17 KB)

---

## [1.0.1] - 2026-01-26

### Summary
Calendar layout fixes for 1920x1080 wall panel + Meal planner pivot for better usability.

### Changed

**Calendar Layout (Fixed for 1920x1080 Wall Panel)**
- Reduced PageContainer max-width from max-w-7xl to max-w-[1800px] with px-4 padding
- Split date label to two rows for compact display (e.g., "Week 5" / "26 Jan - 1 Feb 2026")
- Reduced all button font sizes by 1pt:
  - Person filter buttons: 16px → 15px
  - Add Event button: 15px → 14px
  - Today button: 15px → 14px
  - TwoTierSelector labels: 14px → 13px
  - TwoTierSelector buttons: 15px → 14px, minWidth 100px → 90px
  - Date label: 14px → 13px with two-row layout
- Fixed right arrow (>) button being cut off on 1920x1080 display

**Meal Planner Grid (Pivoted Layout)**
- Transposed grid: meal types (Breakfast, Lunch, Dinner, Cakes) now columns instead of rows
- Days (Thu-Wed) now rows instead of columns
- Days show full name + date (e.g., "Thursday Jan 16")
- More intuitive layout: scan across meals for a day, or down days for a meal type

**Meal Planner Functionality**
- Added "Clear" button (red X icon) for each day row
- Clear button clears all 4 meals for the selected day with confirmation dialog
- Touch-optimized 44px button size

### Documentation
- Updated CLAUDE.md with correct device information:
  - Changed "iPad" references to "1920x1080 wall panel"
  - Added display resolution specification
  - Updated access URLs and testing notes

### Production Build
- Rebuilt React app: 344.49 KB JS, 31.97 KB CSS (gzipped: 101 KB + 6 KB)
- Updated add-on build folder

---

## [1.0.0] - 2026-01-26

### Summary
Phase 2B Complete: Meal Planner fully implemented with two-week view, inline editing, and week copy function.

### Added

**Meal Planner Feature (Phase 2B - Complete)**
- Two-week meal planning view (This Week / Next Week tabs)
- 7-day grid layout (Thursday-Wednesday week structure)
- 4 meal types per day: Breakfast, Lunch, Dinner, Cakes
- Inline cell editing - tap to edit, Enter to save, Escape to cancel
- Auto-save on blur with visual feedback (Saving... indicator)
- Real-time synchronization with Home Assistant input_text entities (56 total)
- Week copy function: "Copy Next Week → This Week" button with confirmation dialog
- Touch-optimized cells (44px minimum height) for wall panel
- Date headers showing actual calendar dates (e.g., "Thursday Jan 16")
- Help tip at bottom explaining edit controls

**New Components**
- `MealsPage.jsx` - Main meal planner page with week management
- `MealGrid.jsx` - 7-day × 4-meal grid table component
- `MealCell.jsx` - Editable cell with inline editing
- `WeekSelector.jsx` - This Week / Next Week tab selector
- `CopyWeekButton.jsx` - Week copy with confirmation dialog
- `useMealData.js` - Hook for fetching/updating meal data with WebSocket subscriptions

### Production Build
- Rebuilt React app with Meal Planner (343.63 KB JS, 31.88 KB CSS)
- Updated add-on build folder (family-dashboard/build/)
- Ready for deployment to wall panel via HA add-on update

### Technical Notes
- Meal data stored in 56 HA input_text entities (28 per week)
- WebSocket subscriptions for real-time updates across all meal entities
- Optimistic UI updates for instant feedback
- Clean lint with 0 errors

---

## [0.9.1] - 2026-01-26

### Summary
Phase 2 Implementation Plan - Phase 1 Quick Wins completed. Wall panel touch target improvements and lint error fixes.

### Changed

**Header Sizing for Wall Panel Touch (MainLayout.jsx)**
- Nav icons: 24px → 28px (better touch targets for wall panel)
- Icon padding: p-2 → p-3 (larger tap area ~44px)
- Date/time/temp text: text-base (16px) → text-xl (20px) (readable from kitchen distance)
- Weather icons: 20px → 24px (match larger text size)

### Fixed

**Lint Errors (4 errors → 0 errors)**
- `EventModal.jsx`: Removed unused imports `setHours`, `setMinutes` from date-fns
- `EventModal.jsx`: Removed unused `handleAllDayToggle` function (lines 225-228)
- `MainLayout.jsx`: Added eslint-disable comment for false positive on `Icon` variable

### Remaining Phase 2 Tasks
The following tasks are planned but not yet implemented:
1. **Phase 2C**: Games Room - climate, harmony, power controls
2. **Phase 2D**: Cameras - 3x3 grid with modal view
3. **Calendar Enhancement**: Move temperature next to date in calendar weekly view
4. **Future**: People/Map tab - family location tracking with map

---

## [0.9.0] - 2026-01-25

### Summary
Header redesign for space efficiency + biweekly calendar view + documentation cleanup.

### Added
- **Biweekly calendar view** - Shows 2 weeks stacked (Mon-Sun rows)
- Biweekly navigation (jump forward/back 2 weeks)
- Biweekly date label format: "Weeks 4-6 • 19 Jan - 1 Feb 2026"

### Changed
- **Header redesign** - Compact blue header with:
  - Icon-only navigation (Home, Calendar, Meals, Games, Cameras)
  - Date, time, weather moved to header
  - Connected status on right side
  - Eliminates ~150px vertical space
- **View selector** - "Show me" and "View as" combined on single line with border
- **Removed** redundant "Family Dashboard" heading below header
- **Removed** text-based navigation tabs below header

### Fixed
- Biweekly view auto-switches to list mode (schedule not applicable)
- Proper week calculation for biweekly navigation

### Documentation
- Created **ROADMAP.md** from specs/00-mvp-definition.md
- Rewrote **DEPLOYMENT.md** with Arthur Dashboard integration details
- Rewrote **README.md** for clarity and conciseness
- Archived 20 historical docs to `docs/archive/`
- Deleted 6 redundant files

---

## [0.8.1] - 2026-01-25

### Summary
Arthur Dashboard - Successful HA Companion App integration via Lovelace iframe.

### Added
- **Arthur Dashboard** - Dedicated Lovelace dashboard with fullscreen iframe
  - Located at: http://192.168.1.2:8123/arthur-dashboard
  - Works in HA Companion App on iOS/Android
  - Accessible locally and remotely via Cloudflare tunnel
- Created `/config/.storage/lovelace.arthur_dashboard` on HA Pi
- Comprehensive deployment documentation (PIVOTAL-SUCCESS.md)

### Fixed
- HA Companion App integration (previous panel_iframe attempts failed)
- Remote access via Cloudflare tunnel now working

### Deprecated
- panel_iframe approach (component not available in this HA installation)

---

## [0.8.0] - 2026-01-24

### Summary
Dashboard deployed as Home Assistant add-on running on port 8099.

### Added
- **Home Assistant Add-on** - Docker container with nginx
- Add-on metadata (config.json, Dockerfile, nginx.conf, run.sh)
- Build script (build-addon.sh) to prepare add-on from React build
- Add-on port 8099 for direct access
- GitHub repository as add-on source

### Changed
- Production build optimized and copied to `family-dashboard/build/`
- Nginx serves static React files

---

## [0.7.1] - 2026-01-23

### Summary
Calendar feature complete with all 6 view modes and event CRUD.

### Added
- **Event Creation** - Modal with form for new events
- **Event Editing** - Edit existing events via modal
- **Event Deletion** - Delete with confirmation dialog
- **Recurring Events** - Weekly recurring event support
- **Weather Integration** - Colorful weather icons and forecasts
- **Waste Collection Countdown** - Shows next collection in header
- All 6 view modes working (Day/List, Day/Schedule, Week/List, Week/Schedule, Month, Day)

---

## [Phase 1 Complete] - 2026-01-17

### Summary
Foundation phase complete. React + Vite + HA WebSocket integration working on localhost and iPad.

### Added

**Project Setup**
- Initialized Vite + React 19 project in `src/`
- Configured Tailwind CSS v4 with PostCSS plugin
- Created `.env.example` for environment template
- Set up ESLint configuration
- Configured Vite for network access (`host: '0.0.0.0'`)

**Home Assistant Integration**
- WebSocket service (`ha-websocket.js`) with:
  - Auto-reconnect with exponential backoff (1s → 30s max)
  - 10-second request timeout
  - Authentication flow
  - Message ID tracking
  - Event subscription (state_changed)
- REST API service (`ha-rest.js`) - placeholder for future use
- Environment-based configuration (HA_URL, HA_TOKEN)

**React Components**
- `App.jsx` - Root component with test entity
- `ConnectionStatus.jsx` - Connection status indicator (green/yellow/red)
- `LoadingSpinner.jsx` - Loading state component
- `ErrorBoundary.jsx` - Error boundary for React errors
- `TestEntity.jsx` - Demo entity card (shows light state and toggle)

**React Hooks**
- `useHAConnection()` - Connection status management
- `useEntity(entityId)` - Entity state subscription
- `useServiceCall()` - Service call functions (toggle, etc.)

**Styling & Theme**
- Dark theme matching Home Assistant colors
- CSS variables for theme colors in `index.css`
- Responsive layout container
- Tailwind utility classes throughout

**Network Configuration**
- WSL2 port forwarding: `192.168.1.6:5173 → 172.27.69.40:5173`
- Windows Firewall rule for inbound TCP 5173
- MCP configuration (`.mcp.json`) for Puppeteer and hass-mcp

**Documentation**
- `README.md` - Project overview for new engineers
- `ARCHITECTURE.md` - Technical design and decisions
- `DEVELOPMENT.md` - How to build and develop
- `CHANGELOG.md` - This file
- `SESSION-NOTES.md` - Working notes for original developer
- Updated discovery and spec documentation

### Fixed

**Bug #1: Entity Loading Stuck (Critical)**
- **Issue:** Entity cards showed "Loading..." forever even when connection was successful
- **Root Cause:** `useHAConnection` hook initialized with hardcoded `'disconnected'` state. When multiple components used the hook, new instances didn't sync with the already-connected singleton WebSocket service.
- **Impact:** App appeared broken - entities never loaded
- **Fix:** Changed hook to initialize state from service: `useState(() => haWebSocket.getStatus())`
- **Files Changed:** `src/src/hooks/useHAConnection.js:7`
- **Verified:** Entity now loads correctly on both localhost and iPad

**Bug #2: Hanging Promises (Medium)**
- **Issue:** WebSocket requests could hang forever if HA didn't respond
- **Root Cause:** No timeout mechanism on send() promises
- **Impact:** UI stuck in loading state indefinitely
- **Fix:** Added 10-second timeout to all WebSocket requests with proper cleanup
- **Files Changed:** `src/src/services/ha-websocket.js:189-206, 135-145`
- **Verified:** Requests timeout gracefully after 10 seconds

**Bug #3: Commands Sent Before Authentication (Low)**
- **Issue:** Commands could be sent before WebSocket authentication completed
- **Root Cause:** No check for `isAuthenticated` flag in send() method
- **Impact:** Commands would fail silently
- **Fix:** Added authentication check before sending commands (auth message excluded)
- **Files Changed:** `src/src/services/ha-websocket.js:186-190`
- **Verified:** Commands only sent after successful authentication

### Changed

**Initialization Flow**
- useHAConnection now gets initial status from service instead of assuming disconnected
- Prevents stale state when multiple hook instances exist

**Error Handling**
- Proper timeout cleanup on disconnect
- Clear error messages for timeout, auth failure, connection errors

**Logging**
- Added comprehensive console logging during debugging
- Removed debug logs after fixes verified
- Kept essential logs (connection, auth, errors)

### Tested

**Localhost Testing (✅ Passed)**
- [x] App loads at http://localhost:5173/
- [x] WebSocket connects to HA
- [x] Authentication successful
- [x] Connection status shows "Connected" (green)
- [x] Entity loads: `light.reading_light` (Office Reading Lamp)
- [x] Entity displays state (on/off)
- [x] Toggle button works (turn_on/turn_off)
- [x] Real-time updates work
- [x] No console errors

**iPad Testing (✅ Passed)**
- [x] App loads at http://192.168.1.6:5173/
- [x] Connection status shows "Connected"
- [x] Entity loads correctly
- [x] Toggle button works on touch
- [x] Layout renders correctly on iPad
- [x] No layout issues

**Edge Case Testing (✅ Passed)**
- [x] HA offline → Shows connection error
- [x] Auto-reconnect works when HA comes back online
- [x] Hard refresh clears state properly
- [x] Multiple component instances share state correctly

### Git Commits

```
e59a99f Phase 1 Foundation complete: React + Vite + HA WebSocket
990f445 Update session notes: Phase 1 complete and tested
3bd37b2 Clean up project structure and add README
```

**Tags:** `phase-1-complete`

### Known Issues

None. Phase 1 complete and working.

### Dependencies

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "lucide-react": "^0.469.0",
  "date-fns": "^4.1.0",
  "@tailwindcss/postcss": "^4.0.3",
  "tailwindcss": "^4.0.3",
  "vite": "^7.3.1"
}
```

### Statistics

- **Files Created:** 24
- **Lines of Code:** ~1,200 (including comments)
- **Components:** 4
- **Hooks:** 3
- **Services:** 2
- **Bugs Fixed:** 3
- **Time Spent:** ~4 hours (including debugging)

---

## [Discovery Phase] - 2026-01-17 (Morning)

### Summary
Comprehensive discovery of existing HA dashboard and entity inventory.

### Added

**Discovery Documentation**
- `discovery/01-dashboard-current.md` - Current dashboard analysis
- `discovery/02-complete-inventory.md` - Full HA entity inventory (2,215 entities)
- `discovery/03-feature-analysis.md` - Feature breakdown

**Specifications**
- `specs/00-mvp-definition.md` - 7-week MVP plan
- `specs/01-calendar-spec.md` - Calendar feature requirements
- `specs/02-meal-planner-spec.md` - Meal planner requirements
- `specs/03-games-room-spec.md` - Games room control requirements
- `specs/04-cameras-spec.md` - Camera feeds requirements

**Configuration**
- `config/entities.json` - All 2,215 HA entities mapped
- `config/automations.json` - Automation details

**Operations**
- `operations/testing-plan.md` - Testing strategy
- `operations/deployment-plan.md` - Deployment guide
- `operations/security-checklist.md` - Security review

**Build Prompts**
- `00-DISCOVERY-PROMPT.md` - Discovery phase prompt
- `01-BUILD-PHASE-1-FOUNDATION.md` - Phase 1 build prompt

### Analyzed

- 8 Google Calendar entities
- 28 meal planner input_text entities (This Week + Next Week)
- 14 climate entities (Games Room controls)
- 9 camera entities
- 18 automations (3 for Games Room)
- Current dashboard structure and layout

### Decisions Made

- Use HA calendar entities (not direct Google Calendar API) for MVP
- Start with Calendar feature (highest priority)
- 7-week phased approach
- Primary device: iPad (Kitchen Calendar tablet)
- Tech stack: React + Vite + Tailwind + HA WebSocket

### Git Commits

```
813edce Discovery complete: dashboard analysis, inventory, specs
2b020ae Initial project setup
3db6ea8 Add Phase 1 build prompt and session notes for resuming
```

**Tags:** `discovery-complete`

---

## [Calendar Feature Complete + Add-on] - 2026-01-22

### Summary
Completed full calendar implementation with multiple view modes, event management, and Home Assistant add-on for deployment.

### Added

**Calendar Views (4 view modes)**
- `CalendarViewList.jsx` - Main calendar page with week/list view
- `DayListView.jsx` - Single day card list view
- `TimelineView.jsx` - Single day timeline/schedule view (7am-11pm)
- `WeekTimelineView.jsx` - 7-day timeline view with hourly slots
- `MonthView.jsx` - Month grid view
- `DayView.jsx` - Day view with hourly time slots
- Two-tier selector for Period (Day/Week/Month) and Layout (List/Schedule)

**Event Management**
- `EventModal.jsx` - Create/edit events with:
  - Quick duration buttons (1hr, 2hr, All day)
  - Recurring weekly events support
  - Natural language input parsing
  - Calendar selection (only writable calendars)
  - Default times rounded to :00 minutes
- `EventDetailModal.jsx` - View event details, edit, delete
- `DeleteConfirmDialog.jsx` - Confirmation dialog for deletions
- Full CRUD operations via HA calendar service

**Weather Integration**
- `useWeather.js` hook - Weather forecast subscription
- Colorful Lucide React weather icons (replaced emoji)
- 7-day forecast integration in calendar views
- Current temperature and condition in header
- Weather display on day headers in all views

**Calendar Service**
- `calendar-service.js` - HA calendar integration:
  - Fetch events from multiple calendars
  - Create/update/delete events
  - Natural language parsing
  - Date range queries
  - Recurring event support (RRULE)

**UI Components**
- `TwoTierSelector.jsx` - Period and layout selector
- `Modal.jsx` - Reusable modal component
- Waste collection countdown display
- Calendar color-coded event cards

**Preferences System**
- `useCalendarPreferences.js` - Persistent user preferences:
  - Selected calendars filter
  - View mode (day/week/month)
  - Layout mode (list/schedule)
  - Default calendar selection
  - localStorage persistence

**Home Assistant Add-on**
- Complete add-on structure in `addon/` directory:
  - `config.json` - Add-on metadata with ingress
  - `Dockerfile` - Multi-arch nginx container
  - `nginx.conf` - Optimized web server config
  - `run.sh` - Startup script
  - `build.json` - Architecture support
  - `README.md` - Installation instructions
- `build-addon.sh` - Automated build script
- `DEPLOYMENT.md` - Complete deployment guide
- Ingress integration for authenticated access
- Sidebar menu integration

**Styling & Design**
- Consistent headers across all views:
  - Large day numbers (3em, bold)
  - Orange "Today" highlight
  - Weather icons with temperature ranges
  - Unified spacing and fonts
- Header shows: Full date, current time, temperature, weather icon
- Calendar-specific color mapping in `constants/colors.js`
- Event cards with calendar colors and borders
- Responsive layout optimized for 1920x1080

### Changed

**Calendar Header**
- Replaced "Arthur Family" with functional date/time/weather display
- Left: Full date "Wednesday, January 22, 2026"
- Right: Time "7:18 AM" and temperature "18°" with weather icon
- Updates every minute automatically

**Timeline Views**
- Reduced hours from 24-hour (0-23) to realistic 7am-11pm (7-23)
- Fixed event positioning with proper hour offset calculations
- Current time indicator for today
- Better screen fit for portrait displays

**Event Modal**
- Removed read-only calendars (Family, UK Holidays, Basildon)
- Only shows writable calendars: Daz, Nic, Cerys, Dex, Birthdays
- Default times set to :00 minutes for usability
- Quick duration shortcuts for faster event creation

**Layout**
- Removed container max-width constraint for full 1920px width
- Full-screen calendar views
- Consistent padding and spacing

### Fixed

**Linting Errors**
- Removed unused imports from all calendar components
- Clean ESLint build with no warnings

**Event Positioning Bug**
- Events displayed at wrong times after hour range change
- Fixed by adjusting position calculations to account for 7am start offset
- Applied to both TimelineView and WeekTimelineView

**Weather Icons**
- Weather data was loading but not displaying
- Added proper weather icon rendering with colorful Lucide icons
- Icons show in header and day views

**Build Configuration**
- Fixed npm build directory issues
- Proper .gitignore exception for addon/build/
- Build output includes all required assets

### Tested

**Calendar Functionality (✅ Passed)**
- [x] All 4 view combinations work: Day/Week × List/Schedule
- [x] Calendar filtering by person works
- [x] Event creation with quick duration
- [x] Event editing and deletion
- [x] Recurring weekly events
- [x] All-day events display correctly
- [x] Weather integration shows in all views
- [x] Waste collection countdown accurate

**Event Management (✅ Passed)**
- [x] Create events in writable calendars
- [x] Cannot select read-only calendars
- [x] Quick duration buttons work (1hr, 2hr, All day)
- [x] Recurring weekly checkbox creates proper RRULE
- [x] Times default to :00 minutes
- [x] Natural language input parsing

**UI Consistency (✅ Passed)**
- [x] All views have matching headers
- [x] Day numbers and "Today" highlight consistent
- [x] Weather icons and temps uniform across views
- [x] Event card styling consistent
- [x] Fonts and spacing unified

**Add-on Build (✅ Passed)**
- [x] Build script creates production build
- [x] Files copied to addon/build/ correctly
- [x] All required config files present
- [x] Build output optimized (325KB total JS)

### Git Commits

```
4e0ac12 Add Home Assistant add-on for dashboard deployment
b2a95e8 Improve calendar header and event modal usability
a08d4da Replace redundant header with functional date, time, and temperature
977098d Update Week Schedule view to match consistent styling
e18916b Make all calendar views consistent with Week/List style
dca5851 Fix calendar colors and styling to match HA exactly
dbdef55 Fix waste collection countdown to show next collection
c9562b9 Apply all calendar styling improvements
(and many more calendar implementation commits)
```

### Dependencies Added

```json
{
  "react-big-calendar": "^1.15.0",
  "react-router-dom": "^7.1.1"
}
```

### Statistics

- **Calendar Components:** 12
- **Modals:** 3
- **Hooks:** 2 (useWeather, useCalendarPreferences)
- **Services:** 1 (calendar-service.js)
- **View Modes:** 6 (Day/List, Day/Schedule, Week/List, Week/Schedule, Month, DayView)
- **Calendar Integration:** 8 Google calendars
- **Total Events Handled:** Unlimited (fetched by date range)
- **Build Size:** 325KB JS + 27KB CSS (gzipped: 98KB + 5KB)

### Known Issues

None. Calendar feature fully functional and ready for deployment.

### Next Steps

1. Deploy add-on to Home Assistant
2. Test on iPad wall panel
3. Continue Phase 2B: Meals page
4. Add Cameras page
5. Add Games Room controls

---

**Changelog maintained by:** Original Developer + Claude Code
**Last Updated:** 2026-01-22 (Calendar Complete + Add-on Ready)
