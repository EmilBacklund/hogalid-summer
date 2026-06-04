import { test, expect } from '@playwright/test';
import { registerAndSignIn, tinyPngBuffer } from './helpers';

// Flow 3: a signed-in player uploads a photo and the album reflects it.
// (Photo bytes use the local-disk storage fallback in dev — see photoStorage.ts.)
test('upload a photo and fetch it back from the album', async ({ page }) => {
  await registerAndSignIn(page, 'photo');

  await page.goto('/team/photos');
  const counter = page.getByText(/uppladdning(ar)? kvar den här veckan/);
  await expect(counter).toContainText('2'); // fresh user: 2 uploads available

  const [uploadRes] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/photos') && r.request().method() === 'POST'),
    page.locator('input[type="file"]').setInputFiles({
      name: 'minne.png',
      mimeType: 'image/png',
      buffer: tinyPngBuffer(),
    }),
  ]);
  expect(uploadRes.ok(), `upload (${uploadRes.status()})`).toBeTruthy();
  const { photo } = (await uploadRes.json()) as { photo: { url: string } };

  // Round-trip: the stored bytes are served back through the auth-gated endpoint.
  const bytesRes = await page.request.get(photo.url);
  expect(bytesRes.ok(), `fetch bytes (${bytesRes.status()})`).toBeTruthy();
  expect(bytesRes.headers()['content-type'] ?? '').toContain('image');
});
