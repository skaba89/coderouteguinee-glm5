// ============================================================
// CodeRoute Guinée — Tarification dynamique des examens
// Centralise la lecture du tarif courant pour la réservation
// ============================================================

import { db } from '@/lib/db'

// ─── Cache en mémoire par clé (TTL court) ───────────────────────────────
interface CacheEntry {
  montant: number
  libelle: string
  fetchedAt: number
}
const tarifCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60_000 // 1 minute

// ─── Clé par défaut du tarif de réservation d'examen (permis B) ────────
const DEFAULT_TARIF_KEY = 'examen_reservation_B'
// ─── Montant de repli si la DB est vide ou inaccessible ────────────────
const FALLBACK_MONTANT = 350000 // GNF — tarif officiel juin 2026

export interface TarifInfo {
  montant: number
  libelle: string
  cle: string
  source: 'db' | 'cache' | 'fallback'
}

// ─── Récupère le tarif courant pour une clé donnée ────────────────────
export async function getCurrentTarif(cle: string = DEFAULT_TARIF_KEY): Promise<TarifInfo> {
  // 1. Cache en mémoire (par clé)
  const cached = tarifCache.get(cle)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return {
      montant: cached.montant,
      libelle: cached.libelle,
      cle,
      source: 'cache',
    }
  }

  // 2. Lecture DB
  try {
    const row = await db.tarifConfig.findFirst({
      where: { cle, actif: true },
      orderBy: { updatedAt: 'desc' },
    })
    if (row) {
      tarifCache.set(cle, {
        montant: row.montant,
        libelle: row.libelle,
        fetchedAt: Date.now(),
      })
      return { montant: row.montant, libelle: row.libelle, cle, source: 'db' }
    }
  } catch (err) {
    console.error('[TARIF_DB_ERROR]', err)
  }

  // 3. Repli
  return { montant: FALLBACK_MONTANT, libelle: 'Réservation examen (repli)', cle, source: 'fallback' }
}

// ─── Récupère tous les tarifs (admin uniquement) ──────────────────────
export async function getAllTarifs() {
  return db.tarifConfig.findMany({
    orderBy: [{ categoriePermis: 'asc' }, { cle: 'asc' }],
  })
}

// ─── Invalide le cache (après modification admin) ─────────────────────
export function invalidateTarifCache() {
  tarifCache.clear()
}
