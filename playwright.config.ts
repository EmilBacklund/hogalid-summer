import { defineConfig, devices } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Load .env.local into the test process so it sees ADMIN_ALIAS / ADMIN_PASSWORD
// (the dev server it spawns loads the file itself). Existing env wins.
const envFile = join(process.cwd(), '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1]!;
    const value = match[2]!.trim().replace(/^["']|["']$/g, '');
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // Single worker: the flows share one Turso DB and an in-memory rate limiter,
  // so serial runs stay well under the per-IP limits and avoid cross-test races.
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  // Dev-server route handlers compile on first hit, so give actions/navigation
  // and per-test budgets generous headroom.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
