/**
 * Color Constants
 * Calendar colors matching Home Assistant theme
 */

// Calendar Colors - One color per calendar source
export const CALENDAR_COLORS = {
  // Main family calendar
  'calendar.99swanlane_gmail_com': {
    primary: '#4ecdc4',    // Teal
    text: '#ffffff',
    border: '#3ab5ad',
  },

  // Daz (Darren)
  'calendar.arthurdarren_gmail_com': {
    primary: '#ff6b6b',    // Red
    text: '#ffffff',
    border: '#e85555',
  },

  // Nic (Nicola)
  'calendar.nicholaarthur_gmail_com': {
    primary: '#a8e6cf',    // Mint green
    text: '#2d3436',
    border: '#8dd9b0',
  },

  // Cerys
  'calendar.arthurcerys_gmail_com': {
    primary: '#ffd93d',    // Yellow
    text: '#2d3436',
    border: '#e6c435',
  },

  // Dex (Dexter)
  'calendar.arthurdexter08_gmail_com': {
    primary: '#6c5ce7',    // Purple
    text: '#ffffff',
    border: '#5849c7',
  },

  // Birthdays
  'calendar.birthdays': {
    primary: '#fd79a8',    // Pink
    text: '#ffffff',
    border: '#e76690',
  },

  // UK Holidays
  'calendar.holidays_in_the_united_kingdom': {
    primary: '#74b9ff',    // Light blue
    text: '#2d3436',
    border: '#5aa3e6',
  },

  // Basildon Council
  'calendar.basildon_council': {
    primary: '#fab1a0',    // Coral
    text: '#2d3436',
    border: '#e89885',
  },
};

// Helper function to get calendar color
export function getCalendarColor(calendarId) {
  return CALENDAR_COLORS[calendarId] || {
    primary: '#95a5a6',  // Default gray
    text: '#ffffff',
    border: '#7f8c8d',
  };
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
