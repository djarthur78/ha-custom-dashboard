/**
 * PlaylistPanel Component
 * Center panel (35%) — Spotify playlist browser with account tabs + queue view.
 *
 * Two modes:
 * 1. Playlists: Auto-fetched from Spotify via Sonos speaker browse_media
 * 2. Queue: Show what's coming up on the active speaker with upcoming tracks
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Music, ChevronLeft, ListMusic, Library, RefreshCw, SkipForward } from 'lucide-react';
import { PlaylistCard } from './PlaylistCard';
import { useBrowseMedia } from './hooks/useBrowseMedia';
import { SPOTIFY_ACCOUNTS } from './musicConfig';
import haWebSocket from '../../../services/ha-websocket';

export function PlaylistPanel({ activeSpeaker, onPlayMedia, onNextTrack }) {
  const [activeTab, setActiveTab] = useState('daz'); // 'daz' | 'nic' | 'queue'
  const { items, title, loading, error, browseToPlaylists, browseInto, goBack, reset, canGoBack } =
    useBrowseMedia();
  const hasLoadedRef = useRef(false);
  const lastSpeakerRef = useRef(null);

  // Track the last played playlist so Queue view can show upcoming tracks
  const [lastPlayedPlaylist, setLastPlayedPlaylist] = useState(null);

  const activeAccount = SPOTIFY_ACCOUNTS.find((a) => a.id === activeTab);

  // Auto-load Spotify playlists when the Daz tab is active
  useEffect(() => {
    if (activeTab === 'queue' || !activeSpeaker?.entityId) return;
    if (activeAccount && !activeAccount.entityId) return;

    const speakerChanged = lastSpeakerRef.current !== activeSpeaker.entityId;
    if (hasLoadedRef.current && !speakerChanged) return;

    hasLoadedRef.current = true;
    lastSpeakerRef.current = activeSpeaker.entityId;
    browseToPlaylists(activeSpeaker.entityId);
  }, [activeTab, activeSpeaker?.entityId, activeAccount, browseToPlaylists]);

  // Reset when switching tabs
  useEffect(() => {
    hasLoadedRef.current = false;
    reset();
  }, [activeTab, reset]);

  const handlePlayPlaylist = (mediaContentId, mediaContentType) => {
    if (activeSpeaker) {
      // Remember which playlist was played so queue can fetch its tracks
      setLastPlayedPlaylist({ id: mediaContentId, type: mediaContentType });
      onPlayMedia(activeSpeaker.entityId, mediaContentId, mediaContentType);
    }
  };

  // IMPORTANT: Always browse using the Sonos speaker entity (not Spotify entity)
  const handleBrowseInto = (item) => {
    if (activeSpeaker?.entityId) {
      browseInto(activeSpeaker.entityId, item);
    }
  };

  return (
    <div
      className="bg-[var(--color-surface)] rounded-xl h-full flex flex-col overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
    >
      {/* Tab Bar */}
      <div className="flex border-b border-[var(--color-border)] flex-shrink-0">
        {SPOTIFY_ACCOUNTS.map((account) => (
          <button
            key={account.id}
            onClick={() => setActiveTab(account.id)}
            className={`flex-1 px-4 py-3.5 text-base font-medium transition-colors ${
              activeTab === account.id
                ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            <Library size={18} className="inline mr-1.5 -mt-0.5" />
            {account.label}
          </button>
        ))}

        {/* Queue tab */}
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 px-4 py-3.5 text-base font-medium transition-colors ${
            activeTab === 'queue'
              ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
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
                  onClick={() => browseToPlaylists(activeSpeaker?.entityId)}
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
                      </h3>
                    )}
                  </div>
                  <button
                    onClick={() => browseToPlaylists(activeSpeaker?.entityId)}
                    className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]
                               hover:bg-gray-100 rounded-lg transition-colors"
                    title="Refresh playlists"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>

                {/* Playlist grid */}
                <div className="grid grid-cols-2 gap-3">
                  {items.map((item, idx) => (
                    <PlaylistCard
                      key={item.media_content_id || idx}
                      item={item}
                      onPlay={handlePlayPlaylist}
                      onBrowse={item.can_expand && !item.can_play ? handleBrowseInto : undefined}
                    />
                  ))}
                </div>

                {items.length === 0 && (
                  <div className="text-center py-12">
                    <Music size={48} className="text-gray-300 mb-3 mx-auto" />
                    <p className="text-base text-[var(--color-text-secondary)]">
                      No playlists found
                    </p>
                    <button
                      onClick={() => browseToPlaylists(activeSpeaker?.entityId)}
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
 * Queue View - shows currently playing track, upcoming tracks, and queue position.
 * Fetches the playlist track list via browse_media to show what's coming next.
 */
function QueueView({ activeSpeaker, lastPlayedPlaylist, onNextTrack }) {
  const [tracks, setTracks] = useState([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const lastFetchedPlaylistRef = useRef(null);

  const isActive =
    activeSpeaker &&
    (activeSpeaker.state === 'playing' || activeSpeaker.state === 'paused');

  // Fetch track list when a playlist is playing
  useEffect(() => {
    if (!lastPlayedPlaylist || !activeSpeaker?.entityId || !isActive) return;

    // Don't re-fetch if we already have tracks for this playlist
    if (lastFetchedPlaylistRef.current === lastPlayedPlaylist.id) return;
    lastFetchedPlaylistRef.current = lastPlayedPlaylist.id;

    async function fetchTracks() {
      setTracksLoading(true);
      try {
        const result = await haWebSocket.send({
          type: 'media_player/browse_media',
          entity_id: activeSpeaker.entityId,
          media_content_type: lastPlayedPlaylist.type,
          media_content_id: lastPlayedPlaylist.id,
        });
        setTracks(result.children || []);
      } catch (err) {
        console.error('[QueueView] Failed to fetch playlist tracks:', err);
        setTracks([]);
      }
      setTracksLoading(false);
    }

    fetchTracks();
  }, [lastPlayedPlaylist, activeSpeaker?.entityId, isActive]);

  // Skip forward N tracks by calling next_track repeatedly
  const handleSkipTo = useCallback(
    async (skipsNeeded) => {
      if (!activeSpeaker?.entityId || !onNextTrack || skipping) return;
      setSkipping(true);
      try {
        for (let i = 0; i < skipsNeeded; i++) {
          await onNextTrack(activeSpeaker.entityId);
          // Small delay between calls so Sonos can process each one
          if (i < skipsNeeded - 1) {
            await new Promise((r) => setTimeout(r, 400));
          }
        }
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

  const queuePosition = activeSpeaker.queuePosition || 0;
  const queueSize = activeSpeaker.queueSize || 0;
  const remaining = queueSize > queuePosition ? queueSize - queuePosition : 0;
  const progress = queueSize > 0 ? (queuePosition / queueSize) * 100 : 0;
  const isShuffled = activeSpeaker.shuffle;

  // Get upcoming tracks from the playlist track list
  // queuePosition is 1-based, tracks array is 0-based
  const upcomingTracks =
    !isShuffled && tracks.length > 0 && queuePosition > 0
      ? tracks.slice(queuePosition, queuePosition + 5)
      : [];

  return (
    <div>
      <h3 className="text-base font-semibold text-[var(--color-text)] mb-3">
        Playing on {activeSpeaker.label}
        {queueSize > 0 && ` \u2014 ${queueSize} tracks`}
      </h3>

      {/* Current track */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg mb-3">
        <div className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-1">
          Now Playing
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
      </div>

      {/* Upcoming tracks */}
      {upcomingTracks.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
            Up Next
          </h4>
          <div className="space-y-1">
            {upcomingTracks.map((track, idx) => (
              <button
                key={track.media_content_id || idx}
                onClick={() => handleSkipTo(idx + 1)}
                disabled={skipping}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50
                           active:bg-gray-100 transition-colors text-left disabled:opacity-50"
              >
                <span className="text-xs font-medium text-[var(--color-text-secondary)] w-5 text-center flex-shrink-0">
                  {queuePosition + idx + 1}
                </span>
                {track.thumbnail ? (
                  <img
                    src={track.thumbnail}
                    alt=""
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Music size={14} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--color-text)] truncate">
                    {track.title}
                  </div>
                </div>
                <SkipForward size={14} className="text-[var(--color-text-secondary)] flex-shrink-0 opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading tracks indicator */}
      {tracksLoading && (
        <div className="flex items-center gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[var(--color-text-secondary)]">Loading track list...</span>
        </div>
      )}

      {/* Shuffle notice */}
      {isShuffled && tracks.length > 0 && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm text-[var(--color-text-secondary)]">
          Shuffle is on — track order may differ from playlist
        </div>
      )}

      {/* Queue progress */}
      {queueSize > 1 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--color-text)]">
              Track {queuePosition} of {queueSize}
            </span>
            <span className="text-sm text-[var(--color-text-secondary)]">
              {remaining} remaining
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
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
