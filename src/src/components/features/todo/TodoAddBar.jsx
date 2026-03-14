/**
 * TodoAddBar Component
 * Always-visible input bar for quickly adding todo items
 */

import { useState, useRef } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';

export function TodoAddBar({ onAdd }) {
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = async () => {
    const trimmed = summary.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      await onAdd(trimmed, description.trim() || undefined);
      setSummary('');
      setDescription('');
      setShowDescription(false);
      inputRef.current?.focus();
    } catch {
      // Error handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="ds-card" style={{ padding: '12px 16px' }}>
      <div className="flex items-center gap-2">
        {/* Description toggle */}
        <button
          onClick={() => setShowDescription(!showDescription)}
          className="flex-shrink-0 p-1 rounded-lg transition-colors hover:bg-black/[0.05]"
          aria-label="Toggle description"
        >
          {showDescription ? (
            <ChevronUp size={18} style={{ color: 'var(--ds-text-secondary)' }} />
          ) : (
            <ChevronDown size={18} style={{ color: 'var(--ds-text-secondary)' }} />
          )}
        </button>

        {/* Summary input */}
        <input
          ref={inputRef}
          type="text"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add item..."
          className="flex-1 text-sm bg-transparent outline-none"
          style={{ color: 'var(--ds-text)' }}
          disabled={submitting}
        />

        {/* Add button */}
        <button
          onClick={handleSubmit}
          disabled={!summary.trim() || submitting}
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
          style={{ backgroundColor: 'var(--ds-accent)', color: 'white' }}
          aria-label="Add item"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Expandable description */}
      {showDescription && (
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Description (optional)"
          rows={2}
          className="w-full mt-2 text-xs bg-transparent outline-none resize-none rounded-lg p-2"
          style={{
            color: 'var(--ds-text-secondary)',
            border: '1px solid var(--ds-border)',
          }}
        />
      )}
    </div>
  );
}

export default TodoAddBar;
