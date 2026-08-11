import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AddMediaPage from '../AddMediaPage';
import { collectMedia, searchMedia } from '../../services/remux-api';
import { showToast } from '../../hooks/useToast';

vi.mock('../../services/remux-api', () => ({
  searchMedia: vi.fn(),
  collectMedia: vi.fn(),
}));

vi.mock('../../hooks/useToast', () => ({
  showToast: vi.fn(),
}));

const movieResults = [
  {
    mediaType: 'movie',
    title: 'Alien',
    originalTitle: 'Alien',
    year: 1979,
    tmdbId: 348,
    imdbId: 'tt0078748',
    posterUrl: 'https://image.tmdb.org/t/p/w500/alien-poster.jpg',
    overview: 'After a space merchant vessel receives an unknown transmission...',
    owned: 'owned',
  },
  {
    mediaType: 'movie',
    title: 'Alien: Covenant',
    originalTitle: 'Alien: Covenant',
    year: 2017,
    tmdbId: 126889,
    imdbId: 'tt2316204',
    posterUrl: 'https://image.tmdb.org/t/p/w500/alien-covenant-poster.jpg',
    overview: 'The crew of a colony ship, bound for a remote planet...',
    owned: 'missing',
  },
];

const stepResults = [
  {
    mediaType: 'movie',
    title: 'Step Up',
    originalTitle: 'Step Up',
    year: 2006,
    tmdbId: 9762,
    imdbId: 'tt0462590',
    posterUrl: 'https://image.tmdb.org/t/p/w500/step-up-poster.jpg',
    overview: 'Delinquent Tyler Gage receives the opportunity of a lifetime...',
    owned: 'missing',
  },
  {
    mediaType: 'movie',
    title: 'Step Brothers',
    originalTitle: 'Step Brothers',
    year: 2008,
    tmdbId: 10664,
    imdbId: 'tt0838283',
    posterUrl: 'https://image.tmdb.org/t/p/w500/step-brothers-poster.jpg',
    overview: 'Brennan Huff and Dale Doback become step brothers.',
    owned: 'owned',
  },
  {
    mediaType: 'movie',
    title: 'Step Up 2: The Streets',
    originalTitle: 'Step Up 2: The Streets',
    year: 2008,
    tmdbId: 8328,
    imdbId: 'tt1023481',
    posterUrl: 'https://image.tmdb.org/t/p/w500/step-up-2-poster.jpg',
    overview: 'Tyler Gage joins a dance crew at an elite arts school.',
    owned: 'missing',
  },
];

const broadResults = Array.from({ length: 7 }, (_, index) => ({
  mediaType: 'movie',
  title: `Broad Result ${index + 1}`,
  originalTitle: `Broad Result ${index + 1}`,
  year: 2000 + index,
  tmdbId: 5000 + index,
  imdbId: `tt50000${index}`,
  posterUrl: `https://image.tmdb.org/t/p/w500/broad-${index + 1}.jpg`,
  overview: `Broad overview ${index + 1}`,
  owned: index === 2 ? 'owned' : 'missing',
}));

describe('AddMediaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows poster artwork and ownership state for similar movie matches', async () => {
    searchMedia.mockResolvedValue({ results: movieResults });

    render(<AddMediaPage />);

    fireEvent.change(screen.getByPlaceholderText('Search IMDb by movie or TV title'), {
      target: { value: 'Alien' },
    });
    fireEvent.click(screen.getByRole('button', { name: /search imdb/i }));

    await waitFor(() => {
      expect(searchMedia).toHaveBeenCalledWith('Alien', 'all', expect.objectContaining({ signal: expect.any(Object) }));
    });

    const featuredPanel = screen.getByRole('heading', { name: 'Featured match' }).closest('.ds-card');
    expect(featuredPanel).toBeTruthy();

    expect(screen.getAllByText('In Jellyfin').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Not in Jellyfin').length).toBeGreaterThan(0);
    expect(within(featuredPanel).getByRole('heading', { name: 'Alien' })).toBeInTheDocument();
    expect(screen.getByText('Alien: Covenant')).toBeInTheDocument();

    const heroPoster = within(featuredPanel).getByAltText('Alien');
    expect(heroPoster).toHaveAttribute('src', movieResults[0].posterUrl);

    const cardPoster = screen.getByAltText('Alien: Covenant');
    expect(cardPoster).toHaveAttribute('src', movieResults[1].posterUrl);
  });

  it('switches the featured artwork when the user selects a different match', async () => {
    searchMedia.mockResolvedValue({ results: movieResults });
    collectMedia.mockResolvedValue({ message: 'movie add: Alien: Covenant (2017)' });

    render(<AddMediaPage />);

    fireEvent.change(screen.getByPlaceholderText('Search IMDb by movie or TV title'), {
      target: { value: 'Alien' },
    });
    fireEvent.click(screen.getByRole('button', { name: /search imdb/i }));

    await screen.findByText('Alien: Covenant');

    const covenantCard = screen.getByText('Alien: Covenant').closest('[role="button"]');
    expect(covenantCard).toBeTruthy();
    fireEvent.click(covenantCard);

    await waitFor(() => {
      const featuredPanel = screen.getByRole('heading', { name: 'Featured match' }).closest('.ds-card');
      expect(featuredPanel).toBeTruthy();
      expect(within(featuredPanel).getByRole('heading', { name: 'Alien: Covenant' })).toBeInTheDocument();
    });

    const featuredPanel = screen.getByRole('heading', { name: 'Featured match' }).closest('.ds-card');
    expect(featuredPanel).toBeTruthy();
    const featuredPoster = within(featuredPanel).getByAltText('Alien: Covenant');
    expect(featuredPoster).toHaveAttribute('src', movieResults[1].posterUrl);

    fireEvent.click(within(featuredPanel).getByRole('button', { name: /collect/i }));

    await waitFor(() => {
      expect(collectMedia).toHaveBeenCalledWith(movieResults[1]);
      expect(showToast).toHaveBeenCalledWith('movie add: Alien: Covenant (2017)', 'success');
    });
  });

  it('disables collect for titles already in Jellyfin', async () => {
    searchMedia.mockResolvedValue({ results: movieResults });

    render(<AddMediaPage />);

    fireEvent.change(screen.getByPlaceholderText('Search IMDb by movie or TV title'), {
      target: { value: 'Alien' },
    });
    fireEvent.click(screen.getByRole('button', { name: /search imdb/i }));

    await waitFor(() => {
      expect(searchMedia).toHaveBeenCalled();
    });

    const featuredPanel = screen.getByRole('heading', { name: 'Featured match' }).closest('.ds-card');
    expect(featuredPanel).toBeTruthy();
    expect(within(featuredPanel).getByRole('button', { name: /already in jellyfin/i })).toBeDisabled();
  });

  it('ranks owned broad matches ahead of weaker fuzzy matches', async () => {
    searchMedia.mockResolvedValue({ results: stepResults });

    render(<AddMediaPage />);

    fireEvent.change(screen.getByPlaceholderText('Search IMDb by movie or TV title'), {
      target: { value: 'Step' },
    });
    fireEvent.click(screen.getByRole('button', { name: /search imdb/i }));

    await waitFor(() => {
      expect(searchMedia).toHaveBeenCalledWith('Step', 'all', expect.objectContaining({ signal: expect.any(Object) }));
    });

    const resultsPanel = screen.getByRole('heading', { name: 'IMDb matches' }).closest('.ds-card');
    expect(resultsPanel).toBeTruthy();

    const resultCards = within(resultsPanel).getAllByRole('button');
    expect(resultCards[0]).toHaveTextContent('Step Brothers');
    expect(resultCards[0]).toHaveTextContent('In Jellyfin');
  });

  it('shows a more results control for broader searches', async () => {
    searchMedia.mockResolvedValue({ results: broadResults });

    render(<AddMediaPage />);

    fireEvent.change(screen.getByPlaceholderText('Search IMDb by movie or TV title'), {
      target: { value: 'Broad' },
    });
    fireEvent.click(screen.getByRole('button', { name: /search imdb/i }));

    await waitFor(() => {
      expect(searchMedia).toHaveBeenCalledWith('Broad', 'all', expect.objectContaining({ signal: expect.any(Object) }));
    });

    const resultsPanel = screen.getByRole('heading', { name: 'IMDb matches' }).closest('.ds-card');
    expect(resultsPanel).toBeTruthy();

    expect(within(resultsPanel).queryByText('Broad Result 7')).not.toBeInTheDocument();
    fireEvent.click(within(resultsPanel).getByRole('button', { name: /show 1 more/i }));

    expect(within(resultsPanel).getByText('Broad Result 7')).toBeInTheDocument();
  });

  it('shows a timeout message when the IMDb search times out', async () => {
    searchMedia.mockRejectedValue(Object.assign(new Error('Gateway Timeout'), { status: 504 }));

    render(<AddMediaPage />);

    fireEvent.change(screen.getByPlaceholderText('Search IMDb by movie or TV title'), {
      target: { value: 'Step' },
    });
    fireEvent.click(screen.getByRole('button', { name: /search imdb/i }));

    await waitFor(() => {
      expect(screen.getByText('IMDb lookup timed out. Try again or narrow the title.')).toBeInTheDocument();
    });
  });

  it('keeps the featured and results panes scrollable on desktop layouts', () => {
    searchMedia.mockResolvedValue({ results: broadResults });

    render(<AddMediaPage />);

    expect(screen.getByTestId('featured-scroll-region')).toHaveClass('overflow-y-auto');
    expect(screen.getByTestId('results-scroll-region')).toHaveClass('overflow-y-auto');
  });
});
