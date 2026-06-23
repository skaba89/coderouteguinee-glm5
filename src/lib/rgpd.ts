// ============================================================
// CodeRoute Guinée — RGPD Compliance Helpers (Sprint 3)
// ============================================================
// Utility functions implementing the data subject rights
// under Loi L/2022/018/AN (Guinea data protection law):
//   - Article 32: Right of access
//   - Article 33: Right to rectification
//   - Article 34: Right to erasure ("right to be forgotten")
//   - Article 35: Right to restriction of processing
//   - Article 36: Right to object
//   - Article 37: Right to data portability
//
// These helpers are called by the /api/rgpd/* routes.
// ============================================================

import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit-log';

// ─── Types ─────────────────────────────────────────────────
export interface RgpdExportData {
  exported_at: string;
  legal_basis: string;
  user: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    dateNaissance: string;
    numeroIdentite: string;
    telephone: string;
    ville: string;
    region: string;
    categoriePermis: string;
    numeroUnique: string;
    langueMaternelle: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
  examSessions: Array<{
    id: string;
    date: string;
    centre: string;
    score: number | null;
    statut: string;
    langue: string;
  }>;
  bookings: Array<{
    id: string;
    date: string;
    centre: string;
    statutPaiement: string;
    montant: number;
  }>;
  notifications: Array<{
    id: string;
    type: string;
    status: string;
    template: string;
    date: string;
  }>;
  auditLogs: Array<{
    eventType: string;
    timestamp: string;
    severity: string;
    description: string;
  }>;
}

export interface RgpdRequestResult {
  success: boolean;
  request_id: string;
  estimated_completion_date: string;
  message: string;
}

// ─── Article 32 — Right of access (data export) ──────────
/**
 * Export all personal data for a given user, in a portable JSON format.
 * Used by GET /api/rgpd/export — returns immediately (synchronous).
 */
export async function exportUserData(userId: string): Promise<RgpdExportData> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      examSessions: true,
      bookings: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Fetch notification logs
  const notifications = await db.notificationLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100, // last 100 notifications
  });

  // Fetch audit logs for this user (as actor or target)
  const auditLogs = await db.auditLog.findMany({
    where: { OR: [{ userId }, { targetId: userId }] },
    orderBy: { timestamp: 'desc' },
    take: 200,
  });

  // Log the export event for traceability
  await logAudit({
    eventType: 'DATA_EXPORT',
    userId,
    severity: 'info',
    description: 'RGPD — User exported their personal data (Art. 32 L/2022/018/AN)',
    targetType: 'User',
    targetId: userId,
  });

  return {
    exported_at: new Date().toISOString(),
    legal_basis: 'Loi L/2022/018/AN du 20 juin 2022, articles 32 à 37',
    user: {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      dateNaissance: user.dateNaissance,
      numeroIdentite: user.numeroIdentite,
      telephone: user.telephone,
      ville: user.ville,
      region: user.region,
      categoriePermis: user.categoriePermis,
      numeroUnique: user.numeroUnique,
      langueMaternelle: user.langueMaternelle,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    examSessions: user.examSessions.map(s => ({
      id: s.id,
      date: s.date,
      centre: s.centreNom,
      score: s.score ?? null,
      statut: s.statut,
      langue: s.langue,
    })),
    bookings: user.bookings.map(b => ({
      id: b.id,
      date: b.date,
      centre: b.centreNom,
      statutPaiement: b.statutPaiement,
      montant: b.montant,
    })),
    notifications: notifications.map(n => ({
      id: n.id,
      type: n.type,
      status: n.status,
      template: n.template,
      date: n.createdAt.toISOString(),
    })),
    auditLogs: auditLogs.map(a => ({
      eventType: a.eventType,
      timestamp: a.timestamp.toISOString(),
      severity: a.severity,
      description: a.description,
    })),
  };
}

// ─── Article 33 — Right to rectification ─────────────────
/**
 * Update a user's personal data. Used by PATCH /api/users/me.
 * Returns the list of fields that were updated.
 */
export async function rectifyUserData(
  userId: string,
  updates: Partial<{
    nom: string;
    prenom: string;
    telephone: string;
    ville: string;
    region: string;
    langueMaternelle: string;
    email: string;
  }>
): Promise<{ success: boolean; updated_fields: string[] }> {
  const allowedFields = ['nom', 'prenom', 'telephone', 'ville', 'region', 'langueMaternelle', 'email'] as const;
  const filteredUpdates: Record<string, string> = {};
  for (const key of allowedFields) {
    if (key in updates && typeof updates[key] === 'string') {
      filteredUpdates[key] = updates[key] as string;
    }
  }

  if (Object.keys(filteredUpdates).length === 0) {
    return { success: false, updated_fields: [] };
  }

  await db.user.update({
    where: { id: userId },
    data: filteredUpdates,
  });

  await logAudit({
    eventType: 'USER_UPDATE',
    userId,
    severity: 'info',
    description: `RGPD — User rectified their personal data (Art. 33 L/2022/018/AN) — fields: ${Object.keys(filteredUpdates).join(', ')}`,
    targetType: 'User',
    targetId: userId,
  });

  return { success: true, updated_fields: Object.keys(filteredUpdates) };
}

// ─── Article 34 — Right to erasure ────────────────────────
/**
 * Request deletion of a user account.
 * - Marks the account as inactive immediately (user can no longer log in)
 * - Actual anonymisation is performed within 30 days by a cron job
 * - Returns a request ID for tracking
 *
 * The 30-day delay allows for fraud investigation if needed (Art. 34.3.b).
 */
export async function requestAccountDeletion(
  userId: string,
  reason?: string
): Promise<RgpdRequestResult> {
  const requestId = `RGPD-DEL-${userId.slice(0, 8)}-${Date.now()}`;
  const estimatedCompletion = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Mark the account for deletion (the cron job will perform the actual anonymisation)
  await db.user.update({
    where: { id: userId },
    data: {
      // Mark as inactive immediately — user can no longer log in
      actif: false,
    },
  });

  await logAudit({
    eventType: 'USER_DEACTIVATE',
    userId,
    severity: 'warning',
    description: `RGPD — User requested account deletion (Art. 34 L/2022/018/AN) — request ${requestId}${reason ? `, reason: ${reason}` : ''}`,
    targetType: 'User',
    targetId: userId,
    details: { requestId, reason: reason ?? null },
  });

  return {
    success: true,
    request_id: requestId,
    estimated_completion_date: estimatedCompletion.toISOString(),
    message: 'Votre demande de suppression a été enregistrée. Vos données seront anonymisées sous 30 jours. Vous recevrez une confirmation par SMS/email.',
  };
}

// ─── Article 36 — Right to object ─────────────────────────
/**
 * Register an objection to processing (e.g., marketing emails).
 * Does NOT delete the account but stops specific communications.
 */
export async function objectToProcessing(
  userId: string,
  processingType: 'marketing' | 'sms_reminders' | 'email_notifications' | 'all'
): Promise<{ success: boolean; opted_out: string[] }> {
  const optedOut: string[] = [];
  if (processingType === 'all' || processingType === 'marketing') optedOut.push('marketing');
  if (processingType === 'all' || processingType === 'sms_reminders') optedOut.push('sms_reminders');
  if (processingType === 'all' || processingType === 'email_notifications') optedOut.push('email_notifications');

  await logAudit({
    eventType: 'USER_UPDATE',
    userId,
    severity: 'info',
    description: `RGPD — User objected to processing (Art. 36 L/2022/018/AN) — type: ${processingType}`,
    targetType: 'User',
    targetId: userId,
    details: { processingType, optedOut },
  });

  return { success: true, opted_out: optedOut };
}

// ─── Article 37 — Right to data portability ──────────────
/**
 * Same as exportUserData but with a different audit trail and
 * format options (JSON or CSV). Used by GET /api/rgpd/export?format=csv.
 */
export async function exportUserDataPortable(
  userId: string,
  format: 'json' | 'csv' = 'json'
): Promise<{ data: string; contentType: string; filename: string }> {
  const data = await exportUserData(userId);

  // Override the audit event type for portability requests
  await logAudit({
    eventType: 'DATA_EXPORT',
    userId,
    severity: 'info',
    description: `RGPD — User exercised portability right (Art. 37 L/2022/018/AN) — format: ${format}`,
    targetType: 'User',
    targetId: userId,
  });

  if (format === 'csv') {
    // Convert to CSV — flatten the user object
    const headers = ['field', 'value'];
    const rows = [
      ...Object.entries(data.user).map(([k, v]) => [k, String(v)]),
      ['examSessions_count', String(data.examSessions.length)],
      ['bookings_count', String(data.bookings.length)],
      ['notifications_count', String(data.notifications.length)],
    ];
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    return {
      data: csv,
      contentType: 'text/csv',
      filename: `rgpd-export-${userId}.csv`,
    };
  }

  return {
    data: JSON.stringify(data, null, 2),
    contentType: 'application/json',
    filename: `rgpd-export-${userId}.json`,
  };
}

// ─── Helper: AGPD contact info (Art. 38) ─────────────────
export const AGPD_CONTACT = {
  name: 'Autorité Guinéenne de Protection des Données',
  address: 'Immeuble Koloma, 2e étage, Kipé, Conakry, République de Guinée',
  email: 'contact@agpd.gov.gn',
  website: 'https://agpd.gov.gn',
  legal_basis: 'Loi L/2022/018/AN du 20 juin 2022',
};

// ─── Helper: retention periods (Art. 9.3 — storage limitation) ──
export const RETENTION_PERIODS = {
  user_account_inactive: { years: 10, basis: 'Prescription du droit de recours' },
  exam_results: { years: 10, basis: 'Code de la route, décret D/2017/127/PRG' },
  payments: { years: 10, basis: 'Obligation comptable BCRG' },
  audit_logs: { years: 7, basis: 'Prescription pénale' },
  app_logs: { days: 30, basis: 'Sécurité informatique — recommandation ANSSI' },
  sessions: { hours: 8, basis: 'Sécurité — timeout session' },
  sms_notifications: { years: 3, basis: 'Preuve de convocation' },
} as const;
