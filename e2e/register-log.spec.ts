import { test, expect } from '@playwright/test';
import { createInvite, uniqueAlias, TEST_PASSWORD } from './helpers';

// Flow 1: a new player registers with an invite, logs an exercise, and sees
// their points reflected on the profile. End-to-end through the real UI + API.
test('register via invite, log an exercise, see points on profile', async ({ page }) => {
  const { token } = await createInvite('E2E register-log');
  const alias = uniqueAlias('reglog');

  // Register: the invite token in the URL auto-validates and flips to register mode.
  await page.goto(`/login?invite=${token}`);
  // A valid invite flips to register mode and shows the "ready" confirmation.
  await expect(page.getByText(/Klar för/)).toBeVisible();
  await page.getByPlaceholder('t.ex. Fotbollstjej99').fill(alias);
  await page.getByPlaceholder('Välj ett lösenord').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /Skapa konto/ }).click();

  // Landed in the app (no longer on the login screen).
  await expect(page).not.toHaveURL(/\/login/);

  // Log 40 passningar (clears the 30-touch threshold).
  await page.goto('/log');
  await expect(page.getByText('Dagbok 📕')).toBeVisible();
  await page.getByLabel(/Passningar.*touch/).fill('40');
  await page.getByRole('button', { name: /^Spara/ }).click();
  await expect(page.getByRole('button', { name: /Sparat/ })).toBeVisible();

  // Stats updated: the profile shows a non-zero point total.
  await page.goto('/profile');
  await expect(page.getByText(/[1-9]\d* poäng/)).toBeVisible();
});
