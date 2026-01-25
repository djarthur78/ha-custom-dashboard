/**
 * CalendarViewList Component
 * Calendar with list/card layout matching HA style
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, startOfWeek, addWeeks, subWeeks, addDays, subDays, addMonths, subMonths, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudLightning, Sun, Moon, CloudFog, Wind, Snowflake } from 'lucide-react';
import { PageContainer } from '../../layout/PageContainer';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { TwoTierSelector } from '../../common/TwoTierSelector';
import { useHAConnection } from '../../../hooks/useHAConnection';
import { useWeather } from '../../../hooks/useWeather';
import { fetchAllCalendarEvents } from '../../../services/calendar-service';
import { getEventStyle, getCalendarColor } from '../../../constants/colors';
import { EventModal } from './EventModal';
import { EventDetailModal } from './EventDetailModal';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { DayView } from './DayView';
import { DayListView } from './DayListView';
import { MonthView } from './MonthView';
import { TimelineView } from './TimelineView';
import { WeekTimelineView } from './WeekTimelineView';

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
  const iconMap = {
    'clear-night': { icon: Moon, color: '#FDB813', size: 28 },
    'cloudy': { icon: Cloud, color: '#78909C', size: 28 },
    'fog': { icon: CloudFog, color: '#B0BEC5', size: 28 },
    'hail': { icon: CloudSnow, color: '#81D4FA', size: 28 },
    'lightning': { icon: CloudLightning, color: '#FDD835', size: 28 },
    'lightning-rainy': { icon: CloudLightning, color: '#FFA726', size: 28 },
    'partlycloudy': { icon: Cloud, color: '#90CAF9', size: 28 },
    'pouring': { icon: CloudRain, color: '#42A5F5', size: 28 },
    'rainy': { icon: CloudDrizzle, color: '#5C6BC0', size: 28 },
    'snowy': { icon: Snowflake, color: '#81D4FA', size: 28 },
    'snowy-rainy': { icon: CloudSnow, color: '#64B5F6', size: 28 },
    'sunny': { icon: Sun, color: '#FFB300', size: 28 },
    'windy': { icon: Wind, color: '#90A4AE', size: 28 },
    'windy-variant': { icon: Wind, color: '#78909C', size: 28 },
    'exceptional': { icon: Cloud, color: '#FF5722', size: 28 },
  };

  const config = iconMap[condition] || iconMap['sunny'];
  const IconComponent = config.icon;

  return (
    <IconComponent
      size={config.size}
      style={{ color: config.color }}
      strokeWidth={2}
    />
  );
};


export function CalendarViewList() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week'); // 'day', 'week', 'month'
  const [layout, setLayout] = useState('list'); // 'list', 'schedule'
  const [enabledCalendars, setEnabledCalendars] = useState(new Set(CALENDAR_IDS));
  const { isConnected } = useHAConnection();
  const weather = useWeather();

  // Modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEventDate, setNewEventDate] = useState(null);

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

  // Force list layout for biweekly period
  useEffect(() => {
    if (period === 'biweekly' && layout !== 'list') {
      setLayout('list');
    }
  }, [period, layout]);

  // Navigation handlers
  const handlePrevious = () => {
    if (period === 'week') {
      setCurrentDate(prev => subWeeks(prev, 1));
    } else if (period === 'biweekly') {
      setCurrentDate(prev => subWeeks(prev, 2));
    } else if (period === 'day') {
      setCurrentDate(prev => subDays(prev, 1));
    } else if (period === 'month') {
      setCurrentDate(prev => subMonths(prev, 1));
    }
  };

  const handleNext = () => {
    if (period === 'week') {
      setCurrentDate(prev => addWeeks(prev, 1));
    } else if (period === 'biweekly') {
      setCurrentDate(prev => addWeeks(prev, 2));
    } else if (period === 'day') {
      setCurrentDate(prev => addDays(prev, 1));
    } else if (period === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    }
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

  // Event handlers for modals
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

  const handleAddEvent = (date) => {
    setNewEventDate(date || currentDate);
    setSelectedEvent(null);
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleDeleteEvent = (event) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const handleEventSaved = () => {
    fetchEvents(); // Refresh after save
  };

  const handleEventDeleted = () => {
    fetchEvents(); // Refresh after delete
  };

  // Filter events by enabled calendars
  const filteredEvents = events.filter(event => enabledCalendars.has(event.calendarId));

  // Get week days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Date label based on period
  const dateLabel = useMemo(() => {
    if (period === 'day') {
      return format(currentDate, 'EEEE, d MMMM yyyy');
    } else if (period === 'week') {
      const weekEnd = addDays(weekStart, 6);
      return `Week ${format(weekStart, 'w')} • ${format(weekStart, 'd MMM')} - ${format(weekEnd, 'd MMM yyyy')}`;
    } else if (period === 'biweekly') {
      const biweekEnd = addDays(weekStart, 13);
      return `Weeks ${format(weekStart, 'w')}-${format(biweekEnd, 'w')} • ${format(weekStart, 'd MMM')} - ${format(biweekEnd, 'd MMM yyyy')}`;
    } else if (period === 'month') {
      return format(currentDate, 'MMMM yyyy');
    }
    return '';
  }, [period, currentDate, weekStart]);


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
      <PageContainer>
        <div className="text-center py-12 text-[var(--color-text-secondary)]">
          Connecting to Home Assistant...
        </div>
      </PageContainer>
    );
  }

  return (
    <div style={{
      margin: '-1.5rem -1rem',
      padding: '1.4rem 5vw',
      width: 'calc(100% + 2rem)',
      boxSizing: 'border-box'
    }}>
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
            onClick={() => handleAddEvent(currentDate)}
          >
            <Plus size={16} />
            Add Event
          </button>
        </div>

        {/* Right: View selector and navigation */}
        <div className="flex items-center" style={{ gap: '12px' }}>
          <TwoTierSelector
            period={period}
            onPeriodChange={setPeriod}
            layout={layout}
            onLayoutChange={setLayout}
          />

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

          <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '200px', textAlign: 'center' }}>
            {dateLabel}
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

      {/* Calendar views */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner message="Loading calendar events..." />
        </div>
      ) : period === 'day' && layout === 'schedule' ? (
        <div style={{ height: 'calc(100vh - 300px)', minHeight: '1400px' }}>
          <TimelineView
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            events={filteredEvents}
            onEventClick={handleEventClick}
            onAddEvent={handleAddEvent}
            selectedCalendars={Array.from(enabledCalendars)}
          />
        </div>
      ) : period === 'day' && layout === 'list' ? (
        <div style={{ height: 'calc(100vh - 300px)', minHeight: '800px' }}>
          <DayListView
            currentDate={currentDate}
            events={filteredEvents}
            onEventClick={handleEventClick}
            selectedCalendars={Array.from(enabledCalendars)}
          />
        </div>
      ) : period === 'week' && layout === 'schedule' ? (
        <div style={{ height: 'calc(100vh - 300px)', minHeight: '1200px' }}>
          <WeekTimelineView
            currentDate={currentDate}
            events={filteredEvents}
            onEventClick={handleEventClick}
            selectedCalendars={Array.from(enabledCalendars)}
          />
        </div>
      ) : period === 'month' ? (
        <div style={{ height: 'calc(100vh - 300px)', minHeight: '800px' }}>
          <MonthView
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            events={filteredEvents}
            onEventClick={handleEventClick}
            onAddEvent={handleAddEvent}
            selectedCalendars={Array.from(enabledCalendars)}
          />
        </div>
      ) : period === 'biweekly' && layout === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          {/* Week 1 */}
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
                            <button
                              key={event.id}
                              onClick={() => handleEventClick(event)}
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
                            </button>
                          );
                        })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Week 2 */}
          <div className="grid grid-cols-7" style={{ gap: '4px', width: '100%' }}>
            {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i + 7)).map(day => {
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
                      {format(day, 'EEEE')}
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
                            <button
                              key={event.id}
                              onClick={() => handleEventClick(event)}
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
                            </button>
                          );
                        })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
                          <button
                            key={event.id}
                            onClick={() => handleEventClick(event)}
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
                          </button>
                        );
                      })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setSelectedEvent(null);
          setNewEventDate(null);
        }}
        onSave={handleEventSaved}
        event={selectedEvent}
        initialDate={newEventDate || currentDate}
        initialCalendar="calendar.arthurdarren_gmail_com"
      />

      <EventDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedEvent(null);
        }}
        onConfirm={handleEventDeleted}
        event={selectedEvent}
      />
    </div>
  );
}

export default CalendarViewList;
