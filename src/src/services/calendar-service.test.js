/**
 * Tests for Calendar Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must use vi.hoisted for variables used in vi.mock factory
const mockHAWebSocket = vi.hoisted(() => ({
  send: vi.fn(),
}));

vi.mock('./ha-websocket', () => ({
  default: mockHAWebSocket,
}));

import {
  fetchCalendarEvents,
  fetchAllCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  parseNaturalLanguage,
} from './calendar-service';

describe('Calendar Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchCalendarEvents', () => {
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-31T23:59:59Z');

    it('should call HA WebSocket with correct parameters', async () => {
      mockHAWebSocket.send.mockResolvedValue({ response: { 'calendar.test': { events: [] } } });

      await fetchCalendarEvents('calendar.test', start, end);

      expect(mockHAWebSocket.send).toHaveBeenCalledWith({
        type: 'call_service',
        domain: 'calendar',
        service: 'get_events',
        service_data: {
          entity_id: 'calendar.test',
          start_date_time: start.toISOString(),
          end_date_time: end.toISOString(),
        },
        return_response: true,
      });
    });

    it('should parse response format: response.[calendarId].events', async () => {
      const mockEvents = [
        { summary: 'Event 1', start: '2024-01-15T10:00:00', end: '2024-01-15T11:00:00' },
      ];
      mockHAWebSocket.send.mockResolvedValue({
        response: { 'calendar.test': { events: mockEvents } },
      });

      const result = await fetchCalendarEvents('calendar.test', start, end);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Event 1');
      expect(result[0].calendarId).toBe('calendar.test');
    });

    it('should parse response format: [calendarId].events', async () => {
      const mockEvents = [
        { summary: 'Event 2', start: '2024-01-16', end: '2024-01-17' },
      ];
      mockHAWebSocket.send.mockResolvedValue({
        'calendar.test': { events: mockEvents },
      });

      const result = await fetchCalendarEvents('calendar.test', start, end);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Event 2');
    });

    it('should parse response format: response.events', async () => {
      const mockEvents = [
        { summary: 'Event 3', start: '2024-01-17T14:00:00', end: '2024-01-17T15:00:00' },
      ];
      mockHAWebSocket.send.mockResolvedValue({
        response: { events: mockEvents },
      });

      const result = await fetchCalendarEvents('calendar.test', start, end);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Event 3');
    });

    it('should parse response format: events (direct)', async () => {
      const mockEvents = [
        { summary: 'Event 4', start: '2024-01-18T09:00:00', end: '2024-01-18T10:00:00' },
      ];
      mockHAWebSocket.send.mockResolvedValue({ events: mockEvents });

      const result = await fetchCalendarEvents('calendar.test', start, end);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Event 4');
    });

    it('should parse response format: array response', async () => {
      const mockEvents = [
        { summary: 'Event 5', start: '2024-01-19T08:00:00', end: '2024-01-19T09:00:00' },
      ];
      mockHAWebSocket.send.mockResolvedValue({ response: mockEvents });

      const result = await fetchCalendarEvents('calendar.test', start, end);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Event 5');
    });

    it('should parse response format: direct array', async () => {
      const mockEvents = [
        { summary: 'Event 6', start: '2024-01-20T10:00:00', end: '2024-01-20T11:00:00' },
      ];
      mockHAWebSocket.send.mockResolvedValue(mockEvents);

      const result = await fetchCalendarEvents('calendar.test', start, end);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Event 6');
    });

    it('should transform events correctly', async () => {
      const mockEvents = [
        {
          summary: 'Test Event',
          start: '2024-01-15T10:00:00',
          end: '2024-01-15T11:00:00',
          description: 'Test description',
          location: 'Test location',
        },
      ];
      mockHAWebSocket.send.mockResolvedValue({
        response: { 'calendar.test': { events: mockEvents } },
      });

      const result = await fetchCalendarEvents('calendar.test', start, end);

      expect(result[0]).toMatchObject({
        title: 'Test Event',
        allDay: false,
        calendarId: 'calendar.test',
        description: 'Test description',
        location: 'Test location',
      });
      expect(result[0].start).toBeInstanceOf(Date);
      expect(result[0].end).toBeInstanceOf(Date);
      expect(result[0].id).toContain('calendar.test');
    });

    it('should detect all-day events (no time in start)', async () => {
      const mockEvents = [
        { summary: 'All Day Event', start: '2024-01-15', end: '2024-01-16' },
      ];
      mockHAWebSocket.send.mockResolvedValue({
        response: { 'calendar.test': { events: mockEvents } },
      });

      const result = await fetchCalendarEvents('calendar.test', start, end);

      expect(result[0].allDay).toBe(true);
    });

    it('should handle missing summary', async () => {
      const mockEvents = [
        { start: '2024-01-15T10:00:00', end: '2024-01-15T11:00:00' },
      ];
      mockHAWebSocket.send.mockResolvedValue({
        response: { 'calendar.test': { events: mockEvents } },
      });

      const result = await fetchCalendarEvents('calendar.test', start, end);

      expect(result[0].title).toBe('Untitled Event');
    });

    it('should handle missing description and location', async () => {
      const mockEvents = [
        { summary: 'Simple Event', start: '2024-01-15T10:00:00', end: '2024-01-15T11:00:00' },
      ];
      mockHAWebSocket.send.mockResolvedValue({
        response: { 'calendar.test': { events: mockEvents } },
      });

      const result = await fetchCalendarEvents('calendar.test', start, end);

      expect(result[0].description).toBe('');
      expect(result[0].location).toBe('');
    });

    it('should return empty array on WebSocket error', async () => {
      mockHAWebSocket.send.mockRejectedValue(new Error('WebSocket failed'));

      const result = await fetchCalendarEvents('calendar.test', start, end);

      expect(result).toEqual([]);
    });

    it('should return empty array when no events found', async () => {
      mockHAWebSocket.send.mockResolvedValue({});

      const result = await fetchCalendarEvents('calendar.test', start, end);

      expect(result).toEqual([]);
    });
  });

  describe('fetchAllCalendarEvents', () => {
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-31T23:59:59Z');

    it('should fetch events from multiple calendars', async () => {
      mockHAWebSocket.send
        .mockResolvedValueOnce({
          response: { 'calendar.one': { events: [{ summary: 'Event 1', start: '2024-01-15', end: '2024-01-16' }] } },
        })
        .mockResolvedValueOnce({
          response: { 'calendar.two': { events: [{ summary: 'Event 2', start: '2024-01-17', end: '2024-01-18' }] } },
        });

      const result = await fetchAllCalendarEvents(['calendar.one', 'calendar.two'], start, end);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Event 1');
      expect(result[1].title).toBe('Event 2');
    });

    it('should flatten results from all calendars', async () => {
      mockHAWebSocket.send
        .mockResolvedValueOnce({
          response: {
            'calendar.one': {
              events: [
                { summary: 'Event 1', start: '2024-01-15', end: '2024-01-16' },
                { summary: 'Event 2', start: '2024-01-17', end: '2024-01-18' },
              ],
            },
          },
        })
        .mockResolvedValueOnce({
          response: { 'calendar.two': { events: [{ summary: 'Event 3', start: '2024-01-19', end: '2024-01-20' }] } },
        });

      const result = await fetchAllCalendarEvents(['calendar.one', 'calendar.two'], start, end);

      expect(result).toHaveLength(3);
    });

    it('should handle partial failures gracefully', async () => {
      mockHAWebSocket.send
        .mockResolvedValueOnce({
          response: { 'calendar.one': { events: [{ summary: 'Event 1', start: '2024-01-15', end: '2024-01-16' }] } },
        })
        .mockRejectedValueOnce(new Error('Calendar two failed'));

      const result = await fetchAllCalendarEvents(['calendar.one', 'calendar.two'], start, end);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Event 1');
    });

    it('should return empty array on complete failure', async () => {
      mockHAWebSocket.send.mockRejectedValue(new Error('All failed'));

      const result = await fetchAllCalendarEvents(['calendar.one', 'calendar.two'], start, end);

      expect(result).toEqual([]);
    });
  });

  describe('createCalendarEvent', () => {
    it('should call HA WebSocket with correct parameters', async () => {
      mockHAWebSocket.send.mockResolvedValue({ success: true });

      const eventData = {
        summary: 'New Event',
        dtstart: '2024-01-15T10:00:00',
        dtend: '2024-01-15T11:00:00',
        description: 'Event description',
        location: 'Event location',
      };

      await createCalendarEvent('calendar.test', eventData);

      expect(mockHAWebSocket.send).toHaveBeenCalledWith({
        type: 'call_service',
        domain: 'calendar',
        service: 'create_event',
        service_data: {
          entity_id: 'calendar.test',
          summary: 'New Event',
          start_date_time: '2024-01-15T10:00:00',
          end_date_time: '2024-01-15T11:00:00',
          description: 'Event description',
          location: 'Event location',
        },
      });
    });

    it('should handle missing optional fields', async () => {
      mockHAWebSocket.send.mockResolvedValue({ success: true });

      const eventData = {
        summary: 'Simple Event',
        dtstart: '2024-01-15T10:00:00',
        dtend: '2024-01-15T11:00:00',
      };

      await createCalendarEvent('calendar.test', eventData);

      expect(mockHAWebSocket.send).toHaveBeenCalledWith(
        expect.objectContaining({
          service_data: expect.objectContaining({
            description: '',
            location: '',
          }),
        })
      );
    });

    it('should return success result', async () => {
      mockHAWebSocket.send.mockResolvedValue({ result: 'ok' });

      const result = await createCalendarEvent('calendar.test', {
        summary: 'Test',
        dtstart: '2024-01-15T10:00:00',
        dtend: '2024-01-15T11:00:00',
      });

      expect(result).toEqual({ success: true, result: { result: 'ok' } });
    });

    it('should throw error on failure', async () => {
      mockHAWebSocket.send.mockRejectedValue(new Error('Create failed'));

      await expect(
        createCalendarEvent('calendar.test', {
          summary: 'Test',
          dtstart: '2024-01-15T10:00:00',
          dtend: '2024-01-15T11:00:00',
        })
      ).rejects.toThrow('Failed to create calendar event: Create failed');
    });
  });

  describe('updateCalendarEvent', () => {
    it('should call HA WebSocket with correct parameters', async () => {
      mockHAWebSocket.send.mockResolvedValue({ success: true });

      const eventData = {
        summary: 'Updated Event',
        dtstart: '2024-01-15T10:00:00',
        dtend: '2024-01-15T12:00:00',
        description: 'Updated description',
        location: 'Updated location',
      };

      await updateCalendarEvent('calendar.test', 'event-uid-123', eventData);

      expect(mockHAWebSocket.send).toHaveBeenCalledWith({
        type: 'call_service',
        domain: 'calendar',
        service: 'update_event',
        service_data: {
          entity_id: 'calendar.test',
          uid: 'event-uid-123',
          summary: 'Updated Event',
          start_date_time: '2024-01-15T10:00:00',
          end_date_time: '2024-01-15T12:00:00',
          description: 'Updated description',
          location: 'Updated location',
        },
      });
    });

    it('should return success result', async () => {
      mockHAWebSocket.send.mockResolvedValue({ result: 'ok' });

      const result = await updateCalendarEvent('calendar.test', 'uid-123', {
        summary: 'Test',
        dtstart: '2024-01-15T10:00:00',
        dtend: '2024-01-15T11:00:00',
      });

      expect(result).toEqual({ success: true, result: { result: 'ok' } });
    });

    it('should throw error on failure', async () => {
      mockHAWebSocket.send.mockRejectedValue(new Error('Update failed'));

      await expect(
        updateCalendarEvent('calendar.test', 'uid-123', {
          summary: 'Test',
          dtstart: '2024-01-15T10:00:00',
          dtend: '2024-01-15T11:00:00',
        })
      ).rejects.toThrow('Failed to update calendar event: Update failed');
    });
  });

  describe('deleteCalendarEvent', () => {
    it('should call HA WebSocket with correct parameters', async () => {
      mockHAWebSocket.send.mockResolvedValue({ success: true });

      await deleteCalendarEvent('calendar.test', 'event-uid-123');

      expect(mockHAWebSocket.send).toHaveBeenCalledWith({
        type: 'call_service',
        domain: 'calendar',
        service: 'delete_event',
        service_data: {
          entity_id: 'calendar.test',
          uid: 'event-uid-123',
        },
      });
    });

    it('should include recurrence_id when provided', async () => {
      mockHAWebSocket.send.mockResolvedValue({ success: true });

      await deleteCalendarEvent('calendar.test', 'event-uid-123', '2024-01-15T10:00:00');

      expect(mockHAWebSocket.send).toHaveBeenCalledWith({
        type: 'call_service',
        domain: 'calendar',
        service: 'delete_event',
        service_data: {
          entity_id: 'calendar.test',
          uid: 'event-uid-123',
          recurrence_id: '2024-01-15T10:00:00',
        },
      });
    });

    it('should return success result', async () => {
      mockHAWebSocket.send.mockResolvedValue({ result: 'ok' });

      const result = await deleteCalendarEvent('calendar.test', 'uid-123');

      expect(result).toEqual({ success: true, result: { result: 'ok' } });
    });

    it('should throw error on failure', async () => {
      mockHAWebSocket.send.mockRejectedValue(new Error('Delete failed'));

      await expect(deleteCalendarEvent('calendar.test', 'uid-123')).rejects.toThrow(
        'Failed to delete calendar event: Delete failed'
      );
    });
  });

  describe('parseNaturalLanguage', () => {
    it('should extract time with am/pm', () => {
      const result = parseNaturalLanguage('Meeting at 3pm');

      expect(result.hours).toBe(15);
      expect(result.minutes).toBe(0);
    });

    it('should handle 12-hour time with minutes', () => {
      const result = parseNaturalLanguage('Call at 10:30am');

      expect(result.hours).toBe(10);
      expect(result.minutes).toBe(30);
    });

    it('should handle 12pm correctly (noon)', () => {
      const result = parseNaturalLanguage('Lunch at 12pm');

      expect(result.hours).toBe(12);
    });

    it('should handle 12am correctly (midnight)', () => {
      const result = parseNaturalLanguage('Event at 12am');

      expect(result.hours).toBe(0);
    });

    it('should detect "today"', () => {
      const result = parseNaturalLanguage('Meeting today at 3pm');

      expect(result.date).toBeInstanceOf(Date);
      // Should be today's date
      const today = new Date();
      expect(result.date.toDateString()).toBe(today.toDateString());
    });

    it('should detect "tomorrow"', () => {
      const result = parseNaturalLanguage('Meeting tomorrow at 10am');

      expect(result.date).toBeInstanceOf(Date);
      // Should be tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(result.date.toDateString()).toBe(tomorrow.toDateString());
    });

    it('should detect "next week"', () => {
      const result = parseNaturalLanguage('Meeting next week');

      expect(result.date).toBeInstanceOf(Date);
      // Should be 7 days from now
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      expect(result.date.toDateString()).toBe(nextWeek.toDateString());
    });

    it('should extract duration in hours', () => {
      const result = parseNaturalLanguage('Meeting for 2 hours');

      expect(result.duration).toBe(120); // 2 hours = 120 minutes
    });

    it('should extract duration in minutes', () => {
      const result = parseNaturalLanguage('Quick call for 30 minutes');

      expect(result.duration).toBe(30);
    });

    it('should extract duration with "hr" abbreviation', () => {
      const result = parseNaturalLanguage('Meeting for 1 hr');

      expect(result.duration).toBe(60);
    });

    it('should extract duration with "min" abbreviation', () => {
      const result = parseNaturalLanguage('Call for 15 min');

      expect(result.duration).toBe(15);
    });

    it('should keep original summary', () => {
      const input = 'Team standup tomorrow at 9am for 30 minutes';
      const result = parseNaturalLanguage(input);

      expect(result.summary).toBe(input);
    });

    it('should handle input with no recognized patterns', () => {
      const result = parseNaturalLanguage('Random text here');

      expect(result.summary).toBe('Random text here');
      expect(result.hours).toBeUndefined();
      expect(result.date).toBeUndefined();
      expect(result.duration).toBeUndefined();
    });
  });
});
