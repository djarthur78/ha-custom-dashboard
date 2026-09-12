import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, renderHook, screen } from '@testing-library/react';
import { AreaCard } from '../AreaCard';
import { useLawnData } from '../hooks/useLawnData';

const stateMap = new Map();

vi.mock('../../../../hooks/useEntity', () => ({
  useEntity: vi.fn((entityId) => ({
    state: stateMap.get(entityId) ?? 'off',
    lastChanged: null,
  })),
}));

const timer = {
  startWatering: vi.fn(),
  stopWatering: vi.fn(),
  checkMoistureHardStop: vi.fn(),
  getTimeRemaining: vi.fn(() => null),
  isRunning: vi.fn(() => false),
  loading: false,
};

describe('useLawnData', () => {
  beforeEach(() => {
    stateMap.clear();
    stateMap.set('sensor.gw3000a_soil_moisture_6', '99');
    stateMap.set('sensor.gw3000a_soil_moisture_8', '35');
  });

  it('excludes the failed flowerbed right-front probe from its area average', () => {
    const { result } = renderHook(() => useLawnData());
    const area = result.current.areas.find((item) => item.key === 'flowerbed-right');

    expect(area.moistureReadings[0]).toMatchObject({ available: false, value: null });
    expect(area.avgMoisture).toBe(35);
  });

  it('renders the failed probe as N/A', () => {
    const { result } = renderHook(() => useLawnData());
    const area = result.current.areas.find((item) => item.key === 'flowerbed-right');

    render(<AreaCard area={area} compact timer={timer} />);

    expect(screen.getByText('N/A')).toBeInTheDocument();
    expect(screen.getAllByText('35%')).toHaveLength(2);
  });
});
