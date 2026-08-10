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

    fireEvent.change(screen.getByPlaceholderText('Movie title or TV series name'), {
      target: { value: 'Alien' },
    });
    fireEvent.click(screen.getByRole('button', { name: /search library/i }));

    await waitFor(() => {
      expect(searchMedia).toHaveBeenCalledWith('Alien', 'all');
    });

    const featuredPanel = screen.getByRole('heading', { name: 'Selected match' }).closest('.ds-card');
    expect(featuredPanel).toBeTruthy();

    expect(within(featuredPanel).getAllByText('In Jellyfin').length).toBeGreaterThan(0);
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

    fireEvent.change(screen.getByPlaceholderText('Movie title or TV series name'), {
      target: { value: 'Alien' },
    });
    fireEvent.click(screen.getByRole('button', { name: /search library/i }));

    await screen.findByText('Alien: Covenant');

    const covenantCard = screen.getByText('Alien: Covenant').closest('[role="button"]');
    expect(covenantCard).toBeTruthy();
    fireEvent.click(covenantCard);

    await waitFor(() => {
      const featuredPanel = screen.getByRole('heading', { name: 'Selected match' }).closest('.ds-card');
      expect(featuredPanel).toBeTruthy();
      expect(within(featuredPanel).getByRole('heading', { name: 'Alien: Covenant' })).toBeInTheDocument();
    });

    const featuredPanel = screen.getByRole('heading', { name: 'Selected match' }).closest('.ds-card');
    expect(featuredPanel).toBeTruthy();
    const featuredPoster = within(featuredPanel).getByAltText('Alien: Covenant');
    expect(featuredPoster).toHaveAttribute('src', movieResults[1].posterUrl);

    expect(within(featuredPanel).getAllByText('Not in Jellyfin').length).toBeGreaterThan(0);

    fireEvent.click(within(featuredPanel).getByRole('button', { name: /collect/i }));

    await waitFor(() => {
      expect(collectMedia).toHaveBeenCalledWith(movieResults[1]);
      expect(showToast).toHaveBeenCalledWith('movie add: Alien: Covenant (2017)', 'success');
    });
  });
});
