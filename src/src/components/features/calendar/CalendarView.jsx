/**
 * CalendarView Component
 * Main calendar feature with week/month/day views and inline editing
 */

import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addWeeks, subWeeks, startOfDay, endOfDay, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, List, Grid, Square } from 'lucide-react';
import { PageContainer } from '../../layout/PageContainer';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { useHAConnection } from '../../../hooks/useHAConnection';
import { fetchAllCalendarEvents } from '../../../services/calendar-service';
import { getEventStyle } from '../../../constants/colors';
import { useCalendarPreferences } from '../../../hooks/useCalendarPreferences';
import { EventModal } from './EventModal';
import { EventDetailModal } from './EventDetailModal';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { MonthView } from './MonthView';
import { DayView } from './DayView';
import { enGB } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar.css';

// Configure date-fns localizer
const locales = {
  'en-GB': enGB,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// All calendar entity IDs with friendly names
const CALENDARS = [
  { id: 'calendar.99swanlane_gmail_com', name: '99 Swan Lane', shortName: '99' },
  { id: 'calendar.arthurdarren_gmail_com', name: 'Daz', shortName: 'D' },
  { id: 'calendar.nicholaarthur_gmail_com', name: 'Nic', shortName: 'N' },
  { id: 'calendar.arthurcerys_gmail_com', name: 'Cerys', shortName: 'C' },
  { id: 'calendar.arthurdexter08_gmail_com', name: 'Dex', shortName: 'D' },
  { id: 'calendar.birthdays', name: 'Birthdays', shortName: 'B' },
  { id: 'calendar.holidays_in_the_united_kingdom', name: 'UK Holidays', shortName: 'UK' },
  { id: 'calendar.basildon_council', name: 'Basildon', shortName: 'BC' },
];

const CALENDAR_IDS = CALENDARS.map(c => c.id);

// Custom event component to show time range
function CustomEvent({ event }) {
  const startTime = format(event.start, 'HH:mm');
  const endTime = format(event.end, 'HH:mm');

  return (
    <div className="flex flex-col h-full justify-center px-1">
      <div className="font-semibold text-xs leading-tight">{event.title}</div>
      {!event.allDay && (
        <div className="text-xs opacity-80 mt-0.5">
          {startTime} - {endTime}
        </div>
      )}
    </div>
  );
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useHAConnection();

  // Calendar preferences (persistent)
  const {
    selectedCalendars,
    viewMode,
    setViewMode,
    toggleCalendar,
    defaultCalendar,
  } = useCalendarPreferences();

  // Modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEventDate, setNewEventDate] = useState(null);

  // Fetch events for current period (adjusted based on view mode)
  const fetchEvents = useCallback(async () => {
    if (!isConnected) return;

    setLoading(true);
    try {
      let startDate, endDate;

      if (viewMode === 'month') {
        // Fetch entire month
        startDate = startOfDay(startOfMonth(currentDate));
        endDate = endOfDay(endOfMonth(currentDate));
      } else if (viewMode === 'day') {
        // Fetch single day
        startDate = startOfDay(currentDate);
        endDate = endOfDay(currentDate);
      } else {
        // Week view (default)
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
        startDate = startOfDay(weekStart);
        endDate = endOfDay(addDays(weekStart, 6)); // Sunday
      }

      // Fetch events from all calendars
      const calendarEvents = await fetchAllCalendarEvents(
        CALENDAR_IDS,
        startDate,
        endDate
      );

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate, isConnected, viewMode]);

  // Fetch events when date or connection changes
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

  // Event handlers
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
    // Refresh events after save
    fetchEvents();
  };

  const handleEventDeleted = () => {
    // Refresh events after delete
    fetchEvents();
  };

  // Filter events by selected calendars
  const filteredEvents = events.filter(event => selectedCalendars.includes(event.calendarId));

  // Event style customization
  const eventStyleGetter = (event) => {
    const style = getEventStyle(event.calendarId);
    return {
      style: {
        ...style,
        borderRadius: '4px',
        padding: '2px 5px',
        border: `1px solid ${style.borderColor}`,
      },
    };
  };

  // Week range display
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const weekLabel = `${format(weekStart, 'd MMM')} - ${format(weekEnd, 'd MMM yyyy')}`;

  if (!isConnected) {
    return (
      <PageContainer title="Calendar">
        <div className="text-center py-12 text-[var(--color-text-secondary)]">
          Connecting to Home Assistant...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Family Calendar"
      subtitle="View all family calendars in one place"
      maxWidth="max-w-full"
    >
      {/* Top Bar: View Switcher + Calendar Filters + Add Button */}
      <div className="mb-4 flex items-center justify-between gap-4">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 bg-[var(--color-surface)] rounded-lg p-1 border border-[var(--color-border)]">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
              viewMode === 'day'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text)] hover:bg-[var(--color-background)]'
            }`}
            title="Day view"
          >
            <Square className="w-4 h-4" />
            <span className="text-sm font-medium">Day</span>
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
              viewMode === 'week'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text)] hover:bg-[var(--color-background)]'
            }`}
            title="Week view"
          >
            <List className="w-4 h-4" />
            <span className="text-sm font-medium">Week</span>
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
              viewMode === 'month'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text)] hover:bg-[var(--color-background)]'
            }`}
            title="Month view"
          >
            <Grid className="w-4 h-4" />
            <span className="text-sm font-medium">Month</span>
          </button>
        </div>

        {/* Calendar Filters */}
        <div className="flex items-center gap-3">
          {CALENDARS.map(calendar => {
            const colors = getEventStyle(calendar.id);
            const isEnabled = selectedCalendars.includes(calendar.id);

            return (
              <button
                key={calendar.id}
                onClick={() => toggleCalendar(calendar.id)}
                className="flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: isEnabled ? colors.backgroundColor : '#1a1a1a',
                  color: isEnabled ? colors.color : '#666',
                  border: `2px solid ${isEnabled ? colors.borderColor : '#333'}`,
                  opacity: isEnabled ? 1 : 0.5,
                }}
                title={calendar.name}
                aria-label={`Toggle ${calendar.name} calendar`}
              >
                {calendar.shortName}
              </button>
            );
          })}
        </div>

        {/* Add Event Button */}
        <button
          onClick={() => handleAddEvent(currentDate)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Event
        </button>
      </div>

      {/* Navigation Bar */}
      <div className="mb-6 flex items-center justify-between bg-[var(--color-surface)] p-4 rounded-lg border border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            className="p-2 hover:bg-[var(--color-surface-variant)] rounded transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={handleToday}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-primary-dark)] transition-colors font-medium"
          >
            Today
          </button>

          <button
            onClick={handleNext}
            className="p-2 hover:bg-[var(--color-surface-variant)] rounded transition-colors"
            aria-label="Next week"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="flex items-center gap-2 text-lg font-semibold">
          <CalendarIcon size={20} />
          <span>{weekLabel}</span>
        </div>
      </div>

      {/* Calendar Views */}
      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-4" style={{ height: '700px' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner message="Loading calendar events..." />
          </div>
        ) : (
          <>
            {viewMode === 'month' && (
              <MonthView
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                events={filteredEvents}
                onEventClick={handleEventClick}
                onAddEvent={handleAddEvent}
                selectedCalendars={selectedCalendars}
              />
            )}

            {viewMode === 'day' && (
              <DayView
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                events={filteredEvents}
                onEventClick={handleEventClick}
                onAddEvent={handleAddEvent}
                selectedCalendars={selectedCalendars}
              />
            )}

            {viewMode === 'week' && (
              <Calendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                defaultView="week"
                view="week"
                date={currentDate}
                onNavigate={setCurrentDate}
                onSelectEvent={handleEventClick}
                onSelectSlot={(slotInfo) => handleAddEvent(slotInfo.start)}
                selectable
                toolbar={false}
                eventPropGetter={eventStyleGetter}
                components={{
                  event: CustomEvent,
                }}
                formats={{
                  weekdayFormat: (date, culture, localizer) =>
                    localizer.format(date, 'EEE', culture),
                  dayFormat: (date, culture, localizer) =>
                    localizer.format(date, 'd MMM', culture),
                }}
                min={new Date(2024, 0, 1, 7, 0, 0)}  // 7 AM
                max={new Date(2024, 0, 1, 22, 0, 0)} // 10 PM
              />
            )}
          </>
        )}
      </div>

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
        initialCalendar={defaultCalendar}
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
    </PageContainer>
  );
}

export default CalendarView;
