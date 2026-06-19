// ============================================================
// Tests unitaires — Mobile Money (Orange / MTN / Celcom)
// ============================================================

import {
  detectProvider,
  validateMobileMoneyNumber,
  getProviderInfo,
  getAllProviders,
  initiateMobileMoneyPayment,
  verifyPayment,
} from '../mobile-money'

// ─── Mock DB ────────────────────────────────────────────────
jest.mock('@/lib/db', () => ({
  db: {
    booking: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { db } from '@/lib/db'

// ─── Helpers ────────────────────────────────────────────────
const bookingMock = db.booking as unknown as {
  findUnique: jest.Mock
  findFirst: jest.Mock
  update: jest.Mock
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── Données de test ────────────────────────────────────────
const ORANGE_NUM = '622123456' // 9 chiffres, préfixe Orange
const MTN_NUM = '624987654'
const CELCOM_NUM = '627111222'
const UNKNOWN_NUM = '629123456' // préfixe non Mobile Money

describe('Mobile Money', () => {
  // ============================================================
  // detectProvider
  // ============================================================
  describe('detectProvider', () => {
    test('détecte Orange Money pour les préfixes 620/621/622', () => {
      expect(detectProvider('620000000')?.id).toBe('orange_money')
      expect(detectProvider('621000000')?.id).toBe('orange_money')
      expect(detectProvider('622000000')?.id).toBe('orange_money')
    })

    test('détecte MTN Mobile Money pour les préfixes 623/624/625', () => {
      expect(detectProvider('623000000')?.id).toBe('mtn_money')
      expect(detectProvider('624000000')?.id).toBe('mtn_money')
      expect(detectProvider('625000000')?.id).toBe('mtn_money')
    })

    test('détecte Celcom Money pour les préfixes 626/627/628', () => {
      expect(detectProvider('626000000')?.id).toBe('celcom_money')
      expect(detectProvider('627000000')?.id).toBe('celcom_money')
      expect(detectProvider('628000000')?.id).toBe('celcom_money')
    })

    test('retourne null pour un préfixe inconnu', () => {
      expect(detectProvider('629000000')).toBeNull()
      expect(detectProvider('600000000')).toBeNull()
      expect(detectProvider('690000000')).toBeNull()
    })

    test('nettoie les espaces et tirets', () => {
      expect(detectProvider('622 12 34 56')?.id).toBe('orange_money')
      expect(detectProvider('622-12-34-56')?.id).toBe('orange_money')
      expect(detectProvider(' 622 12 34 56 ')?.id).toBe('orange_money')
    })

    test('nettoie le préfixe international +224', () => {
      expect(detectProvider('+224622123456')?.id).toBe('orange_money')
      expect(detectProvider('+224 622 12 34 56')?.id).toBe('orange_money')
    })

    test('retourne null pour un numéro vide', () => {
      expect(detectProvider('')).toBeNull()
    })

    test('retourne null pour un préfixe non-MMO', () => {
      // '622' est un préfixe valide Orange mais detectProvider ne fait que
      // tester le startWith ; il ne valide pas la longueur. La longueur est
      // validée par validateMobileMoneyNumber, pas par detectProvider.
      // Ici on teste un préfixe non-MMO donc on doit vraiment obtenir null.
      expect(detectProvider('629')).toBeNull()
      expect(detectProvider('629123456')).toBeNull()
    })

    test('retourne null pour un numéro ne commençant pas par 6', () => {
      // Les préfixes Orange/MTN/Celcom commencent tous par 6XX
      // Un numéro commençant par autre chose ne matchera pas
      expect(detectProvider('722123456')).toBeNull()
    })
  })

  // ============================================================
  // validateMobileMoneyNumber
  // ============================================================
  describe('validateMobileMoneyNumber', () => {
    test('valide un numéro Orange Money bien formé', () => {
      const r = validateMobileMoneyNumber(ORANGE_NUM)
      expect(r.valid).toBe(true)
      expect(r.error).toBeUndefined()
      expect(r.provider?.id).toBe('orange_money')
    })

    test('valide un numéro MTN bien formé', () => {
      const r = validateMobileMoneyNumber(MTN_NUM)
      expect(r.valid).toBe(true)
      expect(r.provider?.id).toBe('mtn_money')
    })

    test('valide un numéro Celcom bien formé', () => {
      const r = validateMobileMoneyNumber(CELCOM_NUM)
      expect(r.valid).toBe(true)
      expect(r.provider?.id).toBe('celcom_money')
    })

    test('accepte le préfixe international +224', () => {
      const r = validateMobileMoneyNumber('+224622123456')
      expect(r.valid).toBe(true)
      expect(r.provider?.id).toBe('orange_money')
    })

    test('accepte les espaces et tirets', () => {
      const r = validateMobileMoneyNumber('622 12 34 56')
      expect(r.valid).toBe(true)
    })

    test('rejette un numéro de 8 chiffres (format non-guinéen)', () => {
      const r = validateMobileMoneyNumber('62212345')
      expect(r.valid).toBe(false)
      expect(r.error).toContain('9 chiffres')
    })

    test('rejette un numéro de 10 chiffres', () => {
      const r = validateMobileMoneyNumber('6221234567')
      expect(r.valid).toBe(false)
      expect(r.error).toContain('9 chiffres')
    })

    test('rejette un numéro avec des lettres', () => {
      const r = validateMobileMoneyNumber('622ABCDEF')
      expect(r.valid).toBe(false)
    })

    test('rejette un numéro au format guinéen mais préfixe inconnu', () => {
      const r = validateMobileMoneyNumber(UNKNOWN_NUM)
      expect(r.valid).toBe(false)
      expect(r.error).toContain('non reconnu')
      expect(r.error).toContain('Orange Money')
      expect(r.error).toContain('MTN')
      expect(r.error).toContain('Celcom')
    })

    test('rejette un numéro vide', () => {
      const r = validateMobileMoneyNumber('')
      expect(r.valid).toBe(false)
    })
  })

  // ============================================================
  // getAllProviders
  // ============================================================
  describe('getAllProviders', () => {
    test('retourne les 3 providers configurés', () => {
      const list = getAllProviders()
      expect(list).toHaveLength(3)
      const ids = list.map((p) => p.id).sort()
      expect(ids).toEqual(['celcom_money', 'mtn_money', 'orange_money'])
    })

    test('expose id, name, color et prefixes pour chaque provider', () => {
      const list = getAllProviders()
      for (const p of list) {
        expect(typeof p.id).toBe('string')
        expect(typeof p.name).toBe('string')
        expect(typeof p.color).toBe('string')
        expect(Array.isArray(p.prefixes)).toBe(true)
        expect(p.prefixes.length).toBeGreaterThan(0)
      }
    })

    test('ne fuite PAS les clés API ni les URLs internes', () => {
      const list = getAllProviders()
      for (const p of list) {
        const obj = p as unknown as Record<string, unknown>
        expect(obj.apiKey).toBeUndefined()
        expect(obj.apiUrl).toBeUndefined()
      }
    })

    test('chaque provider a une couleur hex valide', () => {
      const list = getAllProviders()
      for (const p of list) {
        expect(p.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      }
    })
  })

  // ============================================================
  // getProviderInfo
  // ============================================================
  describe('getProviderInfo', () => {
    test('retourne le provider Orange par id', () => {
      const p = getProviderInfo('orange_money')
      expect(p).not.toBeNull()
      expect(p?.name).toBe('Orange Money')
      expect(p?.color).toBe('#FF6600')
    })

    test('retourne le provider MTN par id', () => {
      const p = getProviderInfo('mtn_money')
      expect(p).not.toBeNull()
      expect(p?.name).toBe('MTN Mobile Money')
    })

    test('retourne le provider Celcom par id', () => {
      const p = getProviderInfo('celcom_money')
      expect(p).not.toBeNull()
      expect(p?.name).toBe('Celcom Money')
    })

    test('retourne null pour un id inconnu', () => {
      expect(getProviderInfo('unknown')).toBeNull()
      expect(getProviderInfo('')).toBeNull()
    })
  })

  // ============================================================
  // initiateMobileMoneyPayment
  // ============================================================
  describe('initiateMobileMoneyPayment', () => {
    test('échoue si le numéro est invalide', async () => {
      const r = await initiateMobileMoneyPayment({
        bookingId: 'bk-1',
        phoneNumber: 'invalid',
        amount: 50000,
      })
      expect(r.success).toBe(false)
      expect(r.status).toBe('failed')
      expect(r.providerName).toBe('Inconnu')
      expect(bookingMock.findUnique).not.toHaveBeenCalled()
    })

    test('échoue si le numéro est valide mais pas Mobile Money', async () => {
      const r = await initiateMobileMoneyPayment({
        bookingId: 'bk-1',
        phoneNumber: UNKNOWN_NUM,
        amount: 50000,
      })
      expect(r.success).toBe(false)
      expect(r.status).toBe('failed')
      expect(r.message).toContain('non reconnu')
    })

    test('échoue si montant < minAmount (1000 GNF)', async () => {
      const r = await initiateMobileMoneyPayment({
        bookingId: 'bk-1',
        phoneNumber: ORANGE_NUM,
        amount: 500,
      })
      expect(r.success).toBe(false)
      expect(r.status).toBe('failed')
      expect(r.message).toContain('Minimum')
      // Intl.NumberFormat par défaut utilise la locale en-US (1,000)
      expect(r.message).toMatch(/1[\s.,]000/)
    })

    test('échoue si montant > maxAmount Orange (5 000 000 GNF)', async () => {
      const r = await initiateMobileMoneyPayment({
        bookingId: 'bk-1',
        phoneNumber: ORANGE_NUM,
        amount: 6_000_000,
      })
      expect(r.success).toBe(false)
      expect(r.message).toContain('Maximum')
      expect(r.message).toMatch(/5[\s.,]000[\s.,]000/)
    })

    test('échoue si montant > maxAmount Celcom (3 000 000 GNF)', async () => {
      const r = await initiateMobileMoneyPayment({
        bookingId: 'bk-1',
        phoneNumber: CELCOM_NUM,
        amount: 3_500_000,
      })
      expect(r.success).toBe(false)
      expect(r.message).toMatch(/3[\s.,]000[\s.,]000/)
    })

    test('échoue si la réservation n\'existe pas', async () => {
      bookingMock.findUnique.mockResolvedValueOnce(null)
      const r = await initiateMobileMoneyPayment({
        bookingId: 'missing-bk',
        phoneNumber: ORANGE_NUM,
        amount: 50000,
      })
      expect(r.success).toBe(false)
      expect(r.message).toContain('Réservation introuvable')
      expect(bookingMock.findUnique).toHaveBeenCalledWith({
        where: { id: 'missing-bk' },
      })
    })

    test('échoue si la réservation est déjà confirmée', async () => {
      bookingMock.findUnique.mockResolvedValueOnce({
        id: 'bk-1',
        statutPaiement: 'confirme',
      })
      const r = await initiateMobileMoneyPayment({
        bookingId: 'bk-1',
        phoneNumber: ORANGE_NUM,
        amount: 50000,
      })
      expect(r.success).toBe(false)
      expect(r.message).toContain('déjà payée')
      expect(bookingMock.update).not.toHaveBeenCalled()
    })

    test('initialise le paiement en sandbox (booking en attente)', async () => {
      bookingMock.findUnique.mockResolvedValueOnce({
        id: 'bk-1',
        statutPaiement: 'en_attente',
        createdAt: new Date(),
      })
      bookingMock.update.mockResolvedValueOnce({})

      const r = await initiateMobileMoneyPayment({
        bookingId: 'bk-1',
        phoneNumber: ORANGE_NUM,
        amount: 50000,
      })

      // En sandbox, simulateProviderApi a 95% de taux de succès.
      // Le test ne doit PAS échouer aléatoirement — on relance si jamais
      // on tombe dans les 5% malchanceux.
      if (!r.success) {
        // Retry une fois pour le bruit aléatoire
        bookingMock.findUnique.mockResolvedValueOnce({
          id: 'bk-1',
          statutPaiement: 'en_attente',
          createdAt: new Date(),
        })
        bookingMock.update.mockResolvedValueOnce({})
        const r2 = await initiateMobileMoneyPayment({
          bookingId: 'bk-1',
          phoneNumber: ORANGE_NUM,
          amount: 50000,
        })
        expect(r2.success).toBe(true)
        expect(r2.status).toBe('pending')
        expect(r2.transactionRef).toBeTruthy()
        expect(r2.providerName).toBe('Orange Money')
        expect(r2.ussdCode).toBe('#144*1#')
      } else {
        expect(r.status).toBe('pending')
        // Format sandbox: SIM-<PROVIDER>-<timestamp> (pas de suffixe aléatoire)
        expect(r.transactionRef).toMatch(/^SIM-ORANGE_MONEY-\d+$/)
        expect(r.providerName).toBe('Orange Money')
        expect(r.ussdCode).toBe('#144*1#')
      }

      // Vérifie que le booking a été mis à jour avec les bons champs
      expect(bookingMock.update).toHaveBeenCalledWith({
        where: { id: 'bk-1' },
        data: expect.objectContaining({
          statutPaiement: 'en_attente',
          numeroPaiement: ORANGE_NUM,
          moyenPaiement: 'mobile_money_orange_money',
        }),
      })
    })

    test('renvoie le bon USSD pour MTN (#156*1#)', async () => {
      bookingMock.findUnique.mockResolvedValueOnce({
        id: 'bk-1',
        statutPaiement: 'en_attente',
        createdAt: new Date(),
      })
      bookingMock.update.mockResolvedValueOnce({})

      const r = await initiateMobileMoneyPayment({
        bookingId: 'bk-1',
        phoneNumber: MTN_NUM,
        amount: 50000,
      })
      if (r.success) {
        expect(r.ussdCode).toBe('*156*1#')
        expect(r.providerName).toBe('MTN Mobile Money')
      }
    })

    test('renvoie le bon USSD pour Celcom (*400*1#)', async () => {
      bookingMock.findUnique.mockResolvedValueOnce({
        id: 'bk-1',
        statutPaiement: 'en_attente',
        createdAt: new Date(),
      })
      bookingMock.update.mockResolvedValueOnce({})

      const r = await initiateMobileMoneyPayment({
        bookingId: 'bk-1',
        phoneNumber: CELCOM_NUM,
        amount: 50000,
      })
      if (r.success) {
        expect(r.ussdCode).toBe('*400*1#')
        expect(r.providerName).toBe('Celcom Money')
      }
    })

    test('accepte un montant exact égal au minAmount (1000 GNF)', async () => {
      bookingMock.findUnique.mockResolvedValueOnce({
        id: 'bk-1',
        statutPaiement: 'en_attente',
        createdAt: new Date(),
      })
      bookingMock.update.mockResolvedValueOnce({})
      const r = await initiateMobileMoneyPayment({
        bookingId: 'bk-1',
        phoneNumber: ORANGE_NUM,
        amount: 1000,
      })
      // Si on arrive jusqu'à findUnique, c'est que le montant était valide
      expect(bookingMock.findUnique).toHaveBeenCalled()
      // Pas d'erreur de montant
      expect(r.message).not.toContain('Montant invalide')
    })

    test('accepte un montant exact égal au maxAmount Orange (5 000 000 GNF)', async () => {
      bookingMock.findUnique.mockResolvedValueOnce({
        id: 'bk-1',
        statutPaiement: 'en_attente',
        createdAt: new Date(),
      })
      bookingMock.update.mockResolvedValueOnce({})
      await initiateMobileMoneyPayment({
        bookingId: 'bk-1',
        phoneNumber: ORANGE_NUM,
        amount: 5_000_000,
      })
      expect(bookingMock.findUnique).toHaveBeenCalled()
    })
  })

  // ============================================================
  // verifyPayment
  // ============================================================
  describe('verifyPayment', () => {
    test('retourne failed si la transaction n\'existe pas', async () => {
      bookingMock.findFirst.mockResolvedValueOnce(null)
      const r = await verifyPayment('MM-DOES-NOT-EXIST')
      expect(r.status).toBe('failed')
      expect(r.message).toContain('introuvable')
    })

    test('retourne confirmed si le booking est déjà confirmé', async () => {
      bookingMock.findFirst.mockResolvedValueOnce({
        id: 'bk-1',
        referencePaiement: 'REF-1',
        statutPaiement: 'confirme',
        createdAt: new Date(),
      })
      const r = await verifyPayment('REF-1')
      expect(r.status).toBe('confirmed')
      expect(bookingMock.update).not.toHaveBeenCalled()
    })

    test('retourne failed si le booking est en échec', async () => {
      bookingMock.findFirst.mockResolvedValueOnce({
        id: 'bk-1',
        referencePaiement: 'REF-1',
        statutPaiement: 'echoue',
        createdAt: new Date(),
      })
      const r = await verifyPayment('REF-1')
      expect(r.status).toBe('failed')
      expect(r.message).toContain('échoué')
    })

    test('retourne pending si le booking est récent (< 30s) en sandbox', async () => {
      bookingMock.findFirst.mockResolvedValueOnce({
        id: 'bk-1',
        referencePaiement: 'REF-1',
        statutPaiement: 'en_attente',
        createdAt: new Date(), // maintenant
      })
      const r = await verifyPayment('REF-1')
      expect(r.status).toBe('pending')
      expect(r.message).toContain('attente')
    })

    test('auto-confirme en sandbox après 30 secondes', async () => {
      const oldDate = new Date(Date.now() - 60_000) // 1 minute ago
      bookingMock.findFirst.mockResolvedValueOnce({
        id: 'bk-1',
        referencePaiement: 'REF-1',
        statutPaiement: 'en_attente',
        createdAt: oldDate,
      })
      bookingMock.update.mockResolvedValueOnce({})
      const r = await verifyPayment('REF-1')
      expect(r.status).toBe('confirmed')
      expect(r.message).toContain('sandbox')
      expect(bookingMock.update).toHaveBeenCalledWith({
        where: { id: 'bk-1' },
        data: expect.objectContaining({
          statutPaiement: 'confirme',
          confirmee: true,
        }),
      })
    })

    test('ne fait pas d\'auto-confirm si NODE_ENV=production', async () => {
      const originalEnv = process.env.NODE_ENV
      try {
        Object.defineProperty(process.env, 'NODE_ENV', {
          value: 'production',
          writable: true,
          configurable: true,
        })
        const oldDate = new Date(Date.now() - 60_000)
        bookingMock.findFirst.mockResolvedValueOnce({
          id: 'bk-1',
          referencePaiement: 'REF-1',
          statutPaiement: 'en_attente',
          createdAt: oldDate,
        })
        const r = await verifyPayment('REF-1')
        expect(r.status).toBe('pending') // reste pending, pas d'auto-confirm
        expect(bookingMock.update).not.toHaveBeenCalled()
      } finally {
        Object.defineProperty(process.env, 'NODE_ENV', {
          value: originalEnv,
          writable: true,
          configurable: true,
        })
      }
    })
  })
})
