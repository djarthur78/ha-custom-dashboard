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

function normalizeText(value) {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function scoreResult(item, query, index) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return { score: 0, index };
  }

  const normalizedTitle = normalizeText(item.title);
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const titleTokens = normalizedTitle.split(/\s+/).filter(Boolean);

  let score = 0;

  if (normalizedTitle === normalizedQuery) score += 1000;
  if (normalizedTitle.startsWith(normalizedQuery)) score += 350;
  if (normalizedTitle.includes(normalizedQuery)) score += 250;

  const matchedTokens = queryTokens.filter((token) => normalizedTitle.includes(token));
  score += matchedTokens.length * 80;

  const orderedTokens = queryTokens.every((token, tokenIndex) => {
    const currentIndex = titleTokens.indexOf(token);
    if (currentIndex === -1) return false;
    if (tokenIndex === 0) return true;
    const previousIndex = titleTokens.indexOf(queryTokens[tokenIndex - 1]);
    return previousIndex !== -1 && previousIndex <= currentIndex;
  });
  if (orderedTokens) score += 120;

  const titleWordMatches = titleTokens.filter((token) => queryTokens.includes(token));
  score += titleWordMatches.length * 20;

  if (item.owned === 'owned') score += 40;
  if (item.owned === 'missing') score += 5;

  score += Math.max(0, 25 - Math.abs(normalizedTitle.length - normalizedQuery.length));

  return { score, index };
}

function rankResults(results, query) {
  return [...results]
    .map((item, index) => ({ item, ...scoreResult(item, query, index) }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if ((left.item.title || '') !== (right.item.title || '')) {
        return (left.item.title || '').localeCompare(right.item.title || '');
      }
      return left.index - right.index;
    })
    .map(({ item }) => item);
}

function ResultCard({ item, selected, onSelect }) {
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
      className={`ds-card overflow-hidden transition-all cursor-pointer ${
        selected ? 'ring-2 ring-[var(--ds-accent)] shadow-md' : 'hover:shadow-md'
      }`}
      style={{ padding: 0, backgroundColor: selected ? 'rgba(243,238,255,0.7)' : 'var(--ds-card)' }}
    >
      <div className="relative aspect-[2/3] bg-[var(--ds-border)]">
        {item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--ds-text-secondary)]">
            <Clapperboard size={32} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

        <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-[var(--ds-text)] shadow-sm">
          <Sparkles size={10} className="text-[var(--ds-accent)]" />
          {selected ? 'Selected' : typeLabel(item)}
        </div>

        <div className="absolute left-2 right-2 bottom-2 space-y-2 text-white">
          <div className="flex items-center gap-2 flex-wrap">
            {item.year ? (
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-[var(--ds-text)]">
                {item.year}
              </span>
            ) : null}
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${owned.className}`}>
              {owned.text}
            </span>
          </div>

          <h3 className="text-sm font-bold leading-tight line-clamp-2 drop-shadow">
            {item.title}
          </h3>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wide text-white/80">
              {item.imdbId ? `IMDb ${item.imdbId}` : 'No IMDb id'}
            </span>
            <a
              href={`https://www.themoviedb.org/${item.mediaType}/${item.tmdbId}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-[var(--ds-text)] shadow-sm"
              title="Open TMDb listing"
              onClick={(event) => event.stopPropagation()}
            >
              TMDb
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectedMediaContent({ item, onCollect, collecting }) {
  const owned = ownedLabel(item.owned);
  const poster = item.posterUrl;
  const canCollect = item.owned !== 'owned';

  return (
    <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
      <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-black/10 min-h-[420px]">
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

      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ds-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--ds-text)]">
            <BadgeCheck size={13} />
            Selected match
          </span>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${owned.className}`}>
            <BadgeCheck size={13} />
            {owned.text}
          </span>
          {item.year ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ds-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--ds-text-secondary)]">
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
          <div className="rounded-xl border border-[var(--ds-border)] bg-white p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--ds-text-secondary)]">Type</div>
            <div className="mt-1 text-sm font-semibold text-[var(--ds-text)]">{typeLabel(item)}</div>
          </div>
          <div className="rounded-xl border border-[var(--ds-border)] bg-white p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--ds-text-secondary)]">IMDb</div>
            <div className="mt-1 text-sm font-semibold text-[var(--ds-text)] truncate">
              {item.imdbId || 'Not available'}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--ds-border)] bg-white p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--ds-text-secondary)]">TMDb</div>
            <div className="mt-1 text-sm font-semibold text-[var(--ds-text)] truncate">{item.tmdbId}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onCollect(item)}
            disabled={collecting || !canCollect}
            className="ds-btn"
            style={{ minWidth: 160 }}
          >
            {collecting ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                Sending
              </>
            ) : !canCollect ? (
              <>
                <BadgeCheck size={16} />
                Already in Jellyfin
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
  const [searched, setSearched] = useState(false);

  const filterButtons = useMemo(() => FILTERS, []);
  const rankedResults = useMemo(() => rankResults(results, query), [results, query]);
  const selectedItem = useMemo(
    () => rankedResults.find((item) => `${item.mediaType}:${item.tmdbId}` === selectedKey) || rankedResults[0] || null,
    [rankedResults, selectedKey],
  );

  const runSearch = async (event) => {
    event?.preventDefault?.();
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setError('Type a movie or TV title to search IMDb.');
      setSearched(false);
      return;
    }

    setLoading(true);
    setError('');
    setSearchMeta('');
    setSearched(true);

    try {
      const response = await searchMedia(trimmed, activeFilter);
      const nextResults = response.results || [];
      const nextRankedResults = rankResults(nextResults, trimmed);
      setResults(nextResults);
      setSelectedKey(nextRankedResults[0] ? `${nextRankedResults[0].mediaType}:${nextRankedResults[0].tmdbId}` : '');
      setSearchMeta(nextResults.length ? `Found ${nextResults.length} IMDb result${nextResults.length === 1 ? '' : 's'}` : 'No IMDb matches');
    } catch (err) {
      setError(err.message || 'Search failed');
      setResults([]);
      setSelectedKey('');
      setSearchMeta('');
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
    <div className="flex flex-col gap-3 p-3 min-h-[calc(100vh-72px)] xl:flex-row xl:h-[calc(100vh-72px)]">
      <section className="ds-card flex min-h-0 w-full flex-col overflow-hidden xl:flex-[32]" style={{ padding: 0 }}>
        <div className="flex-shrink-0 border-b border-[var(--ds-border)] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[var(--ds-tint-games)] p-2.5 text-[var(--ds-accent)] shadow-sm">
              <Film size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[var(--ds-text)] leading-tight">Add Movie/TV</h2>
              <p className="truncate text-xs uppercase tracking-wide text-[var(--ds-text-secondary)]">
                Search IMDb, confirm artwork, then collect the right match
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          <form onSubmit={runSearch} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--ds-text-secondary)]">Title</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search IMDb by movie or TV title"
                autoFocus
                className="w-full rounded-xl border border-[var(--ds-border)] bg-white px-4 py-3 text-[var(--ds-text)] outline-none shadow-sm"
              />
            </label>

            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--ds-text-secondary)]">Type</span>
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
                  Searching IMDb
                </>
              ) : (
                <>
                  <Search size={16} />
                  Search IMDb
                </>
              )}
            </button>
          </form>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-[var(--ds-border)] bg-[var(--ds-tint-games)] p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ds-text-secondary)]">Results</div>
              <div className="mt-1 text-xl font-bold text-[var(--ds-text)]">{results.length}</div>
            </div>
            <div className="rounded-xl border border-[var(--ds-border)] bg-[var(--ds-tint-games)] p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ds-text-secondary)]">Mode</div>
              <div className="mt-1 text-xl font-bold text-[var(--ds-text)]">{activeFilter.toUpperCase()}</div>
            </div>
            <div className="rounded-xl border border-[var(--ds-border)] bg-[var(--ds-tint-games)] p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ds-text-secondary)]">Ready</div>
              <div className="mt-1 text-xl font-bold text-[var(--ds-text)]">{selectedItem ? 'Yes' : '--'}</div>
            </div>
          </div>

          {searchMeta ? (
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--ds-border)] bg-white px-2.5 py-1 text-xs font-semibold">
                <BadgeCheck size={13} />
                {searchMeta}
              </span>
              {selectedItem ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--ds-border)] bg-white px-2.5 py-1 text-xs font-semibold">
                  <ChevronRight size={13} />
                  Selected: {selectedItem.title}
                </span>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <CircleAlert size={16} />
              {error}
            </div>
          ) : null}

          {!loading && !results.length && !error && !searched ? (
            <div className="rounded-xl border border-dashed border-[var(--ds-border)] bg-white/60 p-4 text-sm text-[var(--ds-text-secondary)]">
              <div className="flex items-center gap-2">
                <Search size={16} />
                Search by title, typos, or partial names to pull candidates from IMDb and check Jellyfin ownership.
              </div>
            </div>
          ) : null}

          {!loading && searched && !results.length && !error ? (
            <div className="rounded-xl border border-dashed border-[var(--ds-border)] bg-white/60 p-4 text-sm text-[var(--ds-text-secondary)]">
              <div className="flex items-center gap-2">
                <Search size={16} />
                No IMDb matches. Try a broader title, a typo, or a partial phrase.
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="ds-card flex min-h-0 w-full flex-col overflow-hidden xl:flex-[38]" style={{ padding: 0, backgroundColor: 'var(--ds-tint-games)' }}>
        <div className="flex items-center justify-between border-b border-[var(--ds-border)] px-4 py-3">
          <div>
            <h2 className="text-base font-bold text-[var(--ds-text)]">Featured match</h2>
            <p className="text-xs uppercase tracking-wide text-[var(--ds-text-secondary)]">Artwork first, then collect</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ds-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--ds-text-secondary)]">
            <Sparkles size={12} className="text-[var(--ds-accent)]" />
            {selectedItem ? ownedLabel(selectedItem.owned).text : 'Waiting'}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {selectedItem ? (
            <SelectedMediaContent
              item={selectedItem}
              onCollect={handleCollect}
              collecting={collectingKey === `${selectedItem.mediaType}:${selectedItem.tmdbId}`}
            />
          ) : (
            <div className="flex h-full min-h-[420px] items-center justify-center text-center">
              <div className="max-w-md px-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm text-[var(--ds-accent)]">
                  <Sparkles size={28} />
                </div>
                <h2 className="text-2xl font-bold text-[var(--ds-text)]">
                  {searched ? 'No match selected' : 'Find a title'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--ds-text-secondary)]">
                  {searched
                    ? 'Pick one of the IMDb matches on the right to review artwork, year, and ownership.'
                    : 'Search IMDb with fuzzy terms, compare similar posters, and use the art to confirm the exact movie or series.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="ds-card flex min-h-0 w-full flex-col overflow-hidden xl:flex-[30]" style={{ padding: 0 }}>
        <div className="flex items-center justify-between border-b border-[var(--ds-border)] px-4 py-3">
          <div>
            <h2 className="text-base font-bold text-[var(--ds-text)]">IMDb matches</h2>
            <p className="text-xs uppercase tracking-wide text-[var(--ds-text-secondary)]">Poster cards with Jellyfin state</p>
          </div>
          <span className="rounded-full border border-[var(--ds-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--ds-text-secondary)]">
            {results.length}
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(165px,1fr))]">
            {rankedResults.map((item) => {
              const key = `${item.mediaType}:${item.tmdbId}`;
              return (
                <ResultCard
                  key={key}
                  item={item}
                  selected={selectedKey === key || (!selectedKey && rankedResults[0] && rankedResults[0].mediaType === item.mediaType && rankedResults[0].tmdbId === item.tmdbId)}
                  onSelect={(picked) => setSelectedKey(`${picked.mediaType}:${picked.tmdbId}`)}
                />
              );
            })}
            {!rankedResults.length && !loading && !error ? (
              <div className="rounded-xl border border-dashed border-[var(--ds-border)] bg-white/60 p-4 text-sm text-[var(--ds-text-secondary)]">
                Search IMDb to load poster cards here.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

export default AddMediaPage;
