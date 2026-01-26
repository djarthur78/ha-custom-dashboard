/**
 * Calendar Service
 * Fetches calendar events from Home Assistant
 */

import haWebSocket from './ha-websocket';

/**
 * Fetch calendar events for a date range
 * @param {string} calendarId - Calendar entity ID (e.g., 'calendar.daz')
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {Promise<Array>} Array of calendar events
 */
export async function fetchCalendarEvents(calendarId, start, end) {
  try {
    const startISO = start.toISOString();
    const endISO = end.toISOString();

    console.log(`[Calendar Service] Fetching events for ${calendarId}`, { start: startISO, end: endISO });

    // Try to call calendar.get_events service via WebSocket
    try {
      const result = await haWebSocket.send({
        type: 'call_service',
        domain: 'calendar',
        service: 'get_events',
        service_data: {
          entity_id: calendarId,
          start_date_time: startISO,
          end_date_time: endISO,
        },
        return_response: true,
      });

      console.log(`[Calendar Service] WebSocket response for ${calendarId}:`, result);

      // Try different response paths (HA API format can vary)
      let events = [];
      if (result?.response?.[calendarId]?.events) {
        events = result.response[calendarId].events;
      } else if (result?.[calendarId]?.events) {
        events = result[calendarId].events;
      } else if (result?.response?.events) {
        events = result.response.events;
      } else if (result?.events) {
        events = result.events;
      } else if (Array.isArray(result?.response)) {
        events = result.response;
      } else if (Array.isArray(result)) {
        events = result;
      }

      console.log(`[Calendar Service] Got ${events.length} events for ${calendarId}`);

      return events.map(event => ({
        id: `${calendarId}-${event.start}-${event.summary}`,
        title: event.summary || 'Untitled Event',
        start: new Date(event.start),
        end: new Date(event.end),
        allDay: !event.start.includes('T'),
        calendarId: calendarId,
        description: event.description || '',
        location: event.location || '',
      }));
    } catch (wsError) {
      console.error(`[Calendar Service] WebSocket failed for ${calendarId}:`, wsError);
      return [];
    }
  } catch (error) {
    console.error(`[Calendar Service] Failed to fetch events for ${calendarId}:`, error);
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
    console.error('Failed to fetch calendar events:', error);
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
    console.log(`[Calendar Service] Creating event in ${calendarId}:`, eventData);

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

    console.log(`[Calendar Service] Event created successfully:`, result);
    return { success: true, result };
  } catch (error) {
    console.error(`[Calendar Service] Failed to create event:`, error);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
}

/**
 * Update an existing calendar event
 * @param {string} calendarId - Calendar entity ID
 * @param {string} uid - Event UID
 * @param {Object} eventData - Updated event data
 * @returns {Promise<Object>} Result of the operation
 */
export async function updateCalendarEvent(calendarId, uid, eventData) {
  try {
    console.log(`[Calendar Service] Updating event ${uid} in ${calendarId}:`, eventData);

    const result = await haWebSocket.send({
      type: 'call_service',
      domain: 'calendar',
      service: 'update_event',
      service_data: {
        entity_id: calendarId,
        uid: uid,
        summary: eventData.summary,
        start_date_time: eventData.dtstart,
        end_date_time: eventData.dtend,
        description: eventData.description || '',
        location: eventData.location || '',
      },
    });

    console.log(`[Calendar Service] Event updated successfully:`, result);
    return { success: true, result };
  } catch (error) {
    console.error(`[Calendar Service] Failed to update event:`, error);
    throw new Error(`Failed to update calendar event: ${error.message}`);
  }
}

/**
 * Delete a calendar event
 * @param {string} calendarId - Calendar entity ID
 * @param {string} uid - Event UID
 * @param {string} [recurrenceId] - Recurrence ID for recurring events
 * @returns {Promise<Object>} Result of the operation
 */
export async function deleteCalendarEvent(calendarId, uid, recurrenceId = null) {
  try {
    console.log(`[Calendar Service] Deleting event ${uid} from ${calendarId}`);

    const serviceData = {
      entity_id: calendarId,
      uid: uid,
    };

    if (recurrenceId) {
      serviceData.recurrence_id = recurrenceId;
    }

    const result = await haWebSocket.send({
      type: 'call_service',
      domain: 'calendar',
      service: 'delete_event',
      service_data: serviceData,
    });

    console.log(`[Calendar Service] Event deleted successfully:`, result);
    return { success: true, result };
  } catch (error) {
    console.error(`[Calendar Service] Failed to delete event:`, error);
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
