import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ColdPlungePage from '../ColdPlungePage';

const stateMap = new Map();

vi.mock('../../hooks/useEntity', () => ({
  useEntity: vi.fn((entityId) => stateMap.get(entityId) || { state: undefined, attributes: {} }),
}));

vi.mock('../../components/features/cold-plunge/hooks/useColdPlungeHistory', () => ({
  useColdPlungeHistory: () => {
    const now = Date.now() / 1000;
    return {
      history: [
        { s: '7.8', lu: now - 4 * 60 * 60 },
        { s: '7.5', lu: now - 2 * 60 * 60 },
        { s: '7.2', lu: now - 60 * 60 },
      ],
      loading: false,
      error: null,
    };
  },
}));

vi.mock('../../services/ha-rest', () => ({
  getTriggerStats: vi.fn(() => new Promise(() => {})),
}));

vi.mock('../../services/ha-websocket', () => ({
  default: { callService: vi.fn() },
}));

describe('ColdPlungePage', () => {
  beforeEach(() => {
    stateMap.clear();
    stateMap.set('sensor.cold_plunge_temp_cold_plunge_water_temp', { state: '7.2', attributes: {} });
  });

  it('shows the current water temperature and its 24-hour history in the left pane', () => {
    render(<ColdPlungePage />);

    expect(screen.getByText('Water Temperature')).toBeInTheDocument();
    expect(screen.getByText('Temperature history')).toBeInTheDocument();
    expect(screen.getByText('Current 7.2°C')).toBeInTheDocument();
    const chart = screen.getByRole('img', { name: 'Cold plunge water temperature over the last 24 hours' });
    expect(chart.querySelector('path')).not.toBeNull();
  });
});
