import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const logout = vi.fn();
let ctx: Record<string, unknown> = {};
vi.mock('@/providers/UserProvider', () => ({
  useUser: () => ctx,
}));

import { TopBar } from './TopBar';

describe('TopBar', () => {
  it('shows the user pill and logs out when authenticated', () => {
    ctx = {
      user: { displayAlias: 'Maja', alias: 'maja' },
      isAdmin: false,
      isAuthenticated: true,
      logout,
    };
    render(<TopBar />);
    expect(screen.getByText('Maja')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Logga ut' }));
    expect(logout).toHaveBeenCalledOnce();
  });

  it('hides the logout control when unauthenticated', () => {
    ctx = { user: null, isAdmin: false, isAuthenticated: false, logout };
    render(<TopBar />);
    expect(screen.queryByRole('button', { name: 'Logga ut' })).toBeNull();
  });
});
