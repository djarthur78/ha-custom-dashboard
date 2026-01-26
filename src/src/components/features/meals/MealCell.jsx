/**
 * MealCell Component
 * Editable cell for a single meal entry
 * Touch-optimized for wall panel with improved styling
 */

import { useState, useRef, useEffect } from 'react';

const MEAL_COLORS = {
  breakfast: '#FF6B35',
  lunch: '#4ECDC4',
  dinner: '#9B59B6',
  cakes: '#E91E63',
};

export function MealCell({ value, onSave, isLoading, mealType, isToday }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  const mealColor = MEAL_COLORS[mealType] || '#4ECDC4';

  const handleClick = () => {
    if (!isLoading && !isSaving) {
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
        style={{
          width: '100%',
          height: '100%',
          minHeight: '60px',
          padding: '12px 16px',
          fontSize: '15px',
          fontWeight: '500',
          border: `3px solid ${mealColor}`,
          borderRadius: '8px',
          outline: 'none',
          backgroundColor: 'white',
          color: '#2c3e50',
          boxShadow: `0 0 0 3px ${mealColor}33`,
        }}
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '60px',
        padding: '12px 16px',
        fontSize: '15px',
        fontWeight: '500',
        cursor: 'pointer',
        border: '2px solid transparent',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
        backgroundColor: isToday && value ? `${mealColor}15` : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isLoading && !isSaving) {
          e.currentTarget.style.backgroundColor = `${mealColor}20`;
          e.currentTarget.style.borderColor = `${mealColor}40`;
          e.currentTarget.style.transform = 'scale(1.02)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isToday && value ? `${mealColor}15` : 'transparent';
        e.currentTarget.style.borderColor = 'transparent';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {isLoading ? (
        <span style={{ color: '#999', fontStyle: 'italic' }}>Loading...</span>
      ) : isSaving ? (
        <span style={{ color: mealColor, fontWeight: '600' }}>Saving...</span>
      ) : value ? (
        <span style={{ color: '#2c3e50', lineHeight: '1.4' }}>{value}</span>
      ) : (
        <span style={{ color: '#aaa', fontStyle: 'italic' }}>Tap to add...</span>
      )}
    </div>
  );
}

export default MealCell;
