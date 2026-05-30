import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/hooks/useConfig', () => ({
  useConfig: () => ({ data: { seasonStart: null, countdownDate: '2099-01-01' } }),
}));

import { Countdown } from './Countdown';

describe('Countdown', () => {
  it('shows the countdown for a future target', () => {
    render(<Countdown />);
    expect(screen.getByText('Första träningen')).toBeInTheDocument();
  });
});
