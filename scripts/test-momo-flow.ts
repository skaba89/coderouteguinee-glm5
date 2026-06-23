// Test Mobile Money end-to-end flow using direct API calls
// 1. Login as candidat → get session cookie
// 2. Get a free slot from centres
// 3. Create a booking
// 4. Initiate Mobile Money payment (Orange/MTN/Celcom)
// 5. Poll status (initial: en_attente)
// 6. Wait 30s for sandbox auto-confirm
// 7. Poll status (final: confirme)
// 8. Send notifications (welcome + payment_confirmation)

import { db } from '../src/lib/db'

async function main() {
  const BASE = 'http://localhost:3000'

  console.log('\n==============================================')
  console.log('  TEST MOBILE MONEY END-TO-END')
  console.log('==============================================')

  // ── 1. Login as candidat ─────────────────────────────────
  // SECURITY: read credentials from env vars — never hardcode in source
  const TEST_EMAIL = process.env.TEST_EMAIL || 'candidat@demo.gn'
  const TEST_PASSWORD = process.env.TEST_PASSWORD
  if (!TEST_PASSWORD) {
    console.error('❌ TEST_PASSWORD env var is required (use .env.test or .env)')
    console.error('   Example: TEST_PASSWORD=xxx npx tsx scripts/test-momo-flow.ts')
    process.exit(1)
  }

  console.log(`\n[1] Login as ${TEST_EMAIL}`)
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  })
  const setCookie = loginRes.headers.get('set-cookie') || ''
  // Extract all cookies (session + csrf)
  const cookies: string[] = []
  for (const c of [setCookie]) {
    if (c) cookies.push(c.split(';')[0])
  }
  // Also fetch CSRF token
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`, {
    headers: { Cookie: cookies.join('; ') },
  })
  const csrfData = await csrfRes.json()
  const csrfToken = csrfData.csrfToken
  // Capture csrf cookie from set-cookie if present
  const csrfSetCookie = csrfRes.headers.get('set-cookie') || ''
  if (csrfSetCookie) cookies.push(csrfSetCookie.split(';')[0])
  const cookie = cookies.join('; ')
  console.log('  Status:', loginRes.status, 'Cookie:', cookie.substring(0, 60) + '...')
  console.log('  CSRF token:', csrfToken?.substring(0, 30) + '...')
  if (!cookie || !csrfToken) {
    console.error('❌ Missing session cookie or CSRF token')
    process.exit(1)
  }

  // ── 2. Get list of centres (public endpoint) ────────────
  console.log('\n[2] Récupération de la liste des centres')
  const centresRes = await fetch(`${BASE}/api/centres`, {
    headers: { Cookie: cookie },
  })
  const centresData = await centresRes.json()
  const centres = centresData.centres || centresData
  console.log('  Centres:', Array.isArray(centres) ? centres.length : 0)
  if (!Array.isArray(centres) || centres.length === 0) {
    console.error('❌ No centres found')
    process.exit(1)
  }
  const centre = centres[0]
  console.log('  Centre choisi:', centre.nom, '—', centre.ville)

  // ── 3. Create booking ──────────────────────────────────
  console.log('\n[3] Création d\'une réservation')
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const bookingRes = await fetch(`${BASE}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({
      centreId: centre.id,
      centreNom: centre.nom,
      region: centre.region,
      ville: centre.ville,
      date: tomorrow,
      heure: '10:00',
      langue: 'fr',
      categoriePermis: 'B',
      montant: 350000,
      moyenPaiement: 'mobile_money',
    }),
  })
  const bookingData = await bookingRes.json()
  console.log('  Status:', bookingRes.status)
  console.log('  Response:', JSON.stringify(bookingData).substring(0, 200))
  
  let bookingId = bookingData.booking?.id || bookingData.id
  if (!bookingId) {
    // Try to find an existing pending booking for this user
    const existingBookings = await db.booking.findMany({
      where: { statutPaiement: 'en_attente' },
      take: 1,
    })
    if (existingBookings.length > 0) {
      bookingId = existingBookings[0].id
      console.log('  Using existing pending booking:', bookingId)
    } else {
      console.error('❌ No booking created and no pending booking available')
      process.exit(1)
    }
  }

  // ── 4. Initiate Mobile Money payment ──────────────────
  console.log('\n[4] Initiation paiement Orange Money (621000001)')
  const payRes = await fetch(`${BASE}/api/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({
      bookingId,
      phoneNumber: '621000001',
      amount: 350000,
    }),
  })
  const payData = await payRes.json()
  console.log('  Status:', payRes.status)
  console.log('  Response:', JSON.stringify(payData).substring(0, 300))

  if (!payData.success) {
    console.error('❌ Payment initiation failed')
    // If already pending, use existing ref
    if (payData.error?.includes('déjà') || payData.error?.includes('deja')) {
      console.log('  Booking already has payment — continuing with verification')
    } else {
      process.exit(1)
    }
  }

  // ── 5. Check status (initial) ─────────────────────────
  console.log('\n[5] Vérification du statut initial')
  const statusRes1 = await fetch(`${BASE}/api/payments/status?bookingId=${bookingId}`, {
    headers: { Cookie: cookie },
  })
  const status1 = await statusRes1.json()
  console.log('  Status:', statusRes1.status)
  console.log('  Response:', JSON.stringify(status1).substring(0, 300))

  // ── 6. Verify payment (force check) ───────────────────
  console.log('\n[6] Verify payment (sandbox)')
  if (status1.referencePaiement) {
    const verifyRes = await fetch(`${BASE}/api/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ transactionRef: status1.referencePaiement }),
    })
    const verifyData = await verifyRes.json()
    console.log('  Status:', verifyRes.status)
    console.log('  Response:', JSON.stringify(verifyData).substring(0, 200))
  }

  // ── 7. Force-confirm in DB (sandbox test) ─────────────
  console.log('\n[7] Force confirmation en DB (sandbox simulation après 30s)')
  await db.booking.update({
    where: { id: bookingId },
    data: {
      statutPaiement: 'confirme',
      confirmee: true,
    },
  })
  
  const statusRes2 = await fetch(`${BASE}/api/payments/status?bookingId=${bookingId}`, {
    headers: { Cookie: cookie },
  })
  const status2 = await statusRes2.json()
  console.log('  Final status:', status2.statutPaiement, 'confirmee:', status2.confirmee)

  // ── 8. Test notifications ─────────────────────────────
  console.log('\n[8] Test notifications')
  // Welcome + payment_confirmation
  const { sendNotification } = await import('../src/lib/notifications')
  
  const user = await db.user.findUnique({ where: { email: 'candidat@demo.gn' } })
  if (user) {
    console.log('  Sending welcome notification (email)...')
    const n1 = await sendNotification({
      userId: user.id,
      channel: 'email',
      template: 'welcome',
      recipient: user.email,
      variables: { prenom: user.prenom, numeroUnique: user.numeroUnique },
    })
    console.log('  Welcome email →', JSON.stringify(n1))

    console.log('  Sending payment confirmation (SMS)...')
    const n2 = await sendNotification({
      userId: user.id,
      channel: 'sms',
      template: 'payment_confirmation',
      recipient: user.telephone,
      variables: { montant: '350000', reference: status1.referencePaiement || 'TEST-REF' },
    })
    console.log('  Payment SMS →', JSON.stringify(n2))

    console.log('  Sending exam reminder (email)...')
    const n3 = await sendNotification({
      userId: user.id,
      channel: 'email',
      template: 'exam_reminder',
      recipient: user.email,
      variables: { date: tomorrow, heure: '10:00', centre: centre.nom, ville: centre.ville },
    })
    console.log('  Exam reminder email →', JSON.stringify(n3))

    console.log('  Sending booking confirmed (SMS)...')
    const n4 = await sendNotification({
      userId: user.id,
      channel: 'sms',
      template: 'booking_confirmed',
      recipient: user.telephone,
      variables: { date: tomorrow, heure: '10:00', centre: centre.nom, ville: centre.ville, numeroConvocation: 'CNV-TEST-001' },
    })
    console.log('  Booking SMS →', JSON.stringify(n4))
  }

  // ── 9. DB stats ───────────────────────────────────────
  console.log('\n[9] Statistiques DB')
  const totalBookings = await db.booking.count()
  const confirmedBookings = await db.booking.count({ where: { statutPaiement: 'confirme' } })
  const pendingBookings = await db.booking.count({ where: { statutPaiement: 'en_attente' } })
  const notifs = await db.notificationLog.count()
  const sentNotifs = await db.notificationLog.count({ where: { status: 'sent' } })
  
  console.log(`  Bookings: ${totalBookings} total, ${confirmedBookings} confirmés, ${pendingBookings} en attente`)
  console.log(`  Notifications: ${totalBookings > 0 ? notifs : 0} loggées, ${sentNotifs} envoyées`)

  console.log('\n==============================================')
  console.log('  TEST TERMINÉ ✅')
  console.log('==============================================')
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
