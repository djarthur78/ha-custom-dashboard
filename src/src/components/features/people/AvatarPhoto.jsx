import { useState } from 'react';
import { getHAConfig } from '../../../utils/ha-config';

/**
 * Avatar Photo Component
 * Shows person photo from HA or fallback to colored initials
 */
export function AvatarPhoto({ entityPicture, fallbackInitial, color, size = 56 }) {
  const [imageError, setImageError] = useState(false);

  const showInitials = !entityPicture || imageError;

  if (showInitials) {
    return (
      <div
        className="rounded-full flex items-center justify-center font-bold text-white"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color,
          fontSize: `${size * 0.4}px`
        }}
      >
        {fallbackInitial}
      </div>
    );
  }

  const imageUrl = `${getHAConfig({ useProxy: true }).url}${entityPicture}`;

  return (
    <img
      src={imageUrl}
      alt="Avatar"
      className="rounded-full object-cover"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `2px solid ${color}`
      }}
      onError={() => setImageError(true)}
    />
  );
}
