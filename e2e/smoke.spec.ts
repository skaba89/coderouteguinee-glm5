// ============================================================
// CodeRoute Guinée — Smoke tests
// Verifies that the public parts of the app load correctly.
// ============================================================

import { test, expect } from '@playwright/test';
import { dismissInstallBanner } from './fixtures/test-users';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await dismissInstallBanner(page);
  });

  test('displays the hero title and CTA buttons', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /CodeRoute.*Guinée/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'S\'inscrire' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Se connecter' }).first()).toBeVisible();
  });

  test('renders the "Comment ça marche" section with 5 steps', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Comment ça marche' })).toBeVisible();
    // Scope to the section to avoid matching nav items.
    const section = page.locator('section', { hasText: 'Comment ça marche' }).first();
    for (const step of ['Inscription', 'Réservation', 'Préparation', 'Examen', 'Permis']) {
      await expect(section.getByRole('heading', { name: step, exact: true })).toBeVisible();
    }
  });

  test('renders the comparison table', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'En avance sur les standards mondiaux' })).toBeVisible();
    await expect(page.getByText('CodeRoute Guinée').nth(2)).toBeVisible();
    await expect(page.getByText('Autres plateformes')).toBeVisible();
  });

  test('footer contains Republic of Guinea branding', async ({ page }) => {
    await expect(page.getByText('République de Guinée — Ministère des Transports')).toBeVisible();
    await expect(page.getByText(/© 2026 CodeRoute Guinée/)).toBeVisible();
  });
});

test.describe('PWA + Dark mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await dismissInstallBanner(page);
  });

  test('theme toggle switches between light and dark mode', async ({ page }) => {
    // Initial state: button label depends on system preference.
    // We just verify that clicking it toggles the .dark class on <html>.
    const toggle = page.getByRole('button', { name: /Basculer le thème|Activer le mode (clair|sombre)/ });
    await expect(toggle).toBeVisible();

    // Capture initial theme (may be 'dark' or '' depending on system pref).
    const initialHasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    await toggle.click();
    await page.waitForTimeout(500);
    const afterClickHasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    // The .dark class should have toggled.
    expect(initialHasDark).not.toBe(afterClickHasDark);
  });

  test('manifest.json is reachable and well-formed', async ({ request }) => {
    const res = await request.get('/manifest.json');
    expect(res.ok()).toBeTruthy();
    const manifest = await res.json();
    expect(manifest.name).toContain('CodeRoute');
    expect(manifest.short_name).toBe('CodeRoute GN');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#009460');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  test('service worker file is reachable', async ({ request }) => {
    const res = await request.get('/sw.js');
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text).toContain('CodeRoute Guinée');
    expect(text).toContain('install');
    expect(text).toContain('activate');
    expect(text).toContain('fetch');
  });

  test('offline page loads with branding', async ({ page }) => {
    await page.goto('/offline');
    await expect(page.getByRole('heading', { name: 'Vous êtes hors-ligne' })).toBeVisible();
    await expect(page.getByText('CodeRoute Guinée', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Réessayer/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Page d'accueil/ })).toBeVisible();
  });
});

test.describe('Auth flows', () => {
  test('opens login dialog from landing page', async ({ page }) => {
    await page.goto('/');
    await dismissInstallBanner(page);
    await page.getByRole('button', { name: 'Se connecter' }).first().click();
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/');
    await dismissInstallBanner(page);
    await page.getByRole('button', { name: 'Se connecter' }).first().click();
    await page.fill('#login-email', 'invalid@demo.gn');
    await page.fill('#login-password', 'wrongpass');
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
    // Wait for error message — flexible text since it may be "Identifiants invalides" or similar.
    await expect(page.locator('.text-red-600').first()).toBeVisible({ timeout: 5_000 });
  });
});
