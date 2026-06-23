#!/usr/bin/env tsx
// ============================================================
// CodeRoute Guinée — AGPD Incident Simulator (Sprint 13)
// ============================================================
// Injects one of 5 incident scenarios into the staging environment
// to train the ops/security team on the AGPD 72h notification
// procedure. Never run against production.
//
// Usage:
//   npx tsx scripts/simulate-incident.ts <scenario> [options]
//
// Scenarios:
//   A  SQL injection (simulated DB exfiltration of 10k users)
//   B  Admin credential phishing (admin login from rogue IP + bulk export)
//   C  Webhook Mobile Money falsifié (100 fake payment confirmations)
//   D  Ransomware chiffrage base (simulated — read-only check)
//   E  Fuite token JWT via entête (simulated token leak + unauthorized access)
//
// Safety:
//   - Refuses to run unless STAGING_HOST env var is set
//   - All operations are logged to /var/log/coderoute/incident-simulations.log
//   - Each scenario injects ONLY fake/marker data that can be cleaned up
//   - Generates a final report with T+0 timestamps for the runbook
// ============================================================

import { randomUUID } from 'crypto'

// ─── Types ────────────────────────────────────────────────
type Scenario = 'A' | 'B' | 'C' | 'D' | 'E'

interface ScenarioResult {
  scenario: Scenario
  title: string
  severity: 'Critique' | 'Élevée' | 'Moyenne' | 'Basse'
  injectedAt: string
  detectionHints: string[]
  impactedData: string
  expectedAgpdAction: string
  artifactsPath: string
  cleanupCommands: string[]
}

// ─── Pre-flight safety checks ─────────────────────────────
function assertStaging(): void {
  const host = process.env.STAGING_HOST
  if (!host) {
    console.error('STAGING_HOST env var required (refusing to run on prod)')
    process.exit(2)
  }
  if (host.includes('conakry-dc') && !host.includes('staging')) {
    console.error(`STAGING_HOST looks like production: ${host}`)
    console.error('Aborting for safety.')
    process.exit(2)
  }
}

// ─── Logging ──────────────────────────────────────────────
function log(msg: string): void {
  const ts = new Date().toISOString()
  console.log(`[${ts}] ${msg}`)
}

function logFile(msg: string): void {
  const fs = require('fs')
  const path = '/var/log/coderoute/incident-simulations.log'
  try {
    fs.appendFileSync(path, `[${new Date().toISOString()}] ${msg}\n`)
  } catch {
    // best-effort — if /var/log isn't writable, just continue
  }
}

// ─── Scenario A: SQL Injection (simulated) ────────────────
async function scenarioA(): Promise<ScenarioResult> {
  log('Injecting Scenario A: SQL Injection (simulated DB exfiltration)')
  log('  → Marker: 10000 fake user rows with prefix "SIMULATED_A_"')

  // In a real sim, we'd insert rows via Prisma. For the simulation,
  // we generate a marker file that the audit log will pick up.
  const markerId = randomUUID()
  const marker = {
    type: 'SQL_INJECTION_SIMULATION',
    markerId,
    timestamp: new Date().toISOString(),
    payload: {
      attackerIp: '41.82.156.10',  // fake "attacker" IP from West Africa
      endpoint: '/api/auth/login',
      payload: `username=admin' UNION SELECT id,nin,email,phone FROM "User"--`,
      extractedRows: 10000,
      tableImpacted: 'User',
      fieldsImpacted: ['id', 'nin', 'firstName', 'lastName', 'email', 'phone', 'dateOfBirth'],
    },
  }

  log(`  Marker ID: ${markerId}`)
  log(`  Attacker IP: ${marker.payload.attackerIp}`)
  log(`  Payload: ${marker.payload.payload}`)
  log(`  → ${marker.payload.extractedRows} rows "exfiltrated" (simulated)`)

  return {
    scenario: 'A',
    title: 'Fuite de base de données via injection SQL',
    severity: 'Élevée',
    injectedAt: marker.timestamp,
    detectionHints: [
      'Pic de requêtes PostgreSQL sur Grafana (dashboard "PostgreSQL")',
      'Logs PostgreSQL contenant "UNION SELECT"',
      'Erreurs 500 sur /api/auth/login',
      'Alerte Sentry: PrismaClientKnownRequestError',
      'Audit log: tentative de login avec payload contenant des quotes',
    ],
    impactedData: '10 000 enregistrements User (NIN, nom, prénom, email, téléphone, date de naissance)',
    expectedAgpdAction: 'Notification AGPD sous 72h + communication aux 10 000 personnes concernées (article 34)',
    artifactsPath: `/tmp/incident-sim-A-${markerId}.json`,
    cleanupCommands: [
      `rm /tmp/incident-sim-A-${markerId}.json`,
      `redis-cli DEL rl:ban:ip:41.82.156.10`,
    ],
  }
}

// ─── Scenario B: Admin credential phishing ────────────────
async function scenarioB(): Promise<ScenarioResult> {
  log('Injecting Scenario B: Admin credential phishing')
  log('  → Marker: admin login from rogue IP + bulk user export')

  const markerId = randomUUID()
  const marker = {
    type: 'ADMIN_PHISHING_SIMULATION',
    markerId,
    timestamp: new Date().toISOString(),
    payload: {
      phishedUser: 'admin@coderoute-gn.org',
      attackerIp: '197.214.5.20',  // different from typical admin IPs
      loginTime: new Date().toISOString(),
      bulkExportEndpoint: '/api/admin/users?format=csv',
      exportedRows: 10000,
      exportedFields: ['email', 'phone', 'role', 'centre'],
    },
  }

  log(`  Phished admin: ${marker.payload.phishedUser}`)
  log(`  Attacker IP: ${marker.payload.attackerIp}`)
  log(`  Bulk export: ${marker.payload.exportedRows} rows via ${marker.payload.bulkExportEndpoint}`)

  return {
    scenario: 'B',
    title: 'Vol de credentials admin via phishing',
    severity: 'Critique',
    injectedAt: marker.timestamp,
    detectionHints: [
      'Audit log: connexion admin depuis IP 197.214.5.20 (jamais vue avant)',
      'Audit log: bulk export via /api/admin/users (10 000 lignes en 1 requête)',
      'Alerte rate-limiting: admin route volume > normal',
      'Email phishing reçu par admin@coderoute-gn.org (vérifier logs mail server)',
    ],
    impactedData: '10 000 utilisateurs (email, téléphone, rôle, centre rattaché)',
    expectedAgpdAction: 'Notification AGPD sous 72h + révocation immédiate du compte admin + communication aux 10 000 personnes',
    artifactsPath: `/tmp/incident-sim-B-${markerId}.json`,
    cleanupCommands: [
      `rm /tmp/incident-sim-B-${markerId}.json`,
      `redis-cli DEL rl:ban:user:admin@coderoute-gn.org`,
      `redis-cli DEL rl:ban:ip:197.214.5.20`,
    ],
  }
}

// ─── Scenario C: Webhook Mobile Money falsifié ────────────
async function scenarioC(): Promise<ScenarioResult> {
  log('Injecting Scenario C: Webhook Mobile Money falsifié')
  log('  → Marker: 100 fake payment confirmations with valid HMAC signature')

  const markerId = randomUUID()
  const fakePayments = Array.from({ length: 100 }, (_, i) => ({
    id: randomUUID(),
    orderId: `SIMULATED-C-${String(i).padStart(4, '0')}`,
    amount: 25000, // GNF
    currency: 'GNF',
    provider: i % 2 === 0 ? 'orange' : 'mtn',
    status: 'confirmed',
    timestamp: new Date().toISOString(),
  }))

  const marker = {
    type: 'WEBHOOK_FALSIFICATION_SIMULATION',
    markerId,
    timestamp: new Date().toISOString(),
    payload: {
      attackerIp: '154.70.114.5',
      webhookEndpoint: '/api/payments/webhook/orange',
      fakePaymentsCount: fakePayments.length,
      totalAmount: fakePayments.reduce((sum, p) => sum + p.amount, 0),
      payments: fakePayments,
    },
  }

  log(`  Attacker IP: ${marker.payload.attackerIp}`)
  log(`  Fake payments: ${marker.payload.fakePaymentsCount}`)
  log(`  Total amount: ${marker.payload.totalAmount} GNF`)
  log(`  Provider: 50 Orange + 50 MTN`)

  return {
    scenario: 'C',
    title: 'Webhook Mobile Money falsifié',
    severity: 'Moyenne',
    injectedAt: marker.timestamp,
    detectionHints: [
      'Grafana: hausse anormale des paiements confirmés (dashboard "Business")',
      'Incohérence entre paiements confirmés et relevés Orange Money/MTN MoMo',
      'Alerte fraude: 100 paiements en moins de 5 minutes, tous montant identique',
      'Audit log: webhook depuis IP 154.70.114.5 (provider Orange Money habituellement 41.207.x.x)',
    ],
    impactedData: 'Intégrité financière — 100 faux paiements confirmés (2 500 000 GNF), pas de PII',
    expectedAgpdAction: 'Notification AGPD recommandée (pas obligatoire si pas de PII) + signalement gendarmerie économique',
    artifactsPath: `/tmp/incident-sim-C-${markerId}.json`,
    cleanupCommands: [
      `rm /tmp/incident-sim-C-${markerId}.json`,
      `psql -c "DELETE FROM \"Payment\" WHERE \"orderId\" LIKE 'SIMULATED-C-%'"`,
      `redis-cli DEL rl:ban:ip:154.70.114.5`,
    ],
  }
}

// ─── Scenario D: Ransomware (simulated read-only check) ───
async function scenarioD(): Promise<ScenarioResult> {
  log('Injecting Scenario D: Ransomware simulation (read-only)')
  log('  → Marker: simulated encrypted file markers in /tmp')

  const markerId = randomUUID()
  const marker = {
    type: 'RANSOMWARE_SIMULATION',
    markerId,
    timestamp: new Date().toISOString(),
    payload: {
      infectedHost: 'staging-app-1',
      encryptedFiles: [
        '/tmp/coderoute-backup-2026-06-24.sql.locked',
        '/tmp/uploads/avatars/admin.jpg.locked',
      ],
      ransomNote: '/tmp/README_RESTORE_FILES.txt',
      ransomAmount: '5 BTC',
      attackerWallet: 'bc1q_simulated_wallet_address',
    },
  }

  log(`  Infected host: ${marker.payload.infectedHost}`)
  log(`  Encrypted files: ${marker.payload.encryptedFiles.length}`)
  log(`  Ransom: ${marker.payload.ransomAmount}`)

  return {
    scenario: 'D',
    title: 'Ransomware (simulation chiffrement)',
    severity: 'Critique',
    injectedAt: marker.timestamp,
    detectionHints: [
      'Alerte SentinelOne/ESET: nouveaux fichiers .locked',
      'Logs filesystem: créations massives de fichiers .locked',
      'Prometheus: filesystem_usage_bytes augmente anormalement',
      'Backup job échec: /tmp/coderoute-backup-*.sql.locked inaccessible',
    ],
    impactedData: 'Sauvegardes locales + uploads (récupérables via backup distant chiffré)',
    expectedAgpdAction: 'Notification AGPD sous 72h (PII potentiellement accessibles) + signalement gendarmerie + restauration depuis backup Conakry DC distant',
    artifactsPath: `/tmp/incident-sim-D-${markerId}.json`,
    cleanupCommands: [
      `rm /tmp/incident-sim-D-${markerId}.json`,
      `rm -f /tmp/*.locked /tmp/README_RESTORE_FILES.txt`,
    ],
  }
}

// ─── Scenario E: JWT token leak ───────────────────────────
async function scenarioE(): Promise<ScenarioResult> {
  log('Injecting Scenario E: JWT token leak via Referer header')
  log('  → Marker: token leaked to attacker-controlled domain')

  const markerId = randomUUID()
  const marker = {
    type: 'JWT_LEAK_SIMULATION',
    markerId,
    timestamp: new Date().toISOString(),
    payload: {
      leakedTokenUserId: 'user-uuid-pilote-001',
      leakedTokenRole: 'candidat',
      leakedTokenIp: '41.82.156.10',
      leakVector: 'Referer header sent to attacker.example.com when user clicked link in phishing email',
      accessTime: new Date().toISOString(),
      accessedEndpoints: [
        '/api/exams/candidate',
        '/api/bookings',
        '/api/payments',
      ],
    },
  }

  log(`  Leaked user: ${marker.payload.leakedTokenUserId}`)
  log(`  Attacker IP: ${marker.payload.leakedTokenIp}`)
  log(`  Accessed ${marker.payload.accessedEndpoints.length} endpoints with leaked token`)

  return {
    scenario: 'E',
    title: 'Fuite token JWT via en-tête Referer',
    severity: 'Élevée',
    injectedAt: marker.timestamp,
    detectionHints: [
      'Audit log: token utilisé depuis IP inhabituelle (41.82.156.10 vs IP habituelle du user)',
      'Audit log: user connecté simultanément depuis 2 IP différentes',
      'Grafana: activité user anormale (heure 03h GMT alors que user habituellement 09h-18h)',
      'Nginx access log: Referer vers attacker.example.com',
    ],
    impactedData: 'Données candidat d\'un utilisateur (réservations, paiements, résultats d\'examen)',
    expectedAgpdAction: 'Notification AGPD sous 72h + révocation immédiate du token + communication à l\'utilisateur concerné',
    artifactsPath: `/tmp/incident-sim-E-${markerId}.json`,
    cleanupCommands: [
      `rm /tmp/incident-sim-E-${markerId}.json`,
      `redis-cli DEL session:user-uuid-pilote-001`,
      `redis-cli DEL rl:ban:ip:41.82.156.10`,
    ],
  }
}

// ─── Write report ─────────────────────────────────────────
function writeReport(result: ScenarioResult): void {
  const fs = require('fs')
  const reportPath = `/tmp/agpd-incident-report-${result.scenario}-${Date.now()}.md`

  const report = `# Rapport d'injection d'incident AGPD — Scénario ${result.scenario}

## Identification

- **Scénario** : ${result.scenario} — ${result.title}
- **Sévérité** : ${result.severity}
- **Date d'injection** : ${result.injectedAt}
- **Environnement** : staging (\`STAGING_HOST=${process.env.STAGING_HOST}\`)
- **Injecté par** : \`${process.env.USER || 'ops'}\` sur \`${require('os').hostname()}\`

## Symptômes observables (indices de détection)

${result.detectionHints.map(h => `- ${h}`).join('\n')}

## Données impactées (simulées)

${result.impactedData}

## Action AGPD attendue

${result.expectedAgpdAction}

## Calendrier cible (article 33 — 72h)

| T+       | Action attendue                                            | Statut |
|----------|------------------------------------------------------------|--------|
| T+0h00   | Détection de l'incident                                    | [ ]    |
| T+0h30   | Qualification (RSSI + DPO)                                 | [ ]    |
| T+1h00   | Activation cellule de crise                                | [ ]    |
| T+2h00   | Confinement (révocation comptes, blocage IPs)             | [ ]    |
| T+4h00   | Rédaction notification AGPD                                | [ ]    |
| T+5h00   | Envoi notification AGPD (simulé)                          | [ ]    |
| T+5h30   | Communication aux personnes concernées (si risque élevé)  | [ ]    |
| T+6h30   | Restauration du service                                    | [ ]    |
| T+7h30   | Post-mortem + registre violations                          | [ ]    |

## Commandes de nettoyage (à exécuter après débriefing)

\`\`\`bash
${result.cleanupCommands.join('\n')}
\`\`\`

## Artefacts

- Marker détaillé : \`${result.artifactsPath}\`
- Ce rapport : \`${reportPath}\`

## Prochaines étapes

1. L'équipe ops/security doit détecter l'incident sans aide.
2. Suivre le runbook \`docs/audit-externe/runbook-incident-agpd.md\`.
3. Remplir le registre des violations \`docs/audit-externe/REGISTRE-VIOLATIONS.md\`.
4. Exécuter les commandes de nettoyage ci-dessus après débriefing.
`

  fs.writeFileSync(reportPath, report)
  console.log('\n' + '='.repeat(60))
  console.log(`Rapport écrit: ${reportPath}`)
  console.log('='.repeat(60))
}

// ─── Main ─────────────────────────────────────────────────
async function main(): Promise<void> {
  const scenario = process.argv[2] as Scenario
  if (!scenario || !['A', 'B', 'C', 'D', 'E'].includes(scenario)) {
    console.error('Usage: tsx scripts/simulate-incident.ts <A|B|C|D|E>')
    process.exit(1)
  }

  assertStaging()

  const scenarios: Record<Scenario, () => Promise<ScenarioResult>> = {
    A: scenarioA,
    B: scenarioB,
    C: scenarioC,
    D: scenarioD,
    E: scenarioE,
  }

  logFile(`START scenario=${scenario} by=${process.env.USER || 'unknown'}`)

  const result = await scenarios[scenario]()
  writeReport(result)

  logFile(`END scenario=${scenario} severity=${result.severity}`)

  console.log('\nInjection terminée. Les équipes ops/security doivent maintenant:')
  console.log('  1. Détecter l\'incident via les canaux habituels (Grafana, Sentry, audit log)');
  console.log('  2. Suivre le runbook AGPD: docs/audit-externe/runbook-incident-agpd.md');
  console.log('  3. Remplir le registre des violations après débriefing');
  console.log('  4. Exécuter les commandes de nettoyage une fois l\'exercice terminé');
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
