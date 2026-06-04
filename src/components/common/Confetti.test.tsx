import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Confetti } from './Confetti';

describe('Confetti', () => {
  it('renders 32 pieces when active', () => {
    const { container } = render(<Confetti active />);
    expect(container.querySelectorAll('.animate-confetti-fall')).toHaveLength(32);
  });

  it('renders nothing when inactive', () => {
    const { container } = render(<Confetti active={false} />);
    expect(container.firstChild).toBeNull();
  });
});
