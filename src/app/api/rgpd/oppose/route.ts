// ============================================================
// CodeRoute Guinée — RGPD Objection Endpoint (Art. 36)
// ============================================================
// POST /api/rgpd/oppose
// Body: { processingType: 'marketing' | 'sms_reminders' | 'email_notifications' | 'all' }
//
// Registers an objection to a specific type of processing.
// The user's account is NOT deleted — only the specified
// communications are stopped.
//
// Auth: any authenticated user
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { objectToProcessing, AGPD_CONTACT } from '@/lib/rgpd';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const VALID_TYPES = ['marketing', 'sms_reminders', 'email_notifications', 'all'] as const;
type ProcessingType = (typeof VALID_TYPES)[number];

export async function POST(request: NextRequest) {
  // ─── Auth check ────────────────────────────────────────
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { error: 'Authentification requise' },
      { status: 401 }
    );
  }

  // ─── Parse and validate body ───────────────────────────
  let body: { processingType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête invalide (JSON attendu)' },
      { status: 400 }
    );
  }

  if (!body.processingType) {
    return NextResponse.json(
      { error: 'Champ "processingType" requis' },
      { status: 400 }
    );
  }

  if (!VALID_TYPES.includes(body.processingType as ProcessingType)) {
    return NextResponse.json(
      { error: `Type invalide. Valeurs acceptées: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const result = await objectToProcessing(
      session.userId,
      body.processingType as ProcessingType
    );

    return NextResponse.json(
      {
        ...result,
        agpd_contact: AGPD_CONTACT,
        legal_basis: 'Loi L/2022/018/AN, article 36 — droit d\'opposition',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('RGPD objection error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement de l\'opposition' },
      { status: 500 }
    );
  }
}
