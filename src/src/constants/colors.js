/**
 * Color Constants
 * Calendar color helpers — colors now defined in calendars.js
 */

import { CALENDAR_COLORS } from './calendars';

// Re-export for backward compatibility
export { CALENDAR_COLORS };

const DEFAULT_COLOR = {
  primary: '#95a5a6',
  text: '#ffffff',
  border: '#7f8c8d',
};

// Helper function to get calendar color
export function getCalendarColor(calendarId) {
  return CALENDAR_COLORS[calendarId] || DEFAULT_COLOR;
}

// Helper function for event styling
export function getEventStyle(calendarId) {
  const colors = getCalendarColor(calendarId);
  return {
    backgroundColor: colors.primary,
    borderColor: colors.border,
    color: colors.text,
  };
}

export default CALENDAR_COLORS;
