import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module
vi.mock('../ha-websocket', () => ({
  default: {
    send: vi.fn(),
    getStatus: vi.fn(() => 'connected'),
  },
}));

vi.mock('../ha-rest', () => ({
  default: {
    getCalendarEvents: vi.fn(),
  },
}));

vi.mock('../../utils/logger', () => ({
  default: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('../../hooks/useToast', () => ({
  showToast: vi.fn(),
}));

import { fetchCalendarEvents, parseNaturalLanguage, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../calendar-service';
import haWebSocket from '../ha-websocket';
import haRest from '../ha-rest';

describe('fetchCalendarEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps HA event format to app format correctly', async () => {
    const mockEvents = [
      {
        summary: 'Team Meeting',
        start: { dateTime: '2026-02-07T10:00:00+00:00' },
        end: { dateTime: '2026-02-07T11:00:00+00:00' },
        description: 'Weekly standup',
        location: 'Office',
        uid: 'evt-123',
        recurrence_id: null,
      },
    ];

    haRest.getCalendarEvents.mockResolvedValue(mockEvents);

    const result = await fetchCalendarEvents(
      'calendar.daz',
      new Date('2026-02-01'),
      new Date('2026-02-28'),
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      title: 'Team Meeting',
      allDay: false,
      calendarId: 'calendar.daz',
      description: 'Weekly standup',
      location: 'Office',
      uid: 'evt-123',
    });
    expect(result[0].start).toBeInstanceOf(Date);
    expect(result[0].end).toBeInstanceOf(Date);
    expect(result[0].id).toContain('calendar.daz');
  });

  it('maps all-day events correctly', async () => {
    const mockEvents = [
      {
        summary: 'Birthday',
        start: { date: '2026-02-14' },
        end: { date: '2026-02-15' },
        uid: 'bday-1',
      },
    ];

    haRest.getCalendarEvents.mockResolvedValue(mockEvents);

    const result = await fetchCalendarEvents(
      'calendar.birthdays',
      new Date('2026-02-01'),
      new Date('2026-02-28'),
    );

    expect(result[0].allDay).toBe(true);
    expect(result[0].title).toBe('Birthday');
  });

  it('handles events with missing fields gracefully', async () => {
    const mockEvents = [
      {
        start: { dateTime: '2026-02-07T09:00:00+00:00' },
        end: { dateTime: '2026-02-07T10:00:00+00:00' },
      },
    ];

    haRest.getCalendarEvents.mockResolvedValue(mockEvents);

    const result = await fetchCalendarEvents(
      'calendar.daz',
      new Date('2026-02-01'),
      new Date('2026-02-28'),
    );

    expect(result[0].title).toBe('Untitled Event');
    expect(result[0].description).toBe('');
    expect(result[0].location).toBe('');
  });

  it('returns empty array on fetch error', async () => {
    haRest.getCalendarEvents.mockRejectedValue(new Error('Network error'));

    const result = await fetchCalendarEvents(
      'calendar.daz',
      new Date('2026-02-01'),
      new Date('2026-02-28'),
    );

    expect(result).toEqual([]);
  });
});

describe('deleteCalendarEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses calendar/event/delete WebSocket command (not call_service)', async () => {
    haWebSocket.send.mockResolvedValue(null);

    await deleteCalendarEvent('calendar.daz', 'evt-123');

    expect(haWebSocket.send).toHaveBeenCalledWith({
      type: 'calendar/event/delete',
      entity_id: 'calendar.daz',
      uid: 'evt-123',
    });
  });

  it('includes recurrence_id when provided', async () => {
    haWebSocket.send.mockResolvedValue(null);

    await deleteCalendarEvent('calendar.daz', 'evt-123', 'rec-456');

    expect(haWebSocket.send).toHaveBeenCalledWith({
      type: 'calendar/event/delete',
      entity_id: 'calendar.daz',
      uid: 'evt-123',
      recurrence_id: 'rec-456',
    });
  });
});

describe('updateCalendarEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('implements update as delete + create', async () => {
    haWebSocket.send.mockResolvedValue(null);

    const eventData = {
      summary: 'Updated Event',
      dtstart: '2026-02-07T10:00:00',
      dtend: '2026-02-07T11:00:00',
    };

    await updateCalendarEvent('calendar.daz', 'evt-123', eventData);

    // First call: delete
    expect(haWebSocket.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'calendar/event/delete',
        entity_id: 'calendar.daz',
        uid: 'evt-123',
      })
    );

    // Second call: create
    expect(haWebSocket.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'call_service',
        domain: 'calendar',
        service: 'create_event',
      })
    );
  });
});

describe('parseNaturalLanguage', () => {
  it('extracts time with meridian (pm)', () => {
    const result = parseNaturalLanguage('Lunch at 2pm');
    expect(result.hours).toBe(14);
    expect(result.minutes).toBe(0);
  });

  it('extracts time with meridian (am)', () => {
    const result = parseNaturalLanguage('Breakfast at 8am');
    expect(result.hours).toBe(8);
    expect(result.minutes).toBe(0);
  });

  it('handles 12pm correctly', () => {
    const result = parseNaturalLanguage('Meeting at 12pm');
    expect(result.hours).toBe(12);
  });

  it('handles 12am correctly', () => {
    const result = parseNaturalLanguage('Midnight snack at 12am');
    expect(result.hours).toBe(0);
  });

  it('extracts time with minutes', () => {
    const result = parseNaturalLanguage('Call at 3:30pm');
    expect(result.hours).toBe(15);
    expect(result.minutes).toBe(30);
  });

  it('detects "today" keyword', () => {
    const result = parseNaturalLanguage('Dentist today at 3pm');
    const today = new Date();
    expect(result.date.getDate()).toBe(today.getDate());
  });

  it('detects "tomorrow" keyword', () => {
    const result = parseNaturalLanguage('Meeting tomorrow at 10am');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(result.date.getDate()).toBe(tomorrow.getDate());
  });

  it('detects "next week" keyword', () => {
    const result = parseNaturalLanguage('Review next week');
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    expect(result.date.getDate()).toBe(nextWeek.getDate());
  });

  it('extracts duration in hours', () => {
    const result = parseNaturalLanguage('Workshop 2 hours');
    expect(result.duration).toBe(120);
  });

  it('extracts duration in minutes', () => {
    const result = parseNaturalLanguage('Standup 15 minutes');
    expect(result.duration).toBe(15);
  });

  it('preserves original input as summary', () => {
    const input = 'Lunch with Bob tomorrow at noon';
    const result = parseNaturalLanguage(input);
    expect(result.summary).toBe(input);
  });

  it('returns null dates when no date keyword found', () => {
    const result = parseNaturalLanguage('Something at 3pm');
    expect(result.date).toBeUndefined();
    expect(result.dtstart).toBeNull();
    expect(result.dtend).toBeNull();
  });
});
