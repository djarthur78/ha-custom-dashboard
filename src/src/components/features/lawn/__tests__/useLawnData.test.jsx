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
    stateMap.set('sensor.gw3000a_soil_moisture_6', '34');
    stateMap.set('sensor.gw3000a_soil_moisture_8', '38');
  });

  it('includes the repaired flowerbed right-front probe in its area average', () => {
    const { result } = renderHook(() => useLawnData());
    const area = result.current.areas.find((item) => item.key === 'flowerbed-right');

    expect(area.moistureReadings[0]).toMatchObject({ available: true, value: 34 });
    expect(area.avgMoisture).toBe(36);
  });

  it('renders the repaired probe reading', () => {
    const { result } = renderHook(() => useLawnData());
    const area = result.current.areas.find((item) => item.key === 'flowerbed-right');

    render(<AreaCard area={area} compact timer={timer} />);

    expect(screen.queryByText('N/A')).not.toBeInTheDocument();
    expect(screen.getByText('34%')).toBeInTheDocument();
    expect(screen.getByText('38%')).toBeInTheDocument();
    expect(screen.getByText('36%')).toBeInTheDocument();
  });
});
