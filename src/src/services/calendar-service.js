/**
 * Calendar Service
 * Fetches calendar events from Home Assistant via REST API,
 * creates/updates/deletes via WebSocket
 */

import haWebSocket from './ha-websocket';
import haRest from './ha-rest';
import createLogger from '../utils/logger';
import { showToast } from '../hooks/useToast';

const log = createLogger('Calendar');

/**
 * Fetch calendar events for a date range via REST API
 * @param {string} calendarId - Calendar entity ID (e.g., 'calendar.daz')
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {Promise<Array>} Array of calendar events
 */
export async function fetchCalendarEvents(calendarId, start, end) {
  try {
    log.debug(`[Calendar Service] Fetching events for ${calendarId} via REST API`);

    const events = await haRest.getCalendarEvents(calendarId, start, end);

    log.debug(`[Calendar Service] Got ${events.length} events for ${calendarId}`);

    return events.map(event => ({
      id: `${calendarId}-${event.start?.dateTime || event.start?.date}-${event.summary}`,
      title: event.summary || 'Untitled Event',
      start: new Date(event.start?.dateTime || event.start?.date),
      end: new Date(event.end?.dateTime || event.end?.date),
      allDay: !!event.start?.date && !event.start?.dateTime,
      calendarId: calendarId,
      description: event.description || '',
      location: event.location || '',
      uid: event.uid,
      recurrence_id: event.recurrence_id,
    }));
  } catch (error) {
    log.error(`[Calendar Service] Failed to fetch events for ${calendarId}:`, error);
    showToast('Failed to load calendar events', 'error');
    return [];
  }
}

/**
 * Fetch events from multiple calendars
 * @param {Array<string>} calendarIds - Array of calendar entity IDs
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {Promise<Array>} Combined array of events from all calendars
 */
export async function fetchAllCalendarEvents(calendarIds, start, end) {
  try {
    const promises = calendarIds.map(id => fetchCalendarEvents(id, start, end));
    const results = await Promise.all(promises);

    // Flatten array of arrays into single array
    return results.flat();
  } catch (error) {
    log.error('Failed to fetch calendar events:', error);
    return [];
  }
}

/**
 * Create a new calendar event
 * @param {string} calendarId - Calendar entity ID (e.g., 'calendar.daz')
 * @param {Object} eventData - Event data
 * @param {string} eventData.summary - Event title
 * @param {string} eventData.dtstart - Start datetime (ISO format)
 * @param {string} eventData.dtend - End datetime (ISO format)
 * @param {string} [eventData.description] - Event description
 * @param {string} [eventData.location] - Event location
 * @returns {Promise<Object>} Result of the operation
 */
export async function createCalendarEvent(calendarId, eventData) {
  try {
    log.debug(`[Calendar Service] Creating event in ${calendarId}:`, eventData);

    const result = await haWebSocket.send({
      type: 'call_service',
      domain: 'calendar',
      service: 'create_event',
      service_data: {
        entity_id: calendarId,
        summary: eventData.summary,
        start_date_time: eventData.dtstart,
        end_date_time: eventData.dtend,
        description: eventData.description || '',
        location: eventData.location || '',
      },
    });

    log.debug(`[Calendar Service] Event created successfully:`, result);
    return { success: true, result };
  } catch (error) {
    log.error(`[Calendar Service] Failed to create event:`, error);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
}

/**
 * Update an existing calendar event.
 * HA's Google Calendar integration doesn't support calendar/event/update,
 * so we delete the old event and create a new one.
 * @param {string} calendarId - Calendar entity ID
 * @param {string} uid - Event UID
 * @param {Object} eventData - Updated event data
 * @param {string} [recurrenceId] - Recurrence ID for recurring events
 * @returns {Promise<Object>} Result of the operation
 */
export async function updateCalendarEvent(calendarId, uid, eventData, recurrenceId = null) {
  try {
    log.debug(`[Calendar Service] Updating event ${uid} in ${calendarId} (delete + recreate):`, eventData);

    // Delete the old event first
    await deleteCalendarEvent(calendarId, uid, recurrenceId);

    // Create the new event with updated data
    const result = await createCalendarEvent(calendarId, eventData);

    log.debug(`[Calendar Service] Event updated successfully (delete + recreate):`, result);
    return { success: true, result };
  } catch (error) {
    log.error(`[Calendar Service] Failed to update event:`, error);
    throw new Error(`Failed to update calendar event: ${error.message}`);
  }
}

/**
 * Delete a calendar event via WebSocket command.
 * Uses calendar/event/delete WS command (not call_service — HA doesn't
 * expose delete_event as a service for Google Calendar).
 * @param {string} calendarId - Calendar entity ID
 * @param {string} uid - Event UID
 * @param {string} [recurrenceId] - Recurrence ID for recurring events
 * @returns {Promise<Object>} Result of the operation
 */
export async function deleteCalendarEvent(calendarId, uid, recurrenceId = null) {
  try {
    log.debug(`[Calendar Service] Deleting event ${uid} from ${calendarId}`);

    const command = {
      type: 'calendar/event/delete',
      entity_id: calendarId,
      uid: uid,
    };

    if (recurrenceId) {
      command.recurrence_id = recurrenceId;
    }

    const result = await haWebSocket.send(command);

    log.debug(`[Calendar Service] Event deleted successfully:`, result);
    return { success: true, result };
  } catch (error) {
    log.error(`[Calendar Service] Failed to delete event:`, error);
    throw new Error(`Failed to delete calendar event: ${error.message}`);
  }
}

/**
 * Parse natural language input into event data
 * @param {string} input - Natural language string (e.g., "Lunch tomorrow at noon")
 * @returns {Object} Parsed event data
 */
export function parseNaturalLanguage(input) {
  const now = new Date();
  const result = {
    summary: input,
    dtstart: null,
    dtend: null,
  };

  // Extract time patterns
  const timePattern = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const timeMatch = input.match(timePattern);

  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const meridian = timeMatch[3]?.toLowerCase();

    if (meridian === 'pm' && hours < 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;

    result.hours = hours;
    result.minutes = minutes;
  }

  // Extract date patterns
  if (input.toLowerCase().includes('today')) {
    result.date = new Date(now);
  } else if (input.toLowerCase().includes('tomorrow')) {
    result.date = new Date(now);
    result.date.setDate(result.date.getDate() + 1);
  } else if (input.toLowerCase().includes('next week')) {
    result.date = new Date(now);
    result.date.setDate(result.date.getDate() + 7);
  }

  // Extract duration
  const durationPattern = /(\d+)\s*(hour|hr|minute|min)s?/i;
  const durationMatch = input.match(durationPattern);

  if (durationMatch) {
    const amount = parseInt(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    result.duration = unit.startsWith('hour') || unit === 'hr' ? amount * 60 : amount;
  }

  return result;
}

export default {
  fetchCalendarEvents,
  fetchAllCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  parseNaturalLanguage,
};
