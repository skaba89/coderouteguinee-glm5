// ============================================================
// CodeRoute Guinée — Authenticated smoke tests
// Verifies that each role can log in and reach its dashboard.
// ============================================================

import { test, expect } from '@playwright/test';
import { TEST_USERS, loginAs, dismissInstallBanner } from './fixtures/test-users';

test.describe('Super-admin session', () => {
  test('admin can log in and see the admin dashboard', async ({ page }) => {
    await loginAs(page, TEST_USERS.superAdmin);
    await dismissInstallBanner(page);

    // Admin dashboard should be visible — look for the secondary "Administration" breadcrumb.
    await expect(page.getByText('Administration').first()).toBeVisible({ timeout: 15_000 });

    // Sidebar should contain these admin sections.
    for (const label of ['Vue d\'ensemble', 'Analyses', 'Anti-fraude', 'Centres']) {
      await expect(page.getByRole('button', { name: label }).first()).toBeVisible();
    }
  });

  test('admin can navigate to the Analytics tab', async ({ page }) => {
    await loginAs(page, TEST_USERS.superAdmin);
    await dismissInstallBanner(page);
    await page.getByRole('button', { name: 'Analyses' }).first().click();
    // The analytics view should render without errors — check that the breadcrumb updates.
    await expect(page.getByText('Administration').first()).toBeVisible();
  });

  test('admin can open the command palette with Ctrl+K', async ({ page }) => {
    await loginAs(page, TEST_USERS.superAdmin);
    await dismissInstallBanner(page);
    await page.keyboard.press('Control+k');
    // Command dialog should open
    await expect(page.getByPlaceholder(/Rechercher une page/)).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press('Escape');
  });
});

test.describe('Candidat session', () => {
  test('candidat can log in and see the candidate dashboard', async ({ page }) => {
    await loginAs(page, TEST_USERS.candidat);
    await dismissInstallBanner(page);

    // Candidate dashboard nav should show these items.
    for (const label of ['Tableau de bord', 'Cours', 'Réserver', 'Entraînement', 'Résultats']) {
      await expect(page.getByRole('button', { name: label }).first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('candidat can navigate to courses', async ({ page }) => {
    await loginAs(page, TEST_USERS.candidat);
    await dismissInstallBanner(page);
    await page.getByRole('button', { name: 'Cours' }).first().click();
    // Wait a beat for the SPA transition
    await page.waitForTimeout(800);
    // Just verify no error page
    await expect(page.getByText(/erreur|error/i)).toHaveCount(0);
  });
});

test.describe('Session persistence', () => {
  test('logged-in user survives a page reload', async ({ page }) => {
    await loginAs(page, TEST_USERS.candidat);
    await dismissInstallBanner(page);
    await page.getByRole('button', { name: 'Tableau de bord' }).first().click();
    await page.reload();
    // After reload, the user should still be logged in (token in localStorage)
    await expect(page.getByRole('button', { name: 'Cours' }).first()).toBeVisible({ timeout: 10_000 });
  });
});
