import { test, expect } from '@playwright/test';

// Smoke test for the Session 4 auth redirect. The full E2E suite runs in S12;
// this documents the critical guard: an unauthenticated visitor never sees a
// protected screen.
test.describe('auth redirect', () => {
  test('unauthenticated visit to / redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Logga in' })).toBeVisible();
  });

  test('a protected route also redirects to /login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login$/);
  });
});
