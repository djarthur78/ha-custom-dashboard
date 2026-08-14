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

describe('SpaPage', () => {
  beforeEach(() => {
    stateMap.clear();
    stateMap.set('sensor.spa_current_temperature', { state: '37.4', attributes: {} });
    stateMap.set('number.spa_target_desired_temperature', { state: '38', attributes: {} });
    stateMap.set('select.spa_heater_mode', { state: 'Filtering', attributes: {} });
    stateMap.set('sensor.hot_tub_ph', { state: '7.42', attributes: {} });
    stateMap.set('sensor.hot_tub_oxydo_reduction_potential', { state: '705', attributes: {} });
    stateMap.set('sensor.hot_tub_temperature', { state: '37.1', attributes: {} });
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
    expect(screen.getByText('Water Quality')).toBeInTheDocument();
    expect(screen.getByText('Spa Controls')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Sonos')).toBeInTheDocument();
    expect(screen.getByText('Spa History')).toBeInTheDocument();
    expect(screen.getByText('37.4°')).toBeInTheDocument();
    expect(screen.getByText('7.42')).toBeInTheDocument();
    expect(screen.getByText('705 mV')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
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
          title: 'Add 22 g of bromine shock',
          action: 'Add 22 g of bromine shock',
          message: 'Adjust pH first and run filtration for a few hours.',
        }],
      },
    });

    render(<SpaPage />);

    expect(screen.getByText('ICO action')).toBeInTheDocument();
    expect(screen.getByText('Add 22 g of bromine shock')).toBeInTheDocument();
    expect(screen.getByText('Adjust pH first and run filtration for a few hours.')).toBeInTheDocument();
  });
});
