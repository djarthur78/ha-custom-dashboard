/**
 * TodoItem Component
 * Single todo item row — large touch targets for wall panel use
 * Parses "Daz: " / "Nic: " prefix for person badge
 */

import { Circle, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { parsePerson, PERSON_COLORS } from './todoUtils';

export function TodoItem({ item, onToggle, onEdit, onDelete }) {
  const isCompleted = item.status === 'completed';
  const { person, text } = parsePerson(item.summary);

  const formatDue = (due) => {
    if (!due) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(due + 'T00:00:00');
    dueDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Overdue', style: 'overdue' };
    if (diffDays === 0) return { label: 'Today', style: 'today' };
    if (diffDays === 1) return { label: 'Tomorrow', style: 'upcoming' };
    return {
      label: dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      style: 'upcoming',
    };
  };

  const due = formatDue(item.due);

  const dueStyles = {
    overdue: { backgroundColor: 'rgba(196,99,106,0.12)', color: '#c4636a' },
    today: { backgroundColor: 'rgba(181,69,58,0.10)', color: 'var(--ds-accent)' },
    upcoming: { backgroundColor: 'rgba(0,0,0,0.04)', color: 'var(--ds-text-secondary)' },
  };

  return (
    <div
      className="flex items-center gap-3 px-4 transition-colors hover:bg-black/[0.02]"
      style={{
        minHeight: 52,
        borderBottom: '1px solid var(--ds-border)',
        opacity: isCompleted ? 0.55 : 1,
      }}
    >
      {/* Checkbox — large tap target */}
      <button
        onClick={() => onToggle(item.uid, isCompleted)}
        className="flex-shrink-0 flex items-center justify-center"
        style={{ width: 40, height: 40 }}
        aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
      >
        {isCompleted ? (
          <CheckCircle2 size={24} style={{ color: 'var(--ds-state-on)' }} />
        ) : (
          <Circle size={24} style={{ color: '#c0bbb8' }} />
        )}
      </button>

      {/* Person badge */}
      {person && (
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold"
          style={{
            width: 28,
            height: 28,
            backgroundColor: PERSON_COLORS[person].bg,
            color: PERSON_COLORS[person].text,
          }}
        >
          {person[0]}
        </div>
      )}

      {/* Summary + description */}
      <div className="flex-1 min-w-0 py-2">
        <span
          className={`text-sm font-medium ${isCompleted ? 'line-through' : ''}`}
          style={{ color: isCompleted ? 'var(--ds-text-secondary)' : 'var(--ds-text)' }}
        >
          {text}
        </span>
        {item.description && (
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--ds-text-secondary)' }}>
            {item.description}
          </p>
        )}
      </div>

      {/* Due date badge */}
      {due && (
        <span
          className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={dueStyles[due.style]}
        >
          {due.label}
        </span>
      )}

      {/* Action buttons — decent tap targets */}
      {!isCompleted && (
        <button
          onClick={() => onEdit(item)}
          className="flex-shrink-0 flex items-center justify-center rounded-lg transition-colors hover:bg-black/[0.05]"
          style={{ width: 36, height: 36 }}
          aria-label="Edit item"
        >
          <Pencil size={16} style={{ color: 'var(--ds-text-secondary)' }} />
        </button>
      )}
      <button
        onClick={() => onDelete(item.uid)}
        className="flex-shrink-0 flex items-center justify-center rounded-lg transition-colors hover:bg-black/[0.05]"
        style={{ width: 36, height: 36 }}
        aria-label="Delete item"
      >
        <Trash2 size={16} style={{ color: 'var(--ds-text-secondary)' }} />
      </button>
    </div>
  );
}

export default TodoItem;
