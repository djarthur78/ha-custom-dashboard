/**
 * useBrowseMedia Hook
 * Browses Spotify playlists via HA's media_player/browse_media WebSocket command.
 *
 * How it works:
 * 1. Send: { type: 'media_player/browse_media', entity_id: 'media_player.spotify_djarthur78' }
 * 2. HA returns: { title: 'Spotify', children: [{ title: 'Playlists', children: [...] }, ...] }
 * 3. We drill into "Playlists" to get the user's playlist library
 * 4. Each playlist has: title, thumbnail, media_content_id (spotify:playlist:xxx), can_play
 */

import { useState, useCallback } from 'react';
import haWebSocket from '../../../../services/ha-websocket';

export function useBrowseMedia() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Stack for back navigation: [{ entityId, contentType, contentId, title }]
  const [history, setHistory] = useState([]);

  /**
   * Browse media on a given entity.
   * @param {string} entityId - The media_player entity to browse (e.g. 'media_player.spotify_djarthur78')
   * @param {string} [mediaContentType] - Content type filter (e.g. 'playlist', 'album')
   * @param {string} [mediaContentId] - Content ID to browse into (empty = root)
   */
  const browse = useCallback(async (entityId, mediaContentType, mediaContentId) => {
    if (!entityId) return null;

    setLoading(true);
    setError(null);

    try {
      const msg = {
        type: 'media_player/browse_media',
        entity_id: entityId,
      };
      // Only add these fields if they have values
      // (sending empty strings can cause errors on some integrations)
      if (mediaContentType) msg.media_content_type = mediaContentType;
      if (mediaContentId) msg.media_content_id = mediaContentId;

      const result = await haWebSocket.send(msg);

      setTitle(result.title || '');
      setItems(result.children || []);
      setLoading(false);
      return result;
    } catch (err) {
      console.error('[useBrowseMedia] Browse failed:', err);
      setError(err.message);
      setItems([]);
      setLoading(false);
      return null;
    }
  }, []);

  /**
   * Browse into a child item (e.g. click a playlist to see its tracks).
   * Pushes the current view onto the history stack for back navigation.
   */
  const browseInto = useCallback(async (entityId, item) => {
    // Save current state to history for back button
    setHistory((prev) => [...prev, { entityId, title, items }]);
    return browse(entityId, item.media_content_type, item.media_content_id);
  }, [browse, title, items]);

  /**
   * Go back to the previous browse level.
   */
  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const newHistory = [...prev];
      const last = newHistory.pop();
      setTitle(last.title);
      setItems(last.items);
      return newHistory;
    });
  }, []);

  return {
    items,        // Array of browseable items
    title,        // Current browse level title
    loading,
    error,
    browse,       // Browse root or specific content
    browseInto,   // Drill into a child item
    goBack,       // Go back one level
    canGoBack: history.length > 0,
  };
}
