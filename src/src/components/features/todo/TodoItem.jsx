/**
 * TodoItem Component
 * Single todo item row with checkbox, text, due date, and action buttons
 */

import { Circle, CheckCircle2, Pencil, Trash2 } from 'lucide-react';

export function TodoItem({ item, onToggle, onEdit, onDelete }) {
  const isCompleted = item.status === 'completed';

  const formatDue = (due) => {
    if (!due) return null;
    const date = new Date(due + 'T00:00:00');
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.02]"
      style={{ borderBottom: '1px solid var(--ds-border)' }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.uid, isCompleted)}
        className="flex-shrink-0 p-0.5"
        aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
      >
        {isCompleted ? (
          <CheckCircle2 size={22} style={{ color: 'var(--ds-state-on)' }} />
        ) : (
          <Circle size={22} style={{ color: 'var(--ds-text-secondary)' }} />
        )}
      </button>

      {/* Summary text */}
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm ${isCompleted ? 'line-through' : ''}`}
          style={{ color: isCompleted ? 'var(--ds-text-secondary)' : 'var(--ds-text)' }}
        >
          {item.summary}
        </span>
        {item.description && (
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--ds-text-secondary)' }}>
            {item.description}
          </p>
        )}
      </div>

      {/* Due date badge */}
      {item.due && (
        <span
          className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: 'rgba(181,69,58,0.08)',
            color: 'var(--ds-accent)',
          }}
        >
          {formatDue(item.due)}
        </span>
      )}

      {/* Action buttons */}
      {!isCompleted && (
        <button
          onClick={() => onEdit(item)}
          className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-black/[0.05]"
          aria-label="Edit item"
        >
          <Pencil size={16} style={{ color: 'var(--ds-text-secondary)' }} />
        </button>
      )}
      <button
        onClick={() => onDelete(item.uid)}
        className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-black/[0.05]"
        aria-label="Delete item"
      >
        <Trash2 size={16} style={{ color: 'var(--ds-text-secondary)' }} />
      </button>
    </div>
  );
}

export default TodoItem;
