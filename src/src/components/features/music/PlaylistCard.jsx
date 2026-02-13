/**
 * PlaylistCard Component
 * Displays a single Spotify playlist/album/category as a clickable card with cover art.
 *
 * Touch-friendly design:
 * - Tapping the card PLAYS the item (if can_play is true)
 * - For non-playable folders (categories), tapping browses into them
 * - Play button is always visible (not hover-only) for touch devices
 *
 * Props:
 * - item: Object from browse_media result { title, thumbnail, media_content_id, media_content_type, can_play, can_expand }
 * - onPlay: Function(media_content_id, media_content_type), called when user clicks to play
 * - onBrowse: Function(item), called for non-playable expandable items (categories/folders)
 */

import { Music, Play, FolderOpen } from 'lucide-react';
import { useState } from 'react';

export function PlaylistCard({ item, onPlay, onBrowse }) {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    if (item.can_play) {
      onPlay(item.media_content_id, item.media_content_type);
    } else if (onBrowse) {
      onBrowse(item);
    }
  };

  return (
    <div
      className="bg-[var(--color-surface)] rounded-lg overflow-hidden cursor-pointer
                 hover:shadow-md active:scale-[0.98] transition-all group"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
      onClick={handleClick}
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
            {item.can_play ? (
              <Music size={32} className="text-gray-400" />
            ) : (
              <FolderOpen size={32} className="text-gray-400" />
            )}
          </div>
        )}

        {/* Play badge - always visible for playable items */}
        {item.can_play && (
          <div
            className="absolute bottom-2 right-2 p-2 bg-[var(--color-primary)] text-white
                       rounded-full shadow-lg"
          >
            <Play size={14} fill="currentColor" />
          </div>
        )}
      </div>

      {/* Title */}
      <div className="p-2.5">
        <h4 className="text-sm font-semibold text-[var(--color-text)] truncate leading-tight">
          {item.title}
        </h4>
      </div>
    </div>
  );
}
