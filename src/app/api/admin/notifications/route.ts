// ============================================================
// CodeRoute Guinée — Admin Notifications History API
// GET /api/admin/notifications — List notification logs
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getNotificationHistory } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'super-admin' && session.role !== 'administration')) {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      )
    }

    const { searchParams } = request.nextUrl
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await getNotificationHistory(
      Math.min(limit, 200),
      Math.max(offset, 0),
      status || undefined
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('[NOTIFICATIONS_QUERY_ERROR]', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notifications.' },
      { status: 500 }
    )
  }
}
