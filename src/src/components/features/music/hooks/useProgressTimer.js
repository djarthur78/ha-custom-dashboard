/**
 * useProgressTimer Hook
 * Computes real-time playback position using requestAnimationFrame.
 *
 * HA provides:
 * - media_position: The position (in seconds) at the time of the last state change
 * - media_position_updated_at: ISO timestamp of when media_position was last reported
 * - media_duration: Total track length in seconds
 *
 * We compute: currentPosition = media_position + (now - updated_at) / 1000
 * This gives a smooth progressing value between HA state updates.
 */

import { useState, useEffect, useRef } from 'react';

export function useProgressTimer(mediaPosition, mediaPositionUpdatedAt, mediaDuration, isPlaying) {
  const [currentPosition, setCurrentPosition] = useState(mediaPosition || 0);
  const rafRef = useRef(null);

  useEffect(() => {
    // When HA sends a new position, reset our local position
    if (mediaPosition !== null && mediaPosition !== undefined) {
      setCurrentPosition(mediaPosition);
    }
  }, [mediaPosition, mediaPositionUpdatedAt]);

  useEffect(() => {
    if (!isPlaying || !mediaPositionUpdatedAt || mediaDuration === null) {
      // Not playing — stop the timer
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const updatedAtMs = new Date(mediaPositionUpdatedAt).getTime();
    const basePosition = mediaPosition || 0;

    const tick = () => {
      const elapsed = (Date.now() - updatedAtMs) / 1000;
      const newPosition = Math.min(basePosition + elapsed, mediaDuration);
      setCurrentPosition(newPosition);

      if (newPosition < mediaDuration) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, mediaPosition, mediaPositionUpdatedAt, mediaDuration]);

  return currentPosition;
}
