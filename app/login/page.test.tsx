import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));
vi.mock('@/utils/api', () => ({ apiGet: vi.fn(), apiPost: vi.fn().mockResolvedValue({}) }));

import LoginPage from './page';
import { apiPost } from '@/utils/api';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <LoginPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, '', '/login');
});

describe('LoginPage', () => {
  it('logs in via the cookie endpoint', async () => {
    renderPage();
    fireEvent.change(screen.getByPlaceholderText('t.ex. Fotbollstjej99'), {
      target: { value: 'maja' },
    });
    fireEvent.change(screen.getByPlaceholderText('Välj ett lösenord'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Spela/ }));
    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/auth/login', { alias: 'maja', password: 'secret' }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
  });

  it('requires an invite before registering', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Ny spelare' }));
    expect(screen.getByText('Inbjudan krävs')).toBeInTheDocument();
    // Submit is disabled until an invite is validated.
    expect(screen.getByRole('button', { name: /Skapa konto/ })).toBeDisabled();
  });

  it('enters demo mode and navigates home, without any auth call', async () => {
    window.sessionStorage.clear();
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Prova appen som förälder/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
    expect(window.sessionStorage.getItem('hf_demo')).toBe('1');
    expect(apiPost).not.toHaveBeenCalled();
  });

  it('exits demo before a real login (no demo flag survives)', async () => {
    window.sessionStorage.setItem('hf_demo', '1');
    renderPage();
    fireEvent.change(screen.getByPlaceholderText('t.ex. Fotbollstjej99'), {
      target: { value: 'maja' },
    });
    fireEvent.change(screen.getByPlaceholderText('Välj ett lösenord'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Spela/ }));
    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/auth/login', expect.anything()));
    expect(window.sessionStorage.getItem('hf_demo')).toBeNull();
  });
});
