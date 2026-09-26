import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SceneButtons } from '../SceneButtons';

const mockCallService = vi.fn();

vi.mock('../hooks/useHarmonyActivity', () => ({
  useHarmonyActivity: () => ({ currentActivity: 'power_off' }),
}));

vi.mock('../../../../hooks/useEntity', () => ({
  useEntity: () => ({ state: 'below_horizon', attributes: { elevation: -5 } }),
}));

vi.mock('../../../../hooks/useServiceCall', () => ({
  useServiceCall: () => ({ callService: mockCallService, loading: false }),
}));

describe('SceneButtons', () => {
  beforeEach(() => {
    mockCallService.mockReset();
    mockCallService.mockResolvedValue(undefined);
  });

  it('turns on both garden lighting systems when starting an activity after dusk', async () => {
    render(<SceneButtons />);

    fireEvent.click(screen.getByRole('button', { name: 'Movie' }));

    await waitFor(() => {
      expect(mockCallService).toHaveBeenNthCalledWith(1, 'homeassistant', 'turn_on', {
        entity_id: expect.arrayContaining([
          'switch.iport_area_4',
          'light.back_garden_back_garden',
        ]),
      });
    });
  });
});
