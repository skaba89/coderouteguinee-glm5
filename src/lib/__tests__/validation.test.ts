// ============================================================
// Tests unitaires — Validation des entrées (Zod schemas)
// ============================================================

import {
  loginSchema,
  registerSchema,
  passwordResetConfirmSchema,
  changePasswordSchema,
  validateInput,
} from '../validation'

describe('Validation Schemas', () => {
  // ─── Login Schema ───────────────────────────────────────
  describe('loginSchema', () => {
    test('accepte un email et mot de passe valides', () => {
      const result = validateInput(loginSchema, {
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result.success).toBe(true)
    })

    test('rejette un email invalide', () => {
      const result = validateInput(loginSchema, {
        email: 'not-an-email',
        password: 'password123',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.includes('email'))).toBe(true)
      }
    })

    test('rejette un mot de passe vide', () => {
      const result = validateInput(loginSchema, {
        email: 'test@example.com',
        password: '',
      })
      expect(result.success).toBe(false)
    })

    test('nettoie les tags HTML de l\'email', () => {
      const result = validateInput(loginSchema, {
        email: '<script>alert(1)</script>test@example.com',
        password: 'password123',
      })
      // After sanitization the email becomes "alert(1)test@example.com"
      // which is still a syntactically valid email — accepted, but cleaned.
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('alert(1)test@example.com')
        expect(result.data.email).not.toContain('<script>')
      }
    })
  })

  // ─── Register Schema ────────────────────────────────────
  describe('registerSchema', () => {
    const validRegister = {
      email: 'candidat@example.gn',
      password: 'ValidPass123',
      nom: 'Diallo',
      prenom: 'Mamadou',
      dateNaissance: '1995-08-10',
      numeroIdentite: 'GN-12345678',
      telephone: '+224 622 12 34 56',
      ville: 'Conakry',
      region: 'Conakry',
    }

    test('accepte une inscription valide', () => {
      const result = validateInput(registerSchema, validRegister)
      expect(result.success).toBe(true)
    })

    test('rejette un mot de passe trop court (<8)', () => {
      const result = validateInput(registerSchema, {
        ...validRegister,
        password: 'Ab1',
      })
      expect(result.success).toBe(false)
    })

    test('rejette un mot de passe sans majuscule', () => {
      const result = validateInput(registerSchema, {
        ...validRegister,
        password: 'password123',
      })
      expect(result.success).toBe(false)
    })

    test('rejette un mot de passe sans chiffre', () => {
      const result = validateInput(registerSchema, {
        ...validRegister,
        password: 'PasswordABC',
      })
      expect(result.success).toBe(false)
    })

    test('rejette un numéro de téléphone non-guinéen', () => {
      const result = validateInput(registerSchema, {
        ...validRegister,
        telephone: '+33 6 12 34 56 78',
      })
      expect(result.success).toBe(false)
    })

    test('accepte les numéros guinéens avec préfixe +224', () => {
      const result = validateInput(registerSchema, {
        ...validRegister,
        telephone: '+224622123456',
      })
      expect(result.success).toBe(true)
    })

    test('accepte les numéros guinéens sans préfixe', () => {
      const result = validateInput(registerSchema, {
        ...validRegister,
        telephone: '622123456',
      })
      expect(result.success).toBe(true)
    })

    test('nettoie les tags HTML du nom', () => {
      const result = validateInput(registerSchema, {
        ...validRegister,
        nom: '<script>Diallo</script>',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.nom).toBe('Diallo')
      }
    })

    test('rejette une date de naissance future', () => {
      const future = new Date()
      future.setFullYear(future.getFullYear() + 1)
      const result = validateInput(registerSchema, {
        ...validRegister,
        dateNaissance: future.toISOString().split('T')[0],
      })
      expect(result.success).toBe(false)
    })

    test('rejette une catégorie de permis invalide', () => {
      const result = validateInput(registerSchema, {
        ...validRegister,
        categoriePermis: 'Z',
      })
      expect(result.success).toBe(false)
    })
  })

  // ─── Password Reset Confirm Schema ──────────────────────
  describe('passwordResetConfirmSchema', () => {
    test('accepte un token et mot de passe valide', () => {
      const result = validateInput(passwordResetConfirmSchema, {
        token: 'abc123',
        newPassword: 'NewPass456',
      })
      expect(result.success).toBe(true)
    })

    test('rejette un mot de passe sans complexité', () => {
      const result = validateInput(passwordResetConfirmSchema, {
        token: 'abc123',
        newPassword: 'simple',
      })
      expect(result.success).toBe(false)
    })
  })

  // ─── Change Password Schema ─────────────────────────────
  describe('changePasswordSchema', () => {
    test('accepte des mots de passe valides', () => {
      const result = validateInput(changePasswordSchema, {
        currentPassword: 'OldPass123',
        newPassword: 'NewPass456',
      })
      expect(result.success).toBe(true)
    })

    test('rejette sans mot de passe actuel', () => {
      const result = validateInput(changePasswordSchema, {
        currentPassword: '',
        newPassword: 'NewPass456',
      })
      expect(result.success).toBe(false)
    })
  })
})
