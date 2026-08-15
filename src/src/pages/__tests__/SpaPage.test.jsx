import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SpaPage from '../SpaPage';

const stateMap = new Map();

vi.mock('../../hooks/useEntity', () => ({
  useEntity: vi.fn((entityId) => stateMap.get(entityId) || { state: undefined, attributes: {} }),
}));

vi.mock('../../hooks/useServiceCall', () => ({
  useServiceCall: vi.fn(() => ({
    callService: vi.fn(),
    toggle: vi.fn(),
    loading: false,
  })),
}));

vi.mock('../../hooks/useHAConnection', () => ({
  useHAConnection: () => ({ isConnected: false }),
}));

vi.mock('../../components/features/spa/hooks/useSpaHistory', () => ({
  useSpaHistory: () => {
    const now = Date.now() / 1000;
    const points = (values) => values.map((value, index) => ({ s: String(value), lu: now - (values.length - index) * 3600 }));
    return {
      history: {
        'sensor.spa_current_temperature': points([37.2, 37.4]),
        'sensor.hot_tub_temperature': points([36.9, 37.1]),
        'number.spa_target_desired_temperature': points([38, 38]),
        'sensor.hot_tub_ph': points([7.4, 7.42]),
        'sensor.hot_tub_oxydo_reduction_potential': points([700, 705]),
      },
      loading: false,
      error: null,
    };
  },
}));

describe('SpaPage', () => {
  beforeEach(() => {
    stateMap.clear();
    stateMap.set('sensor.spa_current_temperature', { state: '37.4', attributes: {} });
    stateMap.set('number.spa_target_desired_temperature', { state: '38', attributes: {} });
    stateMap.set('select.spa_heater_mode', { state: 'Filtering', attributes: {} });
    stateMap.set('input_number.spa_standby_temperature', { state: '30', attributes: {} });
    stateMap.set('input_number.spa_ph_minimum', { state: '7.2', attributes: {} });
    stateMap.set('input_number.spa_ph_maximum', { state: '7.6', attributes: {} });
    stateMap.set('input_number.spa_orp_minimum', { state: '550', attributes: {} });
    stateMap.set('input_number.spa_orp_maximum', { state: '650', attributes: {} });
    stateMap.set('sensor.hot_tub_ph', { state: '7.42', attributes: {}, lastUpdated: '2026-08-14T18:37:16.485Z' });
    stateMap.set('sensor.hot_tub_oxydo_reduction_potential', { state: '600', attributes: {} });
    stateMap.set('sensor.hot_tub_temperature', { state: '37.1', attributes: {}, lastUpdated: '2026-08-14T18:37:16.485Z' });
    stateMap.set('sensor.hot_tub_battery', { state: '92', attributes: {} });
    stateMap.set('sensor.spa_ico_recommendation', { state: '0', attributes: {} });
    stateMap.set('switch.spa_pump_1', { state: 'off', attributes: {} });
    stateMap.set('switch.spa_pump_2', { state: 'on', attributes: {} });
    stateMap.set('switch.spa_blower', { state: 'off', attributes: {} });
    stateMap.set('switch.spa_lights', { state: 'off', attributes: {} });
    stateMap.set('media_player.spa_sonos_port', {
      state: 'playing',
      attributes: {
        media_title: 'Spa Session',
        media_artist: 'DJ Test',
        entity_picture: 'https://example.com/art.jpg',
        volume_level: 0.42,
      },
    });
  });

  it('renders the spa control layout', () => {
    render(<SpaPage />);

    expect(screen.getByText('Spa')).toBeInTheDocument();
    expect(screen.getByText('Chemistry')).toBeInTheDocument();
    expect(screen.getByText('Temperature & controls')).toBeInTheDocument();
    expect(screen.getByText('ICO water quality')).toBeInTheDocument();
    expect(screen.getByText('Spa history')).toBeInTheDocument();
    expect(screen.getAllByText('Good to use').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('37.4°C')).toHaveLength(1);
    expect(screen.getByText('7.42')).toBeInTheDocument();
    expect(screen.getByText(/Last reading/)).toBeInTheDocument();
    expect(screen.getByText('Ready 38°')).toBeInTheDocument();
    expect(screen.getByText('Eco')).toBeInTheDocument();
    expect(screen.queryByText('Sonos')).not.toBeInTheDocument();
    expect(screen.queryByText('Next step')).not.toBeInTheDocument();
    expect(document.querySelectorAll('svg[role="img"] path').length).toBeGreaterThan(0);
  });

  it('hides the attention banner when no alert is present', () => {
    stateMap.set('binary_sensor.spa_attention_required', { state: 'off', attributes: {} });

    render(<SpaPage />);

    expect(screen.queryByText('Spa needs attention')).not.toBeInTheDocument();
  });

  it('explains an active ICO recommendation with the concrete action', () => {
    stateMap.set('sensor.spa_ico_recommendation', {
      state: '1',
      attributes: {
        recommendations: [{
          title: 'Add 24 g of pH Plus',
          action: 'Add 24 g of pH Plus',
          message: 'Raise pH by 0.1 with careful dosing.',
        }, {
          title: 'Add 8 g of bromine shock',
          action: 'Add 8 g of bromine shock',
          message: 'Increase disinfection after the pH correction.',
        }],
      },
    });
    stateMap.set('sensor.hot_tub_oxydo_reduction_potential', { state: '500', attributes: {} });
    stateMap.set('sensor.hot_tub_ph', { state: '7.08', attributes: {}, lastUpdated: '2026-08-14T18:37:16.485Z' });

    render(<SpaPage />);

    expect(screen.getByText('Active ICO tasks')).toBeInTheDocument();
    expect(screen.getByText('2 shown')).toBeInTheDocument();
    expect(screen.getByText('Add 24 g of pH Plus')).toBeInTheDocument();
    expect(screen.getByText('Add 8 g of bromine shock')).toBeInTheDocument();
  });

  it('hides a stale completed-style recommendation when the live reading is back in range', () => {
    stateMap.set('sensor.spa_ico_recommendation', {
      state: '1',
      attributes: {
        recommendations: [{
          title: 'Add 36 g of pH Minus - Gradual correction',
          message: 'This old action should not be shown while pH is in range.',
        }],
      },
    });
    stateMap.set('sensor.hot_tub_oxydo_reduction_potential', { state: '600', attributes: {} });

    render(<SpaPage />);

    expect(screen.queryByText('Next step')).not.toBeInTheDocument();
    expect(screen.queryByText('This old action should not be shown while pH is in range.')).not.toBeInTheDocument();
  });

  it('hides recommendations when the ICO task list is stale', () => {
    stateMap.set('sensor.spa_ico_recommendation', {
      state: '1',
      lastUpdated: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
      attributes: {
        recommendations: [{
          title: 'Add 8 g of slow bromine',
          status: 'waiting',
        }],
      },
    });
    stateMap.set('sensor.hot_tub_oxydo_reduction_potential', { state: '450', attributes: {} });

    render(<SpaPage />);

    expect(screen.getByText('Checking ICO')).toBeInTheDocument();
    expect(screen.queryByText('Add 8 g of slow bromine')).not.toBeInTheDocument();
  });

  it('does not render recommendations already marked completed by ICO', () => {
    stateMap.set('sensor.spa_ico_recommendation', {
      state: '1',
      attributes: {
        recommendations: [{
          title: 'Carry out weekly maintenance',
          status: 'ok',
        }],
      },
    });

    render(<SpaPage />);

    expect(screen.queryByText('Carry out weekly maintenance')).not.toBeInTheDocument();
    expect(screen.queryByText('Active ICO tasks')).not.toBeInTheDocument();
  });
});
