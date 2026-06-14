import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if booking exists
    const existingBooking = await db.booking.findUnique({ where: { id } })
    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Mark booking as confirmed
    const updatedBooking = await db.booking.update({
      where: { id },
      data: {
        statutPaiement: 'confirme',
        confirmee: true,
      },
    })

    return NextResponse.json(updatedBooking)
  } catch (error) {
    console.error('Booking confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
