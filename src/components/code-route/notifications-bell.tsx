'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, RefreshCw, Mail, Phone, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface Notification {
  id: string
  template: string
  type: string
  recipient: string
  subject: string | null
  body: string
  status: string
  provider: string | null
  error: string | null
  createdAt: string
}

const TEMPLATE_LABELS: Record<string, string> = {
  welcome: 'Bienvenue',
  password_reset: 'Réinitialisation mot de passe',
  exam_reminder: 'Rappel d\'examen',
  payment_confirmation: 'Confirmation paiement',
  booking_confirmed: 'Réservation confirmée',
  fraud_alert: 'Alerte fraude',
  account_activated: 'Compte activé',
  account_deactivated: 'Compte désactivé',
}

function formatRelativeTime(isoDate: string): string {
  const now = Date.now()
  const then = new Date(isoDate).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'à l\'instant'
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH} h`
  const diffD = Math.floor(diffH / 24)
  return `il y a ${diffD} j`
}

interface Props {
  apiFetch?: (url: string, options?: RequestInit) => Promise<Response>
}

export function NotificationsBell({ apiFetch: apiFetchProp }: Props) {
  const [failedCount, setFailedCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  // Default fetch (no CSRF needed for GET)
  const apiFetch = apiFetchProp || (async (url: string, options?: RequestInit) => fetch(url, options))

  const refreshBadge = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/notifications?limit=1&status=failed')
      if (res.ok) {
        const data = await res.json()
        setFailedCount(data.total || 0)
      }
    } catch {
      // Silent fail — badge is non-critical
    }
  }, [apiFetch])

  const refreshList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/admin/notifications?limit=10')
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()
      setNotifications(data.logs || data.notifications || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  // Refresh badge on mount + every 60s
  useEffect(() => {
    refreshBadge()
    const interval = setInterval(refreshBadge, 60_000)
    return () => clearInterval(interval)
  }, [refreshBadge])

  // Lazy-load list when dropdown opens
  useEffect(() => {
    if (open && notifications.length === 0) {
      refreshList()
    }
  }, [open, notifications.length, refreshList])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {failedCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {failedCount > 99 ? '99+' : failedCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              refreshList()
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <DropdownMenuSeparator />

        {error && (
          <div className="px-3 py-2 text-xs text-red-600 bg-red-50">
            Erreur : {error}
          </div>
        )}

        {notifications.length === 0 && !loading && !error && (
          <div className="px-3 py-6 text-center text-sm text-gray-500">
            Aucune notification
          </div>
        )}

        {notifications.map((n) => {
          const isFailed = n.status === 'failed'
          return (
            <DropdownMenuItem
              key={n.id}
              className="flex flex-col items-start gap-1 py-2"
            >
              <div className="flex w-full items-center gap-2">
                {isFailed ? (
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
                <span className="font-medium text-sm flex-1 truncate">
                  {TEMPLATE_LABELS[n.template] || n.template}
                </span>
                <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(n.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 pl-6">
                {n.type === 'email' ? (
                  <Mail className="h-3 w-3" />
                ) : (
                  <Phone className="h-3 w-3" />
                )}
                <span className="truncate">{n.recipient}</span>
              </div>
              {isFailed && n.error && (
                <div className="text-[10px] text-red-500 pl-6 truncate">
                  {n.error}
                </div>
              )}
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator />
        <div className="px-3 py-2 text-xs text-gray-500 flex items-center justify-between">
          <span>{failedCount} échec(s)</span>
          <Badge variant="secondary">
            {notifications.length} affichée(s)
          </Badge>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
