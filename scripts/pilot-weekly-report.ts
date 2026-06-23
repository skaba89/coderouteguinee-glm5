#!/usr/bin/env tsx
// ============================================================
// CodeRoute Guinée — Pilot weekly report generator
// ============================================================
// Reads the JSON KPI file produced by pilot-kpi-extract.ts
// (for the current week AND the previous week for diff),
// and generates a Markdown report ready for the pilot committee.
//
// Usage:
//   npx tsx scripts/pilot-weekly-report.ts --week=1
//   npx tsx scripts/pilot-weekly-report.ts --week=3 --narrative="Semaine calme, montée en charge OK"
//
// Output:
//   docs/pilote-dntt/rapports/S{N}-{YYYY-MM-DD}.md
// ============================================================

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

// ---------- CLI ----------
const args = process.argv.slice(2)
function arg(name: string, fallback?: string): string | undefined {
  const found = args.find((a) => a.startsWith(`--${name}=`))
  return found ? found.split('=')[1] : fallback
}
const weekNum = parseInt(arg('week', '1')!, 10)
const narrative = arg('narrative', '')
const highlights = arg('highlights', '')
  ? arg('highlights')!.split('|')
  : []
const frictions = arg('frictions', '')
  ? arg('frictions')!.split('|')
  : []

// ---------- Load JSON ----------
const reportsDir = join(process.cwd(), 'reports')
const findReport = (n: number): string | null => {
  const pattern = new RegExp(`^pilot-kpi-S${n}-`)
  const files = existsSync(reportsDir)
    ? readFileSync(join(reportsDir, '..'), { encoding: 'utf8' }) // dummy to satisfy types
    : ''
  void files
  try {
    const dir = readdirSyncSafe(reportsDir)
    const found = dir.find((f) => pattern.test(f))
    return found ? join(reportsDir, found) : null
  } catch {
    return null
  }
}

function readdirSyncSafe(dir: string): string[] {
  // tiny shim to avoid importing 'fs' twice with different APIs
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('fs').readdirSync(dir) as string[]
}

const currentPath = findReport(weekNum)
const previousPath = findReport(weekNum - 1)

if (!currentPath) {
  console.error(
    `❌ KPI file for week ${weekNum} not found in ${reportsDir}.
   Run scripts/pilot-kpi-extract.ts --week=${weekNum} first.`,
  )
  process.exit(1)
}

const current = JSON.parse(readFileSync(currentPath, 'utf8'))
const previous = previousPath ? JSON.parse(readFileSync(previousPath, 'utf8')) : null

// ---------- Helpers ----------
function fmt(n: number | null | undefined, suffix = ''): string {
  if (n == null || isNaN(n)) return '—'
  return n.toLocaleString('fr-FR') + suffix
}
function pct(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—'
  return n.toFixed(1) + '%'
}
function delta(curr: number | null | undefined, prev: number | null | undefined, suffix = ''): string {
  if (curr == null || prev == null || isNaN(curr) || isNaN(prev)) return ''
  const d = curr - prev
  const arrow = d > 0 ? '↑' : d < 0 ? '↓' : '→'
  const pctChange = prev !== 0 ? ` (${((d / prev) * 100).toFixed(1)}%)` : ''
  return `${arrow} ${Math.abs(d).toLocaleString('fr-FR')}${suffix}${pctChange}`
}
function emoji(level: string): string {
  return level === 'critical' ? '🔴' : level === 'warning' ? '🟡' : '🔵'
}

// ---------- Markdown generation ----------
const lines: string[] = []
lines.push(`# Rapport Hebdomadaire Pilote DNTT — Semaine ${weekNum}`)
lines.push('')
lines.push(`**Période** : du ${current.meta.weekStart.slice(0, 10)} au ${current.meta.weekEnd.slice(0, 10)}`)
lines.push(`**Date génération** : ${current.meta.generatedAt}`)
lines.push(`**Rédacteur** : Chef de projet DNTT CodeRoute`)
lines.push(`**Statut global** : ${current.alerts.some((a: any) => a.level === 'critical') ? '🔴 Rouge' : current.alerts.some((a: any) => a.level === 'warning') ? '🟡 Orange' : '🟢 Vert'}`)
lines.push('')
lines.push('---')
lines.push('')

// 1. Synthèse
lines.push('## 1. Synthèse Exécutive')
lines.push('')
if (narrative) {
  lines.push(narrative)
} else {
  const a = current.acquisition
  const e = current.exams
  const p = current.payments
  lines.push(
    `Semaine ${weekNum} du pilote DNTT CodeRoute Guinée. ` +
      `${a.newUsersThisWeek} nouveaux candidats inscrits (cumul ${a.cumulativeUsersEndOfWeek}). ` +
      `${e.code.passed} examens code passés (${pct(e.code.successRate)} de réussite), ` +
      `${e.conduite.passed} examens conduite (${pct(e.conduite.successRate)}). ` +
      `${p.total} paiements traités (${pct(p.failureRate)} d'échec), volume ${fmt(p.volumeGnf)} GNF. ` +
      `${current.security.fraudAlertsThisWeek} alertes fraude. ` +
      `${current.alerts.length} alerte(s) KPI déclenchée(s).`,
  )
}
lines.push('')

// 2. Acquisition
lines.push('## 2. Acquisition & Engagement')
lines.push('')
lines.push('| KPI | Cette semaine | Semaine précédente | Variation |')
lines.push('|-----|---------------|--------------------|-----------|')
lines.push(
  `| Nouveaux candidats | ${fmt(current.acquisition.newUsersThisWeek)} | ${fmt(previous?.acquisition?.newUsersThisWeek)} | ${delta(current.acquisition.newUsersThisWeek, previous?.acquisition?.newUsersThisWeek)} |`,
)
lines.push(
  `| Candidats actifs (7j) | ${fmt(current.acquisition.activeUsers7d)} | ${fmt(previous?.acquisition?.activeUsers7d)} | ${delta(current.acquisition.activeUsers7d, previous?.acquisition?.activeUsers7d)} |`,
)
lines.push(
  `| Cumul candidats | ${fmt(current.acquisition.cumulativeUsersEndOfWeek)} | ${fmt(previous?.acquisition?.cumulativeUsersEndOfWeek)} | ${delta(current.acquisition.cumulativeUsersEndOfWeek, previous?.acquisition?.cumulativeUsersEndOfWeek)} |`,
)
lines.push(
  `| Taux d'abandon | ${pct(current.acquisition.abandonRate)} | ${pct(previous?.acquisition?.abandonRate)} | ${delta(current.acquisition.abandonRate, previous?.acquisition?.abandonRate, '%')} |`,
)
lines.push('')

// 3. Exams
lines.push('## 3. Performance Examens')
lines.push('')
lines.push('### Examen Code')
lines.push('')
lines.push('| KPI | Cette semaine | Semaine précédente | Variation |')
lines.push('|-----|---------------|--------------------|-----------|')
lines.push(
  `| Examens passés | ${fmt(current.exams.code.passed)} | ${fmt(previous?.exams?.code?.passed)} | ${delta(current.exams.code.passed, previous?.exams?.code?.passed)} |`,
)
lines.push(
  `| Examens réussis | ${fmt(current.exams.code.succeeded)} | ${fmt(previous?.exams?.code?.succeeded)} | ${delta(current.exams.code.succeeded, previous?.exams?.code?.succeeded)} |`,
)
lines.push(
  `| Taux de réussite | ${pct(current.exams.code.successRate)} | ${pct(previous?.exams?.code?.successRate)} | ${delta(current.exams.code.successRate, previous?.exams?.code?.successRate, '%')} |`,
)
lines.push(
  `| Note moyenne | ${fmt(current.exams.code.avgScore, '/40')} | ${fmt(previous?.exams?.code?.avgScore, '/40')} | ${delta(current.exams.code.avgScore, previous?.exams?.code?.avgScore)} |`,
)
lines.push('')
lines.push('### Examen Conduite')
lines.push('')
lines.push('| KPI | Cette semaine | Semaine précédente | Variation |')
lines.push('|-----|---------------|--------------------|-----------|')
lines.push(
  `| Examens passés | ${fmt(current.exams.conduite.passed)} | ${fmt(previous?.exams?.conduite?.passed)} | ${delta(current.exams.conduite.passed, previous?.exams?.conduite?.passed)} |`,
)
lines.push(
  `| Examens réussis | ${fmt(current.exams.conduite.succeeded)} | ${fmt(previous?.exams?.conduite?.succeeded)} | ${delta(current.exams.conduite.succeeded, previous?.exams?.conduite?.succeeded)} |`,
)
lines.push(
  `| Taux de réussite | ${pct(current.exams.conduite.successRate)} | ${pct(previous?.exams?.conduite?.successRate)} | ${delta(current.exams.conduite.successRate, previous?.exams?.conduite?.successRate, '%')} |`,
)
lines.push(
  `| Note moyenne | ${fmt(current.exams.conduite.avgScore, '/40')} | ${fmt(previous?.exams?.conduite?.avgScore, '/40')} | ${delta(current.exams.conduite.avgScore, previous?.exams?.conduite?.avgScore)} |`,
)
lines.push('')

// 4. Payments
lines.push('## 4. Paiements')
lines.push('')
lines.push('| KPI | Cette semaine | Semaine précédente | Variation |')
lines.push('|-----|---------------|--------------------|-----------|')
lines.push(
  `| Transactions Orange Money | ${fmt(current.payments.orange)} | ${fmt(previous?.payments?.orange)} | ${delta(current.payments.orange, previous?.payments?.orange)} |`,
)
lines.push(
  `| Transactions MTN MoMo | ${fmt(current.payments.mtn)} | ${fmt(previous?.payments?.mtn)} | ${delta(current.payments.mtn, previous?.payments?.mtn)} |`,
)
lines.push(
  `| Total transactions | ${fmt(current.payments.total)} | ${fmt(previous?.payments?.total)} | ${delta(current.payments.total, previous?.payments?.total)} |`,
)
lines.push(
  `| Volume total (GNF) | ${fmt(current.payments.volumeGnf)} | ${fmt(previous?.payments?.volumeGnf)} | ${delta(current.payments.volumeGnf, previous?.payments?.volumeGnf)} |`,
)
lines.push(
  `| Taux d'échec | ${pct(current.payments.failureRate)} | ${pct(previous?.payments?.failureRate)} | ${delta(current.payments.failureRate, previous?.payments?.failureRate, '%')} |`,
)
lines.push(
  `| Remboursements | ${fmt(current.payments.refunded)} | ${fmt(previous?.payments?.refunded)} | ${delta(current.payments.refunded, previous?.payments?.refunded)} |`,
)
lines.push('')

// 5. Centres
lines.push('## 5. Centres Pilotes')
lines.push('')
lines.push('| Centre | Capacité / jour | Réservations cumulées | Taux remplissage (7j) |')
lines.push('|--------|----------------|----------------------|------------------------|')
for (const c of current.centres) {
  lines.push(`| ${c.nom} | ${fmt(c.capaciteJour)} | ${fmt(c.totalBookings)} | ${pct(c.fillRate)} |`)
}
lines.push('')

// 6. Security
lines.push('## 6. Sécurité & Conformité')
lines.push('')
lines.push('| KPI | Cette semaine | Semaine précédente | Variation |')
lines.push('|-----|---------------|--------------------|-----------|')
lines.push(
  `| Alertes fraude examen | ${fmt(current.security.fraudAlertsThisWeek)} | ${fmt(previous?.security?.fraudAlertsThisWeek)} | ${delta(current.security.fraudAlertsThisWeek, previous?.security?.fraudAlertsThisWeek)} |`,
)
lines.push(
  `| Événements rate limit | ${fmt(current.security.rateLimitEvents)} | ${fmt(previous?.security?.rateLimitEvents)} | ${delta(current.security.rateLimitEvents, previous?.security?.rateLimitEvents)} |`,
)
lines.push(
  `| Événements geoblock | ${fmt(current.security.geoblockEvents)} | ${fmt(previous?.security?.geoblockEvents)} | ${delta(current.security.geoblockEvents, previous?.security?.geoblockEvents)} |`,
)
lines.push(
  `| Tickets support ouverts | ${fmt(current.security.ticketsOpen)} | ${fmt(previous?.security?.ticketsOpen)} | ${delta(current.security.ticketsOpen, previous?.security?.ticketsOpen)} |`,
)
lines.push('')
if (current.security.fraudBySeverity && Object.keys(current.security.fraudBySeverity).length > 0) {
  lines.push('**Répartition fraude par sévérité** :')
  lines.push('')
  for (const [sev, count] of Object.entries(current.security.fraudBySeverity)) {
    lines.push(`- ${sev}: ${count}`)
  }
  lines.push('')
}

// 7. Infrastructure
lines.push('## 7. Infrastructure & Performance')
lines.push('')
if (current.infrastructure.uptime7dPct != null) {
  lines.push('| KPI | Cette semaine | Semaine précédente | Seuil |')
  lines.push('|-----|---------------|--------------------|--------|')
  lines.push(
    `| Uptime 7j (%) | ${pct(current.infrastructure.uptime7dPct)} | ${pct(previous?.infrastructure?.uptime7dPct)} | ≥ 99.5% |`,
  )
  lines.push(
    `| Temps réponse P95 (ms) | ${fmt(current.infrastructure.responseTimeP95Ms)} | ${fmt(previous?.infrastructure?.responseTimeP95Ms)} | ≤ 500 |`,
  )
  lines.push(
    `| Temps réponse P99 (ms) | ${fmt(current.infrastructure.responseTimeP99Ms)} | ${fmt(previous?.infrastructure?.responseTimeP99Ms)} | ≤ 1500 |`,
  )
  lines.push(
    `| Erreurs 5xx (/1000) | ${fmt(current.infrastructure.errors5xxPer1k)} | ${fmt(previous?.infrastructure?.errors5xxPer1k)} | ≤ 5 |`,
  )
  lines.push('')
} else {
  lines.push('_Données Prometheus non disponibles (lancer avec `--prometheus=URL` ou `PROMETHEUS_URL` env)._')
  lines.push('')
}

// 8. Alerts
lines.push('## 8. Alertes KPI')
lines.push('')
if (current.alerts.length === 0) {
  lines.push('_Aucune alerte déclenchée cette semaine._')
} else {
  lines.push('| Niveau | KPI | Valeur | Seuil |')
  lines.push('|--------|-----|--------|-------|')
  for (const a of current.alerts) {
    lines.push(`| ${emoji(a.level)} ${a.level} | ${a.kpi} | ${a.value} | ${a.threshold} |`)
  }
}
lines.push('')

// 9. Highlights & frictions
if (highlights.length > 0 || frictions.length > 0) {
  lines.push('## 9. Faits Saillants & Points de Friction')
  lines.push('')
  if (highlights.length > 0) {
    lines.push('### Points forts')
    lines.push('')
    for (const h of highlights) lines.push(`- ${h}`)
    lines.push('')
  }
  if (frictions.length > 0) {
    lines.push('### Points de friction')
    lines.push('')
    for (const f of frictions) lines.push(`- ${f}`)
    lines.push('')
  }
}

// 10. Next steps
lines.push('## 10. Priorités Semaine Suivante')
lines.push('')
lines.push('- _{à compléter par le chef de projet}_')
lines.push('')

// Footer
lines.push('---')
lines.push('')
lines.push(
  `**Rapport généré automatiquement** par \`scripts/pilot-weekly-report.ts\` à partir de \`${currentPath.split('/').pop()}\`.`,
)
lines.push(`**Classification** : Confidentiel DNTT`)
lines.push(`**Archivage** : 5 ans (art. 35 Loi L/2022/018/AN)`)

// ---------- Write output ----------
const rapportsDir = join(process.cwd(), 'docs', 'pilote-dntt', 'rapports')
mkdirSync(rapportsDir, { recursive: true })
const dateStr = current.meta.weekStart.slice(0, 10)
const outFilename = `S${weekNum}-${dateStr}.md`
const outPath = join(rapportsDir, outFilename)
writeFileSync(outPath, lines.join('\n'), 'utf8')

console.log(`\n✅ Rapport hebdomadaire généré: ${outPath}`)
console.log(`   Alertes: ${current.alerts.length}`)
console.log(`   Statut global: ${current.alerts.some((a: any) => a.level === 'critical') ? '🔴 Rouge' : current.alerts.some((a: any) => a.level === 'warning') ? '🟡 Orange' : '🟢 Vert'}`)
process.exit(0)
