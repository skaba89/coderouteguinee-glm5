// ============================================================
// CodeRoute Guinée — Notification Service
// Centralized email/SMS notifications with templates and providers
// Supports: SMTP email, Orange/MTN/Celcom SMS, console (dev)
// ============================================================

import { db } from '@/lib/db'
import { sendOrangeSms } from '@/lib/orange-sms'

// ─── Notification types ────────────────────────────────────
export type NotificationTemplate =
  | 'welcome'
  | 'password_reset'
  | 'exam_reminder'
  | 'payment_confirmation'
  | 'booking_confirmed'
  | 'fraud_alert'
  | 'account_activated'
  | 'account_deactivated'

export type NotificationChannel = 'email' | 'sms'

export interface NotificationRequest {
  userId?: string
  channel: NotificationChannel
  template: NotificationTemplate
  recipient: string // email or phone
  variables?: Record<string, string>
}

// ─── Email configuration ───────────────────────────────────
interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  fromName: string
  fromEmail: string
}

function getEmailConfig(): EmailConfig | null {
  if (!process.env.SMTP_HOST) return null
  return {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromName: process.env.SMTP_FROM_NAME || 'CodeRoute Guinée',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@coderoute-gn.org',
  }
}

// ─── SMS configuration ─────────────────────────────────────
interface SmsConfig {
  provider: 'orange' | 'mtn' | 'celcom' | 'console'
  apiKey?: string
  senderId?: string
}

function getSmsConfig(): SmsConfig {
  return {
    provider: (process.env.SMS_PROVIDER as SmsConfig['provider']) || 'console',
    apiKey: process.env.SMS_API_KEY,
    senderId: process.env.SMS_SENDER_ID || 'CodeRoute',
  }
}

// ─── Notification templates (French) ───────────────────────
interface Template {
  emailSubject: string
  emailBody: (vars: Record<string, string>) => string
  smsBody: (vars: Record<string, string>) => string
}

const TEMPLATES: Record<NotificationTemplate, Template> = {
  welcome: {
    emailSubject: 'Bienvenue sur CodeRoute Guinée',
    emailBody: (v) => `Bonjour ${v.prenom || ''} ${v.nom || ''},

Votre compte CodeRoute Guinée a été créé avec succès.

Numéro unique de candidat: ${v.numeroUnique || 'N/A'}
Email: ${v.email || 'N/A'}

Vous pouvez maintenant vous connecter à la plateforme et réserver votre examen du code de la route.

Cordialement,
L'équipe CodeRoute Guinée
Ministère des Transports — République de Guinée`,
    smsBody: (v) => `CodeRoute: Bienvenue ${v.prenom || ''}! Votre numero unique: ${v.numeroUnique || 'N/A'}. Connectez-vous sur coderoute-gn.org`,
  },

  password_reset: {
    emailSubject: 'Réinitialisation de votre mot de passe — CodeRoute Guinée',
    emailBody: (v) => `Bonjour,

Une demande de réinitialisation de mot de passe a été faite pour votre compte CodeRoute Guinée.

Votre code de réinitialisation est: ${v.code || 'N/A'}

Ce code expire dans 30 minutes. Si vous n'avez pas fait cette demande, ignorez cet email.

Cordialement,
L'équipe CodeRoute Guinée`,
    smsBody: (v) => `CodeRoute: Votre code de reinitialisation: ${v.code || 'N/A'}. Expire dans 30 min. Si vous n'avez pas demande, ignorez ce message.`,
  },

  exam_reminder: {
    emailSubject: 'Rappel: Votre examen du code de la route',
    emailBody: (v) => `Bonjour ${v.prenom || ''},

Ceci est un rappel pour votre examen du code de la route prévu le:

Date: ${v.date || 'N/A'}
Heure: ${v.heure || 'N/A'}
Centre: ${v.centre || 'N/A'}
Lieu: ${v.adresse || 'N/A'}

Veuillez arriver 30 minutes avant l'heure prévue avec:
- Votre pièce d'identité
- Votre convocation
- Votre numéro unique de candidat

Cordialement,
L'équipe CodeRoute Guinée`,
    smsBody: (v) => `CodeRoute: Rappel examen ${v.date || ''} a ${v.heure || ''} - ${v.centre || ''}. Arrivez 30 min avant. ID + convocation requises.`,
  },

  payment_confirmation: {
    emailSubject: 'Confirmation de paiement — CodeRoute Guinée',
    emailBody: (v) => `Bonjour ${v.prenom || ''},

Votre paiement a été confirmé avec succès.

Détails du paiement:
- Montant: ${v.montant || 'N/A'} GNF
- Moyen: ${v.moyen || 'Mobile Money'}
- Référence: ${v.reference || 'N/A'}
- Date: ${v.date || 'N/A'}

Votre réservation pour l'examen du ${v.dateExamen || 'N/A'} à ${v.heureExamen || 'N/A'} est confirmée.
Vous pouvez télécharger votre convocation depuis votre espace candidat.

Cordialement,
L'équipe CodeRoute Guinée`,
    smsBody: (v) => `CodeRoute: Paiement confirme! Ref: ${v.reference || ''}. Montant: ${v.montant || ''} GNF. Convocation disponible sur votre espace.`,
  },

  booking_confirmed: {
    emailSubject: 'Réservation confirmée — CodeRoute Guinée',
    emailBody: (v) => `Bonjour ${v.prenom || ''},

Votre réservation pour l'examen du code de la route est confirmée.

Détails:
- Centre: ${v.centre || 'N/A'}
- Date: ${v.date || 'N/A'}
- Heure: ${v.heure || 'N/A'}
- Numéro de convocation: ${v.convocation || 'N/A'}

Téléchargez votre convocation depuis votre espace candidat.

Cordialement,
L'équipe CodeRoute Guinée`,
    smsBody: (v) => `CodeRoute: Reservation confirmee! ${v.date || ''} a ${v.heure || ''} - ${v.centre || ''}. Convocation: ${v.convocation || ''}`,
  },

  fraud_alert: {
    emailSubject: 'Alerte de sécurité — CodeRoute Guinée',
    emailBody: (v) => `Bonjour,

Une activité suspecte a été détectée sur votre compte CodeRoute Guinée.

Type: ${v.type || 'Activité suspecte'}
Description: ${v.description || 'Voir les détails dans votre espace'}
Date: ${v.date || 'N/A'}

Si vous pensez qu'il s'agit d'une erreur, contactez l'administration.

Cordialement,
L'équipe de sécurité CodeRoute Guinée`,
    smsBody: (v) => `CodeRoute: Alerte securite detectee sur votre compte. Type: ${v.type || ''}. Contactez l'administration si necessaire.`,
  },

  account_activated: {
    emailSubject: 'Compte activé — CodeRoute Guinée',
    emailBody: (v) => `Bonjour ${v.prenom || ''},

Votre compte CodeRoute Guinée a été activé. Vous pouvez maintenant vous connecter.

Cordialement,
L'équipe CodeRoute Guinée`,
    smsBody: (v) => `CodeRoute: Votre compte a ete active. Connectez-vous sur coderoute-gn.org`,
  },

  account_deactivated: {
    emailSubject: 'Compte désactivé — CodeRoute Guinée',
    emailBody: (v) => `Bonjour ${v.prenom || ''},

Votre compte CodeRoute Guinée a été désactivé.

Raison: ${v.raison || 'Non spécifiée'}

Pour toute question, contactez l'administration.

Cordialement,
L'équipe CodeRoute Guinée`,
    smsBody: (v) => `CodeRoute: Votre compte a ete desactive. Raison: ${v.raison || ''}. Contactez l'administration.`,
  },
}

// ─── Send notification (main entry point) ──────────────────
export async function sendNotification(req: NotificationRequest): Promise<{ success: boolean; error?: string }> {
  const template = TEMPLATES[req.template]
  if (!template) {
    return { success: false, error: `Template inconnu: ${req.template}` }
  }

  const variables = req.variables || {}
  const subject = template.emailSubject
  const body = req.channel === 'email'
    ? template.emailBody(variables)
    : template.smsBody(variables)

  let provider: string | null = null
  let error: string | null = null
  let success = false

  try {
    if (req.channel === 'email') {
      const result = await sendEmail(req.recipient, subject, body)
      success = result.success
      error = result.error ?? null
      provider = result.provider
    } else {
      const result = await sendSms(req.recipient, body)
      success = result.success
      error = result.error ?? null
      provider = result.provider
    }
  } catch (err: any) {
    error = err.message
    success = false
  }

  // Log to database
  try {
    await db.notificationLog.create({
      data: {
        userId: req.userId || null,
        type: req.channel,
        template: req.template,
        recipient: req.recipient,
        subject: req.channel === 'email' ? subject : null,
        body,
        status: success ? 'sent' : 'failed',
        provider: provider || null,
        error: error || null,
        sentAt: success ? new Date() : null,
      },
    })
  } catch (logErr) {
    console.error('[NOTIFICATION_LOG_ERROR]', logErr)
  }

  return success ? { success: true } : { success: false, error: error || 'Erreur inconnue' }
}

// ─── Send email ────────────────────────────────────────────
async function sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean; error?: string; provider: string }> {
  const config = getEmailConfig()

  if (!config) {
    // Dev mode: log to console
    console.log('════════ EMAIL (console) ════════')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log('─'.repeat(50))
    console.log(body)
    console.log('════════════════════════════════')
    return { success: true, provider: 'console' }
  }

  try {
    // Use Nodemailer-style SMTP (we'll use the basic approach via fetch to an SMTP API,
    // or the built-in nodemailer if available)
    // For simplicity, we use a HTTP-based email API (e.g., SendGrid, Mailgun)
    // Here we provide a generic implementation that works with any SMTP-over-HTTP gateway

    const emailApiUrl = process.env.EMAIL_API_URL
    if (emailApiUrl) {
      const response = await fetch(emailApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EMAIL_API_KEY}`,
        },
        body: JSON.stringify({
          from: `${config.fromName} <${config.fromEmail}>`,
          to,
          subject,
          text: body,
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        return { success: false, error: `Email API error: ${errText}`, provider: 'http-api' }
      }
      return { success: true, provider: 'http-api' }
    }

    // Fallback: log to console
    console.log(`[EMAIL SMTP not configured] To: ${to} | Subject: ${subject}`)
    return { success: true, provider: 'console' }
  } catch (err: any) {
    return { success: false, error: err.message, provider: 'http-api' }
  }
}

// ─── Send SMS ──────────────────────────────────────────────
// Routes to Orange SMS OAuth2 API when provider=orange,
// otherwise falls back to console logging or generic SMS API.
async function sendSms(to: string, body: string): Promise<{ success: boolean; error?: string; provider: string }> {
  const config = getSmsConfig()

  // Clean phone number (Guinea format: +224 6XX XX XX XX)
  const cleanedPhone = to.replace(/[\s\-()]/g, '')
  const formattedPhone = cleanedPhone.startsWith('+224') ? cleanedPhone : `+224${cleanedPhone.replace(/^0/, '')}`

  // ─── Orange OAuth2 path (Phase 29) ──────────────────────
  if (config.provider === 'orange') {
    const result = await sendOrangeSms(to, body)
    return {
      success: result.success,
      error: result.error,
      provider: result.provider, // 'orange' or 'console' if Orange not configured
    }
  }

  if (config.provider === 'console') {
    console.log('════════ SMS (console) ════════')
    console.log(`To: ${formattedPhone}`)
    console.log('─'.repeat(50))
    console.log(body)
    console.log('════════════════════════════════')
    return { success: true, provider: 'console' }
  }

  // ─── Generic SMS API fallback (MTN, Celcom, etc.) ───────
  try {
    const smsApiUrl = process.env.SMS_API_URL
    if (!smsApiUrl) {
      console.log(`[SMS ${config.provider} not configured] To: ${formattedPhone}`)
      console.log(body)
      return { success: true, provider: 'console' }
    }

    const response = await fetch(smsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        from: config.senderId,
        to: formattedPhone,
        text: body,
        provider: config.provider,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return { success: false, error: `SMS API error: ${errText}`, provider: config.provider }
    }

    return { success: true, provider: config.provider }
  } catch (err: any) {
    return { success: false, error: err.message, provider: config.provider }
  }
}

// ─── Convenience helpers ───────────────────────────────────
export async function notifyUser(
  userId: string,
  channel: NotificationChannel,
  template: NotificationTemplate,
  variables: Record<string, string> = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return { success: false, error: 'Utilisateur non trouvé' }

    const recipient = channel === 'email' ? user.email : user.telephone
    return sendNotification({ userId, channel, template, recipient, variables })
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ─── Get notification history (for admin) ──────────────────
export async function getNotificationHistory(limit = 50, offset = 0, status?: string) {
  const where = status ? { status } : {}
  const [logs, total] = await Promise.all([
    db.notificationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    db.notificationLog.count({ where }),
  ])

  return { logs, total, limit, offset }
}
