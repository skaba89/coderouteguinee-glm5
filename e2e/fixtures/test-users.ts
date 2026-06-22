// ============================================================
// CodeRoute Guinée — Test credentials fixture (Sprint 1 hardened)
// ============================================================
// SECURITY: Test credentials are read from environment variables.
// They MUST NEVER be hardcoded in source — even for tests.
//
// In CI / local dev, set these env vars before running E2E:
//   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD
//   E2E_CANDIDAT_EMAIL, E2E_CANDIDAT_PASSWORD
//
// The seed script (prisma/seed.ts) reads the same vars when
// SEED_ADMIN_PASSWORD / SEED_CANDIDAT_PASSWORD are set, so you
// can keep them in sync via a single .env.test file.
// ============================================================

export interface TestUser {
  email: string;
  password: string;
  role: 'candidat' | 'auto-ecole' | 'centre-agree' | 'administration' | 'super-admin';
  label: string;
  expectedLandingView: string;
}

/**
 * Read a required test credential from env. Throws if missing so
 * tests fail loudly instead of silently using a wrong password.
 */
function requireEnv(name: string, fallbackDevOnly?: string): string {
  const v = process.env[name];
  if (v) return v;
  // Allow fallback ONLY when explicitly provided AND not in production CI.
  if (fallbackDevOnly && process.env.CI !== 'true' && process.env.NODE_ENV !== 'production') {
    console.warn(
      `⚠ ${name} not set — using dev-only fallback. ` +
      `Set ${name} in .env.test for E2E tests to pass reliably.`
    );
    return fallbackDevOnly;
  }
  throw new Error(
    `Missing env var ${name} required for E2E tests. ` +
    `Add it to .env.test (see .env.example).`
  );
}

export const TEST_USERS: Record<string, TestUser> = {
  superAdmin: {
    email: requireEnv('E2E_ADMIN_EMAIL', 'admin@coderoute-gn.org'),
    password: requireEnv('E2E_ADMIN_PASSWORD'),
    role: 'super-admin',
    label: 'Super Admin',
    expectedLandingView: 'admin-dashboard',
  },
  candidat: {
    email: requireEnv('E2E_CANDIDAT_EMAIL', 'candidat@demo.gn'),
    password: requireEnv('E2E_CANDIDAT_PASSWORD'),
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
