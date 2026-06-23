// ============================================================
// CodeRoute Guinée — RGPD Helpers Tests (Sprint 3)
// ============================================================
// Tests the rgpd.ts helper functions for the 4 data subject rights:
//   - exportUserData (Art. 32)
//   - rectifyUserData (Art. 33)
//   - requestAccountDeletion (Art. 34)
//   - objectToProcessing (Art. 36)
//   - exportUserDataPortable (Art. 37)
// ============================================================

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ─── Mock dependencies BEFORE importing the module under test ──
const mockLogAudit = jest.fn<any>().mockResolvedValue(undefined);

const mockDbUserFindUnique = jest.fn<any>();
const mockDbUserUpdate = jest.fn<any>().mockResolvedValue({});
const mockDbNotificationLogFindMany = jest.fn<any>().mockResolvedValue([]);
const mockDbAuditLogFindMany = jest.fn<any>().mockResolvedValue([]);

jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: mockDbUserFindUnique,
      update: mockDbUserUpdate,
    },
    notificationLog: { findMany: mockDbNotificationLogFindMany },
    auditLog: { findMany: mockDbAuditLogFindMany },
  },
}));

jest.mock('@/lib/audit-log', () => ({
  logAudit: mockLogAudit,
}));

// Import AFTER mocks are set up
import {
  exportUserData,
  rectifyUserData,
  requestAccountDeletion,
  objectToProcessing,
  exportUserDataPortable,
  AGPD_CONTACT,
  RETENTION_PERIODS,
} from '../rgpd';

// ─── Test fixtures ─────────────────────────────────────────
const TEST_USER_ID = 'test-user-id-123';

const MOCK_USER = {
  id: TEST_USER_ID,
  email: 'candidat@demo.gn',
  passwordHash: '$argon2id$mocked',
  nom: 'Diallo',
  prenom: 'Mamadou',
  dateNaissance: '1990-01-01',
  numeroIdentite: 'NIN123456789',
  telephone: '+224620000000',
  ville: 'Conakry',
  region: 'Conakry',
  categoriePermis: 'B',
  numeroUnique: 'GN-CODE-2026-000001',
  langueMaternelle: 'fr',
  role: 'candidat',
  actif: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-06-01'),
  examSessions: [
    {
      id: 'exam-1',
      date: '2026-06-15',
      centreNom: 'Centre de Conakry',
      score: 38,
      statut: 'reussi',
      langue: 'fr',
    },
  ],
  bookings: [
    {
      id: 'booking-1',
      date: '2026-06-10',
      centreNom: 'Centre de Conakry',
      statutPaiement: 'confirme',
      montant: 35000,
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockDbUserFindUnique.mockResolvedValue(MOCK_USER);
});

// ─── Article 32 — Right of access ─────────────────────────
describe('exportUserData (Art. 32 — Right of access)', () => {
  it('exports all personal data for a valid user', async () => {
    const data = await exportUserData(TEST_USER_ID);

    expect(data.exported_at).toBeDefined();
    expect(data.legal_basis).toContain('L/2022/018/AN');
    expect(data.user.id).toBe(TEST_USER_ID);
    expect(data.user.email).toBe('candidat@demo.gn');
    expect(data.user.nom).toBe('Diallo');
    expect(data.user.prenom).toBe('Mamadou');
    expect(data.user.numeroUnique).toBe('GN-CODE-2026-000001');
  });

  it('includes exam sessions in the export', async () => {
    const data = await exportUserData(TEST_USER_ID);
    expect(data.examSessions).toHaveLength(1);
    expect(data.examSessions[0].centre).toBe('Centre de Conakry');
    expect(data.examSessions[0].score).toBe(38);
    expect(data.examSessions[0].statut).toBe('reussi');
  });

  it('includes bookings in the export', async () => {
    const data = await exportUserData(TEST_USER_ID);
    expect(data.bookings).toHaveLength(1);
    expect(data.bookings[0].statutPaiement).toBe('confirme');
    expect(data.bookings[0].montant).toBe(35000);
  });

  it('throws if user does not exist', async () => {
    mockDbUserFindUnique.mockResolvedValue(null);
    await expect(exportUserData('nonexistent-id')).rejects.toThrow('User not found');
  });

  it('logs the export to the audit log', async () => {
    await exportUserData(TEST_USER_ID);
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'DATA_EXPORT',
        userId: TEST_USER_ID,
        severity: 'info',
        targetType: 'User',
        targetId: TEST_USER_ID,
      })
    );
  });

  it('does not expose the password hash', async () => {
    const data = await exportUserData(TEST_USER_ID);
    const serialized = JSON.stringify(data);
    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('argon2');
  });
});

// ─── Article 33 — Right to rectification ─────────────────
describe('rectifyUserData (Art. 33 — Right to rectification)', () => {
  it('updates allowed fields and returns the list of updated fields', async () => {
    const result = await rectifyUserData(TEST_USER_ID, {
      nom: 'Camara',
      telephone: '+224622222222',
    });

    expect(result.success).toBe(true);
    expect(result.updated_fields).toEqual(expect.arrayContaining(['nom', 'telephone']));
    expect(mockDbUserUpdate).toHaveBeenCalledWith({
      where: { id: TEST_USER_ID },
      data: expect.objectContaining({
        nom: 'Camara',
        telephone: '+224622222222',
      }),
    });
  });

  it('rejects disallowed fields (passwordHash, role, actif)', async () => {
    // Cast to any to bypass TS — simulates a malicious client sending extra fields
    const maliciousInput = {
      passwordHash: 'fake-hash',
      role: 'super-admin',
      actif: true,
    } as any;

    const result = await rectifyUserData(TEST_USER_ID, maliciousInput);

    expect(result.success).toBe(false);
    expect(result.updated_fields).toEqual([]);
    expect(mockDbUserUpdate).not.toHaveBeenCalled();
  });

  it('returns success: false when no allowed fields are provided', async () => {
    const result = await rectifyUserData(TEST_USER_ID, {});
    expect(result.success).toBe(false);
    expect(result.updated_fields).toEqual([]);
  });

  it('logs the rectification to the audit log', async () => {
    await rectifyUserData(TEST_USER_ID, { nom: 'Camara' });
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'USER_UPDATE',
        userId: TEST_USER_ID,
        description: expect.stringContaining('Art. 33'),
      })
    );
  });
});

// ─── Article 34 — Right to erasure ────────────────────────
describe('requestAccountDeletion (Art. 34 — Right to erasure)', () => {
  it('deactivates the account immediately', async () => {
    const result = await requestAccountDeletion(TEST_USER_ID);

    expect(result.success).toBe(true);
    expect(result.request_id).toMatch(/^RGPD-DEL-/);
    expect(mockDbUserUpdate).toHaveBeenCalledWith({
      where: { id: TEST_USER_ID },
      data: expect.objectContaining({ actif: false }),
    });
  });

  it('returns an estimated completion date 30 days from now', async () => {
    const result = await requestAccountDeletion(TEST_USER_ID);
    const completion = new Date(result.estimated_completion_date);
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    // Should be approximately 30 days from now (±1 hour tolerance)
    expect(completion.getTime() - now).toBeGreaterThan(thirtyDaysMs - 60 * 60 * 1000);
    expect(completion.getTime() - now).toBeLessThan(thirtyDaysMs + 60 * 60 * 1000);
  });

  it('logs the deletion request as a warning', async () => {
    await requestAccountDeletion(TEST_USER_ID, 'no longer needed');
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'USER_DEACTIVATE',
        userId: TEST_USER_ID,
        severity: 'warning',
        description: expect.stringContaining('Art. 34'),
      })
    );
  });

  it('includes the reason in the audit log if provided', async () => {
    await requestAccountDeletion(TEST_USER_ID, 'privacy concern');
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          reason: 'privacy concern',
        }),
      })
    );
  });
});

// ─── Article 36 — Right to object ─────────────────────────
describe('objectToProcessing (Art. 36 — Right to object)', () => {
  it('opts out of all processing types when "all" is specified', async () => {
    const result = await objectToProcessing(TEST_USER_ID, 'all');
    expect(result.success).toBe(true);
    expect(result.opted_out).toEqual(
      expect.arrayContaining(['marketing', 'sms_reminders', 'email_notifications'])
    );
  });

  it('opts out of only the specified processing type', async () => {
    const result = await objectToProcessing(TEST_USER_ID, 'marketing');
    expect(result.success).toBe(true);
    expect(result.opted_out).toEqual(['marketing']);
  });

  it('logs the objection to the audit log', async () => {
    await objectToProcessing(TEST_USER_ID, 'sms_reminders');
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'USER_UPDATE',
        userId: TEST_USER_ID,
        description: expect.stringContaining('Art. 36'),
      })
    );
  });
});

// ─── Article 37 — Right to data portability ──────────────
describe('exportUserDataPortable (Art. 37 — Right to portability)', () => {
  it('returns JSON by default with correct content type', async () => {
    const result = await exportUserDataPortable(TEST_USER_ID);
    expect(result.contentType).toBe('application/json');
    expect(result.filename).toMatch(/\.json$/);
    expect(() => JSON.parse(result.data)).not.toThrow();
  });

  it('returns CSV when format=csv is specified', async () => {
    const result = await exportUserDataPortable(TEST_USER_ID, 'csv');
    expect(result.contentType).toBe('text/csv');
    expect(result.filename).toMatch(/\.csv$/);
    // CSV should have a header row
    expect(result.data.split('\n')[0]).toContain('field');
    expect(result.data.split('\n')[0]).toContain('value');
  });

  it('escapes double quotes in CSV values', async () => {
    const result = await exportUserDataPortable(TEST_USER_ID, 'csv');
    // The CSV should be parseable — every line should have an even number of quotes
    const lines = result.data.split('\n');
    for (const line of lines) {
      const quoteCount = (line.match(/"/g) || []).length;
      expect(quoteCount % 2).toBe(0);
    }
  });
});

// ─── Exports ──────────────────────────────────────────────
describe('RGPD exports', () => {
  it('exports AGPD contact information', () => {
    expect(AGPD_CONTACT.name).toContain('Autorité Guinéenne');
    expect(AGPD_CONTACT.email).toBe('contact@agpd.gov.gn');
    expect(AGPD_CONTACT.legal_basis).toContain('L/2022/018/AN');
  });

  it('exports retention periods for all data categories', () => {
    expect(RETENTION_PERIODS.user_account_inactive.years).toBe(10);
    expect(RETENTION_PERIODS.exam_results.years).toBe(10);
    expect(RETENTION_PERIODS.payments.years).toBe(10);
    expect(RETENTION_PERIODS.audit_logs.years).toBe(7);
    expect(RETENTION_PERIODS.app_logs.days).toBe(30);
    expect(RETENTION_PERIODS.sessions.hours).toBe(8);
    expect(RETENTION_PERIODS.sms_notifications.years).toBe(3);
  });

  it('includes a legal basis for every retention period', () => {
    for (const [category, period] of Object.entries(RETENTION_PERIODS)) {
      expect(period.basis).toBeDefined();
      expect(typeof period.basis).toBe('string');
      expect(period.basis.length).toBeGreaterThan(5);
    }
  });
});
