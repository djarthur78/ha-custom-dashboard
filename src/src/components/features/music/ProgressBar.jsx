/**
 * ProgressBar Component
 * Seekable progress bar that shows track position with smooth animation.
 * Click anywhere on the bar to seek to that position.
 */

import { useRef } from 'react';

// Format seconds as m:ss
function formatTime(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ProgressBar({ currentPosition, duration, onSeek }) {
  const barRef = useRef(null);

  if (!duration) return null;

  const progress = Math.min((currentPosition / duration) * 100, 100);
  const remaining = duration - currentPosition;

  const handleClick = (e) => {
    if (!barRef.current || !onSeek) return;
    const rect = barRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const seekPosition = Math.max(0, Math.min(percentage * duration, duration));
    onSeek(seekPosition);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Elapsed time */}
      <span className="text-xs font-medium text-[var(--color-text-secondary)] min-w-[3ch] text-right">
        {formatTime(currentPosition)}
      </span>

      {/* Progress bar (clickable) */}
      <div
        ref={barRef}
        onClick={handleClick}
        className="flex-1 h-2 bg-gray-200 rounded-full cursor-pointer relative group"
      >
        {/* Filled portion */}
        <div
          className="absolute top-0 left-0 h-full bg-[var(--color-primary)] rounded-full transition-none"
          style={{ width: `${progress}%` }}
        />
        {/* Thumb (visible on hover) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--color-primary)] rounded-full
                     opacity-0 group-hover:opacity-100 transition-opacity shadow"
          style={{ left: `${progress}%`, marginLeft: '-6px' }}
        />
      </div>

      {/* Remaining time */}
      <span className="text-xs font-medium text-[var(--color-text-secondary)] min-w-[4ch]">
        -{formatTime(remaining)}
      </span>
    </div>
  );
}
