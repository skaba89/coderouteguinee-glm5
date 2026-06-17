// ============================================================
// CodeRoute Guinée — Admin Database Backup API
// POST /api/admin/backup — Trigger a database backup
// GET  /api/admin/backup — List available backups
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { logAudit } from '@/lib/audit-log'
import { execSync } from 'child_process'
import { existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'super-admin') {
      return NextResponse.json(
        { error: 'Accès réservé au super-administrateur.' },
        { status: 403 }
      )
    }

    const backupDir = join(process.cwd(), 'backups')
    const backups: Array<{ filename: string; size: string; date: string }> = []

    if (existsSync(backupDir)) {
      const files = readdirSync(backupDir)
        .filter(f => f.startsWith('coderoute_backup_'))
        .sort()
        .reverse()

      for (const file of files.slice(0, 20)) {
        const filePath = join(backupDir, file)
        const stats = statSync(filePath)
        const sizeKB = Math.round(stats.size / 1024)
        backups.push({
          filename: file,
          size: `${sizeKB} KB`,
          date: stats.mtime.toISOString(),
        })
      }
    }

    return NextResponse.json({ backups })
  } catch (error) {
    console.error('[BACKUP_LIST_ERROR]', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des sauvegardes.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'super-admin') {
      return NextResponse.json(
        { error: 'Accès réservé au super-administrateur.' },
        { status: 403 }
      )
    }

    // Execute the backup script
    try {
      const output = execSync('bash scripts/backup-db.sh', {
        cwd: process.cwd(),
        timeout: 60000,
        encoding: 'utf-8',
      })
      console.log('[BACKUP_OUTPUT]', output)
    } catch (execError: any) {
      console.error('[BACKUP_EXEC_ERROR]', execError.message)
      return NextResponse.json(
        { error: 'Erreur lors de l\'exécution de la sauvegarde.' },
        { status: 500 }
      )
    }

    await logAudit({
      eventType: 'DATA_EXPORT',
      severity: 'warning',
      userId: session.userId,
      userRole: session.role,
      description: 'Database backup triggered via admin API',
    }, request)

    return NextResponse.json({ message: 'Sauvegarde créée avec succès.' })
  } catch (error) {
    console.error('[BACKUP_CREATE_ERROR]', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la sauvegarde.' },
      { status: 500 }
    )
  }
}
