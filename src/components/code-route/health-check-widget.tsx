'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, CheckCircle2, XCircle, Activity } from 'lucide-react'

interface CheckResult {
  name: string
  status: 'ok' | 'error'
  latencyMs?: number
  message?: string
}

interface HealthData {
  status: 'healthy' | 'degraded'
  uptime: number
  uptimeFormatted: string
  timestamp: string
  version: string
  checks: CheckResult[]
}

const CHECK_LABELS: Record<string, string> = {
  database: 'Base de données',
  app: 'Application',
  environment: 'Variables d\'environnement',
  sessionSecret: 'Secret de session',
}

export function HealthCheckWidget() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/health', { cache: 'no-store' })
      if (!res.ok) {
        // Even on 503 we get a JSON body
      }
      const data = await res.json()
      setHealth(data)
      setLastChecked(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }, [])

  // Poll every 30 seconds
  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [refresh])

  const isHealthy = health?.status === 'healthy'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#009460]" />
            <div>
              <CardTitle>État du système</CardTitle>
              <CardDescription>
                Surveillance en temps réel de la plateforme
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refresh}
            disabled={loading}
            aria-label="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            Erreur de connexion : {error}
          </div>
        )}

        {health && (
          <>
            {/* Overall status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Statut global</span>
              <Badge
                variant={isHealthy ? 'default' : 'destructive'}
                className={isHealthy ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {isHealthy ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                {isHealthy ? 'Sain' : 'Dégradé'}
              </Badge>
            </div>

            {/* Uptime */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Temps de fonctionnement</span>
              <span className="font-mono">{health.uptimeFormatted}</span>
            </div>

            {/* Last checked */}
            {lastChecked && (
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Dernière vérification</span>
                <span>{lastChecked.toLocaleTimeString('fr-FR')}</span>
              </div>
            )}

            {/* Individual checks */}
            <div className="space-y-2 pt-2 border-t">
              <span className="text-xs font-semibold uppercase text-gray-500">
                Vérifications
              </span>
              {health.checks.map((check) => (
                <div key={check.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {check.status === 'ok' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>{CHECK_LABELS[check.name] || check.name}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {check.latencyMs !== undefined && (
                      <span className="font-mono">{check.latencyMs} ms</span>
                    )}
                    {check.message && (
                      <span
                        className={check.status === 'ok' ? 'text-gray-400' : 'text-red-500'}
                        title={check.message}
                      >
                        {check.message.length > 30 ? check.message.slice(0, 30) + '…' : check.message}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
