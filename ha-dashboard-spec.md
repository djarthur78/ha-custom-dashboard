# Home Assistant Custom Dashboard - Technical Specification

## Project Overview
Rebuild existing Home Assistant "family calendar - panel" YAML dashboard as a modern, tablet-optimized web application with superior UX.

## Technical Stack
- **Frontend Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS 3+
- **State Management**: Zustand or React Context
- **HA Integration**: Home Assistant WebSocket API + REST API
- **Icons**: Lucide React
- **Date/Time**: date-fns or dayjs
- **Development**: ESLint, Prettier, TypeScript (optional but recommended)

## Home Assistant Connection
- **URL**: http://192.168.1.2:8123
- **Authentication**: Long-lived access token (stored in .env)
- **Dashboard to Analyze**: "family calendar - panel"
- **Connection Method**: WebSocket for real-time updates, REST for queries

## MCP Integration Requirements
- Use MCP servers to interact with Home Assistant
- Minimize token usage by using tools instead of inline API calls
- Store HA entity mappings in local config files
- Use file system tools for reading/writing configuration

## Core Features to Implement

### 1. Family Calendar
**Current YAML Analysis Needed:**
- Entity IDs for calendar integration
- Color coding scheme (exact hex codes)
- Event types and categories
- Week view layout structure

**New Features:**
- Week view (current default)
- Day view toggle
- Month view toggle
- Touch-optimized event creation modal
- Swipe to delete events
- Color-coded events matching existing scheme
- Event search/filter

### 2. Camera Feeds
**Current YAML Analysis Needed:**
- Camera entity IDs
- Streaming configuration
- Layout arrangement

**New Features:**
- Grid layout for multiple cameras
- Tap to expand full screen
- Live refresh indicator
- Fallback images for offline cameras
- Performance-optimized streaming

### 3. Games Room Controls
**Current YAML Analysis Needed:**
- Light entity IDs and groups
- Media player entity IDs
- Automation entity IDs
- Scene configurations

**New Features:**
- Large touch-friendly buttons
- Real-time state updates via WebSocket
- Brightness sliders for lights
- Media player controls (play/pause/volume)
- Quick scene activation
- Automation toggles

### 4. Meal Planner
**Current YAML Analysis Needed:**
- Data storage method (calendar entities? input_text?)
- Current/next week structure
- Meal categories (breakfast, lunch, dinner)

**New Features:**
- This week / Next week tabs
- Drag-and-drop meal planning (nice-to-have)
- Meal templates/favorites
- Shopping list generation (future)

## UI/UX Requirements

### Design Principles
- **Mobile-first**: Optimized for iPad (primary) and phones
- **Touch-friendly**: Minimum 44px tap targets
- **Performance**: 60fps animations, <100ms response time
- **Accessibility**: WCAG 2.1 AA compliance
- **Dark mode**: Primary theme (match existing HA dashboard)
- **Responsive**: Works 320px to 2048px width

### Color Scheme
- Extract exact colors from existing YAML dashboard
- Maintain brand consistency with current HA theme
- High contrast for readability
- Color-blind friendly palette

### Typography
- System fonts for performance
- Clear hierarchy
- Readable at arm's length (tablet use case)

## Technical Requirements

### Performance
- Initial load: <2s on 3G
- Time to interactive: <3s
- Bundle size: <500KB (gzipped)
- 60fps scrolling and animations

### State Management
- Real-time sync with HA via WebSocket
- Optimistic UI updates
- Offline-first architecture (future)
- Local state persistence

### Error Handling
- Graceful degradation if HA offline
- Retry logic for failed API calls
- User-friendly error messages
- Connection status indicator

### Security
- Token stored in .env (never committed)
- HTTPS in production (future)
- Input sanitization
- XSS prevention

## Development Workflow

### Phase 1: Discovery (Use MCP/Tools)
1. Connect to HA API via MCP server
2. Fetch "family calendar - panel" dashboard config
3. Extract all entity IDs, colors, structure
4. Document findings in JSON config file
5. Create entity mapping file

### Phase 2: Foundation
1. Initialize Vite + React project
2. Set up Tailwind CSS
3. Configure HA WebSocket connection
4. Create base layout and routing
5. Implement theme system

### Phase 3: Feature Implementation
1. Calendar module (highest priority)
2. Games room controls
3. Meal planner
4. Camera feeds

### Phase 4: Polish
1. Animations and transitions
2. Loading states
3. Error boundaries
4. Performance optimization
5. Testing on actual iPad

## Testing Requirements
- Test on iPad (primary device)
- Test on iPhone
- Test on desktop (secondary)
- Test with HA offline
- Test with slow network
- Test entity state changes
- Load testing with many entities

## File Structure
```
ha-custom-dashboard/
├── src/
│   ├── components/
│   │   ├── Calendar/
│   │   ├── Cameras/
│   │   ├── GamesRoom/
│   │   ├── MealPlanner/
│   │   └── common/
│   ├── services/
│   │   ├── ha-websocket.js
│   │   ├── ha-rest.js
│   │   └── entity-mapper.js
│   ├── hooks/
│   │   ├── useHAConnection.js
│   │   ├── useEntity.js
│   │   └── useCalendar.js
│   ├── config/
│   │   ├── entities.json (generated from HA)
│   │   └── colors.json (extracted from YAML)
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── .env (gitignored)
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Success Criteria
- [ ] All features from YAML dashboard implemented
- [ ] Improved UX over current dashboard
- [ ] <3s load time
- [ ] Works smoothly on iPad
- [ ] Real-time updates working
- [ ] No loss of functionality
- [ ] Maintainable code structure
- [ ] Documented codebase

## Future Enhancements
- PWA support (offline mode)
- Push notifications
- Voice control integration
- Multi-user support
- Dashboard customization UI
- Analytics/insights

## Questions to Answer During Discovery
1. What calendar integration is used? (Google Calendar entity?)
2. How are meal plans currently stored?
3. What automation logic needs to be preserved?
4. Are there any custom HA components in use?
5. What's the complete entity list?
6. What colors are used for what purposes?
