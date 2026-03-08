/**
 * MobileCalendarPage
 * Day list view default, compact controls, person filters
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format, addDays, subDays, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { MobilePageContainer } from '../../components/mobile/MobilePageContainer';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useHAConnection } from '../../hooks/useHAConnection';
import { fetchAllCalendarEvents } from '../../services/calendar-service';
import { getCalendarColor } from '../../constants/colors';
import { CALENDAR_IDS, PERSON_CALENDARS } from '../../constants/calendars';
import { DayListView } from '../../components/features/calendar/DayListView';
import { MonthView } from '../../components/features/calendar/MonthView';
import { EventModal } from '../../components/features/calendar/EventModal';
import { EventDetailModal } from '../../components/features/calendar/EventDetailModal';
import { DeleteConfirmDialog } from '../../components/features/calendar/DeleteConfirmDialog';

export function MobileCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('day'); // 'day' or 'month'
  const [enabledCalendars, setEnabledCalendars] = useState(new Set(CALENDAR_IDS));
  const { isConnected } = useHAConnection();
  const hasLoadedOnce = useRef(false);

  // Modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEventDate, setNewEventDate] = useState(null);

  // Touch swipe state
  const touchStartX = useRef(null);

  const fetchEvents = useCallback(async () => {
    if (!isConnected) return;
    if (!hasLoadedOnce.current) setLoading(true);
    try {
      const start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      const end = addDays(start, 30);
      end.setHours(23, 59, 59, 999);

      const calendarEvents = await fetchAllCalendarEvents(CALENDAR_IDS, start, end);
      setEvents(calendarEvents);
      hasLoadedOnce.current = true;
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate, isConnected]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isConnected, fetchEvents]);

  const handlePrevious = () => {
    if (view === 'day') setCurrentDate(prev => subDays(prev, 1));
    else setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNext = () => {
    if (view === 'day') setCurrentDate(prev => addDays(prev, 1));
    else setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const toggleCalendar = (calendarId) => {
    setEnabledCalendars(prev => {
      const newSet = new Set(prev);
      if (newSet.has(calendarId)) newSet.delete(calendarId);
      else newSet.add(calendarId);
      return newSet;
    });
  };

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

  const filteredEvents = useMemo(() =>
    events.filter(event => enabledCalendars.has(event.calendarId)),
    [events, enabledCalendars]
  );

  const dateLabel = view === 'day'
    ? format(currentDate, 'EEE, d MMM')
    : format(currentDate, 'MMMM yyyy');

  // Touch handlers for day swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || view !== 'day') return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 60) {
      if (delta > 0) handlePrevious();
      else handleNext();
    }
    touchStartX.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <MobilePageContainer>
        {/* Controls Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button onClick={handlePrevious} className="p-1.5 rounded-full" style={{ backgroundColor: '#efefef' }}>
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: '#efefef' }}
            >
              Today
            </button>
            <button onClick={handleNext} className="p-1.5 rounded-full" style={{ backgroundColor: '#efefef' }}>
              <ChevronRight size={18} />
            </button>
          </div>

          <span className="text-sm font-bold">{dateLabel}</span>

          <div className="flex items-center gap-2">
            <select
              value={view}
              onChange={(e) => setView(e.target.value)}
              className="text-xs font-semibold rounded-lg px-2 py-1"
              style={{ backgroundColor: '#efefef', border: 'none' }}
            >
              <option value="day">Day</option>
              <option value="month">Month</option>
            </select>
            <button
              onClick={() => handleAddEvent(currentDate)}
              className="p-1.5 rounded-full"
              style={{ backgroundColor: 'var(--ds-accent)', color: 'white' }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Person Filters - horizontal scroll */}
        <div className="flex gap-1.5 overflow-x-auto pb-3" style={{ WebkitOverflowScrolling: 'touch' }}>
          {PERSON_CALENDARS.map(calendar => {
            const colors = getCalendarColor(calendar.id);
            const isEnabled = enabledCalendars.has(calendar.id);
            return (
              <button
                key={calendar.id}
                onClick={() => toggleCalendar(calendar.id)}
                className="flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-extrabold"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: isEnabled ? colors.primary : '#e6e6e6',
                  color: isEnabled ? 'white' : '#999',
                }}
              >
                {calendar.shortName}
              </button>
            );
          })}
        </div>

        {/* Calendar View */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner message="Loading..." />
          </div>
        ) : view === 'day' ? (
          <DayListView
            currentDate={currentDate}
            events={filteredEvents}
            onEventClick={handleEventClick}
            selectedCalendars={Array.from(enabledCalendars)}
          />
        ) : (
          <MonthView
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            events={filteredEvents}
            onEventClick={handleEventClick}
            onAddEvent={handleAddEvent}
            selectedCalendars={Array.from(enabledCalendars)}
          />
        )}
      </MobilePageContainer>

      {/* Modals */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => { setIsEventModalOpen(false); setSelectedEvent(null); setNewEventDate(null); }}
        onSave={() => fetchEvents()}
        event={selectedEvent}
        initialDate={newEventDate || currentDate}
        initialCalendar="calendar.arthurdarren_gmail_com"
      />
      <EventDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setSelectedEvent(null); }}
        event={selectedEvent}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => { setIsDeleteDialogOpen(false); setSelectedEvent(null); }}
        onConfirm={() => fetchEvents()}
        event={selectedEvent}
      />
    </div>
  );
}

export default MobileCalendarPage;
