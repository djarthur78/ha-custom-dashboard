/**
 * TodoEditModal Component
 * Modal for editing an existing todo item — summary, description, due date, person
 */

import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../../common/Modal';
import { parsePerson, buildSummary, PERSON_COLORS } from './todoUtils';

const PEOPLE = [null, 'Daz', 'Nic'];

export function TodoEditModal({ item, isOpen, onClose, onSave }) {
  const [text, setText] = useState('');
  const [person, setPerson] = useState(null);
  const [description, setDescription] = useState('');
  const [due, setDue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      const parsed = parsePerson(item.summary);
      setText(parsed.text);
      setPerson(parsed.person);
      setDescription(item.description || '');
      setDue(item.due || '');
    }
  }, [item]);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      const newSummary = buildSummary(trimmed, person);
      const changes = {};
      if (newSummary !== item.summary) changes.rename = newSummary;
      if (description.trim() !== (item.description || '')) changes.description = description.trim();
      if (due !== (item.due || '')) changes.due = due || undefined;

      if (Object.keys(changes).length > 0) {
        await onSave(item.uid, changes);
      }
      onClose();
    } catch {
      // Error handled by hook
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Item" size="sm">
      <div className="space-y-4" onKeyDown={handleKeyDown}>
        {/* Person assignment */}
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--ds-text-secondary)' }}>
            Assigned to
          </label>
          <div className="flex gap-2">
            {PEOPLE.map((p) => (
              <button
                key={p || 'none'}
                onClick={() => setPerson(p)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={
                  person === p
                    ? p
                      ? { backgroundColor: PERSON_COLORS[p].bg, color: PERSON_COLORS[p].text }
                      : { backgroundColor: 'var(--ds-accent)', color: 'white' }
                    : { backgroundColor: 'rgba(0,0,0,0.04)', color: 'var(--ds-text-secondary)' }
                }
              >
                {p ? (
                  <>
                    <span
                      className="flex items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        width: 22,
                        height: 22,
                        backgroundColor: person === p ? 'rgba(255,255,255,0.25)' : PERSON_COLORS[p].bg,
                        color: person === p ? 'inherit' : PERSON_COLORS[p].text,
                      }}
                    >
                      {p[0]}
                    </span>
                    {p}
                  </>
                ) : (
                  'Shared'
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--ds-text-secondary)' }}>
            What needs doing?
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full text-sm rounded-lg p-2.5 outline-none"
            style={{
              color: 'var(--ds-text)',
              border: '1px solid var(--ds-border)',
              backgroundColor: 'var(--color-background)',
            }}
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--ds-text-secondary)' }}>
            Notes
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full text-sm rounded-lg p-2.5 outline-none resize-none"
            style={{
              color: 'var(--ds-text)',
              border: '1px solid var(--ds-border)',
              backgroundColor: 'var(--color-background)',
            }}
          />
        </div>

        {/* Due date */}
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--ds-text-secondary)' }}>
            Due date
          </label>
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="w-full text-sm rounded-lg p-2.5 outline-none"
            style={{
              color: 'var(--ds-text)',
              border: '1px solid var(--ds-border)',
              backgroundColor: 'var(--color-background)',
            }}
          />
        </div>
      </div>

      <ModalFooter>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          style={{ color: 'var(--ds-text-secondary)' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!text.trim() || saving}
          className="px-5 py-2 text-sm font-semibold rounded-lg text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'var(--ds-accent)' }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </ModalFooter>
    </Modal>
  );
}

export default TodoEditModal;
