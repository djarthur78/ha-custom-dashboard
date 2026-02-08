import { useMemo } from 'react';
import { format, isSameDay, isToday } from 'date-fns';
import { isEventOnDay } from '../../../utils/calendar';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { CALENDAR_COLORS } from '../../../constants/colors';
import { useWeather } from '../../../hooks/useWeather';
import { getWeatherIcon } from '../../../utils/weather';

/**
 * TimelineView Component
 * Full-day timeline optimized for 1920x1080 portrait display
 * Shows events positioned at their actual time with duration-based height
 *
 * @param {Object} props
 * @param {Date} props.currentDate - Currently displayed day
 * @param {Function} props.onDateChange - Handler for day navigation
 * @param {Array} props.events - Events to display
 * @param {Function} props.onEventClick - Event click handler
 * @param {Function} props.onAddEvent - Add event handler (receives clicked time)
 * @param {Array} props.selectedCalendars - Array of selected calendar IDs
 */
export function TimelineView({
  currentDate,
  onDateChange,
  events = [],
  onEventClick,
  onAddEvent,
  selectedCalendars = [],
}) {
  const weather = useWeather();
  const HOUR_HEIGHT = 80; // pixels per hour (80px * 17 = 1360px total)
  const TIME_COLUMN_WIDTH = 80; // width of time labels column

  // Generate hours 7am to midnight (7-23)
  const hours = useMemo(() => Array.from({ length: 17 }, (_, i) => i + 7), []);

  // Filter and sort events for current day
  const dayEvents = useMemo(() => {
    return events
      .filter(event => {
        if (selectedCalendars.length > 0 && !selectedCalendars.includes(event.calendarId)) {
          return false;
        }
        return isEventOnDay(event, currentDate);
      })
      .filter(event => !event.allDay) // Handle all-day separately
      .sort((a, b) => a.start - b.start);
  }, [events, currentDate, selectedCalendars]);

  // All-day events
  const allDayEvents = useMemo(() => {
    return events
      .filter(event => {
        if (selectedCalendars.length > 0 && !selectedCalendars.includes(event.calendarId)) {
          return false;
        }
        return isEventOnDay(event, currentDate) && event.allDay;
      });
  }, [events, currentDate, selectedCalendars]);

  // Calculate event positions and handle overlaps
  const positionedEvents = useMemo(() => {
    const positioned = [];
    const columns = [];

    dayEvents.forEach(event => {
      const startHour = event.start.getHours();
      const startMinute = event.start.getMinutes();
      const endHour = event.end.getHours();
      const endMinute = event.end.getMinutes();

      // Adjust position for 7am start (subtract 7 from hours)
      const top = ((startHour - 7) + startMinute / 60) * HOUR_HEIGHT;
      const duration = ((endHour + endMinute / 60) - (startHour + startMinute / 60)) * HOUR_HEIGHT;
      const height = Math.max(duration, 30); // minimum 30px

      // Find column (for overlapping events)
      let column = 0;
      let foundColumn = false;

      while (!foundColumn) {
        const overlaps = positioned.some(p =>
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

      // Track max columns at this time
      if (!columns[column]) columns[column] = true;

      positioned.push({
        event,
        top,
        height,
        column,
        totalColumns: 1, // will be updated
      });
    });

    // Update totalColumns for each event
    const maxColumns = columns.length;
    positioned.forEach(p => {
      p.totalColumns = maxColumns;
    });

    return positioned;
  }, [dayEvents, HOUR_HEIGHT]);

  // Get current time position
  const currentTimePosition = useMemo(() => {
    if (!isToday(currentDate)) return null;
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    // Adjust for 7am start
    return ((hours - 7) + minutes / 60) * HOUR_HEIGHT;
  }, [currentDate, HOUR_HEIGHT]);

  const handlePrevDay = () => {
    onDateChange(subDays(currentDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(currentDate, 1));
  };

  const handleTimeSlotClick = (hour) => {
    if (onAddEvent) {
      const eventDate = new Date(currentDate);
      eventDate.setHours(hour, 0, 0, 0);
      onAddEvent(eventDate);
    }
  };

  const isDayToday = isToday(currentDate);
  const dayKey = format(currentDate, 'yyyy-MM-dd');
  const dayWeather = weather.forecastByDate[dayKey];

  // Get day name
  const getDayName = () => {
    return format(currentDate, 'EEEE, MMMM d, yyyy');
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-background)]">
      {/* Day Header (matching Week view style) */}
      <div className="mb-4 px-4">
        <div
          className="overflow-hidden bg-white"
          style={{
            border: 'solid 1px whitesmoke',
            borderRadius: '8px',
          }}
        >
          <div style={{ padding: '12px' }}>
            <div className="flex items-center justify-between">
              {/* Left: Previous button */}
              <button
                onClick={handlePrevDay}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                aria-label="Previous day"
                style={{ width: '44px', height: '44px' }}
              >
                <ChevronLeft size={24} style={{ color: 'black' }} />
              </button>

              {/* Center: Day number and name */}
              <div className="flex items-center gap-6">
                <div>
                  <div
                    style={{
                      fontSize: '3em',
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
                    {format(currentDate, 'd')}
                  </div>
                  <div style={{ fontSize: '1em', fontWeight: 700, color: '#666', marginTop: '4px' }}>
                    {getDayName()}
                  </div>
                </div>

                {/* Weather */}
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

              {/* Right: Next button */}
              <button
                onClick={handleNextDay}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                aria-label="Next day"
                style={{ width: '44px', height: '44px' }}
              >
                <ChevronRight size={24} style={{ color: 'black' }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* All-Day Events Bar */}
      {allDayEvents.length > 0 && (
        <div className="mb-4 px-4">
          <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-3">
            <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              ALL DAY
            </h3>
            <div className="flex flex-wrap gap-2">
              {allDayEvents.map((event, index) => {
                const calendarColor = CALENDAR_COLORS[event.calendarId]?.primary || '#666666';
                return (
                  <button
                    key={index}
                    onClick={() => onEventClick?.(event)}
                    className="px-4 py-2 rounded-lg hover:opacity-80 transition-opacity text-left"
                    style={{
                      backgroundColor: `${calendarColor}20`,
                      borderLeft: `4px solid ${calendarColor}`,
                    }}
                  >
                    <div className="font-medium text-sm text-[var(--color-text)]">
                      {event.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="flex-1 overflow-auto px-4">
        <div className="flex relative">
          {/* Time Column */}
          <div className="flex flex-col" style={{ width: `${TIME_COLUMN_WIDTH}px` }}>
            {hours.map(hour => {
              const timeLabel = format(new Date().setHours(hour, 0, 0, 0), 'h:mm a');
              return (
                <div
                  key={hour}
                  className="flex items-start justify-end pr-3 text-sm font-medium text-[var(--color-text-secondary)]"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  {timeLabel}
                </div>
              );
            })}
          </div>

          {/* Events Column */}
          <div className="flex-1 relative border-l-2 border-[var(--color-border)]">
            {/* Hour Grid Lines */}
            {hours.map(hour => (
              <div
                key={hour}
                className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface)]/50 transition-colors cursor-pointer"
                style={{ height: `${HOUR_HEIGHT}px` }}
                onClick={() => handleTimeSlotClick(hour)}
              >
                {/* Add button on hover */}
                <div className="opacity-0 hover:opacity-100 flex items-center justify-center h-full transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTimeSlotClick(hour);
                    }}
                    className="p-2 bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 rounded-full transition-colors"
                    aria-label="Add event"
                  >
                    <Plus className="w-4 h-4 text-[var(--color-primary)]" />
                  </button>
                </div>
              </div>
            ))}

            {/* Current Time Indicator */}
            {currentTimePosition !== null && (
              <div
                className="absolute left-0 right-0 flex items-center pointer-events-none z-20"
                style={{ top: `${currentTimePosition}px` }}
              >
                <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5" />
                <div className="flex-1 h-0.5 bg-red-500" />
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
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event);
                  }}
                  className="absolute px-3 py-2 rounded-lg hover:opacity-90 transition-opacity text-left overflow-hidden z-10"
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left,
                    width: totalColumns > 1 ? `calc(${width} - 4px)` : 'calc(100% - 8px)',
                    marginLeft: '4px',
                    backgroundColor: calendarColor,
                    color: '#000',
                    borderLeft: `4px solid ${calendarColor}`,
                    filter: 'brightness(1.2)',
                  }}
                >
                  <div className="font-semibold text-sm leading-tight mb-1">
                    {event.title}
                  </div>
                  <div className="text-xs opacity-80">
                    {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                  </div>
                  {event.location && height > 50 && (
                    <div className="text-xs opacity-80 mt-1 truncate">
                      📍 {event.location}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
