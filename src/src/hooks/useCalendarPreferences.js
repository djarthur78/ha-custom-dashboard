import { useState, useEffect } from 'react';

const STORAGE_KEY = 'calendarPreferences';

const DEFAULT_PREFERENCES = {
  selectedCalendars: [
    'calendar.99swanlane_gmail_com',
    'calendar.arthurdarren_gmail_com',
    'calendar.nicholaarthur_gmail_com',
    'calendar.arthurcerys_gmail_com',
    'calendar.arthurdexter08_gmail_com',
    'calendar.birthdays',
    'calendar.holidays_in_the_united_kingdom',
    'calendar.basildon_council',
  ],
  viewMode: 'week', // 'week' | 'month' | 'day'
  showWeekends: true,
  defaultCalendar: 'calendar.arthurdarren_gmail_com',
};

/**
 * useCalendarPreferences Hook
 * Manages calendar preferences with localStorage persistence
 *
 * @returns {Object} Preferences and setter functions
 */
export function useCalendarPreferences() {
  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load calendar preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  });

  // Save to localStorage whenever preferences change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save calendar preferences:', error);
    }
  }, [preferences]);

  /**
   * Toggle a calendar's visibility
   */
  const toggleCalendar = (calendarId) => {
    setPreferences(prev => {
      const isSelected = prev.selectedCalendars.includes(calendarId);

      return {
        ...prev,
        selectedCalendars: isSelected
          ? prev.selectedCalendars.filter(id => id !== calendarId)
          : [...prev.selectedCalendars, calendarId],
      };
    });
  };

  /**
   * Select all calendars
   */
  const selectAllCalendars = () => {
    setPreferences(prev => ({
      ...prev,
      selectedCalendars: [...DEFAULT_PREFERENCES.selectedCalendars],
    }));
  };

  /**
   * Deselect all calendars
   */
  const deselectAllCalendars = () => {
    setPreferences(prev => ({
      ...prev,
      selectedCalendars: [],
    }));
  };

  /**
   * Set specific calendars
   */
  const setSelectedCalendars = (calendarIds) => {
    setPreferences(prev => ({
      ...prev,
      selectedCalendars: calendarIds,
    }));
  };

  /**
   * Set view mode
   */
  const setViewMode = (mode) => {
    setPreferences(prev => ({
      ...prev,
      viewMode: mode,
    }));
  };

  /**
   * Toggle weekends visibility
   */
  const toggleWeekends = () => {
    setPreferences(prev => ({
      ...prev,
      showWeekends: !prev.showWeekends,
    }));
  };

  /**
   * Set default calendar for new events
   */
  const setDefaultCalendar = (calendarId) => {
    setPreferences(prev => ({
      ...prev,
      defaultCalendar: calendarId,
    }));
  };

  /**
   * Reset to defaults
   */
  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  /**
   * Check if a calendar is selected
   */
  const isCalendarSelected = (calendarId) => {
    return preferences.selectedCalendars.includes(calendarId);
  };

  return {
    // Preferences state
    preferences,
    selectedCalendars: preferences.selectedCalendars,
    viewMode: preferences.viewMode,
    showWeekends: preferences.showWeekends,
    defaultCalendar: preferences.defaultCalendar,

    // Setters
    toggleCalendar,
    selectAllCalendars,
    deselectAllCalendars,
    setSelectedCalendars,
    setViewMode,
    toggleWeekends,
    setDefaultCalendar,
    resetPreferences,
    isCalendarSelected,
  };
}
