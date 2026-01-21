import { useState } from 'react';
import { Modal, ModalFooter } from '../../common/Modal';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { deleteCalendarEvent } from '../../../services/calendar-service';

/**
 * DeleteConfirmDialog Component
 * Confirmation dialog for deleting calendar events
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onConfirm - Confirm handler (called after successful deletion)
 * @param {Object} props.event - Event to delete
 */
export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  event,
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!event) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      // Extract UID from event
      // Event IDs are in format: "calendar.xxx-start-title"
      // But we need the actual UID from the calendar
      // For now, we'll use the event's uid property if available
      const uid = event.uid || event.id;

      await deleteCalendarEvent(event.calendarId, uid);

      onConfirm?.();
      onClose();
    } catch (err) {
      console.error('Failed to delete event:', err);
      setError(err.message || 'Failed to delete event. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatEventDetails = () => {
    if (event.allDay) {
      return format(event.start, 'EEEE, MMMM d, yyyy');
    } else {
      return `${format(event.start, 'EEEE, MMMM d, yyyy')} at ${format(event.start, 'h:mm a')}`;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Event"
      size="md"
      closeOnOverlay={!isDeleting}
    >
      <div className="space-y-4">
        {/* Warning Icon */}
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-[var(--color-error)]" />
          </div>
        </div>

        {/* Warning Message */}
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--color-text)] mb-2">
            Are you sure you want to delete this event?
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            This action cannot be undone.
          </p>
        </div>

        {/* Event Details */}
        <div className="bg-[var(--color-background)] rounded-lg p-4 border border-[var(--color-border)]">
          <p className="font-semibold text-[var(--color-text)] mb-1">
            {event.title}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {formatEventDetails()}
          </p>
          {event.location && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              📍 {event.location}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)] rounded-lg">
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <ModalFooter>
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-background)] rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-error)] hover:bg-[var(--color-error-dark)] rounded-lg transition-colors disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : 'Delete Event'}
        </button>
      </ModalFooter>
    </Modal>
  );
}
