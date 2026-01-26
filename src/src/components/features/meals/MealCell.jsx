/**
 * MealCell Component
 * Editable cell for a single meal entry
 * Touch-optimized for wall panel
 */

import { useState, useRef, useEffect } from 'react';

export function MealCell({ value, onSave, isLoading }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  const handleClick = () => {
    if (!isLoading && !isSaving) {
      // Initialize editValue when starting to edit
      setEditValue(value || '');
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (editValue !== value) {
      setIsSaving(true);
      const success = await onSave(editValue);
      setIsSaving(false);

      if (success) {
        setIsEditing(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value || '');
      setIsEditing(false);
    }
  };

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className="w-full h-full px-3 py-2 text-base border-2 border-blue-500 rounded-lg focus:outline-none focus:border-blue-600 bg-white text-gray-900"
        style={{
          minHeight: '44px',
        }}
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className="w-full h-full px-3 py-2 text-base cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
      style={{
        minHeight: '44px',
        border: '1px solid transparent',
      }}
    >
      {isLoading ? (
        <span className="text-gray-400">Loading...</span>
      ) : isSaving ? (
        <span className="text-blue-500">Saving...</span>
      ) : value ? (
        <span className="text-gray-900">{value}</span>
      ) : (
        <span className="text-gray-400 italic">Tap to add</span>
      )}
    </div>
  );
}

export default MealCell;
