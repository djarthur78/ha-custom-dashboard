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
    const result = await haWebSocket.send({
      type: 'call_service',
      domain: 'calendar',
      service: 'get_events',
      service_data: {
        entity_id: calendarId,
        start_date_time: start.toISOString(),
        end_date_time: end.toISOString(),
      },
      return_response: true,
    });

    // HA returns events in result[calendarId].events
    const events = result?.[calendarId]?.events || [];

    return events.map(event => ({
      id: `${calendarId}-${event.start}-${event.summary}`,
      title: event.summary || 'Untitled Event',
      start: new Date(event.start),
      end: new Date(event.end),
      allDay: !event.start.includes('T'), // No time = all-day event
      calendarId: calendarId,
      description: event.description || '',
      location: event.location || '',
    }));
  } catch (error) {
    console.error(`Failed to fetch events for ${calendarId}:`, error);
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
