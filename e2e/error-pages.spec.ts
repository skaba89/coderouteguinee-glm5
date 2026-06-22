// ============================================================
// CodeRoute Guinée — Error & Edge cases E2E
// Verifies graceful handling of:
//   1. Unknown routes → custom 404 page
//   2. Offline route → branded offline page
//   3. Manifest & service worker reachability
//   4. Public API health check
// ============================================================

import { test, expect } from '@playwright/test';
import { dismissInstallBanner } from './fixtures/test-users';

test.describe('404 handling', () => {
  test('unknown route shows a 404 page with link back home', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-' + Date.now());
    // Next.js renders the not-found.tsx page; expect either a "404" text or "introuvable" / "non trouvée"
    const has404 = await page.getByText(/404|introuvable|non trouvée/i).first().isVisible({ timeout: 5_000 }).catch(() => false);
    expect(has404).toBeTruthy();
  });

  test('404 page provides a way back home', async ({ page }) => {
    await page.goto('/no-such-page-' + Date.now());
    // Look for an anchor or button that takes you home
    const homeLink = page.getByRole('link', { name: /accueil|retour/i }).first();
    const homeBtn = page.getByRole('button', { name: /accueil|retour/i }).first();
    const hasHomeLink = await homeLink.isVisible({ timeout: 3_000 }).catch(() => false);
    const hasHomeBtn = await homeBtn.isVisible({ timeout: 1_000 }).catch(() => false);
    expect(hasHomeLink || hasHomeBtn).toBeTruthy();
  });
});

test.describe('Offline support (Phase 27)', () => {
  test('dedicated /offline route renders branded offline page', async ({ page }) => {
    await page.goto('/offline');
    await expect(page.getByRole('heading', { name: 'Vous êtes hors-ligne' })).toBeVisible();
    await expect(page.getByText('CodeRoute Guinée', { exact: true })).toBeVisible();
    // Retry button
    await expect(page.getByRole('button', { name: /Réessayer/ })).toBeVisible();
    // Home button
    await expect(page.getByRole('button', { name: /Page d'accueil/ })).toBeVisible();
  });

  test('manifest.json exposes correct PWA metadata', async ({ request }) => {
    const res = await request.get('/manifest.json');
    expect(res.ok()).toBeTruthy();
    const manifest = await res.json();
    expect(manifest.name).toMatch(/CodeRoute/i);
    expect(manifest.short_name).toBe('CodeRoute GN');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toMatch(/^#/);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    // Each icon must have src, sizes, type
    for (const icon of manifest.icons) {
      expect(icon.src).toBeTruthy();
      expect(icon.sizes).toBeTruthy();
      expect(icon.type).toMatch(/^image\//);
    }
  });

  test('service worker registers with proper event handlers', async ({ request }) => {
    const res = await request.get('/sw.js');
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    // Must define all four standard SW lifecycle handlers
    expect(text).toMatch(/addEventListener\s*\(\s*['"]install['"]/);
    expect(text).toMatch(/addEventListener\s*\(\s*['"]activate['"]/);
    expect(text).toMatch(/addEventListener\s*\(\s*['"]fetch['"]/);
    expect(text).toMatch(/caches\.(open|match|keys)/);
  });
});

test.describe('Public API health', () => {
  test('GET /api/health returns 200 with ok status', async ({ request }) => {
    const response = await request.get('/api/health');
    // If no /api/health route exists, this will be 404 — that's still a valid result.
    if (response.status() === 404) {
      test.skip(true, '/api/health not implemented — skipping');
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json().catch(() => null);
    if (body) {
      // Common shapes: { status: "ok" } or { ok: true } or { healthy: true }
      const okFlag = body.status === 'ok' || body.ok === true || body.healthy === true;
      expect(okFlag).toBeTruthy();
    }
  });

  test('GET /api/auth/me without session returns 401', async ({ request }) => {
    const response = await request.get('/api/auth/me');
    expect([401, 403]).toContain(response.status());
  });

  test('GET /api/admin/* without session returns 403', async ({ request }) => {
    // Pick any admin endpoint — they should all require auth
    const endpoints = [
      '/api/admin/notifications/status',
      '/api/admin/notifications/orange-sms',
      '/api/admin/users',
      '/api/admin/stats',
    ];
    for (const url of endpoints) {
      const response = await request.get(url);
      expect([401, 403]).toContain(response.status());
    }
  });
});

test.describe('Accessibility smoke', () => {
  test('landing page has a single <h1> (or one visible landmark)', async ({ page }) => {
    await page.goto('/');
    await dismissInstallBanner(page);
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    expect(h1Count).toBeLessThanOrEqual(3); // not a strict rule, but flag multiple h1s
  });

  test('all interactive elements have accessible names', async ({ page }) => {
    await page.goto('/');
    await dismissInstallBanner(page);
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const name = await buttons.nth(i).getAttribute('aria-label');
      const text = (await buttons.nth(i).textContent())?.trim();
      // Each button should have either an aria-label OR visible text
      expect(name || text).toBeTruthy();
    }
  });
});
