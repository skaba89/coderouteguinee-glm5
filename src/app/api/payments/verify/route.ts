import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/mobile-money'
import { getSessionFromRequest } from '@/lib/session'

// ─── POST: Verify/Check payment status ─────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { transactionRef } = body

    if (!transactionRef) {
      return NextResponse.json(
        { error: 'Référence de transaction requise' },
        { status: 400 }
      )
    }

    const result = await verifyPayment(transactionRef)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
