import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PowerGrid } from '../PowerGrid';

const mockCallService = vi.fn();

vi.mock('../hooks/usePowerDevices', () => ({
  usePowerDevices: () => ({
    totalConsumption: 0,
    devices: [
      { id: 'cinema', label: 'Cinema', icon: 'Film', switchEntity: 'switch.iport_area_1', switchState: 'off', loading: false },
      { id: 'pool_table', label: 'Pool Table', icon: 'Triangle', switchEntity: 'switch.iport_area_2', switchState: 'off', loading: false },
      { id: 'bar', label: 'Bar', icon: 'Wine', switchEntity: 'switch.iport_area_3', switchState: 'off', loading: false },
      { id: 'outdoor', label: 'Garden Lights', icon: 'Trees', switchEntity: 'switch.iport_area_4', switchState: 'off', loading: false },
    ],
  }),
}));

vi.mock('../../../../hooks/useServiceCall', () => ({
  useServiceCall: () => ({
    callService: mockCallService,
    toggle: vi.fn(),
    loading: false,
  }),
}));

vi.mock('../../../../hooks/useEntity', () => ({
  useEntity: () => ({ state: 'off', loading: false }),
}));

describe('PowerGrid', () => {
  beforeEach(() => {
    mockCallService.mockReset();
  });

  it('toggles both garden lighting systems from the garden lights button', () => {
    render(<PowerGrid />);

    fireEvent.click(screen.getByRole('button', { name: /Garden Lights/ }));

    expect(mockCallService).toHaveBeenCalledWith('homeassistant', 'turn_on', {
      entity_id: [
        'switch.iport_area_4',
        'light.back_garden_back_garden',
      ],
    });
  });
});
