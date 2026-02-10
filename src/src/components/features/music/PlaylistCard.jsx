/**
 * PlaylistCard Component
 * Displays a single Spotify playlist as a clickable card with cover art.
 *
 * Props:
 * - item: Object from browse_media result { title, thumbnail, media_content_id, media_content_type, can_play }
 * - onPlay: Function(media_content_id, media_content_type), called when user clicks to play
 * - onBrowse: Function(item), called when user wants to see tracks inside (optional)
 */

import { Music, Play } from 'lucide-react';
import { useState } from 'react';

export function PlaylistCard({ item, onPlay, onBrowse }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="bg-[var(--color-surface)] rounded-lg overflow-hidden cursor-pointer
                 hover:shadow-md transition-shadow group"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
      onClick={() => onBrowse ? onBrowse(item) : onPlay(item.media_content_id, item.media_content_type)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square bg-gray-100">
        {item.thumbnail && !imageError ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
            <Music size={32} className="text-gray-400" />
          </div>
        )}

        {/* Play overlay on hover */}
        {item.can_play && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(item.media_content_id, item.media_content_type);
            }}
            className="absolute bottom-2 right-2 p-2 bg-[var(--color-primary)] text-white
                       rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                       shadow-lg hover:scale-105"
          >
            <Play size={16} fill="currentColor" />
          </button>
        )}
      </div>

      {/* Title */}
      <div className="p-3">
        <h4 className="text-base font-semibold text-[var(--color-text)] truncate leading-tight">
          {item.title}
        </h4>
      </div>
    </div>
  );
}
