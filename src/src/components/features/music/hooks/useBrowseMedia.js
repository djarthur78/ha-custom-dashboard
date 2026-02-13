/**
 * useBrowseMedia Hook
 * Browses Spotify playlists via HA's media_player/browse_media WebSocket command.
 *
 * How it works:
 * 1. Browse the Sonos speaker's root media → find Spotify account entry
 * 2. Drill into Spotify library → find "Playlists" category
 * 3. Drill into Playlists → return actual user playlists with thumbnails
 * 4. Each playlist has: title, thumbnail, media_content_id, can_play
 *
 * NOTE: The Spotify entity (media_player.spotify_*) does NOT support browse_media.
 * We must browse through a Sonos speaker entity instead.
 */

import { useState, useCallback, useRef } from 'react';
import haWebSocket from '../../../../services/ha-websocket';

export function useBrowseMedia() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Stack for back navigation: [{ entityId, title, items }]
  const [history, setHistory] = useState([]);

  // Cache the Spotify library path so we don't re-discover it every time
  const spotifyCacheRef = useRef(null);

  /**
   * Raw browse: send a browse_media WebSocket message and return the result.
   * Does NOT update component state (used internally for chaining).
   */
  const rawBrowse = useCallback(async (entityId, mediaContentType, mediaContentId) => {
    const msg = {
      type: 'media_player/browse_media',
      entity_id: entityId,
    };
    if (mediaContentType) msg.media_content_type = mediaContentType;
    if (mediaContentId) msg.media_content_id = mediaContentId;
    return haWebSocket.send(msg);
  }, []);

  /**
   * Browse media on a given entity and update state.
   */
  const browse = useCallback(async (entityId, mediaContentType, mediaContentId) => {
    if (!entityId) return null;

    setLoading(true);
    setError(null);

    try {
      const result = await rawBrowse(entityId, mediaContentType, mediaContentId);
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
  }, [rawBrowse]);

  /**
   * Auto-navigate to Spotify playlists through the Sonos speaker browse tree.
   * Chain: Speaker root → Spotify library → Playlists category → Playlist items
   * Sets up history so user can navigate back to library categories.
   */
  const browseToPlaylists = useCallback(async (speakerEntityId) => {
    if (!speakerEntityId) return;

    setLoading(true);
    setError(null);

    try {
      let spotifyEntry = spotifyCacheRef.current;
      let libraryCategories = null;

      // Step 1: Find Spotify entry (use cache if available)
      if (!spotifyEntry) {
        const root = await rawBrowse(speakerEntityId);
        if (!root?.children) {
          throw new Error('Could not browse speaker media');
        }
        spotifyEntry = root.children.find(
          (c) => c.media_content_type?.startsWith('spotify://')
        );
        if (!spotifyEntry) {
          throw new Error('No Spotify account linked to this speaker');
        }
        spotifyCacheRef.current = spotifyEntry;
      }

      // Step 2: Browse Spotify library to get categories
      const library = await rawBrowse(
        speakerEntityId,
        spotifyEntry.media_content_type,
        spotifyEntry.media_content_id
      );
      libraryCategories = library?.children || [];

      // Step 3: Find "Playlists" and browse into it
      const playlistsEntry = libraryCategories.find(
        (c) => c.title === 'Playlists' || c.media_content_type?.includes('current_user_playlists')
      );

      if (!playlistsEntry) {
        // No playlists category found, show library categories instead
        setHistory([]);
        setTitle(library.title || 'Spotify Library');
        setItems(libraryCategories);
        setLoading(false);
        return;
      }

      const playlists = await rawBrowse(
        speakerEntityId,
        playlistsEntry.media_content_type,
        playlistsEntry.media_content_id
      );

      // Set up history so "Back" shows library categories
      setHistory([
        {
          entityId: speakerEntityId,
          title: spotifyEntry.title || 'Spotify Library',
          items: libraryCategories,
        },
      ]);

      setTitle(playlists.title || 'Playlists');
      setItems(playlists.children || []);
      setLoading(false);
    } catch (err) {
      console.error('[useBrowseMedia] Failed to load playlists:', err);
      setError(err.message);
      setItems([]);
      setLoading(false);
    }
  }, [rawBrowse]);

  /**
   * Browse into a child item (e.g. click a category to see its contents).
   * Pushes the current view onto the history stack for back navigation.
   */
  const browseInto = useCallback(async (entityId, item) => {
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

  /**
   * Reset browse state (used when switching tabs).
   */
  const reset = useCallback(() => {
    setItems([]);
    setTitle('');
    setHistory([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    items,
    title,
    loading,
    error,
    browse,
    browseToPlaylists,
    browseInto,
    goBack,
    reset,
    canGoBack: history.length > 0,
  };
}
