import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { StatusHero } from '../StatusHero';

vi.mock('../../../../hooks/useEntity', () => ({
  useEntity: vi.fn(() => ({ state: 'unknown', attributes: {} })),
}));

describe('StatusHero', () => {
  it('does not expose the removed Run Doctor control', () => {
    render(<StatusHero refreshing={false} error={null} onRefresh={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /run doctor/i })).not.toBeInTheDocument();
  });
});
