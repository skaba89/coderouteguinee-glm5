// ============================================================
// CodeRoute Guinée — Test credentials fixture
// Centralizes login info for each role so tests can be reused.
// ============================================================

export interface TestUser {
  email: string;
  password: string;
  role: 'candidat' | 'auto-ecole' | 'centre-agree' | 'administration' | 'super-admin';
  label: string;
  expectedLandingView: string;
}

export const TEST_USERS: Record<string, TestUser> = {
  superAdmin: {
    email: 'admin@coderoute-gn.org',
    password: 'Admin@2024',
    role: 'super-admin',
    label: 'Super Admin',
    expectedLandingView: 'admin-dashboard',
  },
  candidat: {
    email: 'candidat@demo.gn',
    password: 'Candidat@2024',
    role: 'candidat',
    label: 'Candidat',
    expectedLandingView: 'candidate-dashboard',
  },
};

/** Helper: open the login dialog from the landing page. */
export async function openLoginModal(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Se connecter' }).first().click();
  await page.getByRole('heading', { name: 'Connexion' }).waitFor({ state: 'visible' });
}

/** Helper: log in as a given test user. */
export async function loginAs(page: import('@playwright/test').Page, user: TestUser) {
  await openLoginModal(page);
  await page.fill('#login-email', user.email);
  await page.fill('#login-password', user.password);
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  // Wait for the dashboard heading (role-specific) to appear.
  await page.waitForURL('**/#', { timeout: 15_000 }).catch(() => {});
  // The app is a single-page app, so just wait for nav to appear.
  await page.waitForSelector('nav', { timeout: 15_000 });
}

/** Helper: dismiss the PWA install banner if present. */
export async function dismissInstallBanner(page: import('@playwright/test').Page) {
  const btn = page.getByRole('button', { name: 'Plus tard' });
  if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await btn.click();
  }
}
