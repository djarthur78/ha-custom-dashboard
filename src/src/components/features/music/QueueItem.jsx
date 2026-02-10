/**
 * QueueItem Component
 * A single track row in the queue/playlist view.
 *
 * Props:
 * - position: Number, track position in queue
 * - title: String, track name
 * - artist: String, artist name
 * - duration: Number, track duration in seconds (optional)
 * - isCurrentTrack: Boolean, true if this is the currently playing track
 */

export function QueueItem({ position, title, artist, duration, isCurrentTrack }) {
  const formatDuration = (secs) => {
    if (!secs) return '';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        isCurrentTrack
          ? 'bg-blue-50 border border-blue-200'
          : 'hover:bg-gray-50'
      }`}
    >
      {/* Track number */}
      <span className={`text-sm min-w-[2ch] text-right ${
        isCurrentTrack ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-text-secondary)]'
      }`}>
        {position}
      </span>

      {/* Title + Artist */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm truncate ${
          isCurrentTrack ? 'font-semibold text-[var(--color-text)]' : 'text-[var(--color-text)]'
        }`}>
          {title || 'Unknown Track'}
        </div>
        {artist && (
          <div className="text-xs text-[var(--color-text-secondary)] truncate">
            {artist}
          </div>
        )}
      </div>

      {/* Duration */}
      {duration && (
        <span className="text-xs text-[var(--color-text-secondary)] flex-shrink-0">
          {formatDuration(duration)}
        </span>
      )}
    </div>
  );
}
