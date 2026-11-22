import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SceneButtons } from '../SceneButtons';
import { SCENES } from '../gamesRoomConfig';
import { GamesRoomPage } from '../../../../pages/GamesRoomPage';
import { MobileGamesRoomPage } from '../../../../pages/mobile/MobileGamesRoomPage';

const mocks = vi.hoisted(() => ({ callService: vi.fn(), entities: {} }));
const selector = 'select.192_168_1_230_activity';
const activities = [
  ['Movie', 'Watch Movie'], ['Sky TV', 'Watch Sky'],
  ['Netflix', 'Watch Netflix / Amazon'], ['Sonos', 'Listen to SONOS'],
];
const preparation = [
  'switch.gr_avr', 'switch.gr_subwoofer', 'switch.lounge_subwoofer',
  'switch.christmas_front_left', 'switch.unnamed_p304m_smart_plug_2',
  'switch.unnamed_p304m_games_room_sonos_port', 'switch.sky_games_room',
  'switch.iport_area_2', 'switch.iport_area_3',
];
const garden = [
  'switch.iport_area_4', 'light.back_garden_back_garden',
  'switch.gazebo_lights_sonoff_100026cdb4',
];
vi.mock('../../../../services/ha-websocket', () => ({ default: { callService: mocks.callService } }));
vi.mock('../../../../hooks/useEntity', () => ({
  useEntity: (id) => mocks.entities[id] || { state: 'off', attributes: {}, loading: false },
}));
vi.mock('../ClimateCard', () => ({ ClimateCard: () => null }));
vi.mock('../PowerGrid', () => ({ PowerGrid: () => null }));
vi.mock('../hooks/useMediaPlayers', () => ({
  useMediaPlayers: () => ({ activePlayer: null, volumeLevel: null, loading: false }),
}));
afterEach(() => vi.restoreAllMocks());
beforeEach(() => {
  mocks.callService.mockReset().mockResolvedValue(undefined);
  mocks.entities = {
    [selector]: {
      state: 'Powered Off', attributes: { options: ['Powered Off', ...activities.map(([, option]) => option), 'PlayStation 5'] },
      loading: false, error: null,
    },
    'sun.sun': { state: 'below_horizon', attributes: { elevation: -5 } },
  };
});
describe.each([
  ['shared', SceneButtons], ['desktop', GamesRoomPage], ['mobile', MobileGamesRoomPage],
])('%s Games Room activities', (layout, Component) => {
  it.each(activities)(`${layout}: prepares the room then selects %s with no other service calls`, async (label, option) => {
    let finishPreparation;
    mocks.callService.mockImplementationOnce(() => new Promise(resolve => { finishPreparation = resolve; }));
    render(createElement(Component));
    fireEvent.click(screen.getByRole('button', { name: label }));
    expect(mocks.callService.mock.calls).toEqual([
      ['homeassistant', 'turn_on', { entity_id: [...preparation, ...garden] }],
    ]);
    expect(screen.getByRole('button', { name: label })).toBeDisabled();
    await act(async () => finishPreparation());
    await waitFor(() => expect(mocks.callService.mock.calls).toEqual([
      ['homeassistant', 'turn_on', { entity_id: [...preparation, ...garden] }],
      ['select', 'select_option', { entity_id: selector, option }],
    ]));
    await waitFor(() => expect(screen.getByRole('button', { name: label })).toBeEnabled());
    expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'false');
  });
  it.each([...activities, ['All Off', 'Powered Off']])('highlights %s from native selection updates', (label, option) => {
    const { rerender } = render(createElement(Component));
    mocks.entities[selector].state = option;
    rerender(createElement(Component));
    for (const [buttonLabel] of [...activities, ['All Off']]) {
      expect(screen.getByRole('button', { name: buttonLabel })).toHaveAttribute('aria-pressed', String(buttonLabel === label));
    }
  });

  it('switches sources without inserting shutdown or changing preparation', async () => {
    mocks.entities[selector].state = 'Listen to SONOS';
    const { rerender } = render(createElement(Component));
    fireEvent.click(screen.getByRole('button', { name: 'Sky TV' }));
    await waitFor(() => expect(mocks.callService).toHaveBeenCalledTimes(2));
    expect(mocks.callService.mock.calls).toEqual([
      ['homeassistant', 'turn_on', { entity_id: [...preparation, ...garden] }],
      ['select', 'select_option', { entity_id: selector, option: 'Watch Sky' }],
    ]);
    expect(screen.getByRole('button', { name: 'Sonos' })).toHaveAttribute('aria-pressed', 'true');
    mocks.entities[selector].state = 'Watch Sky';
    rerender(createElement(Component));
    expect(screen.getByRole('button', { name: 'Sky TV' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe.each([['desktop', GamesRoomPage], ['mobile', MobileGamesRoomPage]])(
  '%s idle media status', (layout, Component) => {
    it(`${layout} reports native selection without a readiness claim`, () => {
      mocks.entities[selector].state = 'Watch Netflix / Amazon';
      render(createElement(Component));
      if (layout === 'mobile') fireEvent.click(screen.getByRole('button', { name: 'Now Playing' }));
      expect(screen.getByText(/Selected activity:/)).toHaveTextContent('Selected activity: Watch Netflix / Amazon');
      expect(screen.getByText('Nothing Playing')).toBeInTheDocument();
    });
  },
);
describe('SceneButtons safeguards', () => {
  it.each([
    ['above_horizon', 10, false], ['above_horizon', 3, true], ['below_horizon', 10, true],
  ])('preserves garden lighting at %s elevation %s', async (state, elevation, includeGarden) => {
    mocks.entities['sun.sun'] = { state, attributes: { elevation } };
    render(<SceneButtons />);
    fireEvent.click(screen.getByRole('button', { name: 'Movie' }));
    await waitFor(() => expect(mocks.callService).toHaveBeenCalledTimes(2));
    expect(mocks.callService.mock.calls[0]).toEqual([
      'homeassistant', 'turn_on', { entity_id: [...preparation, ...(includeGarden ? garden : [])] },
    ]);
  });
  it.each(['unavailable', 'unknown', undefined])('blocks preparation when selector is %s', state => {
    mocks.entities[selector].state = state;
    render(<SceneButtons />);
    for (const [label] of activities) {
      expect(screen.getByRole('button', { name: label })).toBeDisabled();
      expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'false');
    }
    expect(screen.getByRole('button', { name: 'All Off' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'All Off' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('alert')).toHaveTextContent(/unavailable/i);
    expect(mocks.callService).not.toHaveBeenCalled();
  });
  it.each(['loading', 'error'])('blocks preparation during selector %s', field => {
    mocks.entities[selector][field] = field === 'loading' ? true : 'Selector read failed';
    render(<SceneButtons />);
    for (const [label] of activities) expect(screen.getByRole('button', { name: label })).toBeDisabled();
    expect(mocks.callService).not.toHaveBeenCalled();
  });
  it('blocks only activities missing from native options', () => {
    mocks.entities[selector].attributes.options = ['Powered Off', 'Watch Sky'];
    render(<SceneButtons />);
    expect(screen.getByRole('button', { name: 'Movie' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Sky TV' })).toBeEnabled();
  });
  it.each([1, 2])('shows failure at service step %s and allows retry without fallback', async step => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    if (step === 2) mocks.callService.mockResolvedValueOnce(undefined);
    mocks.callService.mockRejectedValueOnce(new Error('Service rejected'));
    render(<SceneButtons />);
    fireEvent.click(screen.getByRole('button', { name: 'Movie' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Service rejected'));
    expect(mocks.callService).toHaveBeenCalledTimes(step);
    fireEvent.click(screen.getByRole('button', { name: 'Movie' }));
    await waitFor(() => expect(mocks.callService).toHaveBeenCalledTimes(step + 2));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Movie' })).toBeEnabled();
    expect(mocks.callService.mock.calls.every(([domain]) => ['homeassistant', 'select'].includes(domain))).toBe(true);
  });
  it('preserves the shutdown automation without frontend power commands', async () => {
    render(<SceneButtons />);
    fireEvent.click(screen.getByRole('button', { name: 'All Off' }));
    await waitFor(() => expect(mocks.callService.mock.calls).toEqual([
      ['automation', 'trigger', { entity_id: 'automation.turn_off_games_room' }],
    ]));
  });
});


describe.each([['desktop', GamesRoomPage], ['mobile', MobileGamesRoomPage]])(
  '%s PS5 source', (layout, Component) => {
    it(`${layout}: renders four existing sources then full-width purple PS5 and Off`, () => {
      render(createElement(Component));
      const ps5 = screen.getByRole('button', { name: 'PS5' });
      const off = screen.getByRole('button', { name: 'All Off' });
      const grid = screen.getByRole('button', { name: 'Movie' }).parentElement;
      expect(grid).toHaveClass('grid', 'grid-cols-2');
      expect([...grid.children].map(button => button.textContent)).toEqual(['Movie', 'Sky TV', 'Netflix', 'Sonos']);
      expect(ps5.parentElement).toBe(grid.parentElement);
      expect(ps5.previousElementSibling).toBe(grid);
      expect(ps5.nextElementSibling).toBe(off);
      expect(ps5).toHaveClass('w-full');
      expect(off).toHaveClass('w-full');
      expect(ps5).toHaveStyle({ backgroundColor: '#ede9fe', color: '#7c3aed' });
      expect(SCENES.find(scene => scene.id === 'ps5')).toMatchObject({ icon: 'Gamepad2', activity: 'PlayStation 5' });
    });
    it(`${layout}: calls only the shared preparation script and tracks native selection`, async () => {
      let finish;
      mocks.callService.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
      const { rerender } = render(createElement(Component));
      fireEvent.click(screen.getByRole('button', { name: 'PS5' }));
      expect(mocks.callService.mock.calls).toEqual([
        ['script', 'games_room_prepare_source', { source: 'PlayStation 5' }],
      ]);
      for (const label of ['Movie', 'Sky TV', 'Netflix', 'Sonos', 'PS5', 'All Off']) {
        expect(screen.getByRole('button', { name: label })).toBeDisabled();
      }
      expect(screen.getByRole('button', { name: 'PS5' })).toHaveAttribute('aria-pressed', 'false');
      await act(async () => finish());
      expect(screen.getByRole('button', { name: 'PS5' })).toBeEnabled();
      mocks.entities[selector].state = 'PlayStation 5';
      rerender(createElement(Component));
      expect(screen.getByRole('button', { name: 'PS5' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'PS5' })).toHaveStyle({ backgroundColor: '#7c3aed', color: 'rgb(255, 255, 255)' });
      expect(screen.getByRole('button', { name: 'All Off' })).toHaveAttribute('aria-pressed', 'false');
      expect(mocks.callService).toHaveBeenCalledTimes(1);
    });
    it.each(['unavailable', 'unknown', undefined, 'missing', 'absent-option', 'absent-options', 'invalid-case', 'loading', 'error'])(
      `${layout}: blocks PS5 when native selector is %s`, condition => {
        if (condition === 'missing') mocks.entities[selector] = { loading: false };
        else if (condition === 'absent-option') mocks.entities[selector].attributes.options = ['Powered Off', ...activities.map(([, option]) => option)];
        else if (condition === 'absent-options') delete mocks.entities[selector].attributes.options;
        else if (condition === 'invalid-case') mocks.entities[selector].attributes.options = ['Playstation 5'];
        else if (condition === 'loading') mocks.entities[selector].loading = true;
        else if (condition === 'error') mocks.entities[selector].error = 'Read failed';
        else mocks.entities[selector].state = condition;
        render(createElement(Component));
        const ps5 = screen.getByRole('button', { name: 'PS5' });
        expect(ps5).toBeDisabled();
        if (condition === 'absent-option') expect(screen.getByRole('button', { name: 'Movie' })).toBeEnabled();
        if (['unavailable', 'unknown', undefined, 'missing', 'loading', 'error'].includes(condition)) {
          expect(screen.getByRole('alert')).toHaveTextContent(/unavailable/i);
        }
        fireEvent.click(ps5);
        expect(mocks.callService).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'All Off' })).toBeEnabled();
      },
    );
    it(`${layout}: reports script failure and retries without a direct native fallback`, async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mocks.callService.mockRejectedValueOnce(new Error('PS5 preparation failed'));
      render(createElement(Component));
      fireEvent.click(screen.getByRole('button', { name: 'PS5' }));
      await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('PS5 preparation failed'));
      expect(screen.getByRole('button', { name: 'PS5' })).toBeEnabled();
      fireEvent.click(screen.getByRole('button', { name: 'PS5' }));
      await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
      expect(mocks.callService.mock.calls).toEqual([
        ['script', 'games_room_prepare_source', { source: 'PlayStation 5' }],
        ['script', 'games_room_prepare_source', { source: 'PlayStation 5' }],
      ]);
    });
  },
);
