/**
 * PlaylistPanel Component
 * Center panel (35%) — Spotify playlist browser with account tabs + queue view.
 *
 * Two modes:
 * 1. Playlists: Browse Daz's or Nic's Spotify playlists
 * 2. Queue: Show what's coming up on the active speaker
 */

import { useState, useEffect } from 'react';
import { Music, ChevronLeft, ListMusic, Library, RefreshCw, Grid3x3 } from 'lucide-react';
import { PlaylistCard } from './PlaylistCard';
import { QueueItem } from './QueueItem';
import { useBrowseMedia } from './hooks/useBrowseMedia';
import { useQueue } from './hooks/useQueue';
import { SPOTIFY_ACCOUNTS, FAVORITE_PLAYLISTS } from './musicConfig';

export function PlaylistPanel({ activeSpeaker, onPlayMedia }) {
  const [activeTab, setActiveTab] = useState('daz'); // 'daz' | 'nic' | 'queue'
  const [showBrowse, setShowBrowse] = useState(false); // Toggle between favorites and browse
  const { items, title, loading, error, browse, browseInto, goBack, canGoBack } = useBrowseMedia();
  const { queue, loading: queueLoading, error: queueError, refetch: refetchQueue } = useQueue(
    activeSpeaker?.entityId
  );

  const activeAccount = SPOTIFY_ACCOUNTS.find((a) => a.id === activeTab);
  const favoritePlaylists = FAVORITE_PLAYLISTS[activeTab] || [];

  // Reset browse mode when switching tabs
  useEffect(() => {
    setShowBrowse(false);
  }, [activeTab]);

  // Fetch playlists when browse mode is enabled
  useEffect(() => {
    if (showBrowse && activeSpeaker?.entityId) {
      // Browse the Sonos speaker to show music library (includes Spotify)
      browse(activeSpeaker.entityId);
    }
  }, [showBrowse, activeSpeaker?.entityId, browse]);

  const handlePlayPlaylist = (mediaContentId, mediaContentType) => {
    if (activeSpeaker) {
      onPlayMedia(activeSpeaker.entityId, mediaContentId, mediaContentType);
    }
  };

  const handleBrowseInto = (item) => {
    if (activeAccount?.entityId) {
      browseInto(activeAccount.entityId, item);
    }
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-xl h-full flex flex-col overflow-hidden"
         style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

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
          <div>
            {activeSpeaker && (activeSpeaker.state === 'playing' || activeSpeaker.state === 'paused') ? (
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text)] mb-3">
                  Playing on {activeSpeaker.label}
                  {activeSpeaker.queueSize && ` — ${activeSpeaker.queueSize} tracks`}
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
                </div>

                {/* Queue size indicator */}
                {activeSpeaker.queueSize > 1 && (
                  <div className="text-center py-8 text-[var(--color-text-secondary)]">
                    <ListMusic size={40} className="mx-auto mb-2 opacity-50" />
                    <p className="text-base mb-1">
                      {activeSpeaker.queueSize - 1} more tracks in queue
                    </p>
                    <p className="text-sm opacity-75">
                      Full queue display coming soon
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <ListMusic size={48} className="text-gray-300 mb-3" />
                <p className="text-base text-[var(--color-text-secondary)]">No queue</p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Play something to see the queue
                </p>
              </div>
            )}
          </div>
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
                  HA Settings → Integrations → Add → Spotify
                </p>
              </div>
            )}

            {/* Favorite Playlists (Default View) */}
            {activeAccount.entityId && !showBrowse && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-[var(--color-text)]">
                    Favorite Playlists
                  </h3>
                  <button
                    onClick={() => setShowBrowse(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                               bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Grid3x3 size={14} />
                    Browse All
                  </button>
                </div>

                {favoritePlaylists.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {favoritePlaylists.map((playlist, idx) => (
                      <PlaylistCard
                        key={playlist.uri || idx}
                        item={{
                          title: playlist.name,
                          media_content_id: playlist.uri,
                          media_content_type: 'music',
                          thumbnail: playlist.thumbnail,
                          can_play: true,
                          can_expand: false,
                        }}
                        onPlay={(uri, type) => handlePlayPlaylist(uri, type)}
                        onBrowse={undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Music size={48} className="text-gray-300 mb-3 mx-auto" />
                    <p className="text-base text-[var(--color-text-secondary)] mb-4">
                      No favorite playlists configured
                    </p>
                    <button
                      onClick={() => setShowBrowse(true)}
                      className="px-4 py-2 text-base font-medium bg-[var(--color-primary)]
                                 text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Browse All Playlists
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Loading (only in browse mode) */}
            {activeAccount.entityId && showBrowse && loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                <p className="text-base text-[var(--color-text-secondary)]">Loading playlists...</p>
              </div>
            )}

            {/* Error (only in browse mode) */}
            {activeAccount.entityId && showBrowse && error && (
              <div className="text-center py-12">
                <p className="text-lg font-semibold text-[var(--color-error)] mb-2">Failed to load playlists</p>
                <p className="text-base text-[var(--color-text-secondary)] mt-1 mb-4">{error}</p>
                <button
                  onClick={() => browse(activeAccount.entityId)}
                  className="mt-3 px-5 py-2.5 text-base font-medium bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Browse results */}
            {activeAccount.entityId && showBrowse && !loading && !error && (
              <>
                {/* Back buttons + title */}
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
                    {title && !canGoBack && (
                      <h3 className="text-base font-semibold text-[var(--color-text)]">
                        {title}
                      </h3>
                    )}
                  </div>
                  {favoritePlaylists.length > 0 && (
                    <button
                      onClick={() => setShowBrowse(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                                 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <Music size={14} />
                      Favorites
                    </button>
                  )}
                </div>

                {/* Playlist grid */}
                <div className="grid grid-cols-2 gap-3">
                  {items.map((item, idx) => (
                    <PlaylistCard
                      key={item.media_content_id || idx}
                      item={item}
                      onPlay={handlePlayPlaylist}
                      onBrowse={item.can_expand ? handleBrowseInto : undefined}
                    />
                  ))}
                </div>

                {items.length === 0 && (
                  <div className="text-center py-12">
                    <Music size={48} className="text-gray-300 mb-3 mx-auto" />
                    <p className="text-base text-[var(--color-text-secondary)]">No playlists found</p>
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
