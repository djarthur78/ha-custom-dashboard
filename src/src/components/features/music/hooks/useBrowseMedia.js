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
  // Stack for back navigation: [{ entityId, title, items, currentItem }]
  const [history, setHistory] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);

  // Cache Spotify entries per account so we don't re-discover every time
  // Map of spotifyEntityId → spotify browse entry
  const spotifyCacheRef = useRef({});

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
      setCurrentItem({
        media_content_id: result.media_content_id,
        media_content_type: result.media_content_type,
        can_play: result.can_play,
        title: result.title,
      });
      setLoading(false);
      return result;
    } catch (err) {
      console.error('[useBrowseMedia] Browse failed:', err);
      setError(err.message);
      setItems([]);
      setCurrentItem(null);
      setLoading(false);
      return null;
    }
  }, [rawBrowse]);

  /**
   * Auto-navigate to a Spotify category through the Sonos speaker browse tree.
   * Chain: Speaker root → Spotify library → Target category → Items
   * Sets up history so user can navigate back to library categories.
   *
   * @param {string} speakerEntityId - The Sonos speaker to browse through
   * @param {string} [spotifyEntityId] - Optional Spotify entity ID to match the correct account
   * @param {string} [targetCategory='Playlists'] - Category name to auto-navigate to
   */
  const browseToPlaylists = useCallback(async (speakerEntityId, spotifyEntityId, targetCategory = 'Playlists') => {
    if (!speakerEntityId) return;

    setLoading(true);
    setError(null);

    try {
      const cacheKey = spotifyEntityId || '_default';
      let spotifyEntry = spotifyCacheRef.current[cacheKey];
      let libraryCategories = null;

      // Step 1: Find the correct Spotify entry (use cache if available)
      if (!spotifyEntry) {
        const root = await rawBrowse(speakerEntityId);
        if (!root?.children) {
          throw new Error('Could not browse speaker media');
        }

        // Find all Spotify entries
        const spotifyEntries = root.children.filter(
          (c) => c.media_content_type?.startsWith('spotify://')
        );

        if (spotifyEntries.length === 0) {
          throw new Error('No Spotify account linked to this speaker');
        }

        // Match by entity ID if provided (e.g. media_content_id contains the entity name)
        if (spotifyEntityId && spotifyEntries.length > 1) {
          const entityName = spotifyEntityId.split('.').pop(); // e.g. "spotify_nic"
          spotifyEntry = spotifyEntries.find(
            (c) => c.media_content_id?.includes(entityName) ||
                   c.title?.toLowerCase().includes(entityName.replace('spotify_', ''))
          ) || spotifyEntries[0];
        } else {
          spotifyEntry = spotifyEntries[0];
        }

        spotifyCacheRef.current[cacheKey] = spotifyEntry;
      }

      // Step 2: Browse Spotify library to get categories
      const library = await rawBrowse(
        speakerEntityId,
        spotifyEntry.media_content_type,
        spotifyEntry.media_content_id
      );
      libraryCategories = library?.children || [];

      // Step 3: Find target category and browse into it
      const targetEntry = libraryCategories.find(
        (c) => c.title === targetCategory
      );

      if (!targetEntry) {
        // Target category not found, show library categories instead
        setHistory([]);
        setTitle(library.title || 'Spotify Library');
        setItems(libraryCategories);
        setLoading(false);
        return;
      }

      const result = await rawBrowse(
        speakerEntityId,
        targetEntry.media_content_type,
        targetEntry.media_content_id
      );

      // Set up history so "Back" shows library categories
      setHistory([
        {
          entityId: speakerEntityId,
          title: spotifyEntry.title || 'Spotify Library',
          items: libraryCategories,
          currentItem: null,
        },
      ]);

      setTitle(result.title || targetCategory);
      setItems(result.children || []);
      // Store currentItem so "Replace Playlist" works for non-playlist categories
      setCurrentItem(result.can_play ? {
        media_content_id: result.media_content_id,
        media_content_type: result.media_content_type,
        can_play: result.can_play,
        title: result.title,
      } : null);
      setLoading(false);
    } catch (err) {
      console.error('[useBrowseMedia] Failed to load category:', err);
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
    setHistory((prev) => [...prev, { entityId, title, items, currentItem }]);
    return browse(entityId, item.media_content_type, item.media_content_id);
  }, [browse, title, items, currentItem]);

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
      setCurrentItem(last.currentItem || null);
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
    setCurrentItem(null);
    setError(null);
    setLoading(false);
    spotifyCacheRef.current = {};
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
    currentItem,
    canGoBack: history.length > 0,
  };
}
