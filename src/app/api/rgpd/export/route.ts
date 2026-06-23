// ============================================================
// CodeRoute Guinée — RGPD Export Endpoint (Art. 32 & 37)
// ============================================================
// GET /api/rgpd/export?format=json|csv
//
// Returns all personal data for the authenticated user.
// Format:
//   - json (default): full nested JSON (Art. 32 — access right)
//   - csv: flattened CSV (Art. 37 — portability right)
//
// Auth: any authenticated user (candidat, auto-ecole, centre, admin)
// Rate limit: 1 request per minute per user (prevent abuse)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { exportUserDataPortable, AGPD_CONTACT } from '@/lib/rgpd';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  // ─── Auth check ────────────────────────────────────────
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { error: 'Authentification requise' },
      { status: 401 }
    );
  }

  // ─── Parse format ───────────────────────────────────────
  const format = (request.nextUrl.searchParams.get('format') || 'json') as 'json' | 'csv';
  if (!['json', 'csv'].includes(format)) {
    return NextResponse.json(
      { error: 'Format non supporté. Utilisez ?format=json ou ?format=csv' },
      { status: 400 }
    );
  }

  try {
    const result = await exportUserDataPortable(session.userId, format);

    return new NextResponse(result.data, {
      status: 200,
      headers: {
        'Content-Type': result.contentType + '; charset=utf-8',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'X-RGPD-Legal-Basis': 'Loi L/2022/018/AN, articles 32 et 37',
        'X-RGPD-AGPD-Contact': AGPD_CONTACT.email,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('RGPD export error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'export des données' },
      { status: 500 }
    );
  }
}
