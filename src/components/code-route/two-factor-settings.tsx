'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Shield, ShieldCheck, ShieldAlert, Copy, Download, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import QRCode from 'qrcode'

type View = 'loading' | 'disabled' | 'setup' | 'enabled'

interface StatusResponse {
  enabled: boolean
  pendingSecret?: string
}

interface SetupResponse {
  message: string
  secret: string
  qrUri: string
  backupCodes: string[]
  warning: string
}

export function TwoFactorSettings() {
  const { apiFetch } = useAuth()
  const [view, setView] = useState<View>('loading')
  const [setupData, setSetupData] = useState<SetupResponse | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [verifyCode, setVerifyCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Load 2FA status on mount
  const refreshStatus = useCallback(async () => {
    try {
      const res = await apiFetch('/api/auth/2fa/status')
      if (!res.ok) {
        setError('Impossible de charger le statut 2FA')
        setView('disabled')
        return
      }
      const data: StatusResponse = await res.json()
      setView(data.enabled ? 'enabled' : 'disabled')
    } catch {
      setError('Erreur réseau lors du chargement du statut 2FA')
      setView('disabled')
    }
  }, [apiFetch])

  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  // ─── Start setup: generate secret + QR ─────────────────
  async function handleStartSetup() {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await apiFetch('/api/auth/2fa/setup', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Erreur' }))
        setError(data.error || 'Erreur lors de la configuration 2FA')
        return
      }
      const data: SetupResponse = await res.json()
      setSetupData(data)
      // Generate QR code as data URL
      const qrUrl = await QRCode.toDataURL(data.qrUri, { width: 240, margin: 2 })
      setQrDataUrl(qrUrl)
      setView('setup')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  // ─── Verify code → enable 2FA ──────────────────────────
  async function handleVerify() {
    if (!verifyCode || verifyCode.length !== 6) {
      setError('Code à 6 chiffes requis')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verifyCode }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Erreur' }))
        setError(data.error || 'Code invalide')
        return
      }
      setSuccess('2FA activée avec succès ! Conservez vos codes de secours.')
      setView('enabled')
      setVerifyCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  // ─── Disable 2FA ───────────────────────────────────────
  async function handleDisable() {
    if (!disablePassword) {
      setError('Mot de passe requis')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Erreur' }))
        setError(data.error || 'Mot de passe incorrect')
        return
      }
      setSuccess('2FA désactivée. Votre compte est moins protégé.')
      setView('disabled')
      setDisablePassword('')
      setSetupData(null)
      setQrDataUrl('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  // ─── Copy helper ───────────────────────────────────────
  async function copyToClipboard(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      setError('Impossible de copier dans le presse-papier')
    }
  }

  // ─── Download backup codes ─────────────────────────────
  function downloadBackupCodes() {
    if (!setupData) return
    const content = `CodeRoute Guinée — Codes de secours 2FA\n\nGénérés le ${new Date().toLocaleString('fr-FR')}\n\n${setupData.backupCodes.join('\n')}\n\nATTENTION : Conservez ce document en lieu sûr. Ces codes ne seront plus jamais affichés.\n`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'coderoute-2fa-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {view === 'enabled' ? (
            <ShieldCheck className="h-5 w-5 text-green-600" />
          ) : view === 'setup' ? (
            <ShieldAlert className="h-5 w-5 text-yellow-600" />
          ) : (
            <Shield className="h-5 w-5 text-gray-400" />
          )}
          <div>
            <CardTitle>Authentification à deux facteurs (2FA)</CardTitle>
            <CardDescription>
              Protégez votre compte avec une vérification TOTP (Google Authenticator, Authy, etc.)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* ─── Status badge ─── */}
        {view !== 'loading' && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Statut :</span>
            <Badge
              variant={view === 'enabled' ? 'default' : 'secondary'}
              className={view === 'enabled' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {view === 'enabled' ? 'Activée' : view === 'setup' ? 'Configuration en cours' : 'Désactivée'}
            </Badge>
          </div>
        )}

        {/* ─── View: disabled ─── */}
        {view === 'disabled' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire.
              À chaque connexion, en plus de votre mot de passe, vous devrez saisir un code
              généré par votre application d'authentification.
            </p>
            <Button
              onClick={handleStartSetup}
              disabled={loading}
              className="bg-[#009460] hover:bg-[#007a4d]"
            >
              <Shield className="h-4 w-4 mr-2" />
              Activer 2FA
            </Button>
          </div>
        )}

        {/* ─── View: setup ─── */}
        {view === 'setup' && setupData && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg bg-gray-50">
              <p className="text-sm font-medium">1. Scannez ce QR code</p>
              {qrDataUrl && (
                <img src={qrDataUrl} alt="QR code 2FA" className="w-48 h-48" />
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Ou saisissez manuellement ce secret :</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                  {setupData.secret}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(setupData.secret, 'secret')}
                  aria-label="Copier le secret"
                >
                  {copied === 'secret' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600">
                2. Codes de secours (à conserver !)
              </p>
              <div className="grid grid-cols-2 gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                {setupData.backupCodes.map((code, i) => (
                  <code key={i} className="text-xs font-mono p-1 bg-white rounded text-center">
                    {code}
                  </code>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(setupData.backupCodes.join('\n'), 'codes')}
                >
                  {copied === 'codes' ? (
                    <Check className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 mr-1" />
                  )}
                  Copier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadBackupCodes}
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Télécharger
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verifyCode">3. Saisissez le code à 6 chiffres de votre application</Label>
              <Input
                id="verifyCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="text-center text-lg tracking-widest font-mono"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleVerify}
                disabled={loading || verifyCode.length !== 6}
                className="flex-1 bg-[#009460] hover:bg-[#007a4d]"
              >
                {loading ? 'Vérification...' : 'Vérifier et activer'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setView('disabled')
                  setSetupData(null)
                  setQrDataUrl('')
                  setVerifyCode('')
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* ─── View: enabled ─── */}
        {view === 'enabled' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Votre compte est protégé par 2FA. À chaque connexion, vous devrez saisir
              un code généré par votre application d'authentification.
            </p>
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="disablePassword">Désactiver 2FA (mot de passe requis)</Label>
              <Input
                id="disablePassword"
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
              />
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={loading || !disablePassword}
              >
                {loading ? 'Désactivation...' : 'Désactiver 2FA'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
