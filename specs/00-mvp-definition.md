# MVP Definition - Family Dashboard v1.0

**Target:** Tablet-optimized dashboard that matches current functionality with improved UX
**Timeline:** Phase-based development (Foundation → Features → Polish)
**Primary Device:** iPad (Kitchen Calendar tablet)

---

## Core Principle
**Feature Parity First, Enhancements Second**

The MVP must replicate 100% of current dashboard functionality before adding new features. Users should not lose any capability when switching to the new dashboard.

---

## MVP Feature Scope

### ✅ Phase 1: Foundation (Week 1-2)

**Required:**
- React + Vite project setup
- Tailwind CSS configuration
- Home Assistant WebSocket connection
- REST API integration
- Basic routing (if multi-page)
- Dark theme (matching current HA theme)
- Responsive layout (320px to 2048px)
- Error boundaries and loading states

**Success Criteria:**
- Can connect to HA at http://192.168.1.2:8123
- Can read entity states in real-time
- Can call services (turn_on, turn_off, etc.)
- Basic layout renders on iPad

---

### ✅ Phase 2A: Family Calendar (Week 3-4)

**Priority: HIGHEST** - This is the primary use case

**Architecture Decision: Direct Google Calendar API Integration**
- React app connects directly to Google Calendar API (not through HA)
- OAuth 2.0 client-side authentication
- Independent of HA calendar integration
- Calendar works even if HA is offline
- Full access to Google Calendar features
- Real-time updates via Google's API

**Calendar Sources:**
- 99swanlane@gmail.com (main family calendar)
- arthurdarren@gmail.com (Daz)
- nicholaarthur@gmail.com (Nic)
- arthurcerys@gmail.com (Cerys)
- arthurdexter08@gmail.com (Dex)
- Plus: Birthdays, UK Holidays, Basildon Council

**Must Have:**
1. **Multi-Calendar View**
   - Display all 8 calendars simultaneously
   - Per-person color coding (Daz, Nic, Cerys, Dex)
   - Special calendars (Birthdays, Holidays, Council)
   - Calendar visibility toggles

2. **Week View (Default)**
   - 7-day grid layout
   - Current week by default
   - Time-based event positioning
   - All-day events at top
   - Event truncation with tooltips for long titles

3. **Navigation**
   - Previous/Next week buttons
   - "Today" reset button
   - Week range display (e.g., "12 Jan - 18 Jan")
   - Smooth transitions

4. **Event Display**
   - Event title
   - Time (start-end)
   - Calendar source indicator
   - Color-coded by calendar
   - Touch-friendly tap targets (min 44px)

**Nice to Have (v1.1):**
- Day view toggle
- Month view toggle
- Event creation modal
- Event editing
- Swipe to delete
- Event search/filter
- Drag-and-drop event moving

**Success Criteria:**
- Google OAuth authentication working
- All 8 calendars accessible via Google Calendar API
- Can navigate weeks smoothly
- Can toggle calendar visibility
- Events render with correct colors
- Real-time sync via Google Calendar API
- Readable at arm's length on iPad
- Calendar works independently of HA

**Deferred to v2:**
- Event CRUD operations (create, update, delete)
- Push notifications for calendar changes
- Recurring event handling
- Event reminders

---

### ✅ Phase 2B: Meal Planner (Week 5)

**Priority: HIGH** - Daily family use

**Must Have:**
1. **Two-Week View**
   - This Week / Next Week tabs
   - 7-day grid (Thu-Wed week structure)
   - 4 meal slots per day (Breakfast, Lunch, Dinner, Cakes)
   - Inline editing (tap to edit)

2. **Data Management**
   - Read meal data from input_text entities
   - Update meals via HA service calls
   - Auto-save on blur/enter
   - Visual feedback on save

3. **Week Copy Function**
   - "Copy Next → This" button
   - Confirmation dialog
   - Clear next week after copy

**Nice to Have (v1.1):**
- Meal templates/favorites
- Recent meals list
- Drag-and-drop meal assignment
- Shopping list generation from meals

**Success Criteria:**
- Can view both weeks
- Can edit all 56 meal slots
- Changes persist to HA
- Copy function works correctly
- Touch-optimized input fields

**Deferred to v2:**
- Meal template library
- Recipe integration
- Shopping list auto-generation
- Nutritional tracking

---

### ✅ Phase 2C: Games Room Controls (Week 6)

**Priority: MEDIUM** - Convenience feature

**Must Have:**
1. **Climate Control**
   - Current temperature display
   - On/Off toggle
   - Target temperature adjustment
   - Visual state (heating/off)
   - Filter clean indicator

2. **Quick Actions**
   - Harmony activity selector (Watch Movie, Listen to Music, etc.)
   - Power toggles (TV, AVR, Fridge, Chromecast, Sky)
   - Scene activation (Watch Movie scene)

3. **Status Display**
   - Device power states (on/off)
   - Current consumption (fridge, plugs)
   - Connection status

**Nice to Have (v1.1):**
- Brightness controls for lights
- Media player controls (play/pause/volume)
   - AVR volume slider
- Power consumption graphs
- Schedule timer

**Success Criteria:**
- Can control all devices
- Real-time state updates
- Large touch-friendly buttons (min 60px)
- Clear visual feedback
- Harmony activities work
- Climate control responsive

**Deferred to v2:**
- Media player transport controls
- Custom automation triggers
- Power usage analytics
- Voice control integration

---

### ✅ Phase 2D: Camera Feeds (Week 7)

**Priority: LOW** - Monitoring feature

**Must Have:**
1. **Grid Layout**
   - 2×2 or 3×3 grid (responsive)
   - Static camera snapshots (refresh every 5-10s)
   - Camera labels
   - Fallback for offline cameras

2. **Basic Interaction**
   - Tap to expand full-screen
   - Pinch to zoom (in expanded view)
   - Swipe to dismiss full-screen

**Nice to Have (v1.1):**
- Live streaming (not just snapshots)
- Motion detection indicators
- Event timeline (recent doorbell presses)
- Recording indicator
- Multi-camera full-screen carousel

**Success Criteria:**
- All 9 cameras visible in grid
- Snapshots auto-refresh
- Full-screen view works
- Performance acceptable (<1s load per camera)
- Layout adapts to screen size

**Deferred to v2:**
- RTSP live streaming
- PTZ controls
- Motion alerts
- Recording playback
- Smart detection zones

---

## MVP Exclusions

**Explicitly OUT of scope for v1.0:**
- PWA/offline mode (v2.0)
- Push notifications (v2.0)
- Voice control (v2.0)
- Multi-user accounts (v2.0)
- Dashboard customization UI (v2.0)
- Analytics/insights (v2.0)
- Shopping list management (v1.1 or v2.0)
- Event creation/editing (v1.1)
- Advanced media controls (v1.1)
- Camera recording playback (v2.0)

---

## Non-Functional Requirements

### Performance
- **Initial Load:** <3s on WiFi
- **Time to Interactive:** <5s on WiFi
- **Bundle Size:** <500KB gzipped
- **Frame Rate:** 60fps scrolling
- **API Response:** Optimistic UI updates

### Compatibility
- **Primary:** iPad (Kitchen Calendar tablet - iOS/iPadOS)
- **Secondary:** Desktop browsers (Chrome, Safari, Firefox)
- **Tertiary:** iPhone (responsive fallback)
- **Browser Support:** Last 2 major versions

### Accessibility
- **Touch Targets:** Minimum 44×44px (WCAG 2.1 AA)
- **Contrast Ratio:** 4.5:1 for text (WCAG 2.1 AA)
- **Font Size:** Minimum 16px base
- **Keyboard Navigation:** Full support
- **Screen Reader:** Semantic HTML

### Security
- **Authentication:** Long-lived access token
- **Token Storage:** Environment variable (.env)
- **HTTPS:** Not required for LAN (http://192.168.1.2:8123)
- **Input Validation:** Sanitize all user input
- **XSS Prevention:** React default escaping

### Error Handling
- **HA Offline:** Display connection error with retry
- **Entity Unavailable:** Show "Unavailable" state
- **Service Call Failure:** Toast notification with retry option
- **Network Error:** Auto-retry with exponential backoff
- **Loading States:** Skeleton screens for all data

---

## Success Metrics

### User Acceptance
- [ ] Family can use all current features
- [ ] No feature regression
- [ ] Tablet response feels instant (<100ms perceived)
- [ ] Works for 1 week without issues
- [ ] Family prefers new dashboard over old

### Technical Metrics
- [ ] 100% entity coverage (all mapped entities work)
- [ ] <3s initial load time
- [ ] WebSocket connection stays alive 24h+
- [ ] Zero runtime errors in production
- [ ] 90%+ test coverage (critical paths)

### Quality Metrics
- [ ] Clean ESLint (zero errors)
- [ ] Prettier formatted
- [ ] TypeScript strict mode (if using TS)
- [ ] No console errors/warnings
- [ ] Accessible (Lighthouse Accessibility >90)

---

## Implementation Strategy

### Development Priorities
1. **Calendar First** - Highest value, most complex
2. **Meal Planner** - High value, simpler
3. **Games Room** - Medium value, good for learning HA services
4. **Cameras** - Lower priority, performance considerations

### Technology Choices

**Locked In:**
- React 18+
- Vite
- Tailwind CSS 3+
- Home Assistant WebSocket API
- Google Calendar API (direct integration)
- Lucide React icons
- date-fns or dayjs

**Flexible:**
- State Management: Zustand (recommended) or React Context
- TypeScript: Optional but recommended
- Testing: Vitest + React Testing Library
- HTTP Client: Fetch API or Axios
- Google Auth: @react-oauth/google or gapi-script

### Code Organization
```
src/
├── components/
│   ├── Calendar/
│   ├── MealPlanner/
│   ├── GamesRoom/
│   ├── Cameras/
│   └── common/
├── services/
│   ├── ha-websocket.js
│   ├── ha-rest.js
│   ├── entity-mapper.js
│   └── google-calendar.js        ← Google Calendar API
├── hooks/
│   ├── useHAConnection.js
│   ├── useEntity.js
│   ├── useServiceCall.js
│   ├── useGoogleAuth.js          ← Google OAuth
│   └── useCalendarEvents.js      ← Calendar data
├── config/
│   └── entities.json (imported from /config)
├── App.jsx
└── main.jsx
```

---

## Phase Gates

Each phase requires sign-off before proceeding:

**Foundation Gate:**
- HA connection working
- Can read entities
- Can call services
- Basic UI renders

**Calendar Gate:**
- Week view complete
- Navigation works
- All calendars visible
- Real-time updates working

**Meal Planner Gate:**
- Can view/edit meals
- Copy function works
- Data persists

**Games Room Gate:**
- All devices controllable
- Real-time state updates
- Climate control works

**Camera Gate:**
- All cameras visible
- Refresh works
- Full-screen works

**MVP Complete:**
- All gates passed
- 1 week of family testing
- Zero critical bugs
- Performance targets met

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Google Calendar auth fails | Medium | High | Document OAuth refresh process |
| WebSocket disconnects | High | High | Auto-reconnect with exponential backoff |
| Camera streams too slow | Medium | Medium | Use snapshots instead of live streams |
| Bundle size too large | Low | Medium | Code splitting, lazy loading |
| Tablet performance poor | Low | High | Performance profiling, React.memo |
| HA API changes | Low | High | Pin HA version, test upgrades |

---

## Post-MVP Roadmap (v1.1 - v2.0)

**v1.1 Enhancements:**
- Event creation/editing
- Day/Month view toggles
- Meal templates
- Advanced media controls
- Live camera streams

**v2.0 Major Features:**
- PWA support (offline mode)
- Push notifications
- Voice control integration
- Multi-user support
- Dashboard customization
- Analytics/insights

---

## Definition of Done

The MVP is complete when:
1. All Phase 2 "Must Have" features implemented
2. All success criteria met
3. All phase gates passed
4. Family uses it for 1 week without reverting to old dashboard
5. Zero critical bugs
6. Documentation complete (README, deployment guide)
7. Code reviewed and approved
8. Deployed to production (Kitchen Calendar tablet)

**Target Launch Date:** TBD (based on start date + 7 weeks)
