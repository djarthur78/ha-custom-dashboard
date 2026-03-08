/**
 * PlaylistPanel Component
 * Center panel (35%) — Spotify playlist browser with account tabs + queue view.
 *
 * Two modes:
 * 1. Playlists: Auto-fetched from Spotify via Sonos speaker browse_media
 * 2. Queue: Show what's coming up on the active speaker with upcoming tracks
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Music, ChevronLeft, ListMusic, Library, RefreshCw, SkipForward, Play, FolderOpen } from 'lucide-react';
import { useBrowseMedia } from './hooks/useBrowseMedia';
import { SPOTIFY_ACCOUNTS } from './musicConfig';
import haWebSocket from '../../../services/ha-websocket';

// Load play history from localStorage
function loadPlayHistory() {
  try {
    return JSON.parse(localStorage.getItem('music-play-history') || '{}');
  } catch { return {}; }
}

function savePlayHistory(history) {
  localStorage.setItem('music-play-history', JSON.stringify(history));
}

// Sort items by last played timestamp (most recent first), unplayed items keep original order
function sortByLastPlayed(items, playHistory) {
  return [...items].sort((a, b) => {
    const aTime = playHistory[a.media_content_id] || 0;
    const bTime = playHistory[b.media_content_id] || 0;
    if (aTime && bTime) return bTime - aTime;
    if (aTime) return -1;
    if (bTime) return 1;
    return 0;
  });
}

export function PlaylistPanel({ activeSpeaker, onPlayMedia, onNextTrack }) {
  const [activeTab, setActiveTab] = useState('daz'); // 'daz' | 'nic' | 'queue'
  const { items, title, loading, error, browseToPlaylists, browseInto, goBack, reset, canGoBack, currentItem } =
    useBrowseMedia();
  const hasLoadedRef = useRef(false);
  const lastSpeakerRef = useRef(null);

  // Track the last played playlist so Queue view can show upcoming tracks
  const [lastPlayedPlaylist, setLastPlayedPlaylist] = useState(null);
  // Pre-fetched track list for the queue (fetched at play time, not in QueueView)
  const [lastPlayedTracks, setLastPlayedTracks] = useState([]);

  // Play history for sorting playlists by last played
  const [playHistory, setPlayHistory] = useState(loadPlayHistory);

  const activeAccount = SPOTIFY_ACCOUNTS.find((a) => a.id === activeTab);

  // Auto-load Spotify playlists when the Daz tab is active
  useEffect(() => {
    if (activeTab === 'queue' || !activeSpeaker?.entityId) return;
    if (activeAccount && !activeAccount.entityId) return;

    const speakerChanged = lastSpeakerRef.current !== activeSpeaker.entityId;
    if (hasLoadedRef.current && !speakerChanged) return;

    hasLoadedRef.current = true;
    lastSpeakerRef.current = activeSpeaker.entityId;
    browseToPlaylists(activeSpeaker.entityId, activeAccount?.entityId, activeAccount?.defaultCategory);
  }, [activeTab, activeSpeaker?.entityId, activeAccount, browseToPlaylists]);

  // Reset when switching tabs
  useEffect(() => {
    hasLoadedRef.current = false;
    reset();
  }, [activeTab, reset]);

  const playingRef = useRef(false);
  const handlePlayPlaylist = async (mediaContentId, mediaContentType) => {
    if (!activeSpeaker || playingRef.current) return;
    playingRef.current = true;

    // Instant UI feedback
    setLastPlayedPlaylist({ id: mediaContentId, type: mediaContentType });
    const updated = { ...playHistory, [mediaContentId]: Date.now() };
    setPlayHistory(updated);
    savePlayHistory(updated);

    // Fire play command (don't await - let it go)
    onPlayMedia(activeSpeaker.entityId, mediaContentId, mediaContentType);

    // Pre-fetch the playlist's track list for the Queue view (background)
    try {
      const result = await haWebSocket.send({
        type: 'media_player/browse_media',
        entity_id: activeSpeaker.entityId,
        media_content_type: mediaContentType,
        media_content_id: mediaContentId,
      });
      setLastPlayedTracks(result.children || []);
    } catch (err) {
      console.warn('[PlaylistPanel] Could not pre-fetch tracks:', err);
      setLastPlayedTracks([]);
    }
    playingRef.current = false;
  };

  // IMPORTANT: Always browse using the Sonos speaker entity (not Spotify entity)
  const handleBrowseInto = (item) => {
    if (activeSpeaker?.entityId) {
      browseInto(activeSpeaker.entityId, item);
    }
  };

  return (
    <div
      className="ds-card h-full flex flex-col overflow-hidden"
      style={{ padding: 0 }}
    >
      {/* Tab Bar */}
      <div className="flex border-b border-[var(--color-border)] flex-shrink-0">
        {SPOTIFY_ACCOUNTS.map((account) => (
          <button
            key={account.id}
            onClick={() => setActiveTab(account.id)}
            className="flex-1 px-4 py-3.5 text-base font-medium transition-colors"
            style={activeTab === account.id
              ? { color: 'var(--ds-accent)', borderBottom: '2px solid var(--ds-accent)' }
              : { color: 'var(--ds-text-secondary)' }
            }
          >
            <Library size={18} className="inline mr-1.5 -mt-0.5" />
            {account.label}
          </button>
        ))}

        {/* Queue tab */}
        <button
          onClick={() => setActiveTab('queue')}
          className="flex-1 px-4 py-3.5 text-base font-medium transition-colors"
          style={activeTab === 'queue'
            ? { color: 'var(--ds-accent)', borderBottom: '2px solid var(--ds-accent)' }
            : { color: 'var(--ds-text-secondary)' }
          }
        >
          <ListMusic size={18} className="inline mr-1.5 -mt-0.5" />
          Queue
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Queue View */}
        {activeTab === 'queue' && (
          <QueueView
            activeSpeaker={activeSpeaker}
            lastPlayedPlaylist={lastPlayedPlaylist}
            prefetchedTracks={lastPlayedTracks}
            onNextTrack={onNextTrack}
          />
        )}

        {/* Playlist Browser (Daz or Nic tab) */}
        {activeTab !== 'queue' && activeAccount && (
          <>
            {/* Account not set up */}
            {!activeAccount.entityId && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Music size={56} className="text-gray-300 mb-3" />
                <p className="text-lg text-[var(--color-text)] font-semibold mb-2">
                  {activeAccount.label}&apos;s Spotify not connected
                </p>
                <p className="text-base text-[var(--color-text-secondary)]">
                  Add {activeAccount.label}&apos;s Spotify integration in
                </p>
                <p className="text-base text-[var(--color-text-secondary)]">
                  HA Settings &rarr; Integrations &rarr; Add &rarr; Spotify
                </p>
              </div>
            )}

            {/* Loading */}
            {activeAccount.entityId && loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                <p className="text-base text-[var(--color-text-secondary)]">Loading playlists...</p>
              </div>
            )}

            {/* Error */}
            {activeAccount.entityId && error && !loading && (
              <div className="text-center py-12">
                <p className="text-lg font-semibold text-[var(--color-error)] mb-2">
                  Failed to load playlists
                </p>
                <p className="text-base text-[var(--color-text-secondary)] mt-1 mb-4">{error}</p>
                <button
                  onClick={() => browseToPlaylists(activeSpeaker?.entityId, activeAccount?.entityId, activeAccount?.defaultCategory)}
                  className="mt-3 px-5 py-2.5 text-base font-medium bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Playlist/Browse results */}
            {activeAccount.entityId && !loading && !error && (
              <>
                {/* Header with back button + title + refresh */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {canGoBack && (
                      <button
                        onClick={goBack}
                        className="flex items-center gap-1 text-base text-[var(--color-primary)]
                                   hover:underline font-medium"
                      >
                        <ChevronLeft size={18} />
                        Back
                      </button>
                    )}
                    {title && (
                      <h3 className="text-base font-semibold text-[var(--color-text)]">
                        {title}
                        {items.length > 0 && (
                          <span className="text-xs font-normal text-[var(--color-text-secondary)] ml-1.5">
                            ({items.length})
                          </span>
                        )}
                      </h3>
                    )}
                  </div>
                  <button
                    onClick={() => browseToPlaylists(activeSpeaker?.entityId, activeAccount?.entityId, activeAccount?.defaultCategory)}
                    className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]
                               hover:bg-gray-100 rounded-lg transition-colors"
                    title="Refresh playlists"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>

                {/* Replace Playlist button for non-playlist browse views */}
                {currentItem && currentItem.can_play && title !== 'Playlists' && (
                  <button
                    onClick={() => handlePlayPlaylist(currentItem.media_content_id, currentItem.media_content_type)}
                    className="w-full mb-3 flex items-center justify-center gap-2 py-3 px-4 rounded-lg
                               text-base font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: 'var(--ds-accent)' }}
                  >
                    <Play size={18} fill="white" />
                    Replace Playlist
                  </button>
                )}

                {/* Playlist list */}
                <div className="flex flex-col gap-2">
                  {sortByLastPlayed(items, playHistory).map((item, idx) => {
                    const isPlaylistsView = title === 'Playlists';
                    return (
                      <PlaylistListItem
                        key={item.media_content_id || idx}
                        item={item}
                        isPlaying={lastPlayedPlaylist?.id === item.media_content_id}
                        onPlay={handlePlayPlaylist}
                        onBrowse={item.can_expand && (!item.can_play || !isPlaylistsView) ? handleBrowseInto : undefined}
                      />
                    );
                  })}
                </div>

                {items.length === 0 && (
                  <div className="text-center py-12">
                    <Music size={48} className="text-gray-300 mb-3 mx-auto" />
                    <p className="text-base text-[var(--color-text-secondary)]">
                      No playlists found
                    </p>
                    <button
                      onClick={() => browseToPlaylists(activeSpeaker?.entityId, activeAccount?.entityId, activeAccount?.defaultCategory)}
                      className="mt-4 px-4 py-2 text-base font-medium bg-[var(--color-primary)]
                                 text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Reload
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * PlaylistListItem - horizontal row format for playlist items
 */
function PlaylistListItem({ item, isPlaying, onPlay, onBrowse }) {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    if (onBrowse) {
      onBrowse(item);
    } else if (item.can_play) {
      onPlay(item.media_content_id, item.media_content_type);
    }
  };

  return (
    <div
      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all active:scale-[0.98]"
      style={isPlaying
        ? { backgroundColor: 'var(--ds-accent)', color: 'white' }
        : undefined
      }
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
        {item.thumbnail && !imageError ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {item.can_play ? (
              <Music size={18} className="text-gray-400" />
            ) : (
              <FolderOpen size={18} className="text-gray-400" />
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <span
        className="text-sm font-medium flex-1 truncate"
        style={{ color: isPlaying ? 'white' : 'var(--color-text)' }}
      >
        {item.title}
      </span>

      {/* Play button */}
      {item.can_play && (
        <div
          className="p-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: isPlaying ? 'rgba(255,255,255,0.2)' : 'rgba(159,86,68,0.1)' }}
        >
          <Play size={14} fill={isPlaying ? 'white' : 'var(--ds-accent)'} style={{ color: isPlaying ? 'white' : 'var(--ds-accent)' }} />
        </div>
      )}
    </div>
  );
}

/**
 * Queue View - shows currently playing track, upcoming tracks, and queue position.
 * Fetches the playlist track list via browse_media to show what's coming next.
 */
function QueueView({ activeSpeaker, lastPlayedPlaylist, prefetchedTracks = [], onNextTrack }) {
  const [skipping, setSkipping] = useState(false);

  const isActive =
    activeSpeaker &&
    (activeSpeaker.state === 'playing' || activeSpeaker.state === 'paused');

  // Use pre-fetched tracks from when the playlist was played
  const tracks = prefetchedTracks;

  // Skip forward N tracks by calling next_track repeatedly
  const handleSkipTo = useCallback(
    async (skipsNeeded) => {
      if (!activeSpeaker?.entityId || !onNextTrack || skipping) return;
      setSkipping(true);
      try {
        for (let i = 0; i < skipsNeeded; i++) {
          onNextTrack(activeSpeaker.entityId); // fire-and-forget each skip
          // Small delay between calls so Sonos can process each one
          if (i < skipsNeeded - 1) {
            await new Promise((r) => setTimeout(r, 250));
          }
        }
        // Brief delay then clear skipping state
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error('[QueueView] Skip failed:', err);
      }
      setSkipping(false);
    },
    [activeSpeaker?.entityId, onNextTrack, skipping]
  );

  if (!isActive) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <ListMusic size={48} className="text-gray-300 mb-3" />
        <p className="text-base text-[var(--color-text-secondary)]">No queue</p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Play something to see the queue
        </p>
      </div>
    );
  }

  const isShuffled = activeSpeaker.shuffle;
  // Use playlist track count if available, otherwise fall back to Sonos queue info
  const playlistSize = tracks.length > 0 ? tracks.length : (activeSpeaker.queueSize || 0);

  // Find current track position in the pre-fetched playlist by matching title
  // (queuePosition from Sonos may include accumulated tracks from previous playlists)
  let currentIdx = -1;
  if (tracks.length > 0 && activeSpeaker.mediaTitle) {
    currentIdx = tracks.findIndex(t => t.title === activeSpeaker.mediaTitle);
  }

  const upcomingTracks =
    tracks.length > 0 && currentIdx >= 0
      ? (isShuffled ? tracks.filter((_, idx) => idx !== currentIdx) : tracks.slice(currentIdx + 1))
      : [];

  return (
    <div>
      <h3 className="text-base font-semibold text-[var(--color-text)] mb-3">
        Playing on {activeSpeaker.label}
        {playlistSize > 0 && ` \u2014 ${playlistSize} tracks`}
      </h3>

      {/* Current track */}
      <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: 'rgba(159,86,68,0.06)', borderLeft: '4px solid #9f5644' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-medium uppercase tracking-wider" style={{ color: '#9f5644' }}>
            Now Playing
          </div>
          {playlistSize > 1 && currentIdx >= 0 && (
            <div className="text-xs text-[var(--color-text-secondary)]">
              {currentIdx + 1} / {playlistSize} &middot; {playlistSize - currentIdx - 1} left
            </div>
          )}
        </div>
        <div className="text-base font-semibold text-[var(--color-text)] mb-1">
          {activeSpeaker.mediaTitle || 'Unknown Track'}
        </div>
        {activeSpeaker.mediaArtist && (
          <div className="text-sm text-[var(--color-text-secondary)]">
            {activeSpeaker.mediaArtist}
          </div>
        )}
        {activeSpeaker.mediaAlbumName && (
          <div className="text-xs text-[var(--color-text-secondary)] mt-1">
            {activeSpeaker.mediaAlbumName}
          </div>
        )}
        {/* Compact progress bar */}
        {playlistSize > 1 && currentIdx >= 0 && (
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ backgroundColor: '#9f5644', width: `${((currentIdx + 1) / playlistSize) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Upcoming tracks */}
      {upcomingTracks.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
            {isShuffled ? 'Remaining Tracks (shuffled)' : 'Up Next'}
          </h4>
          <div className="space-y-0.5">
            {upcomingTracks.map((track, idx) => (
              <button
                key={track.media_content_id || idx}
                onClick={() => handleSkipTo(idx + 1)}
                disabled={skipping}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50
                           active:bg-gray-100 transition-colors text-left disabled:opacity-50"
              >
                <span className="text-xs font-medium text-[var(--color-text-secondary)] w-5 text-center flex-shrink-0">
                  {isShuffled ? '·' : currentIdx + idx + 2}
                </span>
                {track.thumbnail ? (
                  <img
                    src={track.thumbnail}
                    alt=""
                    className="w-9 h-9 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Music size={12} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--color-text)] truncate">
                    {track.title}
                  </div>
                </div>
                <SkipForward size={12} className="text-[var(--color-text-secondary)] flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No track list available hint */}
      {upcomingTracks.length === 0 && isActive && (
        <div className="text-center py-6 text-sm text-[var(--color-text-secondary)]">
          <p>Play a playlist from the Daz or Nic tab to see upcoming tracks</p>
        </div>
      )}

      {/* Skipping indicator */}
      {skipping && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 z-50">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Skipping...
        </div>
      )}
    </div>
  );
}
