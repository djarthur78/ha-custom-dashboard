import { useMemo } from 'react';
import { format, startOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { CALENDAR_COLORS } from '../../../constants/colors';

/**
 * MonthView Component
 * Traditional month calendar grid with events
 *
 * @param {Object} props
 * @param {Date} props.currentDate - Currently displayed month
 * @param {Function} props.onDateChange - Handler for month navigation
 * @param {Array} props.events - Events to display
 * @param {Function} props.onEventClick - Event click handler
 * @param {Function} props.onAddEvent - Add event handler (receives clicked date)
 * @param {Array} props.selectedCalendars - Array of selected calendar IDs
 */
export function MonthView({
  currentDate,
  onDateChange,
  events = [],
  onEventClick,
  onAddEvent,
  selectedCalendars = [],
}) {
  // Generate calendar days for the month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);

    // Get first day of the week (Sunday = 0)
    const startDay = monthStart.getDay();

    // Calculate days to show from previous month
    const prevMonthStart = new Date(monthStart);
    prevMonthStart.setDate(prevMonthStart.getDate() - startDay);

    // Calculate total days to show (6 weeks = 42 days)
    const totalDays = 42;
    const endDate = new Date(prevMonthStart);
    endDate.setDate(endDate.getDate() + totalDays - 1);

    return eachDayOfInterval({ start: prevMonthStart, end: endDate });
  }, [currentDate]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped = {};

    events.forEach(event => {
      // Filter by selected calendars
      if (selectedCalendars.length > 0 && !selectedCalendars.includes(event.calendarId)) {
        return;
      }

      const dateKey = format(event.start, 'yyyy-MM-dd');

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      grouped[dateKey].push(event);
    });

    // Sort events by start time within each day
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => a.start - b.start);
    });

    return grouped;
  }, [events, selectedCalendars]);

  const handlePrevMonth = () => {
    onDateChange(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(currentDate, 1));
  };

  const handleDayClick = (day) => {
    if (onAddEvent) {
      onAddEvent(day);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4 px-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-[var(--color-surface)] rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--color-text)]" />
        </button>

        <h2 className="text-2xl font-bold text-[var(--color-text)]">
          {format(currentDate, 'MMMM yyyy')}
        </h2>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-[var(--color-surface)] rounded-lg transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-[var(--color-text)]" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2 px-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-[var(--color-text-secondary)] py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 gap-1 px-4 overflow-auto">
        {calendarDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);

          return (
            <div
              key={index}
              className={`min-h-[100px] border rounded-lg p-2 transition-colors ${
                isCurrentMonth
                  ? 'bg-[var(--color-surface)] border-[var(--color-border)]'
                  : 'bg-[var(--color-background)] border-[var(--color-border)]/50'
              } ${isDayToday ? 'ring-2 ring-[var(--color-primary)]' : ''} hover:bg-[var(--color-surface)] cursor-pointer`}
              onClick={() => handleDayClick(day)}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium ${
                    isDayToday
                      ? 'bg-[var(--color-primary)] text-white rounded-full w-6 h-6 flex items-center justify-center'
                      : isCurrentMonth
                      ? 'text-[var(--color-text)]'
                      : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {onAddEvent && isCurrentMonth && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDayClick(day);
                    }}
                    className="opacity-0 hover:opacity-100 transition-opacity p-1 hover:bg-[var(--color-background)] rounded"
                    aria-label="Add event"
                  >
                    <Plus className="w-3 h-3 text-[var(--color-text-secondary)]" />
                  </button>
                )}
              </div>

              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event, eventIndex) => {
                  const calendarColor = CALENDAR_COLORS[event.calendarId]?.primary || '#666666';

                  return (
                    <button
                      key={eventIndex}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      className="w-full text-left text-xs px-1 py-0.5 rounded truncate hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: `${calendarColor}20`,
                        borderLeft: `3px solid ${calendarColor}`,
                      }}
                      title={event.title}
                    >
                      {event.allDay ? '' : format(event.start, 'h:mm a') + ' '}
                      {event.title}
                    </button>
                  );
                })}

                {/* More events indicator */}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-[var(--color-text-secondary)] px-1">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
