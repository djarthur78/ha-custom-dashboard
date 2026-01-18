# Folder Structure - Frontend Best Practices

**Last Updated:** 2026-01-18 (Phase 2A Prep)

---

## Current Structure

```
ha-custom-dashboard/
├── src/                           # React application root
│   ├── .env                       # Environment variables (gitignored)
│   ├── .env.example               # Environment template
│   ├── package.json               # Dependencies
│   ├── vite.config.js             # Vite configuration
│   ├── postcss.config.js          # PostCSS/Tailwind config
│   ├── index.html                 # HTML entry point
│   │
│   └── src/                       # Application source code
│       ├── main.jsx               # React entry point (Router setup)
│       ├── App.jsx                # Root component
│       ├── index.css              # Global styles + Tailwind + Theme
│       │
│       ├── components/            # React components
│       │   ├── common/            # Shared/reusable components
│       │   │   ├── ConnectionStatus.jsx
│       │   │   ├── LoadingSpinner.jsx
│       │   │   └── ErrorBoundary.jsx
│       │   │
│       │   ├── layout/            # Layout components ✨ NEW
│       │   │   ├── MainLayout.jsx      # Main app layout
│       │   │   ├── Navigation.jsx      # Tab navigation
│       │   │   └── PageContainer.jsx   # Page wrapper
│       │   │
│       │   └── features/          # Feature-specific components ✨ NEW
│       │       ├── calendar/           # Calendar feature
│       │       ├── meals/              # Meal planner feature
│       │       ├── games-room/         # Games room feature
│       │       └── cameras/            # Camera feeds feature
│       │
│       ├── hooks/                 # React hooks
│       │   ├── useHAConnection.js      # Connection status
│       │   ├── useEntity.js            # Entity state
│       │   └── useServiceCall.js       # Service calls
│       │
│       ├── services/              # External services (Backend integration)
│       │   ├── ha-websocket.js         # HA WebSocket client (singleton)
│       │   └── ha-rest.js              # HA REST API client
│       │
│       ├── utils/                 # Utility functions ✨ NEW
│       │   ├── date.js                 # Date formatting
│       │   ├── colors.js               # Calendar color coding
│       │   ├── entity.js               # Entity helpers
│       │   └── storage.js              # LocalStorage wrapper
│       │
│       ├── constants/             # Constants ✨ NEW
│       │   ├── colors.js               # Color definitions
│       │   ├── routes.js               # Route paths
│       │   └── config.js               # App configuration
│       │
│       ├── assets/                # Static assets
│       │   └── react.svg
│       │
│       └── config/                # Configuration (unused currently)
│
├── discovery/                     # Discovery documentation
├── specs/                         # Feature specifications
├── config/                        # Entity mappings (JSON)
├── operations/                    # Testing/deployment plans
│
├── README.md                      # Project overview
├── ARCHITECTURE.md                # Technical design
├── DEVELOPMENT.md                 # Development guide
├── CHANGELOG.md                   # Build history
├── DIAGRAMS.md                    # Architecture diagrams
├── FILE-GUIDE.md                  # Which file when
├── CLAUDE-CODE-EFFICIENCY-GUIDE.md
└── FOLDER-STRUCTURE.md            # This file
```

---

## Frontend Structure Principles

### 1. **Separation of Concerns**

**Clear layers:**
```
Presentation (UI)    → components/
Business Logic       → hooks/ + utils/
Data Access         → services/
Configuration       → constants/ + config/
```

---

### 2. **Feature-Based Organization**

**By feature, not by type:**
```
❌ BAD (by type):
components/
  ├── buttons/
  ├── cards/
  └── modals/

✅ GOOD (by feature):
components/
  ├── common/          # Shared across features
  ├── layout/          # Layout shells
  └── features/
      ├── calendar/    # Calendar-specific
      └── meals/       # Meal-specific
```

**Why:**
- Easy to locate related code
- Clear ownership
- Easier to extract to packages
- Better for code splitting

---

### 3. **Component Organization**

**Within each feature:**
```
features/calendar/
  ├── CalendarView.jsx           # Main component
  ├── WeekView.jsx               # Week view
  ├── DayView.jsx                # Day view
  ├── MonthView.jsx              # Month view
  ├── EventCard.jsx              # Event display
  ├── EventModal.jsx             # Event editor
  ├── hooks/
  │   ├── useCalendarEvents.js   # Calendar-specific hook
  │   └── useCalendarColors.js   # Color logic
  └── utils/
      ├── eventHelpers.js        # Event utilities
      └── dateRanges.js          # Date calculations
```

**Principles:**
- Feature = folder
- Keep related code together
- Can have feature-specific hooks/utils
- Easy to navigate

---

### 4. **Service Layer (Backend Integration)**

**Purpose:** Abstract all HA communication

```javascript
// services/ha-websocket.js
- Singleton WebSocket instance
- Connection management
- Message routing
- State subscription

// services/ha-rest.js
- One-time queries
- Configuration updates
```

**Why separate from components:**
- Single source of truth
- Easier to test
- Can swap implementations
- No HA logic in components

---

### 5. **Hook Layer (Business Logic)**

**Purpose:** Reusable business logic

```javascript
// hooks/useEntity.js
- Generic entity subscription
- Works for any entity type

// hooks/features/calendar/useCalendarEvents.js
- Calendar-specific logic
- Event filtering
- Date range calculation
```

**Pattern:**
- Generic hooks in `hooks/`
- Feature hooks in `features/[feature]/hooks/`

---

### 6. **Utils vs Constants**

**utils/** - Functions
```javascript
// utils/date.js
export function formatDate(date) { ... }
export function isToday(date) { ... }

// utils/colors.js
export function getCalendarColor(calendarId) { ... }
```

**constants/** - Values
```javascript
// constants/colors.js
export const CALENDAR_COLORS = {
  'calendar.daz': '#ff6b6b',
  'calendar.nic': '#4ecdc4',
};

// constants/routes.js
export const ROUTES = {
  HOME: '/',
  CALENDAR: '/calendar',
};
```

---

## Best Practices

### ✅ Do This

**1. Colocate related code**
```
features/calendar/
  ├── CalendarView.jsx
  ├── hooks/
  │   └── useCalendarEvents.js
  └── utils/
      └── eventHelpers.js
```

**2. Use index.js for exports**
```javascript
// features/calendar/index.js
export { CalendarView } from './CalendarView';
export { WeekView } from './WeekView';
export { DayView } from './DayView';

// Then import like:
import { CalendarView, WeekView } from '@/features/calendar';
```

**3. Keep components focused**
```javascript
// ✅ One responsibility
function EventCard({ event }) {
  return <div>...</div>;
}

// ❌ Too many responsibilities
function EventCardWithModalAndEditing({ event }) {
  // 500 lines of code
}
```

**4. Abstract HA logic**
```javascript
// ✅ Component doesn't know about HA
function CalendarView() {
  const { events, loading } = useCalendarEvents();
  return <div>{events.map(...)}</div>;
}

// ❌ Component knows HA details
function CalendarView() {
  const ws = useHAWebSocket();
  ws.send({ type: 'get_calendar' });
  // ...
}
```

---

### ❌ Don't Do This

**1. Mixing concerns**
```javascript
// ❌ Component contains business logic
function Calendar() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // 100 lines of event fetching/filtering logic
  }, []);
}

// ✅ Extract to hook
function Calendar() {
  const { events } = useCalendarEvents();
}
```

**2. Deep imports**
```javascript
// ❌ Importing from deep paths
import { EventCard } from '../../../features/calendar/EventCard';

// ✅ Use index.js or path aliases
import { EventCard } from '@/features/calendar';
```

**3. Circular dependencies**
```javascript
// ❌ A imports B, B imports A
// Will cause build errors
```

---

## Naming Conventions

### Files
```
✅ PascalCase for components: CalendarView.jsx
✅ camelCase for hooks: useCalendarEvents.js
✅ camelCase for utils: dateHelpers.js
✅ kebab-case for folders: games-room/
```

### Components
```javascript
✅ export function CalendarView() { ... }
✅ export default CalendarView;
```

### Hooks
```javascript
✅ export function useCalendarEvents() { ... }
✅ export default useCalendarEvents;
```

### Constants
```javascript
✅ SCREAMING_SNAKE_CASE
export const CALENDAR_COLORS = { ... };
```

---

## Path Aliases (Recommended)

**Add to vite.config.js:**
```javascript
export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@features': '/src/components/features',
      '@hooks': '/src/hooks',
      '@services': '/src/services',
      '@utils': '/src/utils',
      '@constants': '/src/constants',
    },
  },
});
```

**Then import like:**
```javascript
import { CalendarView } from '@features/calendar';
import { useEntity } from '@hooks/useEntity';
import { haWebSocket } from '@services/ha-websocket';
```

---

## Migration from Current Structure

**No breaking changes needed!**

Current Phase 1 code continues to work. New features use new structure.

**Gradual migration:**
1. Keep existing components where they are
2. New features go in `features/`
3. Extract shared components to `common/`
4. Eventually migrate old code (low priority)

---

## Testing Structure (Future)

```
src/
├── components/
│   └── calendar/
│       ├── CalendarView.jsx
│       └── CalendarView.test.jsx     # Colocated tests
│
└── hooks/
    ├── useEntity.js
    └── useEntity.test.js              # Colocated tests
```

**Vitest will automatically find `*.test.js` files.**

---

## Summary

**Frontend Structure:**
- ✅ Feature-based organization
- ✅ Clear separation of concerns
- ✅ Colocated related code
- ✅ Easy to navigate
- ✅ Scalable for growth

**Key Folders:**
- `components/features/` - Feature components
- `components/layout/` - Layout shells
- `components/common/` - Shared components
- `hooks/` - Business logic
- `services/` - HA integration
- `utils/` - Helper functions
- `constants/` - Configuration values

**No Backend Folder:**
- Home Assistant IS the backend
- `services/` provides the integration layer
- No traditional API routes or controllers needed

---

**Last Updated:** 2026-01-18
**Ready for Phase 2A development!** 🚀
