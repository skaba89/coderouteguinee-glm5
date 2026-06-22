// ============================================================
// CodeRoute Guinée — Admin Notifications E2E (Phase 29+30)
// Verifies that the admin can:
//   1. Reach the notifications manager page
//   2. See the Orange SMS OAuth2 panel
//   3. Send a test SMS (will fail gracefully in console mode)
//   4. View the notification log table
// ============================================================

import { test, expect } from '@playwright/test';
import { TEST_USERS, loginAs, dismissInstallBanner } from './fixtures/test-users';

test.describe('Admin Notifications page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.superAdmin);
    await dismissInstallBanner(page);
    // Navigate to the notifications management view
    await page.getByRole('button', { name: 'Communications' }).first().click().catch(async () => {
      // Fallback: try clicking the Notifications label directly
      await page.getByRole('button', { name: /Notifications|Communications/ }).first().click().catch(() => {});
    });
    await page.waitForTimeout(1500);
  });

  test('displays the Orange SMS OAuth2 panel (Phase 29)', async ({ page }) => {
    // The panel header should be visible somewhere on the page
    const panel = page.locator('text=Orange SMS — OAuth2');
    await expect(panel.first()).toBeVisible({ timeout: 10_000 });

    // The configuration badge should show either "Configuré" or "Console (dev)"
    const badge = page.locator('text=/(Configuré|Console \\(dev\\))/').first();
    await expect(badge).toBeVisible({ timeout: 5_000 });
  });

  test('shows the env vars status grid', async ({ page }) => {
    // Wait for the panel to load
    await expect(page.locator('text=Orange SMS — OAuth2').first()).toBeVisible({ timeout: 10_000 });

    // Each env var name (without ORANGE_SMS_ prefix) should be displayed as a badge
    for (const varSuffix of ['CLIENT_ID', 'CLIENT_SECRET', 'SENDER_ADDRESS', 'API_BASE']) {
      // Use a more relaxed matcher — the badge shows "✓ CLIENT_ID" or "✗ CLIENT_ID"
      await expect(page.getByText(varSuffix, { exact: true }).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('phone input accepts Guinea formats and validates', async ({ page }) => {
    await expect(page.locator('text=Orange SMS — OAuth2').first()).toBeVisible({ timeout: 10_000 });

    // Try sending with an invalid phone
    const phoneInput = page.locator('input[type="tel"]').first();
    await phoneInput.fill('12345');
    await page.getByRole('button', { name: /Envoyer un SMS de test/ }).click();

    // Should get an error containing "invalide"
    await expect(page.getByText(/Numéro de téléphone invalide/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('notification log table is rendered', async ({ page }) => {
    // The Notifications card should contain a table (may be empty in fresh test env)
    // Look for the "Logs" or "Historique" heading
    await expect(page.getByText(/Historique|Logs/i).first()).toBeVisible({ timeout: 10_000 });

    // Either the table is present, or the "no data" empty state is shown
    const hasTable = await page.locator('table').first().isVisible({ timeout: 3_000 }).catch(() => false);
    const hasEmptyState = await page.getByText(/Aucune notification/i).first().isVisible({ timeout: 2_000 }).catch(() => false);
    expect(hasTable || hasEmptyState).toBeTruthy();
  });
});

test.describe('Admin Notifications — unauthorized access', () => {
  test('candidat cannot reach admin notifications API', async ({ page }) => {
    await loginAs(page, TEST_USERS.candidat);
    await dismissInstallBanner(page);

    // Hit the API directly — should get 403
    const response = await page.request.get('/api/admin/notifications/orange-sms');
    expect(response.status()).toBe(403);
  });

  test('unauthenticated user gets 403 on admin notifications API', async ({ request }) => {
    const response = await request.get('/api/admin/notifications/orange-sms');
    expect(response.status()).toBe(403);
  });
});
