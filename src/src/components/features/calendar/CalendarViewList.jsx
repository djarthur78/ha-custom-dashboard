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

// Weather condition to emoji icon mapping
const getWeatherIcon = (condition) => {
  const icons = {
    'clear-night': '🌙',
    'cloudy': '☁️',
    'fog': '🌫️',
    'hail': '🧊',
    'lightning': '⚡',
    'lightning-rainy': '⛈️',
    'partlycloudy': '⛅',
    'pouring': '🌧️',
    'rainy': '🌦️',
    'snowy': '🌨️',
    'snowy-rainy': '🌨️',
    'sunny': '☀️',
    'windy': '💨',
    'windy-variant': '💨',
    'exceptional': '❗',
  };
  return icons[condition] || '☀️';
};


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

  // Fetch events for current week (+ extra weeks for waste collection header)
  const fetchEvents = useCallback(async () => {
    if (!isConnected) return;

    setLoading(true);
    try {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
      const weekEnd = addDays(weekStart, 6); // Sunday
      // Fetch extra 3 weeks ahead for waste collection header
      const extendedEnd = addWeeks(weekEnd, 3);

      const calendarEvents = await fetchAllCalendarEvents(
        CALENDAR_IDS,
        new Date(weekStart.setHours(0, 0, 0, 0)),
        new Date(extendedEnd.setHours(23, 59, 59, 999))
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


  // Get waste collection events for header (exclude today, show next collection)
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const wasteEvents = events.filter(e =>
    e.calendarId === 'calendar.basildon_council' &&
    e.start >= tomorrow  // Only future collections, not today
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
    <div style={{
      margin: '-1.5rem -1rem',
      padding: '1.4rem 5vw',
      width: 'calc(100% + 2rem)',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div className="mb-6" style={{ width: '100%' }}>
        <h2 className="text-3xl font-bold text-[var(--color-text)] mb-2">
          {headerTitle}
        </h2>
      </div>

      {/* Header with waste collection info */}
      {nextDayWasteEvents.length > 0 && (
        <div className="mb-4 text-sm flex items-center gap-2" style={{ color: '#666666', width: '100%' }}>
          <CalendarIcon size={16} />
          <span>
            {nextDayWasteEvents.map(e => e.title).join(', ')}
            {daysUntilCollection !== null && ` in ${daysUntilCollection} day${daysUntilCollection !== 1 ? 's' : ''}`}
          </span>
        </div>
      )}

      {/* Top controls */}
      <div className="mb-6 flex items-center justify-between" style={{ gap: '12px', width: '100%' }}>
        {/* Left: Person filters and Add Event */}
        <div className="flex items-center" style={{ gap: '8px' }}>
          {PERSON_CALENDARS.map(calendar => {
            const colors = getCalendarColor(calendar.id);
            const isEnabled = enabledCalendars.has(calendar.id);

            return (
              <button
                key={calendar.id}
                onClick={() => toggleCalendar(calendar.id)}
                className="flex items-center justify-center rounded-full transition-all hover:opacity-80"
                style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: isEnabled ? colors.primary : '#e6e6e6',
                  color: 'black',
                  border: 'none',
                  boxShadow: 'none',
                  padding: 0,
                  fontSize: '16px',
                  fontWeight: 800,
                }}
                title={calendar.name}
              >
                {calendar.shortName}
              </button>
            );
          })}

          <button
            className="flex items-center gap-2 hover:bg-gray-200 transition-colors"
            style={{
              height: '44px',
              minWidth: '140px',
              borderRadius: '999px',
              background: '#efefef',
              boxShadow: 'none',
              border: 'none',
              fontSize: '15px',
              fontWeight: 700,
              padding: '0 20px',
            }}
            onClick={() => alert('Add Event - Coming soon')}
          >
            <Plus size={16} />
            Add Event
          </button>
        </div>

        {/* Right: Today, View selector and navigation */}
        <div className="flex items-center" style={{ gap: '8px' }}>
          <button
            onClick={handleToday}
            className="hover:bg-gray-200 transition-colors"
            style={{
              height: '44px',
              minWidth: '90px',
              borderRadius: '999px',
              background: '#efefef',
              boxShadow: 'none',
              border: 'none',
              fontSize: '15px',
              fontWeight: 700,
            }}
          >
            Today
          </button>

          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            style={{
              height: '44px',
              minWidth: '95px',
              borderRadius: '999px',
              background: '#efefef',
              boxShadow: 'none',
              border: 'none',
              fontSize: '15px',
              fontWeight: 700,
              padding: '0 15px',
            }}
          >
            <option value="week">Week</option>
            <option value="day">Day</option>
            <option value="month">Month</option>
          </select>

          <button
            onClick={handlePrevious}
            className="flex items-center justify-center hover:bg-gray-200 transition-all"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#efefef',
              boxShadow: 'none',
              border: 'none',
            }}
          >
            <ChevronLeft size={26} style={{ color: 'black' }} />
          </button>

          <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '130px', textAlign: 'center' }}>
            {weekLabel}
          </span>

          <button
            onClick={handleNext}
            className="flex items-center justify-center hover:bg-gray-200 transition-all"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#efefef',
              boxShadow: 'none',
              border: 'none',
            }}
          >
            <ChevronRight size={26} style={{ color: 'black' }} />
          </button>
        </div>
      </div>

      {/* Week view */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner message="Loading calendar events..." />
        </div>
      ) : (
        <div className="grid grid-cols-7" style={{ gap: '4px', width: '100%' }}>
          {weekDays.map(day => {
            const dayEvents = filteredEvents.filter(event =>
              isSameDay(event.start, day)
            ).sort((a, b) => a.start - b.start);

            const isCurrentDay = isToday(day);
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayWeather = weather.forecastByDate[dayKey];

            return (
              <div
                key={day.toISOString()}
                className="overflow-hidden bg-white"
                style={{
                  border: 'solid 1px whitesmoke',
                  borderRadius: '8px',
                }}
              >
                {/* Day header */}
                <div style={{ padding: '8px', borderBottom: 'solid 1px whitesmoke' }}>
                  <div className="flex items-center justify-between">
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
                      {format(day, 'd')}
                    </div>
                    {dayWeather && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.2em' }}>
                          {getWeatherIcon(dayWeather.condition)}
                        </div>
                        <div style={{ fontSize: '0.75em', color: '#666', fontWeight: 600 }}>
                          {Math.round(dayWeather.temperature)}° / {Math.round(dayWeather.templow)}°
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '1em', fontWeight: 700, color: '#666', marginTop: '4px' }}>
                    {(() => {
                      const yesterday = addDays(new Date(), -1);
                      const tomorrow = addDays(new Date(), 1);
                      if (isToday(day)) return 'Today';
                      if (isSameDay(day, yesterday)) return 'Yesterday';
                      if (isSameDay(day, tomorrow)) return 'Tomorrow';
                      return format(day, 'EEEE');
                    })()}
                  </div>
                </div>

                {/* Events list */}
                <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                              {!event.allDay && (
                                <>{format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}</>
                              )}
                              {event.allDay && <>Entire day</>}
                            </div>
                            <div style={{ fontSize: '14px', lineHeight: '1.4', fontWeight: '500', color: '#000000' }}>
                              {event.title}
                            </div>
                            {event.location && (
                              <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#000000', opacity: 0.7, marginTop: '2px' }}>
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
    </div>
  );
}

export default CalendarViewList;
