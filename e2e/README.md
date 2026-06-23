# E2E Tests — Playwright

This directory contains end-to-end tests for the CodeRoute Guinée application.

## Setup

Playwright is already installed as a dev dependency. To install the browsers:

```bash
npx playwright install chromium
```

## Running tests

```bash
# All E2E tests (starts dev server automatically)
npm run test:e2e

# UI mode (interactive, with trace viewer)
npm run test:e2e:ui

# Debug mode (step-by-step)
npm run test:e2e:debug

# View last HTML report
npm run test:e2e:report
```

If the dev server is already running on port 3000, Playwright will reuse it.
Otherwise, it will start one automatically.

## Test files

| File | Coverage |
|---|---|
| `smoke.spec.ts` | Landing page, PWA, manifest, SW, dark mode toggle, login dialog |
| `auth.spec.ts` | Super-admin login + dashboard, candidat login + dashboard, session persistence |
| `mobile.mobile.spec.ts` | Pixel 7 viewport — hero, CTA stacking, footer stripe |
| `admin-notifications.spec.ts` | **NEW (Phase 29+30)** — Orange SMS panel visibility, env vars grid, phone validation, log table, unauthorized access |
| `candidate-booking.spec.ts` | **NEW (Phase 30)** — Booking view, training view, courses view, results view |
| `error-pages.spec.ts` | **NEW (Phase 30)** — 404 page, offline route, manifest/SW reachability, API health, accessibility smoke |
| `exam-flow.spec.ts` | **NEW (Sprint 3)** — Start practice exam, answer question, submit, language fallback, API contract |
| `payment-webhook.spec.ts` | **NEW (Sprint 3)** — Webhook HMAC verification: reject missing/invalid/tampered signatures, malformed body, provider identification, no error leakage |
| `rgpd-rights.spec.ts` | **NEW (Sprint 3)** — RGPD user rights (Art. 32-35 Loi L/2022/018/AN): information, access, rectification, opposition, cookie consent |

## Test credentials

Test users are defined in `e2e/fixtures/test-users.ts`:

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@coderoute-gn.org` | (see `prisma/seed.ts`) |
| Candidat | `candidat@demo.gn` | (see `prisma/seed.ts`) |

> ⚠️ **NEVER deploy these credentials to production.** The seed script
> (`prisma/seed.ts`) generates random secure passwords in dev mode and
> prints them once. In production, use `scripts/bootstrap-admin.ts` to
> create the first admin via the `BOOTSTRAP_ADMIN_EMAIL` /
> `BOOTSTRAP_ADMIN_PASSWORD` env vars — those are NOT the seed passwords.

These must exist in the seed data (`prisma/seed.ts`). If you reset the DB, re-seed with `npm run db:seed`.

## CI integration

In CI mode (when `process.env.CI` is set):

- `forbidOnly` is enabled (no `.only()` escape hatches)
- Retries are set to 1
- Reporter switches to `github` + `html`
- Tests run sequentially (workers: 1) — required because they share a SQLite DB

## Conventions

1. **No `.only()` in CI** — locally OK for debugging, stripped in CI
2. **Use `dismissInstallBanner(page)` in `beforeEach`** — the PWA install prompt can intercept clicks
3. **Wait for SPA transitions** — use `page.waitForTimeout(800-1500)` after clicking nav buttons, since the app is client-routed
4. **Don't assert exact text** — use regex matchers to survive copy changes: `getByText(/Sessions?/i)`
5. **Prefer `getByRole` over CSS selectors** — survives class name refactors
6. **Test the user-visible outcome**, not the implementation — assert "the booking page shows a price" rather than "the price element has class `text-red-600`"

## Adding new tests

1. If you need a new role, add it to `e2e/fixtures/test-users.ts`
2. If you need a new page flow, create `e2e/<feature>.spec.ts`
3. For mobile-only tests, name the file `*.mobile.spec.ts` so it matches the `mobile-chrome` project
4. Run `npm run test:e2e -- --grep "<test name>"` to iterate on a single test

## Troubleshooting

### "Cannot find test users"

Re-seed the DB:
```bash
npm run db:seed
```

### Tests pass locally but fail in CI

- Check the `CI=true` environment is set
- Make sure no test relies on `Date.now()` returning a specific value
- Increase timeouts if CI is slow

### Orange SMS panel test fails

The panel needs to be visible. If the admin sidebar nav item name changed, update the test:

```typescript
await page.getByRole('button', { name: 'Communications' }).first().click()
//                    ^^^^^^^^^^^^^^^^^^ update this label
```

### Tests time out on first run

Playwright needs to download the browser binaries first:
```bash
npx playwright install chromium
```
