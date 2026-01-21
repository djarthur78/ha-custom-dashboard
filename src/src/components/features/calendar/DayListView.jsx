/**
 * DayListView Component
 * Simple card list view for a single day's events
 * Optimized for quick glance at today's schedule
 */

import { useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { getEventStyle } from '../../../constants/colors';

export function DayListView({
  currentDate,
  events = [],
  onEventClick,
  selectedCalendars = [],
}) {
  // Filter and sort events for current day
  const dayEvents = useMemo(() => {
    return events
      .filter(event => {
        // Filter by selected calendars
        if (selectedCalendars.length > 0 && !selectedCalendars.includes(event.calendarId)) {
          return false;
        }

        // Filter by current day
        return isSameDay(event.start, currentDate);
      })
      // Exclude waste collection events
      .filter(event => event.calendarId !== 'calendar.basildon_council')
      .sort((a, b) => a.start - b.start);
  }, [events, currentDate, selectedCalendars]);

  // Separate all-day and timed events
  const allDayEvents = dayEvents.filter(e => e.allDay);
  const timedEvents = dayEvents.filter(e => !e.allDay);

  return (
    <div className="w-full" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* All-Day Events */}
      {allDayEvents.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3 uppercase">
            All Day
          </h3>
          <div className="space-y-3">
            {allDayEvents.map((event, index) => {
              const colors = getEventStyle(event.calendarId);
              return (
                <button
                  key={`all-day-${index}`}
                  onClick={() => onEventClick?.(event)}
                  className="w-full text-left hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: colors.backgroundColor,
                    padding: '16px',
                    borderRadius: '12px',
                    border: 'none',
                  }}
                >
                  <div style={{ fontSize: '16px', lineHeight: '1.4', fontWeight: '600', color: '#000000', marginBottom: '4px' }}>
                    {event.title}
                  </div>
                  {event.location && (
                    <div style={{ fontSize: '14px', lineHeight: '1.4', color: '#000000', opacity: 0.7 }}>
                      📍 {event.location}
                    </div>
                  )}
                  {event.description && (
                    <div style={{ fontSize: '14px', lineHeight: '1.4', color: '#000000', opacity: 0.7, marginTop: '4px' }}>
                      {event.description}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Timed Events */}
      {timedEvents.length > 0 && (
        <div>
          {allDayEvents.length > 0 && (
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3 uppercase">
              Schedule
            </h3>
          )}
          <div className="space-y-3">
            {timedEvents.map((event, index) => {
              const colors = getEventStyle(event.calendarId);
              return (
                <button
                  key={`timed-${index}`}
                  onClick={() => onEventClick?.(event)}
                  className="w-full text-left hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: colors.backgroundColor,
                    padding: '16px',
                    borderRadius: '12px',
                    border: 'none',
                  }}
                >
                  <div style={{ fontSize: '14px', lineHeight: '1.4', color: '#000000', opacity: 0.7, marginBottom: '4px' }}>
                    {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                  </div>
                  <div style={{ fontSize: '16px', lineHeight: '1.4', fontWeight: '600', color: '#000000', marginBottom: '4px' }}>
                    {event.title}
                  </div>
                  {event.location && (
                    <div style={{ fontSize: '14px', lineHeight: '1.4', color: '#000000', opacity: 0.7 }}>
                      📍 {event.location}
                    </div>
                  )}
                  {event.description && (
                    <div style={{ fontSize: '14px', lineHeight: '1.4', color: '#000000', opacity: 0.7, marginTop: '4px' }}>
                      {event.description}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* No Events */}
      {dayEvents.length === 0 && (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">
          <p className="text-lg">No events scheduled for this day</p>
        </div>
      )}
    </div>
  );
}
