// ============================================================
// CodeRoute Guinée — Production Admin Bootstrap (Sprint 1)
// ============================================================
// Creates the FIRST super-admin account on a fresh production
// database. Run ONCE after deploying, then delete the env vars
// BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD.
//
// Usage:
//   1. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD in .env
//   2. npx tsx scripts/bootstrap-admin.ts
//   3. Log in, change the password immediately
//   4. Delete BOOTSTRAP_ADMIN_* from .env
//
// Safety:
//   - Refuses to run if a super-admin already exists (idempotent)
//   - Refuses to run in development (use npm run db:seed instead)
//   - Validates password strength (12+ chars, mixed case, digit)
// ============================================================

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'

const prisma = new PrismaClient()

function validatePassword(password: string): string[] {
  const errors: string[] = []
  if (password.length < 12) errors.push('at least 12 characters')
  if (!/[A-Z]/.test(password)) errors.push('one uppercase letter')
  if (!/[a-z]/.test(password)) errors.push('one lowercase letter')
  if (!/[0-9]/.test(password)) errors.push('one digit')
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('one special character')
  return errors
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║  CodeRoute Guinée — Admin Bootstrap                       ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log('')

  // ─── 1. Environment checks ─────────────────────────────
  if (process.env.NODE_ENV === 'development') {
    console.error('✗ Refusing to run in development mode.')
    console.error('  Use `npm run db:seed` instead — it creates demo accounts.')
    process.exit(1)
  }

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD

  if (!email || !password) {
    console.error('✗ BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be set in .env')
    console.error('')
    console.error('  Generate a strong password:')
    console.error('    openssl rand -base64 24')
    console.error('')
    console.error('  Then set in .env:')
    console.error('    BOOTSTRAP_ADMIN_EMAIL="admin@your-domain.gn"')
    console.error('    BOOTSTRAP_ADMIN_PASSWORD="<generated>"')
    process.exit(1)
  }

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`✗ Invalid email: ${email}`)
    process.exit(1)
  }

  // Validate password strength
  const errors = validatePassword(password)
  if (errors.length > 0) {
    console.error('✗ BOOTSTRAP_ADMIN_PASSWORD is too weak. It must contain:')
    for (const e of errors) console.error(`    - ${e}`)
    process.exit(1)
  }

  // ─── 2. Idempotency check ─────────────────────────────
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'super-admin' },
  })
  if (existingAdmin) {
    console.error(`✗ A super-admin already exists (${existingAdmin.email}).`)
    console.error('  To reset the password, use:')
    console.error('    npx tsx scripts/reset-admin-password.ts')
    process.exit(1)
  }

  // Also check this email isn't already used
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    console.error(`✗ Email ${email} is already used by a non-admin account.`)
    console.error('  Delete that account first, or use a different email.')
    process.exit(1)
  }

  // ─── 3. Create the admin account ──────────────────────
  const numeroUnique = `GN-CODE-${new Date().getFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`
  const passwordHash = await bcrypt.hash(password, 12) // 12 rounds = ~250ms, secure

  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      nom: 'ADMIN',
      prenom: 'Super',
      dateNaissance: '1980-01-01', // placeholder — admin must update
      numeroIdentite: `GN-ADMIN-${randomBytes(3).toString('hex').toUpperCase()}`,
      telephone: '+224000000000', // placeholder — admin must update
      ville: 'Conakry',
      region: 'Conakry',
      categoriePermis: 'B',
      role: 'super-admin',
      numeroUnique,
      langueMaternelle: 'fr',
      actif: true,
    },
  })

  console.log('✓ Super-admin account created:')
  console.log(`    Email:          ${admin.email}`)
  console.log(`    Numéro unique:  ${admin.numeroUnique}`)
  console.log(`    User ID:        ${admin.id}`)
  console.log('')
  console.log('═'.repeat(60))
  console.log('  ⚠  IMPORTANT — follow these steps NOW:')
  console.log('═'.repeat(60))
  console.log('  1. Log in at /admin with the email and password above')
  console.log('  2. Change the password from the admin profile page')
  console.log('  3. Update the placeholder dateNaissance, telephone, nom, prenom')
  console.log('  4. Delete BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD')
  console.log('     from your .env file (they are not needed anymore)')
  console.log('  5. Restart the app to clear the env vars from memory')
  console.log('═'.repeat(60))
}

main()
  .catch((e) => {
    console.error('FATAL:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
