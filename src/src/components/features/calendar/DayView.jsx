import { useMemo } from 'react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { isEventOnDay } from '../../../utils/calendar';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { CALENDAR_COLORS } from '../../../constants/colors';

/**
 * DayView Component
 * Single day view with hourly time slots
 *
 * @param {Object} props
 * @param {Date} props.currentDate - Currently displayed day
 * @param {Function} props.onDateChange - Handler for day navigation
 * @param {Array} props.events - Events to display
 * @param {Function} props.onEventClick - Event click handler
 * @param {Function} props.onAddEvent - Add event handler (receives clicked time)
 * @param {Array} props.selectedCalendars - Array of selected calendar IDs
 */
export function DayView({
  currentDate,
  onDateChange,
  events = [],
  onEventClick,
  onAddEvent,
  selectedCalendars = [],
}) {
  // Generate hourly time slots (7am to midnight = hours 7-23)
  const timeSlots = useMemo(() => {
    return Array.from({ length: 17 }, (_, i) => i + 7);
  }, []);

  // Filter and sort events for current day
  const dayEvents = useMemo(() => {
    return events
      .filter(event => {
        // Filter by selected calendars
        if (selectedCalendars.length > 0 && !selectedCalendars.includes(event.calendarId)) {
          return false;
        }

        // Filter by current day
        return isEventOnDay(event, currentDate);
      })
      .sort((a, b) => a.start - b.start);
  }, [events, currentDate, selectedCalendars]);

  // Group events by hour
  const eventsByHour = useMemo(() => {
    const grouped = {};

    dayEvents.forEach(event => {
      const hour = event.allDay ? 'all-day' : event.start.getHours();

      if (!grouped[hour]) {
        grouped[hour] = [];
      }

      grouped[hour].push(event);
    });

    return grouped;
  }, [dayEvents]);

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

  return (
    <div className="flex flex-col h-full">
      {/* Day Header */}
      <div className="flex items-center justify-between mb-4 px-4">
        <button
          onClick={handlePrevDay}
          className="p-2 hover:bg-[var(--color-surface)] rounded-lg transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--color-text)]" />
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--color-text)]">
            {format(currentDate, 'EEEE, MMMM d')}
          </h2>
          {isDayToday && (
            <span className="text-sm text-[var(--color-primary)] font-medium">
              Today
            </span>
          )}
        </div>

        <button
          onClick={handleNextDay}
          className="p-2 hover:bg-[var(--color-surface)] rounded-lg transition-colors"
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5 text-[var(--color-text)]" />
        </button>
      </div>

      {/* All-Day Events */}
      {eventsByHour['all-day'] && eventsByHour['all-day'].length > 0 && (
        <div className="mb-4 px-4">
          <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-3">
            <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
              ALL DAY
            </h3>
            <div className="space-y-2">
              {eventsByHour['all-day'].map((event, index) => {
                const calendarColor = CALENDAR_COLORS[event.calendarId]?.primary || '#666666';

                return (
                  <button
                    key={index}
                    onClick={() => onEventClick?.(event)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: `${calendarColor}20`,
                      borderLeft: `4px solid ${calendarColor}`,
                    }}
                  >
                    <div className="font-medium text-[var(--color-text)]">
                      {event.title}
                    </div>
                    {event.location && (
                      <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                        📍 {event.location}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Hourly Time Slots */}
      <div className="flex-1 overflow-auto px-4">
        <div className="space-y-0">
          {timeSlots.map(hour => {
            const hourEvents = eventsByHour[hour] || [];
            const timeLabel = format(new Date().setHours(hour, 0, 0, 0), 'h:mm a');

            return (
              <div
                key={hour}
                className="flex border-t border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors min-h-[60px]"
              >
                {/* Time Label */}
                <div className="w-20 py-2 pr-4 text-right">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                    {timeLabel}
                  </span>
                </div>

                {/* Events Column */}
                <div
                  className="flex-1 py-2 pl-4 border-l border-[var(--color-border)] cursor-pointer relative"
                  onClick={() => handleTimeSlotClick(hour)}
                >
                  {hourEvents.length > 0 ? (
                    <div className="space-y-2">
                      {hourEvents.map((event, index) => {
                        const calendarColor = CALENDAR_COLORS[event.calendarId]?.primary || '#666666';
                        const duration = (event.end - event.start) / (1000 * 60); // minutes

                        return (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick?.(event);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:opacity-80 transition-opacity"
                            style={{
                              backgroundColor: `${calendarColor}20`,
                              borderLeft: `4px solid ${calendarColor}`,
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="font-medium text-[var(--color-text)]">
                                  {event.title}
                                </div>
                                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                                  {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                                  {duration > 0 && ` (${Math.round(duration)}m)`}
                                </div>
                                {event.location && (
                                  <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                                    📍 {event.location}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full opacity-0 hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTimeSlotClick(hour);
                        }}
                        className="p-1 hover:bg-[var(--color-background)] rounded"
                        aria-label="Add event"
                      >
                        <Plus className="w-4 h-4 text-[var(--color-text-secondary)]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
