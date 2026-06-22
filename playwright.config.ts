// ============================================================
// CodeRoute Guinée — Playwright E2E configuration
// ============================================================
// Smoke test suite covering the critical user journeys:
//   - Landing page loads + theme toggle works
//   - Auth flows (login as each role)
//   - Candidate exam flow
//   - Booking + payment sandbox
//   - Admin dashboard navigation
//
// Run:  npm run test:e2e
//   UI:  npm run test:e2e:ui
// Debug: npm run test:e2e:debug
// ============================================================

import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT || '3000';
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Sequential — same SQLite DB
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : [['html', { open: 'never' }], ['list']],
  timeout: 30_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'fr-FR',
    timezoneId: 'Africa/Conakry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile viewport — covers responsive design smoke
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testMatch: /.*\.mobile\.spec\.ts/,
    },
  ],
  // Auto-start dev server if not running
  webServer: process.env.E2E_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'npm run dev',
        url: BASE_URL,
        timeout: 60_000,
        reuseExistingServer: true,
        stdout: 'ignore',
        stderr: 'pipe',
      },
});
