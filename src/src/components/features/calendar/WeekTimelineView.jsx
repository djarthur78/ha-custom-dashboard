/**
 * WeekTimelineView Component
 * 7-column week view with hourly timelines
 * Optimized for 1920×1080 landscape display
 *
 * Shows 7 side-by-side day columns, each with hourly timeline
 * Perfect for seeing time relationships across the entire week
 */

import { useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { CALENDAR_COLORS } from '../../../constants/colors';
import { useWeather } from '../../../hooks/useWeather';
import { getWeatherIcon } from '../../../utils/weather';

export function WeekTimelineView({
  currentDate,
  events = [],
  onEventClick,
  selectedCalendars = [],
}) {
  const weather = useWeather();
  const HOUR_HEIGHT = 60; // pixels per hour (60px * 17 = 1020px total)
  const TIME_COLUMN_WIDTH = 80; // width of time labels column

  // Generate hours 7am to midnight (7-23)
  const hours = useMemo(() => Array.from({ length: 17 }, (_, i) => i + 7), []);

  // Get week days (Monday to Sunday)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped = {};

    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      grouped[dayKey] = events
        .filter(event => {
          if (selectedCalendars.length > 0 && !selectedCalendars.includes(event.calendarId)) {
            return false;
          }
          return isSameDay(event.start, day);
        })
        .filter(event => !event.allDay && event.calendarId !== 'calendar.basildon_council')
        .sort((a, b) => a.start - b.start);
    });

    return grouped;
  }, [events, weekDays, selectedCalendars]);

  // Position events for each day
  const positionedEventsByDay = useMemo(() => {
    const positioned = {};

    Object.keys(eventsByDay).forEach(dayKey => {
      const dayEvents = eventsByDay[dayKey];
      const dayPositioned = [];
      const columns = [];

      dayEvents.forEach(event => {
        const startHour = event.start.getHours();
        const startMinute = event.start.getMinutes();
        const endHour = event.end.getHours();
        const endMinute = event.end.getMinutes();

        // Adjust position for 7am start (subtract 7 from hours)
        const top = ((startHour - 7) + startMinute / 60) * HOUR_HEIGHT;
        const duration = ((endHour + endMinute / 60) - (startHour + startMinute / 60)) * HOUR_HEIGHT;
        const height = Math.max(duration, 25); // minimum 25px

        // Find column (for overlapping events)
        let column = 0;
        let foundColumn = false;

        while (!foundColumn) {
          const overlaps = dayPositioned.some(p =>
            p.column === column &&
            top < p.top + p.height &&
            top + height > p.top
          );

          if (!overlaps) {
            foundColumn = true;
          } else {
            column++;
          }
        }

        if (!columns[column]) columns[column] = true;

        dayPositioned.push({
          event,
          top,
          height,
          column,
          totalColumns: 1, // will be updated
        });
      });

      // Update totalColumns for each event
      const maxColumns = columns.length;
      dayPositioned.forEach(p => {
        p.totalColumns = maxColumns;
      });

      positioned[dayKey] = dayPositioned;
    });

    return positioned;
  }, [eventsByDay, HOUR_HEIGHT]);

  // Get current time position
  const currentTimePosition = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    // Adjust for 7am start
    return ((hours - 7) + minutes / 60) * HOUR_HEIGHT;
  }, [HOUR_HEIGHT]);

  return (
    <div className="flex flex-col h-full bg-[var(--color-background)]">
      {/* Week Timeline */}
      <div className="flex-1 overflow-auto">
        <div className="flex relative" style={{ minWidth: '100%' }}>
          {/* Time Column */}
          <div className="flex flex-col sticky left-0 bg-[var(--color-background)] z-10" style={{ width: `${TIME_COLUMN_WIDTH}px` }}>
            {/* Header spacer */}
            <div style={{ height: '100px', borderBottom: '2px solid var(--color-border)' }} />

            {/* Hour labels */}
            {hours.map(hour => {
              const timeLabel = format(new Date().setHours(hour, 0, 0, 0), 'h a');
              return (
                <div
                  key={hour}
                  className="flex items-start justify-end pr-3 text-xs font-medium text-[var(--color-text-secondary)]"
                  style={{ height: `${HOUR_HEIGHT}px`, paddingTop: '2px' }}
                >
                  {timeLabel}
                </div>
              );
            })}
          </div>

          {/* Day Columns */}
          {weekDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const positionedEvents = positionedEventsByDay[dayKey] || [];
            const isDayToday = isToday(day);
            const dayWeather = weather.forecastByDate[dayKey];

            return (
              <div
                key={dayKey}
                className="flex-1 border-l border-[var(--color-border)]"
                style={{ minWidth: '200px' }}
              >
                {/* Day Header */}
                <div
                  className="sticky top-0 z-20 flex flex-col items-center justify-center"
                  style={{
                    height: '100px',
                    borderBottom: '2px solid var(--color-border)',
                    backgroundColor: 'white',
                    padding: '8px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#666',
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                    }}
                  >
                    {format(day, 'EEE')}
                  </div>
                  <div
                    style={{
                      fontSize: '2em',
                      fontWeight: 700,
                      lineHeight: 1,
                      ...(isDayToday && {
                        borderRadius: '5px',
                        backgroundColor: 'orange',
                        padding: '0 4px',
                        display: 'inline-block'
                      })
                    }}
                  >
                    {format(day, 'd')}
                  </div>
                  {dayWeather && (
                    <>
                      <div style={{ fontSize: '0.9em', marginTop: '6px' }}>
                        {getWeatherIcon(dayWeather.condition, 20)}
                      </div>
                      <div style={{ fontSize: '0.7em', color: '#666', fontWeight: 600, marginTop: '2px' }}>
                        {Math.round(dayWeather.temperature)}° / {Math.round(dayWeather.templow)}°
                      </div>
                    </>
                  )}
                </div>

                {/* Timeline Grid */}
                <div className="relative">
                  {/* Hour Grid Lines */}
                  {hours.map(hour => (
                    <div
                      key={hour}
                      className="border-t border-[var(--color-border)]"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                    />
                  ))}

                  {/* Current Time Indicator (only for today) */}
                  {isDayToday && (
                    <div
                      className="absolute left-0 right-0 pointer-events-none z-30"
                      style={{ top: `${currentTimePosition}px` }}
                    >
                      <div className="h-0.5 bg-red-500" />
                    </div>
                  )}

                  {/* Events */}
                  {positionedEvents.map((positioned, index) => {
                    const { event, top, height, column, totalColumns } = positioned;
                    const calendarColor = CALENDAR_COLORS[event.calendarId]?.primary || '#666666';

                    const width = totalColumns > 1 ? `${100 / totalColumns}%` : '100%';
                    const left = totalColumns > 1 ? `${(column * 100) / totalColumns}%` : '0';

                    return (
                      <button
                        key={`${dayKey}-${index}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        className="absolute px-2 py-1 rounded hover:opacity-90 transition-opacity text-left overflow-hidden z-20"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          left,
                          width: totalColumns > 1 ? `calc(${width} - 2px)` : 'calc(100% - 4px)',
                          marginLeft: '2px',
                          backgroundColor: calendarColor,
                          color: '#000',
                          borderLeft: `3px solid ${calendarColor}`,
                          filter: 'brightness(1.2)',
                          fontSize: '11px',
                        }}
                      >
                        <div className="font-semibold leading-tight truncate">
                          {event.title}
                        </div>
                        {height > 35 && (
                          <div className="opacity-80 text-[10px]">
                            {format(event.start, 'h:mm a')}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
