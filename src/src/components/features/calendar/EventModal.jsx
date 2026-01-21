import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../../common/Modal';
import { Calendar, Clock, MapPin, AlignLeft, User } from 'lucide-react';
import { format, addHours } from 'date-fns';
import { createCalendarEvent, updateCalendarEvent, parseNaturalLanguage } from '../../../services/calendar-service';
import { CALENDAR_COLORS } from '../../../constants/colors';

const CALENDAR_OPTIONS = [
  { id: 'calendar.arthurdarren_gmail_com', name: 'Daz', color: CALENDAR_COLORS['calendar.arthurdarren_gmail_com']?.primary || '#2962FF' },
  { id: 'calendar.nicholaarthur_gmail_com', name: 'Nic', color: CALENDAR_COLORS['calendar.nicholaarthur_gmail_com']?.primary || '#F4A6B8' },
  { id: 'calendar.arthurcerys_gmail_com', name: 'Cerys', color: CALENDAR_COLORS['calendar.arthurcerys_gmail_com']?.primary || '#9DB8A0' },
  { id: 'calendar.arthurdexter08_gmail_com', name: 'Dex', color: CALENDAR_COLORS['calendar.arthurdexter08_gmail_com']?.primary || '#FFB703' },
  { id: 'calendar.99swanlane_gmail_com', name: 'Family', color: CALENDAR_COLORS['calendar.99swanlane_gmail_com']?.primary || '#4ecdc4' },
  { id: 'calendar.birthdays', name: 'Birthdays', color: CALENDAR_COLORS['calendar.birthdays']?.primary || '#fd79a8' },
  { id: 'calendar.holidays_in_the_united_kingdom', name: 'UK Holidays', color: CALENDAR_COLORS['calendar.holidays_in_the_united_kingdom']?.primary || '#74b9ff' },
  { id: 'calendar.basildon_council', name: 'Basildon', color: CALENDAR_COLORS['calendar.basildon_council']?.primary || '#fab1a0' },
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

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    calendar: initialCalendar,
    startDate: format(initialDate, 'yyyy-MM-dd'),
    startTime: format(initialDate, 'HH:mm'),
    endDate: format(initialDate, 'yyyy-MM-dd'),
    endTime: format(addHours(initialDate, 1), 'HH:mm'),
    allDay: false,
    location: '',
    description: '',
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
      });
    } else {
      // Reset for new event
      setFormData({
        title: '',
        calendar: initialCalendar,
        startDate: format(initialDate, 'yyyy-MM-dd'),
        startTime: format(initialDate, 'HH:mm'),
        endDate: format(initialDate, 'yyyy-MM-dd'),
        endTime: format(addHours(initialDate, 1), 'HH:mm'),
        allDay: false,
        location: '',
        description: '',
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

  // Handle all-day toggle
  const handleAllDayToggle = () => {
    setFormData(prev => ({ ...prev, allDay: !prev.allDay }));
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

        {/* All Day Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allDay"
            checked={formData.allDay}
            onChange={handleAllDayToggle}
            className="w-4 h-4 rounded border-[var(--color-border)]"
          />
          <label htmlFor="allDay" className="text-sm font-medium text-[var(--color-text)]">
            All day event
          </label>
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
