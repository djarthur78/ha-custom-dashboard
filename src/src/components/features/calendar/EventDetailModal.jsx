import { Modal, ModalFooter } from '../../common/Modal';
import { Calendar, Clock, MapPin, AlignLeft, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { CALENDAR_COLORS, CALENDAR_NAMES } from '../../../constants/calendars';

/**
 * EventDetailModal Component
 * Quick view of event details with edit/delete actions
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.event - Event to display
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 */
export function EventDetailModal({
  isOpen,
  onClose,
  event,
  onEdit,
  onDelete,
}) {
  if (!event) return null;

  const calendarColor = CALENDAR_COLORS[event.calendarId]?.primary || '#666666';
  const calendarName = CALENDAR_NAMES[event.calendarId] || event.calendarId;

  const formatEventTime = () => {
    if (event.allDay) {
      if (format(event.start, 'yyyy-MM-dd') === format(event.end, 'yyyy-MM-dd')) {
        return format(event.start, 'EEEE, MMMM d, yyyy');
      } else {
        return `${format(event.start, 'MMM d')} - ${format(event.end, 'MMM d, yyyy')}`;
      }
    } else {
      if (format(event.start, 'yyyy-MM-dd') === format(event.end, 'yyyy-MM-dd')) {
        return `${format(event.start, 'EEEE, MMMM d, yyyy')} • ${format(event.start, 'h:mm a')} - ${format(event.end, 'h:mm a')}`;
      } else {
        return `${format(event.start, 'MMM d, h:mm a')} - ${format(event.end, 'MMM d, h:mm a')}`;
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Event Details"
      size="md"
    >
      <div className="space-y-4">
        {/* Event Title with Calendar Color */}
        <div className="flex items-start gap-3">
          <div
            className="w-1 h-full rounded-full"
            style={{ backgroundColor: calendarColor }}
          />
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-[var(--color-text)] mb-1">
              {event.title}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {calendarName}'s Calendar
            </p>
          </div>
        </div>

        {/* Date and Time */}
        <div className="flex items-start gap-3">
          {event.allDay ? (
            <Calendar className="w-5 h-5 text-[var(--color-text-secondary)] mt-0.5" />
          ) : (
            <Clock className="w-5 h-5 text-[var(--color-text-secondary)] mt-0.5" />
          )}
          <div>
            <p className="text-sm text-[var(--color-text)]">
              {formatEventTime()}
            </p>
            {event.allDay && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                All day event
              </p>
            )}
          </div>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[var(--color-text-secondary)] mt-0.5" />
            <div>
              <p className="text-sm text-[var(--color-text)]">
                {event.location}
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--color-primary)] hover:underline"
              >
                View on Google Maps
              </a>
            </div>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className="flex items-start gap-3">
            <AlignLeft className="w-5 h-5 text-[var(--color-text-secondary)] mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          </div>
        )}

        {/* No additional details message */}
        {!event.location && !event.description && (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              No additional details for this event
            </p>
          </div>
        )}
      </div>

      {/* Footer with Actions */}
      <ModalFooter>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-background)] rounded-lg transition-colors"
        >
          Close
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => {
              onClose();
              onDelete?.(event);
            }}
            className="px-4 py-2 text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit?.(event);
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-lg transition-colors flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
