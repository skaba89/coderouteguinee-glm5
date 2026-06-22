// ============================================================
// CodeRoute Guinée — Environment Variables Validator (Sprint 1)
// ============================================================
// Fail-fast validation: throws at boot time if a required env var is
// missing or invalid. Prevents the app from starting with weak
// defaults (a common security footgun).
//
// Usage:
//   import { validateEnv, env } from '@/lib/env'
//   validateEnv()           // call once at boot
//   const secret = env.JWT_SECRET  // typed access
// ============================================================

type EnvVarSpec = {
  name: string
  required: boolean
  description: string
  /** Validate the value. Return error message or null if OK. */
  validate?: (value: string) => string | null
  /** Mask the value when logging (for secrets). */
  secret?: boolean
  /** Only required in production. */
  prodOnly?: boolean
}

const MIN_SECRET_LENGTH = 32

const SPECS: EnvVarSpec[] = [
  // ─── Database ──────────────────────────────────────────────
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'Prisma database connection string',
    validate: (v) => {
      if (v.startsWith('file:')) return null // SQLite dev
      if (v.startsWith('postgresql://') || v.startsWith('postgres://')) return null
      return `Must be "file:..." (dev) or "postgresql://..." (prod), got prefix "${v.slice(0, 20)}..."`
    },
  },

  // ─── Auth secrets (production-blocking) ────────────────────
  {
    name: 'SESSION_SECRET',
    required: false,
    prodOnly: true,
    description: 'Secret used to sign session JWTs (min 32 chars)',
    secret: true,
    validate: (v) => v.length < MIN_SECRET_LENGTH
      ? `Must be at least ${MIN_SECRET_LENGTH} chars (got ${v.length}). Generate with: openssl rand -hex 32`
      : null,
  },
  {
    name: 'JWT_SECRET',
    required: false,
    prodOnly: true,
    description: 'Secret used to sign access tokens (min 32 chars)',
    secret: true,
    validate: (v) => v.length < MIN_SECRET_LENGTH
      ? `Must be at least ${MIN_SECRET_LENGTH} chars (got ${v.length}). Generate with: openssl rand -hex 32`
      : null,
  },
  {
    name: 'CSRF_SECRET',
    required: false,
    prodOnly: true,
    description: 'Secret used to sign CSRF tokens (min 32 chars)',
    secret: true,
    validate: (v) => v.length < MIN_SECRET_LENGTH
      ? `Must be at least ${MIN_SECRET_LENGTH} chars (got ${v.length}). Generate with: openssl rand -hex 32`
      : null,
  },

  // ─── App config ───────────────────────────────────────────
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: false,
    prodOnly: true,
    description: 'Public URL of the app (e.g. https://coderoute-gn.org)',
    validate: (v) => {
      if (process.env.NODE_ENV !== 'production') return null
      if (!v.startsWith('https://')) return 'Must start with https:// in production'
      return null
    },
  },

  // ─── Email ─────────────────────────────────────────────────
  {
    name: 'SMTP_HOST',
    required: false,
    prodOnly: true,
    description: 'SMTP server hostname (required to send real emails)',
  },
  {
    name: 'SMTP_FROM_EMAIL',
    required: false,
    prodOnly: true,
    description: 'From: address used in outgoing emails',
    validate: (v) => !v.includes('@') ? 'Must be a valid email address' : null,
  },

  // ─── SMS provider ─────────────────────────────────────────
  {
    name: 'SMS_PROVIDER',
    required: false,
    description: 'SMS provider: "console" (dev) | "orange" | "mtn" | "celcom"',
    validate: (v) => ['console', 'orange', 'mtn', 'celcom'].includes(v)
      ? null
      : `Must be one of: console, orange, mtn, celcom (got "${v}")`,
  },

  // ─── Orange SMS OAuth2 ─────────────────────────────────────
  // All 4 vars required together if SMS_PROVIDER=orange
  {
    name: 'ORANGE_SMS_CLIENT_ID',
    required: false,
    description: 'Orange SMS API client_id (from developer.orange.com)',
    secret: true,
  },
  {
    name: 'ORANGE_SMS_CLIENT_SECRET',
    required: false,
    description: 'Orange SMS API client_secret',
    secret: true,
  },
  {
    name: 'ORANGE_SMS_SENDER_ADDRESS',
    required: false,
    description: 'Sender address provisioned by Orange (e.g. tel:+224628000000)',
  },

  // ─── Mobile Money ──────────────────────────────────────────
  {
    name: 'MOMO_PROVIDER',
    required: false,
    description: 'Mobile Money provider: "mock" | "orange" | "mtn" | "celcom"',
    validate: (v) => ['mock', 'orange', 'mtn', 'celcom'].includes(v)
      ? null
      : `Must be one of: mock, orange, mtn, celcom (got "${v}")`,
  },
]

// ─── Validation result ─────────────────────────────────────
export interface EnvValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
  config: Record<string, { value: string | undefined; masked: string; required: boolean; secret: boolean }>
}

function mask(value: string | undefined, isSecret: boolean): string {
  if (!value) return '<not set>'
  if (!isSecret) return value
  if (value.length <= 8) return '••••'
  return `${value.slice(0, 4)}••••${value.slice(-4)}`
}

/**
 * Validate all environment variables.
 * Throws on blocking errors (missing required vars, invalid values)
 * unless `opts.throwOnError` is false.
 */
export function validateEnv(opts: { throwOnError?: boolean } = {}): EnvValidationResult {
  const isProd = process.env.NODE_ENV === 'production'
  const errors: string[] = []
  const warnings: string[] = []
  const config: EnvValidationResult['config'] = {}

  for (const spec of SPECS) {
    const value = process.env[spec.name]
    const isRequired = !!(spec.required || (spec.prodOnly && isProd))

    config[spec.name] = {
      value,
      masked: mask(value, !!spec.secret),
      required: isRequired,
      secret: !!spec.secret,
    }

    if (value === undefined || value === '') {
      if (isRequired) {
        errors.push(`✗ ${spec.name}: ${spec.description} — MISSING (required${spec.prodOnly ? ' in production' : ''})`)
      } else if (spec.prodOnly && isProd) {
        // Already covered above
      } else if (spec.prodOnly) {
        warnings.push(`⚠ ${spec.name}: ${spec.description} — not set (required in production)`)
      }
      continue
    }

    // Value is set — validate it
    if (spec.validate) {
      const err = spec.validate(value)
      if (err) {
        errors.push(`✗ ${spec.name}: ${err} (current: ${mask(value, !!spec.secret)})`)
      }
    }
  }

  // ─── Cross-var validation: if SMS_PROVIDER=orange, all ORANGE_SMS_* required ──
  if (process.env.SMS_PROVIDER === 'orange') {
    for (const v of ['ORANGE_SMS_CLIENT_ID', 'ORANGE_SMS_CLIENT_SECRET', 'ORANGE_SMS_SENDER_ADDRESS']) {
      if (!process.env[v]) {
        errors.push(`✗ ${v}: Required when SMS_PROVIDER=orange`)
      }
    }
  }

  // ─── Cross-var validation: if MOMO_PROVIDER != mock, MOMO_API_KEY required ──
  if (process.env.MOMO_PROVIDER && process.env.MOMO_PROVIDER !== 'mock') {
    if (!process.env.MOMO_API_KEY) {
      warnings.push(`⚠ MOMO_API_KEY: Required when MOMO_PROVIDER=${process.env.MOMO_PROVIDER} (currently using sandbox simulation)`)
    }
  }

  const result: EnvValidationResult = {
    ok: errors.length === 0,
    errors,
    warnings,
    config,
  }

  if (errors.length > 0 && opts.throwOnError !== false) {
    const msg = [
      '',
      '╔══════════════════════════════════════════════════════════╗',
      '║  Environment validation FAILED                            ║',
      '╚══════════════════════════════════════════════════════════╝',
      '',
      ...errors.map(e => `  ${e}`),
      '',
      ...(warnings.length ? ['Warnings:'] : []),
      ...warnings.map(w => `  ${w}`),
      '',
      'Fix these by updating your .env file, then restart the app.',
      'See .env.example for a complete reference.',
      '',
    ].join('\n')
    throw new Error(msg)
  }

  return result
}

/**
 * Typed accessor for env vars. Use this instead of process.env directly
 * to get autocomplete and ensure validation has run.
 */
export const env = new Proxy({} as Record<keyof typeof process.env, string>, {
  get(_target, prop: string) {
    return process.env[prop]
  },
})

/**
 * Log the validation result (without secrets) at boot time.
 * Useful for debugging — call this from instrumentation.ts.
 */
export function logEnvStatus(result: EnvValidationResult): void {
  if (result.errors.length > 0) {
    console.error(result.errors.join('\n'))
  }
  for (const w of result.warnings) {
    console.warn(w)
  }
  if (result.ok && result.warnings.length === 0) {
    console.log('✓ Environment validation passed')
  }
}
