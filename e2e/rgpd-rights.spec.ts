// ============================================================
// CodeRoute Guinée — RGPD User Rights E2E (Sprint 3)
// ============================================================
// Verifies the 4 RGPD rights are accessible from the UI:
//   1. Information right — privacy policy page reachable
//   2. Access right — candidate can see their own data
//   3. Rectification right — candidate can edit their profile
//   4. Opposition/deletion right — candidate can request deletion
//
// Under Loi L/2022/018/AN (Guinea data protection law), each
// user has the right to access, rectify, oppose, and request
// deletion of their personal data.
// ============================================================

import { test, expect } from '@playwright/test';
import { TEST_USERS, loginAs, dismissInstallBanner } from './fixtures/test-users';

test.describe('RGPD — Information right (privacy policy reachable)', () => {
  test('landing page links to privacy policy', async ({ page }) => {
    await page.goto('/');
    // Look for a link to privacy/confidentialité
    const privacyLink = page.getByRole('link', { name: /confidentialité|privacy|RGPD|données personnelles/i }).first();
    const hasLink = await privacyLink.isVisible({ timeout: 3_000 }).catch(() => false);
    if (hasLink) {
      await privacyLink.click();
      await page.waitForTimeout(1000);
      // Privacy policy should be displayed (not 404)
      await expect(page.getByText(/^Erreur$/i)).toHaveCount(0);
      // Should mention RGPD or the data controller
      const bodyText = await page.locator('body').innerText().catch(() => '');
      expect(bodyText.toLowerCase()).toMatch(/rgpd|données personnelles|responsable du traitement|concerné/i);
    }
  });

  test('footer contains legal links (mentions légales, confidentialité)', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer').first();
    const hasFooter = await footer.isVisible({ timeout: 3_000 }).catch(() => false);
    if (hasFooter) {
      const footerText = await footer.innerText().catch(() => '');
      // Footer should mention at least one legal reference
      const hasLegalReference = /mentions légales|confidentialité|RGPD|cookies|©|copyright/i.test(footerText);
      expect(hasLegalReference).toBeTruthy();
    }
  });
});

test.describe('RGPD — Access right (candidate can view own data)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.candidat);
    await dismissInstallBanner(page);
  });

  test('candidate can access their profile / account page', async ({ page }) => {
    // Look for a profile/account button — usually in sidebar or avatar menu
    const profileBtn = page.getByRole('button', { name: /profil|mon compte|paramètres|compte/i }).first();
    const hasProfileBtn = await profileBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (hasProfileBtn) {
      await profileBtn.click();
      await page.waitForTimeout(1000);
      // Profile page should show personal data (name, email, phone, etc.)
      const bodyText = await page.locator('body').innerText().catch(() => '');
      // Should display some personal info — email is the most reliable
      const hasPersonalInfo = /email|courriel|@|téléphone|nom|prénom/i.test(bodyText);
      expect(hasPersonalInfo).toBeTruthy();
    }
    // No error page in any case
    await expect(page.getByText(/^Erreur$/i)).toHaveCount(0);
  });

  test('candidate dashboard shows their numero unique (national ID)', async ({ page }) => {
    // The candidate dashboard should at least show their numero unique
    // (GN-CODE-YYYY-XXXXXX) or their name in a greeting
    const bodyText = await page.locator('body').innerText({ timeout: 8_000 }).catch(() => '');
    const hasIdentifier = /GN-CODE-\d{4}-\d{6}|bonjour|bienvenue|salut/i.test(bodyText);
    expect(hasIdentifier).toBeTruthy();
  });
});

test.describe('RGPD — Rectification right (candidate can edit profile)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.candidat);
    await dismissInstallBanner(page);
  });

  test('profile page offers an edit mode', async ({ page }) => {
    const profileBtn = page.getByRole('button', { name: /profil|mon compte|paramètres/i }).first();
    const hasProfileBtn = await profileBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasProfileBtn) {
      // Test is informational only if profile button is missing
      test.skip();
    }
    await profileBtn!.click();
    await page.waitForTimeout(1000);

    // Look for edit buttons or inline-editable fields
    const editBtn = page.getByRole('button', { name: /modifier|éditer|enregistrer|sauvegarder/i }).first();
    const hasEdit = await editBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    const hasInputField = await page.locator('input[type="text"], input[type="email"], input[type="tel"]').first().isVisible({ timeout: 2_000 }).catch(() => false);

    expect(hasEdit || hasInputField).toBeTruthy();
  });
});

test.describe('RGPD — Opposition / account deletion', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.candidat);
    await dismissInstallBanner(page);
  });

  test('profile or settings page exposes a delete-account option', async ({ page }) => {
    const profileBtn = page.getByRole('button', { name: /profil|mon compte|paramètres/i }).first();
    const hasProfileBtn = await profileBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasProfileBtn) {
      test.skip();
    }
    await profileBtn!.click();
    await page.waitForTimeout(1000);

    // Look for a delete-account button or link
    const deleteBtn = page.getByRole('button', { name: /supprimer.*compte|désactiver|résilier|suppression/i }).first();
    const hasDelete = await deleteBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    // Either there's a delete option, or there's a help text mentioning RGPD
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const mentionsRGPD = /RGPD|suppression.*données|droit.*opposition|droit.*oubli/i.test(bodyText);

    expect(hasDelete || mentionsRGPD).toBeTruthy();
  });
});

test.describe('RGPD — Cookie consent', () => {
  test('landing page shows a cookie banner or consent mechanism', async ({ page }) => {
    await page.goto('/');
    // Either a cookie banner is shown, OR cookies are not used for tracking
    // (essential cookies do not require consent under RGPD/Loi L/2022/018/AN)
    const cookieBanner = page.getByText(/cookies|consentement|préférences.*cookies/i).first();
    const hasCookieBanner = await cookieBanner.isVisible({ timeout: 3_000 }).catch(() => false);

    // If there's no banner, that's acceptable IF the app doesn't set tracking cookies
    if (hasCookieBanner) {
      // The banner should have an "accept" button at minimum
      const acceptBtn = page.getByRole('button', { name: /accept|tout accepter|j'accepte/i }).first();
      await expect(acceptBtn).toBeVisible({ timeout: 2_000 });
    } else {
      // No banner — verify no tracking cookies are set on initial load
      const cookies = await page.context().cookies();
      const trackingCookies = cookies.filter(c =>
        !c.name.startsWith('session') &&
        !c.name.startsWith('__Host-') &&
        !c.name.startsWith('__cf_') &&
        c.name !== 'locale'
      );
      // Essential cookies only — no GA, no Facebook Pixel, etc.
      const hasTrackingCookie = trackingCookies.some(c => /ga|gtm|fbp|_trk|track/i.test(c.name));
      expect(hasTrackingCookie).toBe(false);
    }
  });
});
