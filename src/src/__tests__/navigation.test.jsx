import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { MobileLayout } from '../components/mobile/MobileLayout';
import haWebSocket from '../services/ha-websocket';
import App from '../App';
import MobileApp from '../MobileApp';

// Keep the real layouts and navigation, with HA requests confined to a fixture.
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('[]', {
    headers: { 'Content-Type': 'application/json' },
  })));
});

afterEach(() => {
  cleanup();
  haWebSocket.disconnect();
  vi.unstubAllGlobals();
});

const destinations = [
  ['Home', '/home'], ['Calendar', '/calendar'], ['Meals', '/meals'],
  ['Weather', '/weather'], ['Games Room', '/games-room'], ['Spa', '/spa'],
  ['Add Media', '/add-media'], ['Music', '/music'], ['People', '/people'],
  ['Health', '/health'], ['Cameras', '/cameras'], ['Cold Plunge', '/cold-plunge'],
  ['To-Do', '/todo'], ['Heating', '/heating'], ['Lawn', '/lawn'],
];

function renderNavigation(Layout) {
  render(
    <MemoryRouter initialEntries={['/calendar']}>
      <Routes>
        <Route element={createElement(Layout)}>
          {destinations.map(([label, path]) => (
            <Route key={path} path={path} element={<h2>{label} content</h2>} />
          ))}
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('dashboard navigation', () => {
  it.each([
    ['desktop', App, ''],
    ['mobile', MobileApp, '/mobile'],
  ])('does not resolve the removed Alfred URL on %s', (_name, Root, basename) => {
    const { container } = render(
      <MemoryRouter basename={basename} initialEntries={[`${basename}/alfred`]}>
        {createElement(Root)}
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ['desktop', App, ''],
    ['mobile', MobileApp, '/mobile'],
  ])('keeps the default calendar route on %s', async (_name, Root, basename) => {
    render(
      <MemoryRouter basename={basename} initialEntries={[`${basename}/`]}>
        {createElement(Root)}
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByRole('link', { name: 'Calendar' })).toHaveAttribute('aria-current', 'page'), { timeout: 5000 });
    expect(screen.getByRole('link', { name: 'Calendar' })).toHaveAttribute('href', `${basename}/calendar`);
  });

  it('removes Alfred from the desktop tabs while keeping every other destination usable', () => {
    renderNavigation(MainLayout);

    expect(screen.queryByRole('link', { name: 'Alfred' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(destinations.length);
    for (const [label, path] of destinations) {
      const link = screen.getByRole('link', { name: label });
      expect(link).toHaveAttribute('href', path);
      fireEvent.click(link);
      expect(screen.getByRole('heading', { name: `${label} content` })).toBeInTheDocument();
      expect(link).toHaveAttribute('aria-current', 'page');
    }
  });

  it('keeps mobile tabs and More destinations usable without an Alfred entry', () => {
    renderNavigation(MobileLayout);

    for (const label of ['Calendar', 'Meals', 'Games Room', 'Cold Plunge']) {
      fireEvent.click(screen.getByRole('link', { name: label }));
      expect(screen.getByRole('heading', { name: `${label} content` })).toBeInTheDocument();
    }
    for (const label of ['Home', 'To-Do', 'Weather', 'Spa', 'Add Media', 'Music', 'Cameras', 'People', 'Health', 'Heating', 'Lawn']) {
      fireEvent.click(screen.getByRole('button', { name: 'More' }));
      expect(screen.queryByRole('button', { name: 'Alfred' })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: label === 'Add Media' ? 'Add Movie/TV' : label }));
      expect(screen.getByRole('heading', { name: `${label} content` })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Lawn' })).not.toBeInTheDocument();
    }
  });
});
