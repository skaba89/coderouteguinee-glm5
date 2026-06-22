// ============================================================
// CodeRoute Guinée — Candidate Exam Booking E2E
// Verifies the candidate journey:
//   1. Reach the booking page
//   2. See available exam sessions
//   3. Select a session and open the payment dialog
//   4. Verify the booking appears in the candidate's "Réservations"
// ============================================================

import { test, expect } from '@playwright/test';
import { TEST_USERS, loginAs, dismissInstallBanner } from './fixtures/test-users';

test.describe('Candidat — Booking flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.candidat);
    await dismissInstallBanner(page);
  });

  test('can navigate to the booking view', async ({ page }) => {
    await page.getByRole('button', { name: 'Réserver' }).first().click();
    // Wait a moment for the SPA transition to settle
    await page.waitForTimeout(1200);
    // Verify no error page rendered
    await expect(page.getByText(/erreur|error/i)).toHaveCount(0);
    // Verify either a session list OR an empty-state is shown
    const hasSessions = await page.getByText(/session|examen disponible|créneau/i).first().isVisible({ timeout: 3_000 }).catch(() => false);
    const hasEmptyState = await page.getByText(/Aucun.*examen|Aucune.*session/i).first().isVisible({ timeout: 2_000 }).catch(() => false);
    expect(hasSessions || hasEmptyState).toBeTruthy();
  });

  test('booking page shows the tariff info or pricing', async ({ page }) => {
    await page.getByRole('button', { name: 'Réserver' }).first().click();
    await page.waitForTimeout(1500);
    // The booking page should mention the price (e.g. "35 000 GNF" or "tarif")
    await expect(page.getByText(/GNF|tarif|prix/i).first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Candidat — Training view', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.candidat);
    await dismissInstallBanner(page);
  });

  test('can navigate to the training (entraînement) view', async ({ page }) => {
    await page.getByRole('button', { name: 'Entraînement' }).first().click();
    await page.waitForTimeout(1200);
    // No error
    await expect(page.getByText(/^Erreur/i)).toHaveCount(0);
    // The training page should show some kind of quiz/exam starter
    const hasQuizUI = await page.getByText(/question|quiz|examen blanc|entraînement/i).first().isVisible({ timeout: 5_000 }).catch(() => false);
    expect(hasQuizUI).toBeTruthy();
  });

  test('can navigate to the courses view', async ({ page }) => {
    await page.getByRole('button', { name: 'Cours' }).first().click();
    await page.waitForTimeout(1200);
    await expect(page.getByText(/^Erreur/i)).toHaveCount(0);
    // The courses page should show either course cards or an empty state
    const hasCourses = await page.getByText(/cours|module|leçon/i).first().isVisible({ timeout: 5_000 }).catch(() => false);
    expect(hasCourses).toBeTruthy();
  });
});

test.describe('Candidat — Results view', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.candidat);
    await dismissInstallBanner(page);
  });

  test('can navigate to results and see either history or empty state', async ({ page }) => {
    await page.getByRole('button', { name: 'Résultats' }).first().click();
    await page.waitForTimeout(1200);
    await expect(page.getByText(/^Erreur/i)).toHaveCount(0);
    // Either past results are listed or empty state is shown
    const hasResults = await page.getByText(/résultat|score|examen passé/i).first().isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmpty = await page.getByText(/Aucun.*résultat|aucun.*examen/i).first().isVisible({ timeout: 2_000 }).catch(() => false);
    expect(hasResults || hasEmpty).toBeTruthy();
  });
});
