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

      // Check if result has events
      const events = result?.response?.[calendarId]?.events || [];

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

export default {
  fetchCalendarEvents,
  fetchAllCalendarEvents,
};
