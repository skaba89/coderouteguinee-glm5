// ============================================================
// Tests unitaires — Orange SMS OAuth2 integration (Phase 29)
// ============================================================
// Covers: phone normalization, config detection, OAuth2 token
// flow, SMS send success/failure paths, console fallback.
//
// Mocks: global.fetch for HTTP calls.
// ============================================================

import {
  _resetTokenCacheForTests,
  getOrangeSmsConfig,
  getOrangeAccessToken,
  normalizeGuineaPhone,
  sendOrangeSms,
  sendTestOrangeSms,
  isOrangeSmsConfigured,
} from '../orange-sms'

// ─── Helpers ──────────────────────────────────────────────
function setOrangeEnv(overrides: Record<string, string | undefined> = {}) {
  const defaults: Record<string, string> = {
    ORANGE_SMS_CLIENT_ID: 'test-client-id',
    ORANGE_SMS_CLIENT_SECRET: 'test-client-secret',
    ORANGE_SMS_SENDER_ADDRESS: 'tel:+224628000000',
    ORANGE_SMS_API_BASE: 'https://api.orange.com',
  }
  for (const [k, v] of Object.entries(defaults)) {
    if (v === undefined) {
      delete process.env[k]
    } else {
      process.env[k] = v
    }
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
}

function clearOrangeEnv() {
  delete process.env.ORANGE_SMS_CLIENT_ID
  delete process.env.ORANGE_SMS_CLIENT_SECRET
  delete process.env.ORANGE_SMS_SENDER_ADDRESS
  delete process.env.ORANGE_SMS_API_BASE
}

function mockFetchOnce(handler: (url: string, init?: RequestInit) => Promise<{
  ok: boolean
  status: number
  json: () => Promise<any>
  text: () => Promise<string>
  headers: { get: (n: string) => string | null }
}>) {
  const calls: Array<{ url: string; init?: RequestInit }> = []
  const origFetch = global.fetch
  // @ts-expect-error — we use a simpler shape
  global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init })
    return handler(url, init)
  })
  return {
    calls,
    restore: () => { global.fetch = origFetch as any },
  }
}

// ─── Tests ────────────────────────────────────────────────

describe('Orange SMS — normalizeGuineaPhone', () => {
  it.each([
    ['628123456',          'tel:+224628123456'],
    ['0628123456',         'tel:+224628123456'],
    ['+224628123456',      'tel:+224628123456'],
    ['224628123456',       'tel:+224628123456'],
    ['00 224 628 12 34 56','tel:+224628123456'],
    ['+224 628-12-34-56',  'tel:+224628123456'],
  ])('normalizes %s → %s', (input, expected) => {
    expect(normalizeGuineaPhone(input)).toBe(expected)
  })

  it.each([
    ['12345',           'trop court'],
    ['6281234',         'trop court'],
    ['700123456',       'ne commence pas par 6'],
    ['',                'vide'],
    ['+33612345678',    'numéro français'],
  ])('rejette %s (%s)', (input) => {
    expect(() => normalizeGuineaPhone(input)).toThrow()
  })
})

describe('Orange SMS — getOrangeSmsConfig', () => {
  beforeEach(clearOrangeEnv)
  afterAll(clearOrangeEnv)

  it('retourne null si aucune var n\'est définie', () => {
    expect(getOrangeSmsConfig()).toBeNull()
  })

  it('retourne null si une var obligatoire manque', () => {
    setOrangeEnv({ ORANGE_SMS_CLIENT_SECRET: undefined })
    expect(getOrangeSmsConfig()).toBeNull()
  })

  it('retourne la config complète si tout est défini', () => {
    setOrangeEnv()
    const cfg = getOrangeSmsConfig()
    expect(cfg).not.toBeNull()
    expect(cfg!.clientId).toBe('test-client-id')
    expect(cfg!.senderAddress).toBe('tel:+224628000000')
    expect(cfg!.apiBase).toBe('https://api.orange.com')
  })

  it('utilise l\'API base par défaut si non spécifiée', () => {
    setOrangeEnv({ ORANGE_SMS_API_BASE: undefined })
    const cfg = getOrangeSmsConfig()
    expect(cfg!.apiBase).toBe('https://api.orange.com')
  })
})

describe('Orange SMS — isOrangeSmsConfigured', () => {
  beforeEach(clearOrangeEnv)
  afterAll(clearOrangeEnv)

  it('retourne false si config absente', () => {
    expect(isOrangeSmsConfigured()).toBe(false)
  })

  it('retourne true si config complète', () => {
    setOrangeEnv()
    expect(isOrangeSmsConfigured()).toBe(true)
  })
})

describe('Orange SMS — getOrangeAccessToken', () => {
  beforeEach(() => {
    clearOrangeEnv()
    _resetTokenCacheForTests()
  })
  afterEach(clearOrangeEnv)

  it('obtient un token via OAuth2 client_credentials', async () => {
    setOrangeEnv()
    const { calls, restore } = mockFetchOnce(async (url) => ({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'test-access-token-abc',
        token_type: 'Bearer',
        expires_in: 3600,
      }),
      text: async () => '',
      headers: { get: () => null },
    }))

    try {
      const cfg = getOrangeSmsConfig()!
      const token = await getOrangeAccessToken(cfg)
      expect(token).toBe('test-access-token-abc')

      // Verify the request shape
      expect(calls).toHaveLength(1)
      expect(calls[0].url).toBe('https://api.orange.com/oauth/v3/token')
      const init = calls[0].init!
      expect(init.method).toBe('POST')
      const headers = init.headers as Record<string, string>
      expect(headers['Authorization']).toMatch(/^Basic /)
      expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded')
      const body = init.body as URLSearchParams
      expect(body.get('grant_type')).toBe('client_credentials')
    } finally {
      restore()
    }
  })

  it('met en cache le token — n\'appelle pas l\'API 2 fois', async () => {
    setOrangeEnv()
    let callCount = 0
    const { restore } = mockFetchOnce(async () => {
      callCount++
      return {
        ok: true,
        status: 200,
        json: async () => ({
          access_token: 'cached-token',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
        text: async () => '',
        headers: { get: () => null },
      }
    })

    try {
      const cfg = getOrangeSmsConfig()!
      await getOrangeAccessToken(cfg)
      await getOrangeAccessToken(cfg)
      await getOrangeAccessToken(cfg)
      expect(callCount).toBe(1)
    } finally {
      restore()
    }
  })

  it('lève une erreur si l\'API retourne 401', async () => {
    setOrangeEnv()
    const { restore } = mockFetchOnce(async () => ({
      ok: false,
      status: 401,
      json: async () => ({}),
      text: async () => 'Unauthorized',
      headers: { get: () => null },
    }))

    try {
      const cfg = getOrangeSmsConfig()!
      await expect(getOrangeAccessToken(cfg)).rejects.toThrow(/401/)
    } finally {
      restore()
    }
  })

  it('lève une erreur si token_type est incorrect', async () => {
    setOrangeEnv()
    const { restore } = mockFetchOnce(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'weird-token',
        token_type: 'Macaroon', // not Bearer
        expires_in: 3600,
      }),
      text: async () => '',
      headers: { get: () => null },
    }))

    try {
      const cfg = getOrangeSmsConfig()!
      await expect(getOrangeAccessToken(cfg)).rejects.toThrow(/invalid token response/)
    } finally {
      restore()
    }
  })
})

describe('Orange SMS — sendOrangeSms', () => {
  beforeEach(() => {
    clearOrangeEnv()
    _resetTokenCacheForTests()
  })
  afterEach(clearOrangeEnv)

  it('passe en console mode si config absente', async () => {
    const { restore } = mockFetchOnce(async () => {
      throw new Error('fetch should not be called in console mode')
    })

    try {
      const result = await sendOrangeSms('+224628123456', 'Bonjour')
      expect(result.success).toBe(true)
      expect(result.provider).toBe('console')
    } finally {
      restore()
    }
  })

  it('envoie un SMS avec succès', async () => {
    setOrangeEnv()
    let tokenCallCount = 0
    const { calls, restore } = mockFetchOnce(async (url) => {
      if (url.includes('/oauth/v3/token')) {
        tokenCallCount++
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'access-token-xyz',
            token_type: 'Bearer',
            expires_in: 3600,
          }),
          text: async () => '',
          headers: { get: () => null },
        }
      }
      // SMS endpoint
      return {
        ok: true,
        status: 201,
        json: async () => ({
          outbondSMSMessageRequest: {
            deliveryInfoList: {
              deliveryInfo: [
                { address: 'tel:+224628123456', deliveryStatus: 'Delivered' },
              ],
            },
            resourceURL: 'https://api.orange.com/smsmessaging/v1/outbound/.../requests/abc123',
            senderAddresses: ['tel:+224628000000'],
          },
        }),
        text: async () => '',
        headers: { get: (n: string) => n === 'X-Cdr-Remaining-Quota' ? '4500' : null },
      }
    })

    try {
      const result = await sendOrangeSms('628123456', 'Bienvenue sur CodeRoute')
      expect(result.success).toBe(true)
      expect(result.provider).toBe('orange')
      expect(result.messageId).toBe('abc123')
      expect(result.remainingQuota).toBe(4500)

      // Verify request shape
      const smsCall = calls.find(c => c.url.includes('/smsmessaging/v1/outbound/'))
      expect(smsCall).toBeDefined()
      const init = smsCall!.init!
      const headers = init.headers as Record<string, string>
      expect(headers['Authorization']).toBe('Bearer access-token-xyz')
      const body = JSON.parse(init.body as string)
      expect(body.outboundSMSMessageRequest.address).toEqual(['tel:+224628123456'])
      expect(body.outboundSMSMessageRequest.senderAddress).toBe('tel:+224628000000')
      expect(body.outboundSMSMessageRequest.outboundSMSTextMessage.message).toBe('Bienvenue sur CodeRoute')
    } finally {
      restore()
    }
  })

  it('rejette un message vide', async () => {
    setOrangeEnv()
    const { restore } = mockFetchOnce(async () => {
      throw new Error('fetch should not be called for empty message')
    })
    try {
      const result = await sendOrangeSms('628123456', '')
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/vide/)
    } finally {
      restore()
    }
  })

  it('rejette un message trop long', async () => {
    setOrangeEnv()
    const longText = 'x'.repeat(1531)
    const { restore } = mockFetchOnce(async () => {
      throw new Error('fetch should not be called for too-long message')
    })
    try {
      const result = await sendOrangeSms('628123456', longText)
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/trop long/)
    } finally {
      restore()
    }
  })

  it('rejette un numéro invalide', async () => {
    setOrangeEnv()
    const { restore } = mockFetchOnce(async () => {
      throw new Error('fetch should not be called for invalid phone')
    })
    try {
      const result = await sendOrangeSms('12345', 'Bonjour')
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/Numéro de téléphone invalide/)
    } finally {
      restore()
    }
  })

  it('gère l\'erreur API (deliveryStatus = DeliveryImpossible)', async () => {
    setOrangeEnv()
    const { restore } = mockFetchOnce(async (url) => {
      if (url.includes('/oauth/v3/token')) {
        return {
          ok: true, status: 200,
          json: async () => ({ access_token: 'tok', token_type: 'Bearer', expires_in: 3600 }),
          text: async () => '',
          headers: { get: () => null },
        }
      }
      return {
        ok: true, status: 200,
        json: async () => ({
          outbondSMSMessageRequest: {
            deliveryInfoList: {
              deliveryInfo: [{ address: 'tel:+224628123456', deliveryStatus: 'DeliveryImpossible' }],
            },
            resourceURL: 'https://api.orange.com/.../abc',
            senderAddresses: ['tel:+224628000000'],
          },
        }),
        text: async () => '',
        headers: { get: () => null },
      }
    })

    try {
      const result = await sendOrangeSms('628123456', 'Bonjour')
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/Livraison impossible/)
    } finally {
      restore()
    }
  })

  it('gère l\'erreur HTTP API (400 Bad Request)', async () => {
    setOrangeEnv()
    const { restore } = mockFetchOnce(async (url) => {
      if (url.includes('/oauth/v3/token')) {
        return {
          ok: true, status: 200,
          json: async () => ({ access_token: 'tok', token_type: 'Bearer', expires_in: 3600 }),
          text: async () => '',
          headers: { get: () => null },
        }
      }
      return {
        ok: false, status: 400,
        json: async () => ({}),
        text: async () => JSON.stringify({
          code: 'SVC0001',
          message: 'A service error occurred',
          description: 'Invalid sender address',
        }),
        headers: { get: () => null },
      }
    })

    try {
      const result = await sendOrangeSms('628123456', 'Bonjour')
      expect(result.success).toBe(false)
      expect(result.error).toContain('SVC0001')
    } finally {
      restore()
    }
  })
})

describe('Orange SMS — sendTestOrangeSms', () => {
  beforeEach(() => {
    clearOrangeEnv()
    _resetTokenCacheForTests()
  })
  afterEach(clearOrangeEnv)

  it('retourne des infos de diagnostic en console mode', async () => {
    const result = await sendTestOrangeSms('628123456')
    expect(result.success).toBe(true)
    expect(result.provider).toBe('console')
    expect(result.diagnostic.configured).toBe(false)
    expect(result.diagnostic.elapsedMs).toBeGreaterThanOrEqual(0)
    expect(result.diagnostic.timestamp).toBeTruthy()
  })
})
