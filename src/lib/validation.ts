// ============================================================
// CodeRoute Guinée — Input Validation & Sanitization
// Centralized validation using Zod schemas for all API inputs
// ============================================================

import { z } from 'zod'

// ─── Custom sanitization helpers ───────────────────────────

/** Strip HTML tags and trim */
function sanitizeString(val: string): string {
  return val.replace(/<[^>]*>/g, '').trim()
}

/** Validate a Guinean phone number.
 *  Accepts formats: +224 6XX XX XX XX, 00224 6XX XX XX XX, 6XX XX XX XX
 *  Guinea mobile numbers are 9 digits starting with 6 (Orange 622/621/620,
 *  Celcom 623/624/625, MTN 626/627/628). */
function isValidGuineanPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '')
  return /^(\+224|00224)?6[2-8]\d{7}$/.test(cleaned)
}

/** Validate email format */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ─── Auth Schemas ──────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email requis')
    .transform(sanitizeString)
    .refine(isValidEmail, 'Format d\'email invalide'),
  password: z.string()
    .min(1, 'Mot de passe requis')
    .max(128, 'Mot de passe trop long'),
})

export const registerSchema = z.object({
  email: z.string()
    .min(1, 'Email requis')
    .transform(sanitizeString)
    .refine(isValidEmail, 'Format d\'email invalide'),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(128, 'Mot de passe trop long')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  nom: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .transform(sanitizeString),
  prenom: z.string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .transform(sanitizeString),
  dateNaissance: z.string()
    .min(1, 'Date de naissance requise')
    .refine((val) => {
      const date = new Date(val)
      return !isNaN(date.getTime()) && date < new Date() && date > new Date('1900-01-01')
    }, 'Date de naissance invalide'),
  numeroIdentite: z.string()
    .min(5, 'Numero d\'identité invalide')
    .max(30, 'Numero d\'identité trop long')
    .transform(sanitizeString),
  telephone: z.string()
    .min(1, 'Numero de téléphone requis')
    .transform(sanitizeString)
    .refine(isValidGuineanPhone, 'Numero de téléphone guinéen invalide (format: +224 6XX XX XX XX)'),
  ville: z.string()
    .min(2, 'Ville requise')
    .max(50, 'Nom de ville trop long')
    .transform(sanitizeString),
  region: z.string()
    .min(2, 'Région requise')
    .max(50, 'Nom de région trop long')
    .transform(sanitizeString),
  categoriePermis: z.enum(['A', 'B', 'C', 'D', 'E', 'BE', 'CE', 'DE']).default('B'),
})

export const passwordResetRequestSchema = z.object({
  email: z.string()
    .transform(sanitizeString)
    .refine(isValidEmail, 'Format d\'email invalide')
    .optional(),
  telephone: z.string()
    .transform(sanitizeString)
    .refine(isValidGuineanPhone, 'Numero de téléphone invalide')
    .optional(),
}).refine(data => data.email || data.telephone, {
  message: 'Veuillez fournir votre email ou numéro de téléphone.',
})

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  newPassword: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(128, 'Mot de passe trop long')
    .regex(/[A-Z]/, 'Au moins une majuscule requise')
    .regex(/[a-z]/, 'Au moins une minuscule requise')
    .regex(/[0-9]/, 'Au moins un chiffre requis'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string()
    .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
    .max(128, 'Mot de passe trop long')
    .regex(/[A-Z]/, 'Au moins une majuscule requise')
    .regex(/[a-z]/, 'Au moins une minuscule requise')
    .regex(/[0-9]/, 'Au moins un chiffre requis'),
})

// ─── Admin Schemas ─────────────────────────────────────────

export const adminUpdateUserSchema = z.object({
  role: z.enum(['candidat', 'auto-ecole', 'centre-agree', 'administration', 'super-admin']).optional(),
  actif: z.boolean().optional(),
})

export const adminUpdateCentreSchema = z.object({
  nom: z.string().transform(sanitizeString).optional(),
  actif: z.boolean().optional(),
  accredStatut: z.enum(['actif', 'en_renouvellement', 'expire', 'suspendu']).optional(),
  accredScore: z.number().min(0).max(100).optional(),
})

export const adminUpdateFraudSchema = z.object({
  status: z.enum(['investigating', 'resolved', 'dismissed']).optional(),
  notes: z.string().max(2000).transform(sanitizeString).optional(),
})

export const adminUpdateBookingSchema = z.object({
  statutPaiement: z.enum(['en_attente', 'confirme', 'echoue', 'rembourse']).optional(),
  confirmee: z.boolean().optional(),
})

export const adminCreateQuestionSchema = z.object({
  texte: z.string().min(5, 'Question trop courte').max(500).transform(sanitizeString),
  options: z.array(z.string().transform(sanitizeString)).min(2, 'Au moins 2 options').max(6, 'Maximum 6 options'),
  bonneReponse: z.number().int().min(0, 'Index de réponse invalide'),
  categorie: z.enum(['Signalisation', 'Priorités', 'Conduite', 'Sécurité', 'Infractions']),
  difficulte: z.enum(['facile', 'moyen', 'difficile']).default('facile'),
  explication: z.string().min(5, 'Explication trop courte').max(1000).transform(sanitizeString),
  points: z.number().int().min(1).max(5).default(1),
  tempsEstime: z.number().int().min(10).max(120).default(20),
})

export const adminUpdateQuestionSchema = z.object({
  texte: z.string().min(5).max(500).transform(sanitizeString).optional(),
  options: z.array(z.string().transform(sanitizeString)).min(2).max(6).optional(),
  bonneReponse: z.number().int().min(0).optional(),
  categorie: z.enum(['Signalisation', 'Priorités', 'Conduite', 'Sécurité', 'Infractions']).optional(),
  difficulte: z.enum(['facile', 'moyen', 'difficile']).optional(),
  explication: z.string().min(5).max(1000).transform(sanitizeString).optional(),
  actif: z.boolean().optional(),
  points: z.number().int().min(1).max(5).optional(),
  tempsEstime: z.number().int().min(10).max(120).optional(),
})

// ─── Payment Schemas ───────────────────────────────────────

export const paymentInitiateSchema = z.object({
  centreId: z.string().min(1, 'Centre requis'),
  date: z.string().min(1, 'Date requise'),
  heure: z.string().regex(/^\d{2}:\d{2}$/, 'Format d\'heure invalide (HH:mm)'),
  telephone: z.string()
    .transform(sanitizeString)
    .refine(isValidGuineanPhone, 'Numero de téléphone Mobile Money invalide'),
  moyenPaiement: z.enum(['mobile_money', 'cash', 'carte']).default('mobile_money'),
})

// ─── Booking Schemas ───────────────────────────────────────

export const bookingCreateSchema = z.object({
  centreId: z.string().min(1, 'Centre requis'),
  date: z.string().min(1, 'Date requise'),
  heure: z.string().regex(/^\d{2}:\d{2}$/, 'Format d\'heure invalide'),
  langue: z.enum(['fr']).default('fr'),
  categoriePermis: z.enum(['A', 'B', 'C', 'D', 'E', 'BE', 'CE', 'DE']).default('B'),
})

// ─── Validation helper ─────────────────────────────────────

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true
  data: T
} | {
  success: false
  errors: string[]
} {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  // Zod v4 exposes `issues`; Zod v3 exposed `errors`. Support both.
  const issues = (result.error.issues || (result.error as unknown as { errors?: Array<{ message: string }> }).errors || []) as Array<{ message: string }>
  const errors = issues.map(err => err.message)
  return { success: false, errors }
}
