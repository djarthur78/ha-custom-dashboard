/**
 * DayListView Component
 * Simple card list view for a single day's events
 * Optimized for quick glance at today's schedule
 */

import { useMemo } from 'react';
import { format, isSameDay, isToday } from 'date-fns';
import { getEventStyle } from '../../../constants/colors';
import { useWeather } from '../../../hooks/useWeather';
import { getWeatherIcon } from '../../../utils/weather';

export function DayListView({
  currentDate,
  events = [],
  onEventClick,
  selectedCalendars = [],
}) {
  const weather = useWeather();

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

  // Get day details
  const isCurrentDay = isToday(currentDate);
  const dayKey = format(currentDate, 'yyyy-MM-dd');
  const dayWeather = weather.forecastByDate[dayKey];

  // Get day name
  const getDayName = () => {
    return format(currentDate, 'EEEE');
  };

  return (
    <div className="w-full" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Day Header (matching Week view style) */}
      <div
        className="overflow-hidden bg-white mb-6"
        style={{
          border: 'solid 1px whitesmoke',
          borderRadius: '8px',
        }}
      >
        <div style={{ padding: '12px' }}>
          <div className="flex items-center justify-between">
            <div>
              <div
                style={{
                  fontSize: '3em',
                  fontWeight: 700,
                  lineHeight: 1,
                  ...(isCurrentDay && {
                    borderRadius: '5px',
                    backgroundColor: 'orange',
                    padding: '0 4px',
                    display: 'inline-block'
                  })
                }}
              >
                {format(currentDate, 'd')}
              </div>
              <div style={{ fontSize: '1em', fontWeight: 700, color: '#666', marginTop: '4px' }}>
                {getDayName()}
              </div>
            </div>
            {dayWeather && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2em', marginBottom: '4px' }}>
                  {getWeatherIcon(dayWeather.condition, 32)}
                </div>
                <div style={{ fontSize: '0.85em', color: '#666', fontWeight: 600 }}>
                  {Math.round(dayWeather.temperature)}° / {Math.round(dayWeather.templow)}°
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* All-Day Events */}
      {allDayEvents.length > 0 && (
        <div className="mb-4">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {allDayEvents.map((event, index) => {
              const colors = getEventStyle(event.calendarId);
              return (
                <button
                  key={`all-day-${index}`}
                  onClick={() => onEventClick?.(event)}
                  className="w-full text-left hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: colors.backgroundColor,
                    padding: '8px',
                    borderRadius: '10px',
                    border: 'none',
                    maxHeight: '80px',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#000000', opacity: 0.7, marginBottom: '2px' }}>
                    Entire day
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: '1.4', fontWeight: '500', color: '#000000' }}>
                    {event.title}
                  </div>
                  {event.location && (
                    <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#000000', opacity: 0.7, marginTop: '2px' }}>
                      {event.location}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {timedEvents.map((event, index) => {
              const colors = getEventStyle(event.calendarId);
              return (
                <button
                  key={`timed-${index}`}
                  onClick={() => onEventClick?.(event)}
                  className="w-full text-left hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: colors.backgroundColor,
                    padding: '8px',
                    borderRadius: '10px',
                    border: 'none',
                    maxHeight: '80px',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#000000', opacity: 0.7, marginBottom: '2px' }}>
                    {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: '1.4', fontWeight: '500', color: '#000000' }}>
                    {event.title}
                  </div>
                  {event.location && (
                    <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#000000', opacity: 0.7, marginTop: '2px' }}>
                      {event.location}
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
