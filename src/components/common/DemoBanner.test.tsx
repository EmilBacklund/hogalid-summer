import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DemoBanner } from './DemoBanner';

const logout = vi.fn();
let mockIsDemo = false;
vi.mock('@/providers/UserProvider', () => ({
  useUser: () => ({ isDemo: mockIsDemo, logout }),
}));

describe('DemoBanner', () => {
  it('renders nothing when not in demo', () => {
    mockIsDemo = false;
    const { container } = render(<DemoBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the demo notice and exits via logout', () => {
    mockIsDemo = true;
    render(<DemoBanner />);
    expect(screen.getByText(/Demoläge/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Avsluta demo/ }));
    expect(logout).toHaveBeenCalledOnce();
  });
});
