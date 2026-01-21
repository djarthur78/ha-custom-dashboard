# Code Quality & Structure Analysis

## ✅ Linter Status: CLEAN
All ESLint errors have been fixed. The codebase now passes linting with zero errors or warnings.

---

## Current Project Structure

```
src/
├── main.jsx                          # App entry point
├── App.jsx                           # Root component with routing
├── constants/
│   ├── colors.js                     # Calendar color definitions
│   └── routes.js                     # Route constants
├── services/
│   ├── ha-websocket.js              # WebSocket service for HA
│   ├── ha-rest.js                   # REST API service for HA
│   └── calendar-service.js          # Calendar data fetching
├── hooks/
│   ├── useHAConnection.js           # WebSocket connection hook
│   ├── useEntity.js                 # Entity state subscription hook
│   ├── useWeather.js                # Weather forecast subscription hook
│   └── useServiceCall.js            # Service call hook
├── components/
│   ├── layout/
│   │   ├── MainLayout.jsx           # Main app layout
│   │   ├── Navigation.jsx           # Top navigation bar
│   │   └── PageContainer.jsx        # Page wrapper component
│   ├── common/
│   │   ├── ErrorBoundary.jsx        # Error handling boundary
│   │   ├── LoadingSpinner.jsx       # Loading state component
│   │   └── ConnectionStatus.jsx     # HA connection indicator
│   └── features/
│       └── calendar/
│           ├── CalendarView.jsx     # Full calendar view (unused)
│           └── CalendarViewList.jsx # Skylight-style week view
└── pages/
    ├── HomePage.jsx                  # Dashboard home
    ├── MealsPage.jsx                 # Meal planning (placeholder)
    ├── GamesRoomPage.jsx             # Games room (placeholder)
    └── CamerasPage.jsx               # Camera view (placeholder)
```

---

## ✅ What's Working Well

### 1. **Clean Architecture**
- Clear separation of concerns (services, hooks, components)
- Logical folder structure following React best practices
- Components properly organized by type (layout, common, features)

### 2. **Robust WebSocket Implementation**
- Auto-reconnect with exponential backoff
- Proper error handling and timeout management
- Weather forecast subscription using `weather/subscribe_forecast`
- Entity state subscriptions with cleanup

### 3. **Reusable Hooks**
- `useHAConnection` - Centralized connection management
- `useEntity` - Subscribes to entity state changes
- `useWeather` - Weather forecast with date-indexed lookup
- Good separation of data fetching logic from UI

### 4. **Error Handling**
- ErrorBoundary wraps entire app
- Connection status monitoring
- Loading states throughout

---

## 🔧 Recommended Improvements

### 1. **Remove Unused Code**

**CalendarView.jsx is unused** - The app uses `CalendarViewList.jsx` exclusively.

**Recommendation:**
```bash
# Remove or archive the old calendar view
rm src/components/features/calendar/CalendarView.jsx
```

**Impact:** Reduces bundle size, eliminates confusion about which component to use.

---

### 2. **Extract Weather Icons to Constants**

Currently in `CalendarViewList.jsx`:
```javascript
const getWeatherIcon = (condition) => {
  const icons = { ... };
  return icons[condition] || '☀️';
};
```

**Recommendation:**
```javascript
// src/constants/weather.js
export const WEATHER_ICONS = {
  'clear-night': '🌙',
  'cloudy': '☁️',
  // ... rest
};

export const getWeatherIcon = (condition) => WEATHER_ICONS[condition] || '☀️';
```

**Benefits:**
- Reusable across components
- Easier to maintain and update
- Single source of truth for weather icons

---

### 3. **Create Weather Display Component**

Extract weather display logic from CalendarViewList:

```jsx
// src/components/features/calendar/DayWeather.jsx
export function DayWeather({ forecast }) {
  if (!forecast) return null;

  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '1.2em' }}>
        {getWeatherIcon(forecast.condition)}
      </div>
      <div style={{ fontSize: '0.75em', color: '#666', fontWeight: 600 }}>
        {Math.round(forecast.temperature)}° / {Math.round(forecast.templow)}°
      </div>
    </div>
  );
}
```

**Benefits:**
- Easier to test
- More maintainable
- Can reuse in other views

---

### 4. **Extract Event Card Component**

The event rendering logic is inline and could be its own component:

```jsx
// src/components/features/calendar/EventCard.jsx
export function EventCard({ event }) {
  const colors = getEventStyle(event.calendarId);

  return (
    <div
      style={{
        backgroundColor: colors.backgroundColor,
        padding: '8px',
        borderRadius: '10px',
        border: 'none',
        maxHeight: '80px',
        overflow: 'hidden',
      }}
    >
      <div style={{
        fontSize: '12px',
        lineHeight: '1.4',
        color: '#000000',
        opacity: 0.7,
        marginBottom: '2px'
      }}>
        {!event.allDay && (
          <>{format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}</>
        )}
        {event.allDay && <>Entire day</>}
      </div>
      <div style={{
        fontSize: '14px',
        lineHeight: '1.4',
        fontWeight: '500',
        color: '#000000'
      }}>
        {event.title}
      </div>
      {event.location && (
        <div style={{
          fontSize: '12px',
          lineHeight: '1.4',
          color: '#000000',
          opacity: 0.7,
          marginTop: '2px'
        }}>
          {event.location}
        </div>
      )}
    </div>
  );
}
```

---

### 5. **Environment Variable Validation**

Add environment variable validation at startup:

```javascript
// src/utils/validateEnv.js
export function validateEnvironment() {
  const required = ['VITE_HA_URL', 'VITE_HA_TOKEN'];
  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file.`
    );
  }

  // Validate URL format
  try {
    new URL(import.meta.env.VITE_HA_URL);
  } catch {
    throw new Error('VITE_HA_URL must be a valid URL');
  }
}

// Call in main.jsx before rendering
validateEnvironment();
```

---

### 6. **Add PropTypes or TypeScript**

For better type safety, consider:

**Option A: PropTypes** (Quick win)
```javascript
import PropTypes from 'prop-types';

EventCard.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    start: PropTypes.instanceOf(Date).isRequired,
    end: PropTypes.instanceOf(Date).isRequired,
    allDay: PropTypes.bool,
    location: PropTypes.string,
    calendarId: PropTypes.string.isRequired,
  }).isRequired,
};
```

**Option B: TypeScript** (Future consideration)
- Migrate to `.tsx` files
- Full type safety
- Better IDE support

---

### 7. **Add Component Documentation**

Improve JSDoc comments:

```javascript
/**
 * CalendarViewList Component
 *
 * Displays a week view calendar matching Skylight Calendar design.
 * Fetches events from multiple Home Assistant calendars and displays
 * weather forecasts for each day.
 *
 * Features:
 * - Full-color event cards by calendar
 * - Daily weather forecast with high/low temps
 * - Today/Tomorrow/Yesterday relative labels
 * - Orange highlight for current day
 *
 * @component
 * @example
 * return <CalendarViewList />
 */
export function CalendarViewList() {
  // ...
}
```

---

### 8. **Create Utility Files**

Move helper functions to dedicated utility files:

```javascript
// src/utils/dateHelpers.js
export function getRelativeDayName(day) {
  const yesterday = addDays(new Date(), -1);
  const tomorrow = addDays(new Date(), 1);

  if (isToday(day)) return 'Today';
  if (isSameDay(day, yesterday)) return 'Yesterday';
  if (isSameDay(day, tomorrow)) return 'Tomorrow';
  return format(day, 'EEEE');
}

// src/utils/weatherHelpers.js
export function formatTemperature(temp, showDecimal = false) {
  return showDecimal ? temp.toFixed(1) : Math.round(temp);
}
```

---

### 9. **Add Error Logging Service**

Consider adding structured error logging:

```javascript
// src/services/logger.js
const LOG_LEVELS = { ERROR: 'error', WARN: 'warn', INFO: 'info', DEBUG: 'debug' };

export const logger = {
  error: (message, data) => {
    console.error(`[ERROR] ${message}`, data);
    // Could send to external service (Sentry, LogRocket, etc.)
  },

  warn: (message, data) => {
    console.warn(`[WARN] ${message}`, data);
  },

  info: (message, data) => {
    console.info(`[INFO] ${message}`, data);
  },

  debug: (message, data) => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  },
};

// Usage in components
logger.error('Failed to fetch weather forecast', { entity: WEATHER_ENTITY, error });
```

---

### 10. **Add Unit Tests**

Consider adding tests for critical functions:

```javascript
// src/utils/__tests__/weatherHelpers.test.js
import { describe, it, expect } from 'vitest';
import { getWeatherIcon } from '../weatherHelpers';

describe('getWeatherIcon', () => {
  it('returns correct icon for sunny', () => {
    expect(getWeatherIcon('sunny')).toBe('☀️');
  });

  it('returns default icon for unknown condition', () => {
    expect(getWeatherIcon('unknown')).toBe('☀️');
  });
});
```

---

## 📊 Code Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| ESLint Errors | 0 | 0 | ✅ |
| Component Size | Good | <300 lines | ✅ |
| Function Length | Good | <50 lines | ✅ |
| Cyclomatic Complexity | Low | <10 | ✅ |
| Test Coverage | 0% | >70% | ⚠️ |

---

## 🎯 Priority Recommendations

### High Priority (Do Now)
1. ✅ **Fix linter errors** - DONE
2. 🔄 **Remove unused CalendarView.jsx** - Reduces confusion
3. 🔄 **Extract weather icons to constants** - Easy win for maintainability

### Medium Priority (This Week)
4. Extract EventCard and DayWeather components
5. Add environment variable validation
6. Move helper functions to utilities

### Low Priority (Future)
7. Add PropTypes or consider TypeScript migration
8. Implement error logging service
9. Add unit tests for critical functions
10. Improve component documentation

---

## 🏗️ Proposed File Structure After Refactoring

```
src/
├── utils/
│   ├── validateEnv.js               # Environment validation
│   ├── dateHelpers.js               # Date formatting utilities
│   └── weatherHelpers.js            # Weather-related utilities
├── constants/
│   ├── colors.js
│   ├── routes.js
│   └── weather.js                   # Weather icons and conditions
├── components/
│   └── features/
│       └── calendar/
│           ├── CalendarViewList.jsx # Main calendar component
│           ├── EventCard.jsx        # Individual event card
│           └── DayWeather.jsx       # Weather display component
└── ...
```

---

## 💡 Summary

**Current State:** The codebase is well-structured, clean, and follows React best practices. All linter errors are fixed.

**Key Strengths:**
- Clean architecture with proper separation of concerns
- Robust WebSocket implementation with auto-reconnect
- Good hook design for data management
- Proper error boundaries

**Main Opportunities:**
- Remove unused code (CalendarView.jsx)
- Extract reusable components (EventCard, DayWeather)
- Move constants and utilities to dedicated files
- Add type checking (PropTypes or TypeScript)
- Implement testing

**Next Steps:**
1. Remove CalendarView.jsx
2. Create constants/weather.js
3. Extract EventCard and DayWeather components
4. Add environment validation
5. Consider adding tests for critical paths
