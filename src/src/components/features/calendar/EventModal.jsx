import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../../common/Modal';
import { Calendar, Clock, MapPin, AlignLeft, User, Repeat } from 'lucide-react';
import { format, addHours } from 'date-fns';
import { createCalendarEvent, updateCalendarEvent, parseNaturalLanguage } from '../../../services/calendar-service';
import { CALENDAR_COLORS } from '../../../constants/colors';

// Only writable calendars (excluding read-only: Family, UK Holidays, Basildon)
const CALENDAR_OPTIONS = [
  { id: 'calendar.arthurdarren_gmail_com', name: 'Daz', color: CALENDAR_COLORS['calendar.arthurdarren_gmail_com']?.primary || '#2962FF' },
  { id: 'calendar.nicholaarthur_gmail_com', name: 'Nic', color: CALENDAR_COLORS['calendar.nicholaarthur_gmail_com']?.primary || '#F4A6B8' },
  { id: 'calendar.arthurcerys_gmail_com', name: 'Cerys', color: CALENDAR_COLORS['calendar.arthurcerys_gmail_com']?.primary || '#9DB8A0' },
  { id: 'calendar.arthurdexter08_gmail_com', name: 'Dex', color: CALENDAR_COLORS['calendar.arthurdexter08_gmail_com']?.primary || '#FFB703' },
  { id: 'calendar.birthdays', name: 'Birthdays', color: CALENDAR_COLORS['calendar.birthdays']?.primary || '#fd79a8' },
];

/**
 * EventModal Component
 * Form for creating and editing calendar events
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSave - Save handler
 * @param {Object} props.event - Existing event for edit mode (null for create)
 * @param {Date} props.initialDate - Default date for new events
 * @param {string} props.initialCalendar - Default calendar for new events
 */
export function EventModal({
  isOpen,
  onClose,
  onSave,
  event = null,
  initialDate = new Date(),
  initialCalendar = 'calendar.arthurdarren_gmail_com',
}) {
  const isEditMode = !!event;

  // Helper to round time to nearest hour with :00 minutes
  const roundToHour = (date) => {
    const rounded = new Date(date);
    rounded.setMinutes(0);
    rounded.setSeconds(0);
    rounded.setMilliseconds(0);
    return rounded;
  };

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    calendar: initialCalendar,
    startDate: format(initialDate, 'yyyy-MM-dd'),
    startTime: format(roundToHour(initialDate), 'HH:mm'),
    endDate: format(initialDate, 'yyyy-MM-dd'),
    endTime: format(addHours(roundToHour(initialDate), 1), 'HH:mm'),
    allDay: false,
    location: '',
    description: '',
    recurring: false,
    recurrenceRule: 'FREQ=WEEKLY',
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [naturalInput, setNaturalInput] = useState('');

  // Initialize form with event data in edit mode
  useEffect(() => {
    if (event) {
      const start = new Date(event.start);
      const end = new Date(event.end);

      setFormData({
        title: event.title || '',
        calendar: event.calendarId || initialCalendar,
        startDate: format(start, 'yyyy-MM-dd'),
        startTime: format(start, 'HH:mm'),
        endDate: format(end, 'yyyy-MM-dd'),
        endTime: format(end, 'HH:mm'),
        allDay: event.allDay || false,
        location: event.location || '',
        description: event.description || '',
        recurring: false,
        recurrenceRule: 'FREQ=WEEKLY',
      });
    } else {
      // Reset for new event with :00 minutes
      const roundedStart = roundToHour(initialDate);
      const roundedEnd = addHours(roundedStart, 1);

      setFormData({
        title: '',
        calendar: initialCalendar,
        startDate: format(initialDate, 'yyyy-MM-dd'),
        startTime: format(roundedStart, 'HH:mm'),
        endDate: format(initialDate, 'yyyy-MM-dd'),
        endTime: format(roundedEnd, 'HH:mm'),
        allDay: false,
        location: '',
        description: '',
        recurring: false,
        recurrenceRule: 'FREQ=WEEKLY',
      });
    }
    setErrors({});
    setNaturalInput('');
  }, [event, initialDate, initialCalendar, isOpen]);

  // Handle natural language parsing
  const handleNaturalInput = (input) => {
    setNaturalInput(input);

    if (!input.trim()) return;

    const parsed = parseNaturalLanguage(input);

    // Update form fields based on parsed data
    if (parsed.summary) {
      setFormData(prev => ({
        ...prev,
        title: parsed.summary.replace(/\s+(today|tomorrow|at|next week|\d{1,2}:\d{2}|am|pm)/gi, '').trim(),
      }));
    }

    if (parsed.date) {
      setFormData(prev => ({
        ...prev,
        startDate: format(parsed.date, 'yyyy-MM-dd'),
        endDate: format(parsed.date, 'yyyy-MM-dd'),
      }));
    }

    if (parsed.hours !== undefined) {
      const timeStr = `${String(parsed.hours).padStart(2, '0')}:${String(parsed.minutes || 0).padStart(2, '0')}`;
      setFormData(prev => ({
        ...prev,
        startTime: timeStr,
        endTime: format(addHours(new Date(`2000-01-01T${timeStr}`), 1), 'HH:mm'),
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.calendar) {
      newErrors.calendar = 'Calendar is required';
    }

    // Validate end time is after start time
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (endDateTime <= startDateTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);

    try {
      const startDateTime = formData.allDay
        ? formData.startDate
        : `${formData.startDate}T${formData.startTime}:00`;

      const endDateTime = formData.allDay
        ? formData.endDate
        : `${formData.endDate}T${formData.endTime}:00`;

      const eventData = {
        summary: formData.title,
        dtstart: startDateTime,
        dtend: endDateTime,
        description: formData.description,
        location: formData.location,
      };

      // Add recurrence rule if recurring is enabled
      if (formData.recurring && formData.recurrenceRule) {
        eventData.rrule = formData.recurrenceRule;
      }

      if (isEditMode && event.uid) {
        await updateCalendarEvent(formData.calendar, event.uid, eventData);
      } else {
        await createCalendarEvent(formData.calendar, eventData);
      }

      onSave?.();
      onClose();
    } catch (error) {
      console.error('Failed to save event:', error);
      setErrors({ submit: error.message || 'Failed to save event' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle quick duration buttons
  const handleQuickDuration = (hours) => {
    if (hours === 'allday') {
      setFormData(prev => ({ ...prev, allDay: true }));
    } else {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = addHours(startDateTime, hours);

      setFormData(prev => ({
        ...prev,
        allDay: false,
        endDate: format(endDateTime, 'yyyy-MM-dd'),
        endTime: format(endDateTime, 'HH:mm'),
      }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Event' : 'New Event'}
      size="lg"
    >
      <div className="space-y-4">
        {/* Natural Language Input (Create mode only) */}
        {!isEditMode && (
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              Quick Add (try: "Lunch tomorrow at noon")
            </label>
            <input
              type="text"
              value={naturalInput}
              onChange={(e) => handleNaturalInput(e.target.value)}
              placeholder="Type naturally..."
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
            <AlignLeft className="inline w-4 h-4 mr-1" />
            Event Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="What's the event?"
            className={`w-full px-3 py-2 bg-[var(--color-background)] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
              errors.title ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'
            }`}
          />
          {errors.title && (
            <p className="text-sm text-[var(--color-error)] mt-1">{errors.title}</p>
          )}
        </div>

        {/* Calendar Selection */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
            <User className="inline w-4 h-4 mr-1" />
            Calendar *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CALENDAR_OPTIONS.map(cal => (
              <button
                key={cal.id}
                type="button"
                onClick={() => handleChange('calendar', cal.id)}
                className={`px-3 py-2 rounded-lg border-2 transition-colors ${
                  formData.calendar === cal.id
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                }`}
                style={{
                  borderLeftColor: formData.calendar === cal.id ? cal.color : undefined,
                  borderLeftWidth: formData.calendar === cal.id ? '4px' : undefined,
                }}
              >
                <span className="text-sm font-medium">{cal.name}</span>
              </button>
            ))}
          </div>
          {errors.calendar && (
            <p className="text-sm text-[var(--color-error)] mt-1">{errors.calendar}</p>
          )}
        </div>

        {/* Quick Duration Buttons */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
            <Clock className="inline w-4 h-4 mr-1" />
            Duration
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickDuration(1)}
              className="flex-1 px-4 py-2 text-sm font-medium border-2 border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
            >
              1 hour
            </button>
            <button
              type="button"
              onClick={() => handleQuickDuration(2)}
              className="flex-1 px-4 py-2 text-sm font-medium border-2 border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
            >
              2 hours
            </button>
            <button
              type="button"
              onClick={() => handleQuickDuration('allday')}
              className="flex-1 px-4 py-2 text-sm font-medium border-2 border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
            >
              All day
            </button>
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          {/* Start */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              <Calendar className="inline w-4 h-4 mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            {!formData.allDay && (
              <>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1 mt-2">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </>
            )}
          </div>

          {/* End */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              <Calendar className="inline w-4 h-4 mr-1" />
              End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            {!formData.allDay && (
              <>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1 mt-2">
                  <Clock className="inline w-4 h-4 mr-1" />
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                  className={`w-full px-3 py-2 bg-[var(--color-background)] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
                    errors.endTime ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'
                  }`}
                />
                {errors.endTime && (
                  <p className="text-sm text-[var(--color-error)] mt-1">{errors.endTime}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Recurring */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="recurring"
              checked={formData.recurring}
              onChange={(e) => handleChange('recurring', e.target.checked)}
              className="w-4 h-4 rounded border-[var(--color-border)]"
            />
            <label htmlFor="recurring" className="text-sm font-medium text-[var(--color-text)]">
              <Repeat className="inline w-4 h-4 mr-1" />
              Repeat weekly
            </label>
          </div>
          {formData.recurring && (
            <div className="ml-6 p-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-text-secondary)]">
                This event will repeat every week on {format(new Date(`${formData.startDate}T${formData.startTime || '00:00'}`), 'EEEE')}
              </p>
            </div>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
            <MapPin className="inline w-4 h-4 mr-1" />
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="Add a location"
            className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Add notes or details"
            rows={3}
            className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
          />
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)] rounded-lg">
            <p className="text-sm text-[var(--color-error)]">{errors.submit}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <ModalFooter>
        <button
          onClick={onClose}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-background)] rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-lg transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : isEditMode ? 'Update Event' : 'Create Event'}
        </button>
      </ModalFooter>
    </Modal>
  );
}
