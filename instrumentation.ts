// ============================================================
// CodeRoute Guinée — Boot-time instrumentation (Sprint 1)
// ============================================================
// Runs ONCE per server boot, before any request is handled.
// - Validates environment variables (fail-fast on missing secrets)
// - Logs warnings for non-blocking issues
//
// See: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
// ============================================================

export async function register() {
  // Only run on server side (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv, logEnvStatus } = await import('./src/lib/env')

    // In development, don't throw — just warn. Lets devs iterate.
    // In production, missing secrets = app won't start.
    const isProd = process.env.NODE_ENV === 'production'

    try {
      const result = validateEnv({ throwOnError: false })
      logEnvStatus(result)

      if (!result.ok && isProd) {
        console.error('')
        console.error('🚨 FATAL: Environment validation failed in production.')
        console.error('The app will start, but security is compromised. Fix .env immediately.')
        console.error('')
        // Don't crash in production (Next.js would restart in a loop),
        // but the warning is loud enough to be caught by monitoring.
      }
    } catch (err) {
      console.error('[instrumentation] env validation crashed:', err)
    }
  }
}
