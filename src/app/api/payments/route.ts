import { NextRequest, NextResponse } from 'next/server'
import { initiateMobileMoneyPayment, validateMobileMoneyNumber, getAllProviders } from '@/lib/mobile-money'
import { getSessionFromRequest } from '@/lib/session'
import { getCurrentTarif } from '@/lib/tarif'

// ─── GET: List available Mobile Money providers ────────────
export async function GET() {
  try {
    const providers = getAllProviders()
    return NextResponse.json({ providers })
  } catch (error) {
    console.error('Provider list error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// ─── POST: Initiate a Mobile Money payment ─────────────────
export async function POST(request: NextRequest) {
  try {
    // Verify session
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookingId, phoneNumber, amount } = body

    if (!bookingId || !phoneNumber) {
      return NextResponse.json(
        { error: 'ID réservation et numéro de téléphone requis' },
        { status: 400 }
      )
    }

    // Validate phone number format and detect provider
    const validation = validateMobileMoneyNumber(phoneNumber)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Initiate payment
    const result = await initiateMobileMoneyPayment({
      bookingId,
      phoneNumber,
      amount: amount || (await getCurrentTarif('examen_reservation_B')).montant,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, provider: result.providerName },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      transactionRef: result.transactionRef,
      status: result.status,
      message: result.message,
      provider: result.providerName,
      ussdCode: result.ussdCode,
    }, { status: 201 })
  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
