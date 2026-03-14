/**
 * TodoEditModal Component
 * Modal for editing an existing todo item's summary, description, and due date
 */

import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../../common/Modal';

export function TodoEditModal({ item, isOpen, onClose, onSave }) {
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [due, setDue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setSummary(item.summary || '');
      setDescription(item.description || '');
      setDue(item.due || '');
    }
  }, [item]);

  const handleSave = async () => {
    const trimmed = summary.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      const changes = {};
      if (trimmed !== item.summary) changes.rename = trimmed;
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
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ds-text-secondary)' }}>
            Summary
          </label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full text-sm rounded-lg p-2 outline-none"
            style={{
              color: 'var(--ds-text)',
              border: '1px solid var(--ds-border)',
              backgroundColor: 'var(--color-background)',
            }}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ds-text-secondary)' }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full text-sm rounded-lg p-2 outline-none resize-none"
            style={{
              color: 'var(--ds-text)',
              border: '1px solid var(--ds-border)',
              backgroundColor: 'var(--color-background)',
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ds-text-secondary)' }}>
            Due Date
          </label>
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="w-full text-sm rounded-lg p-2 outline-none"
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
          className="px-4 py-2 text-sm rounded-lg transition-colors"
          style={{ color: 'var(--ds-text-secondary)' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!summary.trim() || saving}
          className="px-4 py-2 text-sm rounded-lg text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'var(--ds-accent)' }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </ModalFooter>
    </Modal>
  );
}

export default TodoEditModal;
