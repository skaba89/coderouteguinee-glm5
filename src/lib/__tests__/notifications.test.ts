// ============================================================
// Tests unitaires — Notification Service
// Vérifie le rendu des 8 templates, la gestion des canaux,
// le fallback console et l'enregistrement en base.
// ============================================================

import { sendNotification, notifyUser, type NotificationTemplate } from '../notifications'
import { db } from '@/lib/db'

// ─── Mock Prisma db ────────────────────────────────────────
jest.mock('@/lib/db', () => ({
  db: {
    notificationLog: {
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

// ─── Helpers ───────────────────────────────────────────────
const ALL_TEMPLATES: NotificationTemplate[] = [
  'welcome',
  'password_reset',
  'exam_reminder',
  'payment_confirmation',
  'booking_confirmed',
  'fraud_alert',
  'account_activated',
  'account_deactivated',
]

const VARIABLES: Record<string, string> = {
  prenom: 'Aicha',
  nom: 'Diallo',
  email: 'aicha@demo.gn',
  numeroUnique: 'GN-CODE-2026-0001',
  code: '123456',
  date: '15/07/2026',
  heure: '10:00',
  centre: 'Centre Kaloum',
  montant: '75000',
  reference: 'PAY-ABC123',
  session: 'EXAM-2026-001',
  description: 'Connexions multiples détectées',
  raison: 'Documents valides',
}

beforeEach(() => {
  jest.clearAllMocks()
  // Force console provider for both channels
  delete process.env.SMTP_HOST
  delete process.env.SMTP_USER
  delete process.env.SMTP_PASS
  delete process.env.EMAIL_API_URL
  process.env.SMS_PROVIDER = 'console'
  delete process.env.SMS_API_URL
})

describe('Notification Service', () => {
  describe('sendNotification — erreurs', () => {
    test('échoue sur un template inconnu', async () => {
      const result = await sendNotification({
        channel: 'email',
        template: 'unknown_template' as NotificationTemplate,
        recipient: 'test@demo.gn',
        variables: {},
      })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Template inconnu')
    })
  })

  describe('sendNotification — canal email en mode console', () => {
    test.each(ALL_TEMPLATES)('rend le template %s en email', async (template) => {
      const result = await sendNotification({
        channel: 'email',
        template,
        recipient: 'candidat@demo.gn',
        variables: VARIABLES,
      })
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test('enregistre le log en base avec le bon template', async () => {
      await sendNotification({
        channel: 'email',
        template: 'welcome',
        recipient: 'candidat@demo.gn',
        variables: VARIABLES,
      })
      expect(db.notificationLog.create).toHaveBeenCalledTimes(1)
      const call = db.notificationLog.create.mock.calls[0][0]
      expect(call.data.template).toBe('welcome')
      expect(call.data.type).toBe('email')
      expect(call.data.recipient).toBe('candidat@demo.gn')
      expect(call.data.status).toBe('sent')
      expect(call.data.provider).toBe('console')
      expect(call.data.subject).toContain('Bienvenue')
      expect(call.data.body).toContain('Aicha')
      expect(call.data.body).toContain('GN-CODE-2026-0001')
    })
  })

  describe('sendNotification — canal SMS en mode console', () => {
    test.each(ALL_TEMPLATES)('rend le template %s en SMS', async (template) => {
      const result = await sendNotification({
        channel: 'sms',
        template,
        recipient: '622123456',
        variables: VARIABLES,
      })
      expect(result.success).toBe(true)
    })

    test('enregistre le SMS sans sujet (subject null)', async () => {
      await sendNotification({
        channel: 'sms',
        template: 'exam_reminder',
        recipient: '622123456',
        variables: VARIABLES,
      })
      const call = db.notificationLog.create.mock.calls[0][0]
      expect(call.data.type).toBe('sms')
      expect(call.data.subject).toBeNull()
      expect(call.data.body).toContain('15/07/2026')
      expect(call.data.body).toContain('10:00')
    })

    test('formate le numéro guinéen avec +224', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      await sendNotification({
        channel: 'sms',
        template: 'welcome',
        recipient: '622123456',
        variables: VARIABLES,
      })
      // Console provider logs the formatted phone
      const phoneLog = consoleSpy.mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].includes('+224')
      )
      expect(phoneLog).toBeDefined()
      consoleSpy.mockRestore()
    })
  })

  describe('sendNotification — contenu des templates', () => {
    test('welcome inclut le numéro unique', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      await sendNotification({
        channel: 'email',
        template: 'welcome',
        recipient: 'aicha@demo.gn',
        variables: VARIABLES,
      })
      const body = consoleSpy.mock.calls
        .map((c) => c[0])
        .join('\n')
      expect(body).toContain('Aicha')
      expect(body).toContain('GN-CODE-2026-0001')
      consoleSpy.mockRestore()
    })

    test('password_reset inclut le code', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      await sendNotification({
        channel: 'email',
        template: 'password_reset',
        recipient: 'aicha@demo.gn',
        variables: VARIABLES,
      })
      const body = consoleSpy.mock.calls
        .map((c) => c[0])
        .join('\n')
      expect(body).toContain('123456')
      consoleSpy.mockRestore()
    })

    test('payment_confirmation inclut le montant et la référence', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      await sendNotification({
        channel: 'email',
        template: 'payment_confirmation',
        recipient: 'aicha@demo.gn',
        variables: VARIABLES,
      })
      const body = consoleSpy.mock.calls
        .map((c) => c[0])
        .join('\n')
      expect(body).toContain('75000')
      expect(body).toContain('PAY-ABC123')
      consoleSpy.mockRestore()
    })
  })

  describe('sendNotification — userId optionnel', () => {
    test('accepte un userId et l\'enregistre', async () => {
      await sendNotification({
        userId: 'user-123',
        channel: 'email',
        template: 'welcome',
        recipient: 'aicha@demo.gn',
        variables: VARIABLES,
      })
      const call = db.notificationLog.create.mock.calls[0][0]
      expect(call.data.userId).toBe('user-123')
    })

    test('fonctionne sans userId (null)', async () => {
      await sendNotification({
        channel: 'email',
        template: 'welcome',
        recipient: 'aicha@demo.gn',
        variables: VARIABLES,
      })
      const call = db.notificationLog.create.mock.calls[0][0]
      expect(call.data.userId).toBeNull()
    })
  })

  describe('notifyUser — résolution utilisateur', () => {
    test('récupère l\'email depuis l\'utilisateur', async () => {
      db.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'via-user@demo.gn',
        telephone: '622000000',
      })

      const result = await notifyUser('u-1', 'email', 'welcome', VARIABLES)
      expect(result.success).toBe(true)
      expect(db.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u-1' } })

      const call = db.notificationLog.create.mock.calls[0][0]
      expect(call.data.recipient).toBe('via-user@demo.gn')
    })

    test('récupère le téléphone pour le canal SMS', async () => {
      db.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'via-user@demo.gn',
        telephone: '627111111',
      })

      await notifyUser('u-1', 'sms', 'exam_reminder', VARIABLES)
      const call = db.notificationLog.create.mock.calls[0][0]
      expect(call.data.recipient).toBe('627111111')
    })

    test('échoue si l\'utilisateur n\'existe pas', async () => {
      db.user.findUnique.mockResolvedValue(null)
      const result = await notifyUser('missing', 'email', 'welcome', VARIABLES)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Utilisateur non trouvé')
    })
  })

  describe('sendNotification — gestion des erreurs', () => {
    test('survit à une erreur DB et renvoie quand même success', async () => {
      db.notificationLog.create.mockRejectedValueOnce(new Error('DB down'))
      const result = await sendNotification({
        channel: 'email',
        template: 'welcome',
        recipient: 'aicha@demo.gn',
        variables: VARIABLES,
      })
      // L'envoi lui-même a réussi, seul le log a échoué
      expect(result.success).toBe(true)
    })
  })
})
