/**
 * Calendar Constants — Single Source of Truth
 * All calendar entity IDs, names, colors, and metadata in one place.
 * Add a new calendar here and it propagates everywhere.
 */

export const CALENDARS = [
  { id: 'calendar.99swanlane_gmail_com', name: '99 Swan Lane', shortName: 'F', writable: false, color: { primary: '#4ecdc4', text: '#ffffff', border: '#3ab5ad' } },
  { id: 'calendar.arthurdarren_gmail_com', name: 'Daz', shortName: 'D', writable: true, color: { primary: '#2962FF', text: '#000000', border: '#2962FF' } },
  { id: 'calendar.nicholaarthur_gmail_com', name: 'Nic', shortName: 'N', writable: true, color: { primary: '#F4A6B8', text: '#000000', border: '#F4A6B8' } },
  { id: 'calendar.arthurcerys_gmail_com', name: 'Cerys', shortName: 'C', writable: true, color: { primary: '#9DB8A0', text: '#000000', border: '#9DB8A0' } },
  { id: 'calendar.arthurdexter08_gmail_com', name: 'Dex', shortName: 'D', writable: true, color: { primary: '#FFB703', text: '#000000', border: '#FFB703' } },
  { id: 'calendar.birthdays', name: 'Birthdays', shortName: 'B', writable: true, color: { primary: '#fd79a8', text: '#ffffff', border: '#e76690' } },
  { id: 'calendar.holidays_in_the_united_kingdom', name: 'UK Holidays', shortName: 'H', writable: false, color: { primary: '#74b9ff', text: '#2d3436', border: '#5aa3e6' } },
  { id: 'calendar.basildon_council', name: 'Basildon Council', shortName: 'W', writable: false, color: { primary: '#fab1a0', text: '#2d3436', border: '#e89885' } },
];

// Derived constants — all computed from the CALENDARS array above

/** All calendar entity IDs */
export const CALENDAR_IDS = CALENDARS.map(c => c.id);

/** Person calendars (writable, excluding birthdays) for filter buttons */
export const PERSON_CALENDARS = CALENDARS.filter(c => c.writable && c.id !== 'calendar.birthdays');

/** Writable calendars for event creation/editing */
export const WRITABLE_CALENDARS = CALENDARS.filter(c => c.writable);

/** Calendar ID → display name lookup */
export const CALENDAR_NAMES = Object.fromEntries(CALENDARS.map(c => [c.id, c.name]));

/** Calendar ID → color object lookup (for colors.js compatibility) */
export const CALENDAR_COLORS = Object.fromEntries(CALENDARS.map(c => [c.id, c.color]));

/** Writable calendars formatted for EventModal options */
export const CALENDAR_OPTIONS = WRITABLE_CALENDARS.map(c => ({
  id: c.id,
  name: c.name,
  color: c.color.primary,
}));
