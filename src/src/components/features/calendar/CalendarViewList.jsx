/**
 * CalendarViewList Component
 * Calendar with list/card layout matching HA style
 */

import { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, addWeeks, subWeeks, addDays, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { PageContainer } from '../../layout/PageContainer';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { useHAConnection } from '../../../hooks/useHAConnection';
import { useWeather } from '../../../hooks/useWeather';
import { fetchAllCalendarEvents } from '../../../services/calendar-service';
import { getEventStyle, getCalendarColor } from '../../../constants/colors';
import { enGB } from 'date-fns/locale';

// Person calendars for filtering
const PERSON_CALENDARS = [
  { id: 'calendar.arthurdarren_gmail_com', name: 'Daz', shortName: 'D' },
  { id: 'calendar.nicholaarthur_gmail_com', name: 'Nic', shortName: 'N' },
  { id: 'calendar.arthurcerys_gmail_com', name: 'Cerys', shortName: 'C' },
  { id: 'calendar.arthurdexter08_gmail_com', name: 'Dex', shortName: 'D' },
];

// All calendar entity IDs
const CALENDAR_IDS = [
  'calendar.99swanlane_gmail_com',
  'calendar.arthurdarren_gmail_com',
  'calendar.nicholaarthur_gmail_com',
  'calendar.arthurcerys_gmail_com',
  'calendar.arthurdexter08_gmail_com',
  'calendar.birthdays',
  'calendar.holidays_in_the_united_kingdom',
  'calendar.basildon_council',
];

export function CalendarViewList() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('week'); // 'week', 'day', 'month'
  const [enabledCalendars, setEnabledCalendars] = useState(new Set(CALENDAR_IDS));
  const { isConnected } = useHAConnection();
  const weather = useWeather();

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch events for current week
  const fetchEvents = useCallback(async () => {
    if (!isConnected) return;

    setLoading(true);
    try {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
      const weekEnd = addDays(weekStart, 6); // Sunday

      const calendarEvents = await fetchAllCalendarEvents(
        CALENDAR_IDS,
        new Date(weekStart.setHours(0, 0, 0, 0)),
        new Date(weekEnd.setHours(23, 59, 59, 999))
      );

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate, isConnected]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Navigation handlers
  const handlePrevious = () => {
    setCurrentDate(prev => subWeeks(prev, 1));
  };

  const handleNext = () => {
    setCurrentDate(prev => addWeeks(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Toggle calendar visibility
  const toggleCalendar = (calendarId) => {
    setEnabledCalendars(prev => {
      const newSet = new Set(prev);
      if (newSet.has(calendarId)) {
        newSet.delete(calendarId);
      } else {
        newSet.add(calendarId);
      }
      return newSet;
    });
  };

  // Filter events by enabled calendars
  const filteredEvents = events.filter(event => enabledCalendars.has(event.calendarId));

  // Get week days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekLabel = `${format(weekStart, 'd MMM')} - ${format(addDays(weekStart, 6), 'd MMM yyyy')}`;

  // Get waste collection events for header
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const wasteEvents = filteredEvents.filter(e =>
    e.calendarId === 'calendar.basildon_council' &&
    e.start >= tomorrow
  ).sort((a, b) => a.start - b.start);

  // Get next collection day and all events on that day
  const nextWasteCollection = wasteEvents[0];
  const nextCollectionDay = nextWasteCollection?.start;
  const nextDayWasteEvents = wasteEvents.filter(e =>
    nextCollectionDay && isSameDay(e.start, nextCollectionDay)
  );

  const daysUntilCollection = nextWasteCollection
    ? Math.ceil((nextWasteCollection.start - today) / (1000 * 60 * 60 * 24))
    : null;

  if (!isConnected) {
    return (
      <PageContainer title="Calendar">
        <div className="text-center py-12 text-[var(--color-text-secondary)]">
          Connecting to Home Assistant...
        </div>
      </PageContainer>
    );
  }

  const headerTitle = (
    <div className="flex items-center gap-3">
      <span>Arthur Family</span>
      <span className="text-lg font-normal text-[var(--color-text-secondary)]">
        {format(currentTime, 'HH:mm')}
      </span>
      {weather.temperature && (
        <span className="text-lg font-normal text-[var(--color-text-secondary)]">
          ☀️ {Math.round(weather.temperature)}°C
        </span>
      )}
    </div>
  );

  return (
    <PageContainer title={headerTitle} maxWidth="max-w-full">
      {/* Header with waste collection info */}
      {nextWasteCollection && nextDayWasteEvents.length > 0 && (
        <div className="mb-4 text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
          <CalendarIcon size={16} />
          <span>
            {nextDayWasteEvents.map(e => e.title).join(', ')}
            {daysUntilCollection !== null && ` in ${daysUntilCollection} day${daysUntilCollection !== 1 ? 's' : ''}`}
          </span>
        </div>
      )}

      {/* Top controls */}
      <div className="mb-6 flex items-center justify-between gap-4">
        {/* Left: Person filters and Add Event */}
        <div className="flex items-center gap-3">
          {PERSON_CALENDARS.map(calendar => {
            const colors = getCalendarColor(calendar.id);
            const isEnabled = enabledCalendars.has(calendar.id);

            return (
              <button
                key={calendar.id}
                onClick={() => toggleCalendar(calendar.id)}
                className="flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all hover:scale-110"
                style={{
                  backgroundColor: isEnabled ? colors.primary : '#e0e0e0',
                  color: isEnabled ? colors.text : '#999',
                  border: `2px solid ${isEnabled ? colors.border : '#ccc'}`,
                  opacity: isEnabled ? 1 : 0.6,
                }}
                title={calendar.name}
              >
                {calendar.shortName}
              </button>
            );
          })}

          <button
            className="px-4 py-2 bg-white border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-variant)] transition-colors flex items-center gap-2 text-sm font-medium"
            onClick={() => alert('Add Event - Coming soon')}
          >
            <Plus size={16} />
            Add Event
          </button>
        </div>

        {/* Right: Today, View selector and navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-primary-dark)] transition-colors text-sm font-medium"
          >
            Today
          </button>

          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="px-3 py-2 bg-white border border-[var(--color-border)] rounded text-[var(--color-text)] text-sm"
          >
            <option value="week">Week</option>
            <option value="day">Day</option>
            <option value="month">Month</option>
          </select>

          <button
            onClick={handlePrevious}
            className="p-2 hover:bg-[var(--color-surface-variant)] rounded transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <span className="text-sm font-medium min-w-[140px] text-center">
            {weekLabel}
          </span>

          <button
            onClick={handleNext}
            className="p-2 hover:bg-[var(--color-surface-variant)] rounded transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Week view */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner message="Loading calendar events..." />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map(day => {
            const dayEvents = filteredEvents.filter(event =>
              isSameDay(event.start, day)
            ).sort((a, b) => a.start - b.start);

            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`border rounded-lg overflow-hidden ${
                  isCurrentDay ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)]'
                }`}
              >
                {/* Day header */}
                <div className={`p-3 border-b ${isCurrentDay ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}>
                  <div className="flex items-baseline justify-between">
                    <div className={`text-2xl font-bold ${isCurrentDay ? 'text-[var(--color-primary)]' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    {weather.temperature && (
                      <div className="text-xs text-[var(--color-text-secondary)]">
                        ☀️ {Math.round(weather.temperature)}°C
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    {format(day, 'EEEE')}
                  </div>
                  {isCurrentDay && (
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                      Today
                    </div>
                  )}
                </div>

                {/* Events list */}
                <div className="p-2 space-y-2">
                  {dayEvents.length === 0 ? (
                    <div className="text-xs text-[var(--color-text-secondary)] text-center py-2">
                      No events
                    </div>
                  ) : (
                    dayEvents
                      .filter(event => event.calendarId !== 'calendar.basildon_council')
                      .map(event => {
                        const colors = getEventStyle(event.calendarId);
                        return (
                          <div
                            key={event.id}
                            className="p-2 rounded text-xs shadow-sm"
                            style={{
                              backgroundColor: colors.backgroundColor,
                              color: colors.color,
                              border: `1px solid ${colors.borderColor}`,
                            }}
                          >
                            <div className="font-semibold">{event.title}</div>
                            {!event.allDay && (
                              <div className="text-xs opacity-90 mt-0.5">
                                {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                              </div>
                            )}
                            {event.allDay && (
                              <div className="text-xs opacity-90 mt-0.5">
                                All day
                              </div>
                            )}
                            {event.location && (
                              <div className="text-xs opacity-90 mt-0.5">
                                {event.location}
                              </div>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

export default CalendarViewList;
