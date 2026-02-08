import { startOfDay, endOfDay } from 'date-fns';

/**
 * Check if an event is visible on a given day.
 * Handles multi-day and all-day events by checking date range overlap.
 * @param {Object} event - Event with start and end Date properties
 * @param {Date} day - The day to check
 * @returns {boolean}
 */
export function isEventOnDay(event, day) {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  return event.start < dayEnd && event.end > dayStart;
}
