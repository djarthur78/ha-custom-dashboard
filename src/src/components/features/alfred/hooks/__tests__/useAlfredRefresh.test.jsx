import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { refreshStates } = vi.hoisted(() => ({ refreshStates: vi.fn() }));

vi.mock('../../../../../services/ha-websocket', () => ({
  default: { refreshStates },
}));

import { useAlfredRefresh } from '../useAlfredRefresh';

describe('useAlfredRefresh', () => {
  beforeEach(() => {
    refreshStates.mockReset();
    refreshStates.mockResolvedValue([]);
    vi.stubGlobal('fetch', vi.fn(() => {
      throw new Error('refresh must not call the Mac Mini API');
    }));
  });

  it('refreshes dashboard entities through the authenticated Home Assistant boundary', async () => {
    const { result } = renderHook(() => useAlfredRefresh());

    await waitFor(() => expect(result.current.refreshing).toBe(false));

    expect(refreshStates).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.error).toBe(null);
    expect(result.current.lastRefresh).toEqual(expect.any(Number));
  });
});
