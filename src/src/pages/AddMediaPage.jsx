/**
 * AddMediaPage Component
 * Search movies and TV series, confirm the right match, then post to #movies.
 */

import { createElement, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CircleAlert,
  Clapperboard,
  ExternalLink,
  LoaderCircle,
  Search,
  Tv,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { searchMedia, collectMedia } from '../services/remux-api';
import { showToast } from '../hooks/useToast';

const FILTERS = [
  { id: 'all', label: 'All', icon: Search },
  { id: 'movie', label: 'Movie', icon: Clapperboard },
  { id: 'tv', label: 'TV', icon: Tv },
];

function ownedLabel(value) {
  if (value === 'owned') return { text: 'In Jellyfin', className: 'bg-green-50 text-green-700 border-green-200' };
  if (value === 'missing') return { text: 'Not in Jellyfin', className: 'bg-gray-50 text-gray-600 border-gray-200' };
  return { text: 'Ownership unknown', className: 'bg-amber-50 text-amber-700 border-amber-200' };
}

function ResultCard({ item, onCollect, collecting }) {
  const owned = ownedLabel(item.owned);

  return (
    <div className="ds-card flex gap-4 items-stretch" style={{ padding: 12 }}>
      <div className="w-24 shrink-0">
        <div className="aspect-[2/3] rounded-lg overflow-hidden bg-[var(--ds-border)]">
          {item.posterUrl ? (
            <img
              src={item.posterUrl}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--ds-text-secondary)]">
              <Clapperboard size={28} />
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-[var(--ds-text)] truncate">
                {item.title}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold border bg-[var(--ds-tint-games)] text-[var(--ds-text)]">
                {item.mediaType === 'movie' ? 'Movie' : 'TV'}
              </span>
              {item.year ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold border bg-white text-[var(--ds-text-secondary)]">
                  {item.year}
                </span>
              ) : null}
              {item.imdbId ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold border bg-white text-[var(--ds-text-secondary)]">
                  IMDb {item.imdbId}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-[var(--ds-text-secondary)] line-clamp-3">
              {item.overview || 'No overview available.'}
            </p>
          </div>

          <a
            href={`https://www.themoviedb.org/${item.mediaType}/${item.tmdbId}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 p-2 rounded-lg hover:bg-black/[0.04] text-[var(--ds-text-secondary)]"
            title="Open TMDb listing"
          >
            <ExternalLink size={16} />
          </a>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${owned.className}`}>
            <BadgeCheck size={14} />
            {owned.text}
          </span>

          <button
            type="button"
            onClick={() => onCollect(item)}
            disabled={collecting}
            className="ds-btn"
            style={{ minWidth: 120 }}
          >
            {collecting ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                Sending
              </>
            ) : (
              'Collect'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AddMediaPage() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchMeta, setSearchMeta] = useState('');
  const [collectingKey, setCollectingKey] = useState('');

  const filterButtons = useMemo(() => FILTERS, []);

  const runSearch = async (event) => {
    event?.preventDefault?.();
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setError('Type a title to search.');
      return;
    }

    setLoading(true);
    setError('');
    setSearchMeta('');

    try {
      const response = await searchMedia(trimmed, activeFilter);
      setResults(response.results || []);
      setSearchMeta(response.results?.length ? `Found ${response.results.length} result${response.results.length === 1 ? '' : 's'}` : 'No matches');
    } catch (err) {
      setError(err.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCollect = async (item) => {
    const key = `${item.mediaType}:${item.tmdbId}`;
    setCollectingKey(key);
    try {
      const response = await collectMedia(item);
      showToast(response.message || 'Sent to Discord', 'success');
    } catch (err) {
      showToast(err.message || 'Collect failed', 'error');
    } finally {
      setCollectingKey('');
    }
  };

  return (
    <PageContainer maxWidth="max-w-[1600px]">
      <div className="space-y-4">
        <div className="ds-card" style={{ padding: 14 }}>
          <form onSubmit={runSearch} className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
              <label className="flex-1">
                <span className="block text-sm font-semibold text-[var(--ds-text)] mb-2">Search</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Movie title or TV series"
                  className="w-full rounded-lg border border-[var(--ds-border)] bg-white px-3 py-3 text-[var(--ds-text)] outline-none"
                />
              </label>

              <div>
                <span className="block text-sm font-semibold text-[var(--ds-text)] mb-2">Type</span>
                <div className="inline-flex rounded-lg border border-[var(--ds-border)] bg-white p-1 gap-1">
                  {filterButtons.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveFilter(id)}
                      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                        activeFilter === id
                          ? 'bg-[var(--ds-accent)] text-white'
                          : 'text-[var(--ds-text-secondary)] hover:bg-black/[0.04]'
                      }`}
                    >
                      {createElement(Icon, { size: 16 })}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="ds-btn" disabled={loading} style={{ minWidth: 120, height: 44 }}>
                {loading ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Searching
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Search
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {error ? (
          <div className="ds-card flex items-center gap-2 text-sm text-red-700" style={{ padding: 12, backgroundColor: 'rgba(196, 99, 106, 0.08)' }}>
            <CircleAlert size={16} />
            {error}
          </div>
        ) : null}

        {searchMeta ? (
          <div className="text-sm text-[var(--ds-text-secondary)] px-1">
            {searchMeta}
          </div>
        ) : null}

        <div className="space-y-3">
          {results.map((item) => {
            const key = `${item.mediaType}:${item.tmdbId}`;
            return (
              <ResultCard
                key={key}
                item={item}
                onCollect={handleCollect}
                collecting={collectingKey === key}
              />
            );
          })}
          {!loading && !results.length && !error ? (
            <div className="ds-card flex items-center gap-2 text-sm text-[var(--ds-text-secondary)]" style={{ padding: 12 }}>
              <Search size={16} />
              Search by title to pull candidates from TMDb and check Jellyfin ownership.
            </div>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}

export default AddMediaPage;
