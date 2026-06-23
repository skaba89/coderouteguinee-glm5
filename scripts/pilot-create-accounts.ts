#!/usr/bin/env tsx
// ============================================================
// CodeRoute Guinée — Pilot week 0: bulk account creation
// ============================================================
// Creates the initial accounts for the 3 pilot centres:
//   - Conakry-Kaloum (200 candidates/day capacity)
//   - Kankan (80 candidates/day)
//   - Labé (50 candidates/day)
//
// Creates:
//   - 3 centre-agree accounts (one per centre)
//   - 5 administration accounts (DNTT agents)
//   - 1 super-admin account (Tech Lead)
//   - N auto-ecole accounts (one per auto-ecole partner)
//
// All passwords are randomly generated and printed ONCE.
// They MUST be communicated to users via Signal/WhatsApp (not email).
//
// Usage:
//   npx tsx scripts/pilot-create-accounts.ts --centres=3 --admins=5 --autoecoles=10
//
// Env:
//   DATABASE_URL           — PostgreSQL connection string
//   BOOTSTRAP_ADMIN_EMAIL  — super-admin email (default: tech@coderoute-gn.org)
//   PILOT_OUTPUT_FILE      — where to write the credentials CSV (default: /tmp/pilot-accounts.csv)
// ============================================================

import { db } from '../src/lib/db'
import { hash } from 'argon2'
import { randomBytes, randomInt } from 'crypto'
import { writeFileSync } from 'fs'

// ─── Types ────────────────────────────────────────────────
interface Account {
  email: string
  password: string
  role: string
  centre?: string
  name: string
  phone: string
}

// ─── Helpers ──────────────────────────────────────────────
function generatePassword(): string {
  // Generate a memorable but strong password
  const length = 16
  const charset = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*'
  let password = ''
  const bytes = randomBytes(length)
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length]
  }
  // Ensure at least one of each required type
  return password + 'A1!'
}

function generatePhone(): string {
  // Guinean mobile numbers start with 6 (Orange 622/621/620, MTN 626/627/628, Celcom 623/624/625)
  const prefixes = ['622', '621', '626', '627', '624']
  const prefix = prefixes[randomInt(0, prefixes.length)]
  let suffix = ''
  for (let i = 0; i < 6; i++) {
    suffix += randomInt(0, 10).toString()
  }
  return `+224${prefix}${suffix}`
}

// ─── Main ─────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2)
  const centresCount = parseInt(args.find(a => a.startsWith('--centres='))?.split('=')[1] || '3', 10)
  const adminsCount = parseInt(args.find(a => a.startsWith('--admins='))?.split('=')[1] || '5', 10)
  const autoecolesCount = parseInt(args.find(a => a.startsWith('--autoecoles='))?.split('=')[1] || '10', 10)
  const outputFile = process.env.PILOT_OUTPUT_FILE || '/tmp/pilot-accounts.csv'

  console.log('═══════════════════════════════════════════════════════')
  console.log('  CodeRoute Guinée — Pilot Week 0: Account Creation')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`  Centres:        ${centresCount}`)
  console.log(`  Admins:         ${adminsCount}`)
  console.log(`  Auto-écoles:    ${autoecolesCount}`)
  console.log(`  Output CSV:     ${outputFile}`)
  console.log('═══════════════════════════════════════════════════════')
  console.log('')

  const accounts: Account[] = []

  // ─── 1. Pilot centres ──────────────────────────────────
  const pilotCentres = [
    { name: 'Centre de Conakry-Kaloum', region: 'Conakry', capacity: 200, code: 'CKK' },
    { name: 'Centre de Kankan', region: 'Kankan', capacity: 80, code: 'KKN' },
    { name: 'Centre de Labé', region: 'Labé', capacity: 50, code: 'LBE' },
  ]

  console.log('Creating pilot centres...')
  for (let i = 0; i < Math.min(centresCount, pilotCentres.length); i++) {
    const centre = pilotCentres[i]
    const email = `centre.${centre.code.toLowerCase()}@coderoute-gn.org`
    const password = generatePassword()

    // Create the centre record
    const centreRecord = await db.centre.create({
      data: {
        name: centre.name,
        region: centre.region,
        address: `À compléter — ${centre.region}`,
        phone: generatePhone(),
        capacity: centre.capacity,
        isActive: true,
      },
    })

    // Create the centre-agree user
    await db.user.create({
      data: {
        email,
        passwordHash: await hash(password),
        role: 'centre-agree',
        name: `Responsable ${centre.name}`,
        phone: generatePhone(),
        centreId: centreRecord.id,
        isActive: true,
      },
    })

    accounts.push({
      email,
      password,
      role: 'centre-agree',
      centre: centre.name,
      name: `Responsable ${centre.name}`,
      phone: '',
    })

    console.log(`  ✓ ${centre.name} — ${email}`)
  }
  console.log('')

  // ─── 2. Administration accounts ───────────────────────
  console.log('Creating administration accounts...')
  const adminNames = [
    'Aïssatou Diallo', 'Mamadou Camara', 'Fatou BAH', 'Ousmane Sow', 'Mariama Cissé'
  ]
  for (let i = 0; i < adminsCount; i++) {
    const name = adminNames[i % adminNames.length]
    const email = `admin${i + 1}@coderoute-gn.org`
    const password = generatePassword()

    await db.user.create({
      data: {
        email,
        passwordHash: await hash(password),
        role: 'administration',
        name,
        phone: generatePhone(),
        isActive: true,
      },
    })

    accounts.push({ email, password, role: 'administration', name, phone: '' })
    console.log(`  ✓ ${email}`)
  }
  console.log('')

  // ─── 3. Auto-école accounts ───────────────────────────
  console.log('Creating auto-école accounts...')
  const autoEcoleNames = [
    'Auto-École Excellence', 'Auto-École Étoile', 'Auto-École Bonne Route',
    'Auto-École Safa', 'Auto-École Touma', 'Auto-École Kaloum',
    'Auto-École Dixinn', 'Auto-École Ratoma', 'Auto-École Matam',
    'Auto-École Kankan'
  ]
  for (let i = 0; i < autoecolesCount; i++) {
    const name = autoEcoleNames[i % autoEcoleNames.length]
    const email = `autoecole${i + 1}@coderoute-gn.org`
    const password = generatePassword()

    await db.user.create({
      data: {
        email,
        passwordHash: await hash(password),
        role: 'auto-ecole',
        name,
        phone: generatePhone(),
        isActive: true,
      },
    })

    accounts.push({ email, password, role: 'auto-ecole', name, phone: '' })
    console.log(`  ✓ ${email}`)
  }
  console.log('')

  // ─── 4. Super-admin (Tech Lead) ───────────────────────
  const superAdminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || 'tech@coderoute-gn.org'
  console.log('Creating super-admin (Tech Lead)...')

  // Check if super-admin already exists
  const existing = await db.user.findUnique({ where: { email: superAdminEmail } })
  if (!existing) {
    const password = generatePassword()
    await db.user.create({
      data: {
        email: superAdminEmail,
        passwordHash: await hash(password),
        role: 'super-admin',
        name: 'Tech Lead CodeRoute',
        phone: generatePhone(),
        isActive: true,
      },
    })
    accounts.push({
      email: superAdminEmail,
      password,
      role: 'super-admin',
      name: 'Tech Lead CodeRoute',
      phone: '',
    })
    console.log(`  ✓ ${superAdminEmail} (NEW)`)
  } else {
    console.log(`  → ${superAdminEmail} already exists (skipped)`)
  }
  console.log('')

  // ─── 5. Write credentials CSV ─────────────────────────
  const csv = ['email,password,role,name,centre']
  for (const a of accounts) {
    csv.push(`${a.email},${a.password},${a.role},"${a.name}","${a.centre || ''}"`)
  }
  writeFileSync(outputFile, csv.join('\n'))

  console.log('═══════════════════════════════════════════════════════')
  console.log('  ✓ DONE — ' + accounts.length + ' accounts created')
  console.log('═══════════════════════════════════════════════════════')
  console.log('')
  console.log('Credentials saved to: ' + outputFile)
  console.log('')
  console.log('⚠ SECURITY INSTRUCTIONS:')
  console.log('  1. This file contains plaintext passwords — DO NOT commit to git')
  console.log('  2. Communicate each password to the user via Signal/WhatsApp (not email)')
  console.log('  3. After all users have logged in once, delete this file:')
  console.log(`       shred -u ${outputFile}`)
  console.log('  4. Audit log will record all logins (force password change on first login)')
  console.log('     — feature to be implemented in Sprint 13')
  console.log('')

  await db.$disconnect()
}

main().catch(async (e) => {
  console.error('FATAL:', e)
  await db.$disconnect()
  process.exit(1)
})
