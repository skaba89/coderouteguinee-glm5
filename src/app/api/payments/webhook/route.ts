// ============================================================
// CodeRoute Guinée — Mobile Money Webhook
// POST /api/payments/webhook — Receives payment notifications
// from Orange Money, MTN MoMo, and Celcom Money APIs
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit-log'
import { sendNotification } from '@/lib/notifications'
import { createHmac } from 'crypto'

// ─── Webhook signature verification ────────────────────────
function verifyWebhookSignature(
  provider: string,
  payload: string,
  signature: string,
  rawBody: string
): boolean {
  const secrets: Record<string, string | undefined> = {
    orange_money: process.env.ORANGE_MONEY_WEBHOOK_SECRET,
    mtn_money: process.env.MTN_MONEY_WEBHOOK_SECRET,
    celcom_money: process.env.CELCOM_MONEY_WEBHOOK_SECRET,
  }

  const secret = secrets[provider]
  if (!secret) {
    // No secret configured — accept in development, reject in production
    return process.env.NODE_ENV !== 'production'
  }

  const expectedSignature = createHmac('sha256', secret).update(rawBody).digest('hex')
  return signature === expectedSignature
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    // ─── Identify provider from headers ─────────────────────
    const providerHeader = request.headers.get('x-provider') ||
                          request.headers.get('x-source') ||
                          body.provider ||
                          'unknown'

    const signature = request.headers.get('x-signature') ||
                      request.headers.get('x-hub-signature-256') ||
                      ''

    // Verify webhook signature
    if (!verifyWebhookSignature(providerHeader, JSON.stringify(body), signature, rawBody)) {
      await logAudit({
        eventType: 'PAYMENT_FAIL',
        severity: 'critical',
        description: `Webhook signature verification failed for provider: ${providerHeader}`,
        details: { provider: providerHeader },
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // ─── Extract transaction reference and status ──────────
    let transactionRef: string
    let status: 'confirmed' | 'failed' | 'pending'
    let amount: number | null = null

    // Provider-specific payload parsing
    switch (providerHeader) {
      case 'orange_money':
        // Orange Money API webhook format
        transactionRef = body.transactionId || body.reference || ''
        status = body.status === 'SUCCESSFUL' ? 'confirmed' :
                 body.status === 'FAILED' ? 'failed' : 'pending'
        amount = body.amount ? parseInt(body.amount) : null
        break

      case 'mtn_money':
        // MTN MoMo API webhook format
        transactionRef = body.externalId || body.financialTransactionId || ''
        status = body.status === 'SUCCESSFUL' ? 'confirmed' :
                 body.status === 'FAILED' ? 'failed' : 'pending'
        amount = body.amount ? parseInt(body.amount) : null
        break

      case 'celcom_money':
        // Celcom Money API webhook format
        transactionRef = body.transaction_reference || body.tx_ref || ''
        status = body.status === 'success' || body.status === 'completed' ? 'confirmed' :
                 body.status === 'failed' || body.status === 'cancelled' ? 'failed' : 'pending'
        amount = body.amount ? parseInt(body.amount) : null
        break

      default:
        // Generic webhook format
        transactionRef = body.transactionRef || body.reference || body.id || ''
        status = body.status === 'success' || body.status === 'confirmed' ? 'confirmed' :
                 body.status === 'failed' ? 'failed' : 'pending'
    }

    if (!transactionRef) {
      return NextResponse.json({ error: 'Transaction reference required' }, { status: 400 })
    }

    // ─── Find the booking ───────────────────────────────────
    const booking = await db.booking.findFirst({
      where: { referencePaiement: transactionRef },
      include: { candidat: true, centre: true },
    })

    if (!booking) {
      await logAudit({
        eventType: 'PAYMENT_FAIL',
        severity: 'warning',
        description: `Webhook received for unknown transaction: ${transactionRef}`,
        details: { provider: providerHeader, transactionRef },
      })
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // ─── Idempotency check ─────────────────────────────────
    if (booking.statutPaiement === 'confirme' && status === 'confirmed') {
      // Already confirmed — webhook is duplicate, return success without action
      return NextResponse.json({ message: 'Already processed' })
    }

    // ─── Update booking based on status ────────────────────
    if (status === 'confirmed') {
      // Generate convocation number if not exists
      let convocationNumber = booking.numeroConvocation
      if (!convocationNumber) {
        const year = new Date().getFullYear()
        const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
        convocationNumber = `CONV-${year}-${random}`
      }

      await db.booking.update({
        where: { id: booking.id },
        data: {
          statutPaiement: 'confirme',
          confirmee: true,
          numeroConvocation: convocationNumber,
        },
      })

      await logAudit({
        eventType: 'PAYMENT_CONFIRM',
        userId: booking.candidatId,
        description: `Payment confirmed via webhook: ${transactionRef}`,
        details: {
          provider: providerHeader,
          amount,
          convocation: convocationNumber,
        },
      })

      // Send confirmation notifications
      const candidat = booking.candidat
      if (candidat) {
        sendNotification({
          userId: candidat.id,
          channel: 'email',
          template: 'payment_confirmation',
          recipient: candidat.email,
          variables: {
            prenom: candidat.prenom,
            montant: amount?.toString() || booking.montant.toString(),
            moyen: providerHeader,
            reference: transactionRef,
            date: new Date().toLocaleDateString('fr-FR'),
            dateExamen: booking.date,
            heureExamen: booking.heure,
          },
        }).catch(err => console.error('[PAYMENT_CONFIRM_EMAIL_ERROR]', err))

        sendNotification({
          userId: candidat.id,
          channel: 'sms',
          template: 'payment_confirmation',
          recipient: candidat.telephone,
          variables: {
            prenom: candidat.prenom,
            montant: amount?.toString() || booking.montant.toString(),
            moyen: providerHeader,
            reference: transactionRef,
          },
        }).catch(err => console.error('[PAYMENT_CONFIRM_SMS_ERROR]', err))
      }
    } else if (status === 'failed') {
      await db.booking.update({
        where: { id: booking.id },
        data: {
          statutPaiement: 'echoue',
        },
      })

      await logAudit({
        eventType: 'PAYMENT_FAIL',
        userId: booking.candidatId,
        severity: 'warning',
        description: `Payment failed via webhook: ${transactionRef}`,
        details: { provider: providerHeader },
      })
    }

    return NextResponse.json({
      received: true,
      status,
      transactionRef,
    })
  } catch (error) {
    console.error('[PAYMENT_WEBHOOK_ERROR]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── GET endpoint for webhook verification (some providers) ─
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const challenge = searchParams.get('hub.challenge') || searchParams.get('challenge')
  if (challenge) {
    return NextResponse.json({ challenge })
  }
  return NextResponse.json({ status: 'webhook active' })
}
