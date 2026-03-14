/**
 * TodoAddBar Component
 * Always-visible input bar with person assignment toggle
 */

import { useState, useRef } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { PERSON_COLORS, buildSummary } from './todoUtils';

const PEOPLE = [null, 'Daz', 'Nic'];

export function TodoAddBar({ onAdd }) {
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [person, setPerson] = useState(null);
  const [showDescription, setShowDescription] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  const cyclePerson = () => {
    const idx = PEOPLE.indexOf(person);
    setPerson(PEOPLE[(idx + 1) % PEOPLE.length]);
  };

  const handleSubmit = async () => {
    const trimmed = summary.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const fullSummary = buildSummary(trimmed, person);
      await onAdd(fullSummary, description.trim() || undefined);
      setSummary('');
      setDescription('');
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
    <div className="ds-card" style={{ padding: '10px 12px' }}>
      <div className="flex items-center gap-2">
        {/* Person toggle */}
        <button
          onClick={cyclePerson}
          className="flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold transition-all"
          style={{
            width: 32,
            height: 32,
            ...(person
              ? { backgroundColor: PERSON_COLORS[person].bg, color: PERSON_COLORS[person].text }
              : { backgroundColor: 'var(--ds-border)', color: 'var(--ds-text-secondary)' }),
          }}
          title={person ? `Assigned to ${person}` : 'Tap to assign (Daz/Nic)'}
        >
          {person ? person[0] : '?'}
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
          style={{ color: 'var(--ds-text)', height: 36 }}
          disabled={submitting}
        />

        {/* Description toggle */}
        <button
          onClick={() => setShowDescription(!showDescription)}
          className="flex-shrink-0 flex items-center justify-center rounded-lg transition-colors hover:bg-black/[0.05]"
          style={{ width: 32, height: 32 }}
          aria-label="Toggle description"
        >
          {showDescription ? (
            <ChevronUp size={16} style={{ color: 'var(--ds-text-secondary)' }} />
          ) : (
            <ChevronDown size={16} style={{ color: 'var(--ds-text-secondary)' }} />
          )}
        </button>

        {/* Add button */}
        <button
          onClick={handleSubmit}
          disabled={!summary.trim() || submitting}
          className="flex-shrink-0 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30"
          style={{ width: 36, height: 36, backgroundColor: 'var(--ds-accent)', color: 'white' }}
          aria-label="Add item"
        >
          <Plus size={20} />
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
