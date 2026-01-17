# Google Calendar API Integration Guide

**Purpose:** Direct Google Calendar API integration for the Family Dashboard

**Architecture:** React app → Google Calendar API (bypassing Home Assistant)

---

## Why Direct Integration?

✅ **Faster** - No HA middleman
✅ **More reliable** - Calendar works even if HA is down
✅ **Full features** - Access to all Google Calendar API capabilities
✅ **Real-time** - Push notifications support
✅ **Independent** - Doesn't rely on HA calendar integration

---

## Setup Steps

### 1. Google Cloud Console Setup

**Create Project:**
1. Go to https://console.cloud.google.com
2. Click "Select a project" → "New Project"
3. Name: "Family Dashboard"
4. Click "Create"

**Enable Google Calendar API:**
1. Go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click "Enable"

**Create OAuth 2.0 Credentials:**
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Configure consent screen (if first time):
   - User Type: External
   - App name: "Family Dashboard"
   - User support email: your email
   - Developer contact: your email
   - Scopes: `https://www.googleapis.com/auth/calendar.readonly`
   - Test users: Add all family Gmail accounts
4. Create OAuth Client ID:
   - Application type: Web application
   - Name: "Family Dashboard React"
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://192.168.1.X:5173` (replace X with your IP)
   - Authorized redirect URIs:
     - `http://localhost:5173`
     - `http://192.168.1.X:5173`
5. Click "Create"
6. **SAVE THE CLIENT ID** - you'll need it

### 2. Environment Variables

Add to `.env`:
```bash
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

---

## React Implementation

### Package Installation

```bash
npm install @react-oauth/google
npm install date-fns  # for date manipulation
```

### 1. Wrap App with GoogleOAuthProvider

**File:** `src/main.jsx`
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
)
```

### 2. Create Google Calendar Service

**File:** `src/services/google-calendar.js`
```javascript
/**
 * Google Calendar API Service
 * Handles authentication and calendar data fetching
 */

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Fetch list of calendars
 * @param {string} accessToken - OAuth access token
 * @returns {Promise<Array>} List of calendars
 */
export async function fetchCalendars(accessToken) {
  const response = await fetch(`${CALENDAR_API_BASE}/users/me/calendarList`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch calendars: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Fetch events from a specific calendar
 * @param {string} accessToken - OAuth access token
 * @param {string} calendarId - Calendar ID (email)
 * @param {Date} timeMin - Start date
 * @param {Date} timeMax - End date
 * @returns {Promise<Array>} List of events
 */
export async function fetchCalendarEvents(
  accessToken,
  calendarId,
  timeMin,
  timeMax
) {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Fetch events from multiple calendars
 * @param {string} accessToken - OAuth access token
 * @param {Array<string>} calendarIds - Array of calendar IDs
 * @param {Date} timeMin - Start date
 * @param {Date} timeMax - End date
 * @returns {Promise<Array>} Combined events from all calendars
 */
export async function fetchMultipleCalendarEvents(
  accessToken,
  calendarIds,
  timeMin,
  timeMax
) {
  const promises = calendarIds.map((calendarId) =>
    fetchCalendarEvents(accessToken, calendarId, timeMin, timeMax)
      .then((events) =>
        events.map((event) => ({
          ...event,
          calendarId, // Add calendar ID to each event
        }))
      )
      .catch((error) => {
        console.error(`Error fetching calendar ${calendarId}:`, error);
        return []; // Return empty array on error
      })
  );

  const results = await Promise.all(promises);
  return results.flat();
}
```

### 3. Create Google Auth Hook

**File:** `src/hooks/useGoogleAuth.js`
```javascript
import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

/**
 * Custom hook for Google OAuth authentication
 * @returns {Object} Auth state and login function
 */
export function useGoogleAuth() {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  // Google OAuth login
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      fetchUserInfo(tokenResponse.access_token);
    },
    onError: (error) => {
      console.error('Login Failed:', error);
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
  });

  // Fetch user info
  async function fetchUserInfo(token) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  }

  // Logout
  function logout() {
    setUser(null);
    setAccessToken(null);
  }

  return {
    user,
    accessToken,
    isAuthenticated: !!accessToken,
    login,
    logout,
  };
}
```

### 4. Create Calendar Events Hook

**File:** `src/hooks/useCalendarEvents.js`
```javascript
import { useState, useEffect } from 'react';
import { fetchMultipleCalendarEvents } from '../services/google-calendar';
import { startOfWeek, endOfWeek, addDays } from 'date-fns';

/**
 * Custom hook for fetching calendar events
 * @param {string} accessToken - OAuth access token
 * @param {Array<string>} calendarIds - Array of calendar IDs to fetch
 * @param {Date} currentDate - Current viewing date
 * @returns {Object} Events and loading state
 */
export function useCalendarEvents(accessToken, calendarIds, currentDate = new Date()) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!accessToken || !calendarIds || calendarIds.length === 0) {
      return;
    }

    async function loadEvents() {
      setLoading(true);
      setError(null);

      try {
        // Fetch week's events
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

        const fetchedEvents = await fetchMultipleCalendarEvents(
          accessToken,
          calendarIds,
          weekStart,
          addDays(weekEnd, 1) // Include next day to catch midnight events
        );

        setEvents(fetchedEvents);
      } catch (err) {
        console.error('Error loading calendar events:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [accessToken, calendarIds, currentDate]);

  return {
    events,
    loading,
    error,
  };
}
```

### 5. Example Component Usage

**File:** `src/components/Calendar/CalendarView.jsx`
```javascript
import { useState } from 'react';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';

export function CalendarView() {
  const { user, accessToken, isAuthenticated, login, logout } = useGoogleAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Family calendar IDs
  const calendarIds = [
    '99swanlane@gmail.com',
    'arthurdarren@gmail.com',
    'nicholaarthur@gmail.com',
    'arthurcerys@gmail.com',
    'arthurdexter08@gmail.com',
  ];

  const { events, loading, error } = useCalendarEvents(
    accessToken,
    calendarIds,
    currentDate
  );

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Family Calendar</h1>
        <button
          onClick={login}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Family Calendar</h1>
        <div className="flex items-center gap-4">
          <span>Hello, {user?.name}</span>
          <button
            onClick={logout}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      </div>

      {loading && <p>Loading events...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      <div className="grid gap-2">
        {events.map((event) => (
          <div key={event.id} className="p-4 bg-gray-800 rounded">
            <h3 className="font-semibold">{event.summary}</h3>
            <p className="text-sm text-gray-400">
              {event.start?.dateTime || event.start?.date}
            </p>
            <p className="text-xs text-gray-500">
              Calendar: {event.calendarId}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Family Calendar IDs

Based on discovery, these are your calendar IDs:

```javascript
const FAMILY_CALENDARS = {
  main: '99swanlane@gmail.com',
  daz: 'arthurdarren@gmail.com',
  nic: 'nicholaarthur@gmail.com',
  cerys: 'arthurcerys@gmail.com',
  dex: 'arthurdexter08@gmail.com',
  // These may need discovery via API:
  birthdays: 'addressbook#contacts@group.v.calendar.google.com', // typical format
  ukHolidays: 'en.uk#holiday@group.v.calendar.google.com', // typical format
  council: 'basildon.council@gmail.com', // need to verify
};
```

**Note:** For shared calendars (birthdays, holidays, council), you may need to:
1. Fetch the full calendar list first
2. Find the exact calendar ID from the list
3. Store it in your config

---

## Testing the Integration

### Step 1: Test Authentication
```javascript
// In browser console after clicking "Sign in with Google"
console.log('Access Token:', accessToken);
console.log('User:', user);
```

### Step 2: Test Calendar List Fetch
```javascript
import { fetchCalendars } from './services/google-calendar';

const calendars = await fetchCalendars(accessToken);
console.log('Available calendars:', calendars);
```

### Step 3: Test Event Fetch
```javascript
import { fetchCalendarEvents } from './services/google-calendar';

const events = await fetchCalendarEvents(
  accessToken,
  '99swanlane@gmail.com',
  new Date(),
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // +7 days
);
console.log('Events:', events);
```

---

## Error Handling

### Common Issues:

**"Access blocked: Authorization Error"**
- Solution: Add test users in OAuth consent screen

**"Invalid redirect_uri"**
- Solution: Check authorized redirect URIs match exactly

**"Daily Limit Exceeded"**
- Solution: Google Calendar API has quotas (10,000 requests/day for free)
- Use caching to reduce API calls

**Token expires**
- Solution: Access tokens expire after ~1 hour
- Store refresh token and implement auto-refresh
- Or prompt user to re-authenticate

---

## Best Practices

1. **Cache Events:** Don't fetch on every render
2. **Batch Requests:** Fetch multiple calendars in parallel
3. **Handle Errors:** Calendar unavailable shouldn't crash app
4. **Loading States:** Show skeleton while fetching
5. **Token Management:** Store token in memory, not localStorage (XSS risk)
6. **Rate Limiting:** Implement request throttling
7. **Offline Support:** Cache events locally (future enhancement)

---

## API Reference

**Google Calendar API Docs:**
https://developers.google.com/calendar/api/v3/reference

**@react-oauth/google Docs:**
https://www.npmjs.com/package/@react-oauth/google

**Scopes:**
- `calendar.readonly` - Read-only access (recommended for MVP)
- `calendar` - Full read/write access (for v1.1 event creation)

---

## Next Steps

1. ✅ Set up Google Cloud Project
2. ✅ Get OAuth Client ID
3. ✅ Add to `.env`
4. ⬜ Implement authentication
5. ⬜ Test calendar fetch
6. ⬜ Build calendar UI
7. ⬜ Add color coding per calendar
8. ⬜ Implement week navigation

---

**Good luck! 🚀**
