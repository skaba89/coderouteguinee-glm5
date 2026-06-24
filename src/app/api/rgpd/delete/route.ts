// ============================================================
// CodeRoute Guinée — RGPD Account Deletion Endpoint (Art. 34)
// ============================================================
// POST /api/rgpd/delete
// Body: { reason?: string }
//
// Initiates the account deletion process. The account is
// immediately deactivated (user can no longer log in) and the
// actual anonymisation is performed within 30 days by a cron job.
//
// Auth: any authenticated user
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { requestAccountDeletion, AGPD_CONTACT } from '@/lib/rgpd';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  // ─── Auth check ────────────────────────────────────────
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { error: 'Authentification requise' },
      { status: 401 }
    );
  }

  // ─── Parse body ────────────────────────────────────────
  let body: { reason?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Body is optional — empty body is OK
  }
  if (body.reason && typeof body.reason !== 'string') {
    return NextResponse.json(
      { error: 'Le champ "reason" doit être une chaîne de caractères' },
      { status: 400 }
    );
  }
  if (body.reason && body.reason.length > 500) {
    return NextResponse.json(
      { error: 'Le champ "reason" ne peut pas dépasser 500 caractères' },
      { status: 400 }
    );
  }

  try {
    const result = await requestAccountDeletion(session.userId, body.reason);

    return NextResponse.json(
      {
        ...result,
        agpd_contact: AGPD_CONTACT,
        legal_basis: 'Loi L/2022/018/AN, article 34 — droit à l\'effacement',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('RGPD deletion error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la demande de suppression' },
      { status: 500 }
    );
  }
}
