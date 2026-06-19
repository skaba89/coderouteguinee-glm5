// ============================================================
// Tests unitaires — /api/health endpoint contract
// Mocke db.$queryRaw pour valider les 4 checks + format de réponse.
// ============================================================

import { GET } from '@/app/api/health/route'
import { db } from '@/lib/db'

// ─── Mock Prisma db ────────────────────────────────────────
jest.mock('@/lib/db', () => ({
  db: {
    $queryRaw: jest.fn(),
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
  // Force env vars to be set so environment + sessionSecret checks pass
  process.env.DATABASE_URL = 'file:./test.db'
  process.env.SESSION_SECRET = 'test-secret-strong-enough-for-prod-1234567890'
  process.env.CSRF_SECRET = 'test-csrf-secret-strong-enough-1234567890'
})

afterEach(() => {
  // Restore defaults
  delete process.env.DATABASE_URL
  delete process.env.SESSION_SECRET
  delete process.env.CSRF_SECRET
})

describe('GET /api/health', () => {
  test('renvoie healthy quand tout va bien (200)', async () => {
    ;(db.$queryRaw as jest.Mock).mockResolvedValueOnce([{ '1': 1 }])

    const response = await GET()
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.status).toBe('healthy')
    expect(data.uptime).toBeGreaterThan(0)
    expect(typeof data.uptimeFormatted).toBe('string')
    expect(data.timestamp).toBeTruthy()
    expect(Array.isArray(data.checks)).toBe(true)
    expect(data.checks).toHaveLength(4)

    const checkNames = data.checks.map((c: { name: string }) => c.name)
    expect(checkNames).toEqual(['database', 'app', 'environment', 'sessionSecret'])
    expect(data.checks.every((c: { status: string }) => c.status === 'ok')).toBe(true)
  })

  test('renvoie degraded et 503 si la DB échoue', async () => {
    ;(db.$queryRaw as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'))

    const response = await GET()
    expect(response.status).toBe(503)

    const data = await response.json()
    expect(data.status).toBe('degraded')

    const dbCheck = data.checks.find((c: { name: string }) => c.name === 'database')
    expect(dbCheck.status).toBe('error')
    expect(dbCheck.message).toContain('Connection refused')
    expect(typeof dbCheck.latencyMs).toBe('number')
  })

  test('renvoie degraded si SESSION_SECRET est manquant', async () => {
    ;(db.$queryRaw as jest.Mock).mockResolvedValueOnce([{ '1': 1 }])
    delete process.env.SESSION_SECRET

    const response = await GET()
    expect(response.status).toBe(503)

    const data = await response.json()
    expect(data.status).toBe('degraded')

    const envCheck = data.checks.find((c: { name: string }) => c.name === 'environment')
    expect(envCheck.status).toBe('error')
    expect(envCheck.message).toContain('SESSION_SECRET')

    const secretCheck = data.checks.find((c: { name: string }) => c.name === 'sessionSecret')
    expect(secretCheck.status).toBe('error')
  })

  test('renvoie degraded si SESSION_SECRET utilise la valeur par défaut', async () => {
    ;(db.$queryRaw as jest.Mock).mockResolvedValueOnce([{ '1': 1 }])
    process.env.SESSION_SECRET = 'coderoute-guinee-session-secret-2024-change-in-production'

    const response = await GET()
    expect(response.status).toBe(503)

    const data = await response.json()
    const secretCheck = data.checks.find((c: { name: string }) => c.name === 'sessionSecret')
    expect(secretCheck.status).toBe('error')
    expect(secretCheck.message).toContain('default value')
  })

  test('inclut la latence DB dans le check database', async () => {
    ;(db.$queryRaw as jest.Mock).mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 10))
      return [{ '1': 1 }]
    })

    const response = await GET()
    const data = await response.json()
    const dbCheck = data.checks.find((c: { name: string }) => c.name === 'database')
    expect(dbCheck.latencyMs).toBeGreaterThanOrEqual(8) // at least 10ms minus jitter
  })

  test('uptimeFormatted respecte le format "Xj Xh Xm Xs"', async () => {
    ;(db.$queryRaw as jest.Mock).mockResolvedValueOnce([{ '1': 1 }])

    const response = await GET()
    const data = await response.json()
    // Uptime is small in tests — should match "Ns" or "Xm Xs"
    expect(data.uptimeFormatted).toMatch(/^(\d+j )?(\d+h )?(\d+m )?\d+s$/)
  })

  test('check app est toujours ok', async () => {
    ;(db.$queryRaw as jest.Mock).mockResolvedValueOnce([{ '1': 1 }])

    const response = await GET()
    const data = await response.json()
    const appCheck = data.checks.find((c: { name: string }) => c.name === 'app')
    expect(appCheck.status).toBe('ok')
    expect(appCheck.message).toBeUndefined()
  })

  test('renvoie degraded si DATABASE_URL est manquant', async () => {
    ;(db.$queryRaw as jest.Mock).mockResolvedValueOnce([{ '1': 1 }])
    delete process.env.DATABASE_URL

    const response = await GET()
    expect(response.status).toBe(503)

    const data = await response.json()
    const envCheck = data.checks.find((c: { name: string }) => c.name === 'environment')
    expect(envCheck.status).toBe('error')
    expect(envCheck.message).toContain('DATABASE_URL')
  })
})
