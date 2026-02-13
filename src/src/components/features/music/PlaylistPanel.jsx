/**
 * PlaylistPanel Component
 * Center panel (35%) — Spotify playlist browser with account tabs + queue view.
 *
 * Two modes:
 * 1. Playlists: Auto-fetched from Spotify via Sonos speaker browse_media
 * 2. Queue: Show what's coming up on the active speaker
 */

import { useState, useEffect, useRef } from 'react';
import { Music, ChevronLeft, ListMusic, Library, RefreshCw } from 'lucide-react';
import { PlaylistCard } from './PlaylistCard';
import { useBrowseMedia } from './hooks/useBrowseMedia';
import { SPOTIFY_ACCOUNTS } from './musicConfig';

export function PlaylistPanel({ activeSpeaker, onPlayMedia }) {
  const [activeTab, setActiveTab] = useState('daz'); // 'daz' | 'nic' | 'queue'
  const { items, title, loading, error, browseToPlaylists, browseInto, goBack, reset, canGoBack } =
    useBrowseMedia();
  const hasLoadedRef = useRef(false);
  const lastSpeakerRef = useRef(null);

  const activeAccount = SPOTIFY_ACCOUNTS.find((a) => a.id === activeTab);

  // Auto-load Spotify playlists when the Daz tab is active
  useEffect(() => {
    if (activeTab === 'queue' || !activeSpeaker?.entityId) return;

    // If this account doesn't have Spotify connected, don't try to browse
    if (activeAccount && !activeAccount.entityId) return;

    // Only load once per speaker selection (or on first mount)
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
          <QueueView activeSpeaker={activeSpeaker} />
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
 * Queue View - shows currently playing track and queue position.
 */
function QueueView({ activeSpeaker }) {
  const isActive =
    activeSpeaker &&
    (activeSpeaker.state === 'playing' || activeSpeaker.state === 'paused');

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
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Source info */}
          {activeSpeaker.source && (
            <div className="text-xs text-[var(--color-text-secondary)]">
              Source: {activeSpeaker.source}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
