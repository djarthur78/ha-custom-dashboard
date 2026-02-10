/**
 * CalendarViewList Component
 * Calendar with list/card layout matching HA style
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, startOfWeek, addWeeks, subWeeks, addDays, subDays, addMonths, subMonths, isSameDay } from 'date-fns';
import { isEventOnDay } from '../../../utils/calendar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { PageContainer } from '../../layout/PageContainer';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { TwoTierSelector } from '../../common/TwoTierSelector';
import { useHAConnection } from '../../../hooks/useHAConnection';
import { useWeather } from '../../../hooks/useWeather';
import { fetchAllCalendarEvents } from '../../../services/calendar-service';
import { getCalendarColor } from '../../../constants/colors';
import { CALENDAR_IDS, PERSON_CALENDARS } from '../../../constants/calendars';
import { EventModal } from './EventModal';
import { EventDetailModal } from './EventDetailModal';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { DayView } from './DayView';
import { DayListView } from './DayListView';
import { MonthView } from './MonthView';
import { TimelineView } from './TimelineView';
import { WeekTimelineView } from './WeekTimelineView';
import { DayCard } from './DayCard';
import { EventSearchFilter, filterEvents } from './EventSearchFilter';

export function CalendarViewList() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('biweekly'); // 'day', 'week', 'biweekly', 'month'
  const [layout, setLayout] = useState('list'); // 'list', 'schedule'
  const [enabledCalendars, setEnabledCalendars] = useState(new Set(CALENDAR_IDS));
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
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

  // Filter events by enabled calendars, search term, and quick filter
  const filteredEvents = useMemo(() => {
    // First filter by enabled calendars
    const calendarFiltered = events.filter(event => enabledCalendars.has(event.calendarId));
    // Then apply search and quick filters
    return filterEvents(calendarFiltered, searchTerm, quickFilter);
  }, [events, enabledCalendars, searchTerm, quickFilter]);

  // Get week days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

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
  const { nextDayWasteEvents, daysUntilCollection } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const wasteEvents = events.filter(e =>
      e.calendarId === 'calendar.basildon_council' &&
      e.start >= tomorrow
    ).sort((a, b) => a.start - b.start);

    const nextWasteCollection = wasteEvents[0];
    const nextCollectionDay = nextWasteCollection?.start;
    const nextDayWasteEvents = wasteEvents.filter(e =>
      nextCollectionDay && isSameDay(e.start, nextCollectionDay)
    );

    const daysUntilCollection = nextWasteCollection
      ? Math.ceil((nextWasteCollection.start - today) / (1000 * 60 * 60 * 24))
      : null;

    return { nextDayWasteEvents, daysUntilCollection };
  }, [events]);

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

      {/* Search and Filter */}
      <div className="mb-6">
        <EventSearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          quickFilter={quickFilter}
          onQuickFilterChange={setQuickFilter}
        />
      </div>

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
                  fontSize: '15px',
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
              fontSize: '14px',
              fontWeight: 700,
              padding: '0 18px',
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
              fontSize: '14px',
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

          <div style={{ fontSize: '13px', fontWeight: 700, minWidth: '140px', textAlign: 'center', lineHeight: '1.3' }}>
            {dateLabel.split(' • ').map((part, i) => (
              <div key={i}>{part}</div>
            ))}
          </div>

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
                isEventOnDay(event, day)
              ).sort((a, b) => a.start - b.start);
              const dayKey = format(day, 'yyyy-MM-dd');

              return (
                <DayCard
                  key={day.toISOString()}
                  day={day}
                  events={dayEvents}
                  weather={weather.forecastByDate[dayKey]}
                  onEventClick={handleEventClick}
                />
              );
            })}
          </div>

          {/* Week 2 */}
          <div className="grid grid-cols-7" style={{ gap: '4px', width: '100%' }}>
            {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i + 7)).map(day => {
              const dayEvents = filteredEvents.filter(event =>
                isEventOnDay(event, day)
              ).sort((a, b) => a.start - b.start);
              const dayKey = format(day, 'yyyy-MM-dd');

              return (
                <DayCard
                  key={day.toISOString()}
                  day={day}
                  events={dayEvents}
                  weather={weather.forecastByDate[dayKey]}
                  onEventClick={handleEventClick}
                  showRelativeLabel={false}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-7" style={{ gap: '4px', width: '100%' }}>
          {weekDays.map(day => {
            const dayEvents = filteredEvents.filter(event =>
              isEventOnDay(event, day)
            ).sort((a, b) => a.start - b.start);
            const dayKey = format(day, 'yyyy-MM-dd');

            return (
              <DayCard
                key={day.toISOString()}
                day={day}
                events={dayEvents}
                weather={weather.forecastByDate[dayKey]}
                onEventClick={handleEventClick}
              />
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
