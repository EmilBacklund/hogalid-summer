import { test, expect } from '@playwright/test';
import { requireEnv, uniqueAlias, TEST_PASSWORD } from './helpers';

// Flow 4: an admin generates an invite through the admin UI, then a brand-new
// player registers with that code.
test('admin generates an invite, new user registers with the code', async ({ page }) => {
  // Admin logs in, then we navigate to /admin directly (avoids depending on the
  // client-side Home→/admin redirect).
  await page.goto('/login');
  await page.getByPlaceholder('t.ex. Fotbollstjej99').fill(requireEnv('ADMIN_ALIAS'));
  await page.getByPlaceholder('Välj ett lösenord').fill(requireEnv('ADMIN_PASSWORD'));
  const [loginRes] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST',
    ),
    page.getByRole('button', { name: /Spela/ }).click(),
  ]);
  expect(loginRes.ok(), `admin login (${loginRes.status()})`).toBeTruthy();
  await page.goto('/admin');

  // Create an invite and capture the generated code from the API response.
  await page.getByLabel('Namn på inbjudan').fill('E2E admin-invite');
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/api/invites') && r.request().method() === 'POST',
    ),
    page.getByRole('button', { name: /Ny invite/ }).click(),
  ]);
  const invite = (await response.json()) as { code: string };
  expect(invite.code).toMatch(/^F15-/);

  // New player registers with the code (fresh, logged-out session).
  await page.context().clearCookies();
  const alias = uniqueAlias('invited');
  await page.goto('/login');
  await page.getByRole('button', { name: 'Ny spelare' }).click();
  await page.getByPlaceholder(/Skriv din kod/).fill(invite.code);
  await page.getByRole('button', { name: /Lås upp/ }).click();
  await expect(page.getByText(/Klar för/)).toBeVisible();

  await page.getByPlaceholder('t.ex. Fotbollstjej99').fill(alias);
  await page.getByPlaceholder('Välj ett lösenord').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /Skapa konto/ }).click();
  await expect(page).not.toHaveURL(/\/login/);
});
