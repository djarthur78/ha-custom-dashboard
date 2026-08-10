/**
 * AddMediaPage Component
 * Search movies and TV series, confirm the right match, then post to #movies.
 */

import { createElement, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CircleAlert,
  Clapperboard,
  ChevronRight,
  ExternalLink,
  LoaderCircle,
  Play,
  Sparkles,
  Search,
  Tv,
  Film,
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

function typeLabel(item) {
  return item.mediaType === 'movie' ? 'Movie' : 'TV series';
}

function ResultCard({ item, selected, onSelect, onCollect, collecting }) {
  const owned = ownedLabel(item.owned);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(item);
        }
      }}
      className={`ds-card flex gap-4 items-stretch transition-all cursor-pointer ${
        selected ? 'ring-2 ring-[var(--ds-accent)] shadow-md' : 'hover:shadow-md'
      }`}
      style={{ padding: 12, backgroundColor: selected ? 'rgba(243,238,255,0.7)' : 'var(--ds-card)' }}
    >
      <div className="w-24 shrink-0">
        <div className="aspect-[2/3] rounded-lg overflow-hidden bg-[var(--ds-border)] shadow-sm">
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
                {typeLabel(item)}
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
            onClick={(event) => event.stopPropagation()}
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
            onClick={(event) => {
              event.stopPropagation();
              onCollect(item);
            }}
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

function FeaturedMedia({ item, onCollect, collecting }) {
  const owned = ownedLabel(item.owned);
  const poster = item.posterUrl;

  return (
    <div className="ds-card overflow-hidden" style={{ backgroundColor: 'var(--ds-tint-games)', padding: 0 }}>
      <div className="grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="relative bg-black/10 min-h-[360px] lg:min-h-[520px]">
          {poster ? (
            <img
              src={poster}
              alt={item.title}
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[var(--ds-text-secondary)]">
              <Clapperboard size={88} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="absolute left-4 bottom-4 right-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--ds-text)] shadow-sm">
              <Sparkles size={12} className="text-[var(--ds-accent)]" />
              {typeLabel(item)}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5 p-5 lg:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--ds-text)]">
              <BadgeCheck size={13} />
              Selected match
            </span>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${owned.className}`}>
              <BadgeCheck size={13} />
              {owned.text}
            </span>
            {item.year ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--ds-text-secondary)]">
                {item.year}
              </span>
            ) : null}
          </div>

          <div className="min-w-0">
            <h2 className="text-3xl lg:text-4xl font-bold text-[var(--ds-text)] leading-tight">
              {item.title}
            </h2>
            <p className="mt-2 text-sm font-medium uppercase tracking-wide text-[var(--ds-text-secondary)]">
              {item.originalTitle && item.originalTitle !== item.title ? item.originalTitle : item.mediaType}
            </p>
          </div>

          <p className="max-w-3xl text-[15px] leading-6 text-[var(--ds-text-secondary)]">
            {item.overview || 'No overview available.'}
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/70 bg-white/80 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--ds-text-secondary)]">Type</div>
              <div className="mt-1 text-sm font-semibold text-[var(--ds-text)]">{typeLabel(item)}</div>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--ds-text-secondary)]">IMDb</div>
              <div className="mt-1 text-sm font-semibold text-[var(--ds-text)] truncate">
                {item.imdbId || 'Not available'}
              </div>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--ds-text-secondary)]">TMDb</div>
              <div className="mt-1 text-sm font-semibold text-[var(--ds-text)] truncate">{item.tmdbId}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onCollect(item)}
              disabled={collecting}
              className="ds-btn"
              style={{ minWidth: 160 }}
            >
              {collecting ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  Sending
                </>
              ) : (
                <>
                  <Play size={16} />
                  Collect
                </>
              )}
            </button>

            <a
              href={`https://www.themoviedb.org/${item.mediaType}/${item.tmdbId}`}
              target="_blank"
              rel="noreferrer"
              className="ds-btn-secondary"
              onClick={(event) => event.stopPropagation()}
            >
              <ExternalLink size={16} />
              TMDb
            </a>

            {item.imdbId ? (
              <a
                href={`https://www.imdb.com/title/${item.imdbId}/`}
                target="_blank"
                rel="noreferrer"
                className="ds-btn-secondary"
                onClick={(event) => event.stopPropagation()}
              >
                <ExternalLink size={16} />
                IMDb
              </a>
            ) : null}
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-[var(--ds-text-secondary)]">
            <ChevronRight size={14} />
            Pick a result below, then collect the match you want.
          </div>
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
  const [selectedKey, setSelectedKey] = useState('');

  const filterButtons = useMemo(() => FILTERS, []);
  const selectedItem = useMemo(
    () => results.find((item) => `${item.mediaType}:${item.tmdbId}` === selectedKey) || results[0] || null,
    [results, selectedKey],
  );

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
      setSelectedKey(response.results?.[0] ? `${response.results[0].mediaType}:${response.results[0].tmdbId}` : '');
      setSearchMeta(response.results?.length ? `Found ${response.results.length} result${response.results.length === 1 ? '' : 's'}` : 'No matches');
    } catch (err) {
      setError(err.message || 'Search failed');
      setResults([]);
      setSelectedKey('');
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
    <PageContainer maxWidth="max-w-[1720px]">
      <div className="space-y-4">
        <div className="ds-card overflow-hidden" style={{ backgroundColor: 'var(--ds-tint-games)', padding: 0 }}>
          <div className="grid gap-0 xl:grid-cols-[380px_minmax(0,1fr)]">
            <div className="border-b xl:border-b-0 xl:border-r border-white/70 p-5 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/80 p-3 text-[var(--ds-accent)] shadow-sm">
                  <Film size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[var(--ds-text)]">Add Movie/TV</h1>
                  <p className="text-sm text-[var(--ds-text-secondary)]">Search, confirm, and send the exact request to #movies.</p>
                </div>
              </div>

              <form onSubmit={runSearch} className="mt-6 space-y-4">
                <label className="block">
                  <span className="block text-sm font-semibold text-[var(--ds-text)] mb-2">Search</span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Movie title or TV series"
                    autoFocus
                    className="w-full rounded-xl border border-[var(--ds-border)] bg-white px-4 py-3 text-[var(--ds-text)] outline-none shadow-sm"
                  />
                </label>

                <div>
                  <span className="block text-sm font-semibold text-[var(--ds-text)] mb-2">Type</span>
                  <div className="grid grid-cols-3 gap-2">
                    {filterButtons.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setActiveFilter(id)}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                          activeFilter === id
                            ? 'border-[var(--ds-accent)] bg-[var(--ds-accent)] text-white shadow-sm'
                            : 'border-[var(--ds-border)] bg-white text-[var(--ds-text-secondary)] hover:bg-black/[0.03]'
                        }`}
                      >
                        {createElement(Icon, { size: 16 })}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="ds-btn w-full justify-center" disabled={loading} style={{ height: 48 }}>
                  {loading ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      Searching
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      Search library
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-white/70 bg-white/80 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ds-text-secondary)]">Results</div>
                  <div className="mt-1 text-lg font-bold text-[var(--ds-text)]">{results.length}</div>
                </div>
                <div className="rounded-xl border border-white/70 bg-white/80 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ds-text-secondary)]">Mode</div>
                  <div className="mt-1 text-lg font-bold text-[var(--ds-text)]">{activeFilter.toUpperCase()}</div>
                </div>
                <div className="rounded-xl border border-white/70 bg-white/80 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ds-text-secondary)]">Queue</div>
                  <div className="mt-1 text-lg font-bold text-[var(--ds-text)]">{selectedItem ? 'Ready' : '--'}</div>
                </div>
              </div>
            </div>

            <div className="p-5 lg:p-6">
              {selectedItem ? (
                <FeaturedMedia
                  item={selectedItem}
                  onCollect={handleCollect}
                  collecting={collectingKey === `${selectedItem.mediaType}:${selectedItem.tmdbId}`}
                />
              ) : (
                <div className="ds-card flex min-h-[360px] items-center justify-center border-dashed bg-white/60 text-center" style={{ borderStyle: 'dashed' }}>
                  <div className="max-w-md px-4">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm text-[var(--ds-accent)]">
                      <Sparkles size={28} />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--ds-text)]">Find a title</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--ds-text-secondary)]">
                      Search TMDb, compare the best match, and confirm whether it is already in Jellyfin before you collect it.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {error ? (
          <div className="ds-card flex items-center gap-2 text-sm text-red-700" style={{ padding: 12, backgroundColor: 'rgba(196, 99, 106, 0.08)' }}>
            <CircleAlert size={16} />
            {error}
          </div>
        ) : null}

        {searchMeta ? (
          <div className="flex flex-wrap items-center gap-2 px-1 text-sm text-[var(--ds-text-secondary)]">
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--ds-border)] bg-white px-2.5 py-1 font-semibold">
              <BadgeCheck size={13} />
              {searchMeta}
            </span>
            {selectedItem ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--ds-border)] bg-white px-2.5 py-1 font-semibold">
                <ChevronRight size={13} />
                Selected: {selectedItem.title}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {results.map((item) => {
            const key = `${item.mediaType}:${item.tmdbId}`;
            return (
              <ResultCard
                key={key}
                item={item}
                selected={selectedKey === key || (!selectedKey && results[0] && results[0].mediaType === item.mediaType && results[0].tmdbId === item.tmdbId)}
                onSelect={(picked) => setSelectedKey(`${picked.mediaType}:${picked.tmdbId}`)}
                onCollect={handleCollect}
                collecting={collectingKey === key}
              />
            );
          })}
        </div>

        {!loading && !results.length && !error ? (
          <div className="ds-card flex items-center gap-2 text-sm text-[var(--ds-text-secondary)]" style={{ padding: 12 }}>
            <Search size={16} />
            Search by title to pull candidates from TMDb and check Jellyfin ownership.
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}

export default AddMediaPage;
