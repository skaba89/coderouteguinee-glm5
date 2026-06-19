'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Car, CheckCircle2, AlertCircle } from 'lucide-react'

// ─── Form content (uses useSearchParams, needs Suspense wrapper) ──
function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function validatePassword(pwd: string): string | null {
    if (pwd.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.'
    if (!/[A-Z]/.test(pwd)) return 'Le mot de passe doit contenir au moins une majuscule.'
    if (!/[a-z]/.test(pwd)) return 'Le mot de passe doit contenir au moins une minuscule.'
    if (!/[0-9]/.test(pwd)) return 'Le mot de passe doit contenir au moins un chiffre.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const pwdError = validatePassword(newPassword)
    if (pwdError) {
      setError(pwdError)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (!token) {
      setError('Token manquant. Veuillez utiliser le lien reçu par email ou SMS.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la réinitialisation.')
        return
      }
      setSuccess(true)
    } catch (err) {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Mot de passe réinitialisé</CardTitle>
          <CardDescription>
            Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            className="w-full bg-[#009460] hover:bg-[#007a4d]"
            onClick={() => router.push('/')}
          >
            Retour à la connexion
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Réinitialiser le mot de passe</CardTitle>
        <CardDescription>
          Choisissez un nouveau mot de passe pour votre compte CodeRoute Guinée.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!token && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucun token fourni dans l'URL. Veuillez cliquer sur le lien que vous avez reçu par email ou SMS.
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Minimum 8 caractères, 1 majuscule, 1 chiffre"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full bg-[#009460] hover:bg-[#007a4d]"
            disabled={loading || !token}
          >
            {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => router.push('/')}
          >
            Retour à l'accueil
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

// ─── Page wrapper with branded header + Suspense ─────────
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 p-4">
      <div className="w-full max-w-md mb-6 text-center">
        <div className="inline-flex items-center justify-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-lg bg-[#009460] flex items-center justify-center">
            <Car className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">CodeRoute Guinée</span>
        </div>
        {/* Guinea flag stripe */}
        <div className="h-1.5 w-full flex rounded-full overflow-hidden mb-4">
          <div className="flex-1 bg-[#CE1126]"></div>
          <div className="flex-1 bg-[#FCD116]"></div>
          <div className="flex-1 bg-[#009460]"></div>
        </div>
      </div>
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Chargement...</CardTitle>
          </CardHeader>
        </Card>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
