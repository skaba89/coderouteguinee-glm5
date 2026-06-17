// ============================================================
// CodeRoute Guinée — Admin Audit Logs API
// GET /api/admin/audit-logs — Query audit logs with filters
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { queryAuditLogs } from '@/lib/audit-log'

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
    const eventType = searchParams.get('eventType') as string | null
    const severity = searchParams.get('severity') as string | null
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await queryAuditLogs({
      eventType: eventType as any || undefined,
      severity: severity as any || undefined,
      userId: userId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit: Math.min(limit, 200),
      offset: Math.max(offset, 0),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[AUDIT_LOGS_QUERY_ERROR]', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des journaux d\'audit.' },
      { status: 500 }
    )
  }
}
