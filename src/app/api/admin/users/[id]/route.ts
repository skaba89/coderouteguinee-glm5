import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// ─── PATCH: Update a user (admin only) ────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'administration' && session.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    // Verify user exists
    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Only super-admin can change roles to super-admin
    if (body.role === 'super-admin' && session.role !== 'super-admin') {
      return NextResponse.json({ error: 'Seul un super-admin peut attribuer le rôle super-admin' }, { status: 403 })
    }

    // Only super-admin can deactivate another admin
    if (body.actif === false && existing.role !== 'candidat' && session.role !== 'super-admin') {
      return NextResponse.json({ error: 'Seul un super-admin peut désactiver un administrateur' }, { status: 403 })
    }

    // Build update object with only allowed fields
    const allowedFields = ['nom', 'prenom', 'telephone', 'ville', 'region', 'categoriePermis', 'role', 'actif', 'langueMaternelle']
    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Validate role value
    if (updateData.role && !['candidat', 'auto-ecole', 'centre-agree', 'administration', 'super-admin'].includes(updateData.role as string)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        actif: true,
        numeroUnique: true,
        telephone: true,
        ville: true,
        region: true,
        categoriePermis: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
