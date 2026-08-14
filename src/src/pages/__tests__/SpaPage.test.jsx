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

describe('SpaPage', () => {
  beforeEach(() => {
    stateMap.clear();
    stateMap.set('sensor.spa_current_temperature', { state: '37.4', attributes: {} });
    stateMap.set('sensor.spa_target_temperature', { state: '38', attributes: {} });
    stateMap.set('sensor.spa_status', { state: 'Filtering', attributes: {} });
    stateMap.set('sensor.spa_water_quality_ph', { state: '7.42', attributes: {} });
    stateMap.set('sensor.spa_water_quality_orp', { state: '705', attributes: {} });
    stateMap.set('sensor.spa_ico_temperature', { state: '37.1', attributes: {} });
    stateMap.set('sensor.spa_ico_battery', { state: '92%', attributes: {} });
    stateMap.set('sensor.spa_ico_recommendation', { state: 'Good', attributes: {} });
    stateMap.set('switch.spa_jets_1', { state: 'off', attributes: {} });
    stateMap.set('switch.spa_jets_2', { state: 'on', attributes: {} });
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
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('37.4°')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('hides the attention banner when no alert is present', () => {
    stateMap.set('binary_sensor.spa_attention_required', { state: 'off', attributes: {} });

    render(<SpaPage />);

    expect(screen.queryByText('Spa needs attention')).not.toBeInTheDocument();
  });
});

