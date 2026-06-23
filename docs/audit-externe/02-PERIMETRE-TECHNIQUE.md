# Périmètre technique — Inventaire des composants audités

Ce document inventorie l'ensemble des composants techniques soumis à l'audit externe. Chaque composant est décrit avec sa version, sa surface d'exposition, ses dépendances critiques et les contrôles attendus.

## 1. Cartographie d'architecture

```
                    ┌─────────────────────────────────────────────┐
                    │           Internet public                   │
                    └──────────────────┬──────────────────────────┘
                                       │
                          ┌────────────▼─────────────┐
                          │   Caddy (TLS 1.3, HSTS)  │
                          │   Reverse-proxy edge     │
                          └────────────┬─────────────┘
                                       │
                    ┌──────────────────▼───────────────────────┐
                    │  Nginx (WAF basique, rate limit, headers)│
                    │  Conakry DC                              │
                    └──────────────────┬───────────────────────┘
                                       │
        ┌──────────────────────────────▼──────────────────────────────┐
        │  Next.js 14 standalone (Node 20) — Docker container         │
        │  ├─ Frontend React (SSR + PWA)                              │
        │  └─ API Routes (/api/auth/*, /api/exams/*, /api/...)        │
        └──┬─────────────┬───────────────┬───────────────┬───────────┘
           │             │               │               │
       ┌───▼───┐    ┌────▼────┐    ┌─────▼─────┐   ┌─────▼─────┐
       │Postgres│    │  Redis  │    │  SMTP     │   │  Orange   │
       │  16    │    │   7     │    │  (postfix │   │   SMS     │
       │Conakry │    │sessions │    │   relay)  │   │   API     │
       │  DC    │    │+ rate   │    │           │   │           │
       └────┬───┘    └─────────┘    └───────────┘   └───────────┘
            │
       ┌────▼────────────┐
       │  Kankan DC (DR) │
       │  Postgres 16    │
       │  (réplication   │
       │   streaming)    │
       └─────────────────┘
```

## 2. Composants applicatifs

### 2.1 Application Next.js 14

- **Version** : Next.js 14.2.x (App Router)
- **Runtime** : Node.js 20 LTS (Docker image officielle `node:20-alpine`)
- **Build** : `next build` + output `standalone` (auto-optimisée)
- **Bundles** : 247 KB JS initial, 89 KB CSS (gzippés)
- **PWA** : Service Worker (`public/sw.js`), manifeste (`public/manifest.json`), icônes 192/512/maskable
- **i18n** : 4 langues (FR, Pular `ff`, Soussou `sus`, Malinké `man`)
- **Surface d'exposition publique** :
  - Pages : `/` (landing), `/offline`, `/reset-password`
  - API publiques : `/api/health`, `/api/auth/login`, `/api/auth/register`, `/api/auth/csrf`, `/api/auth/reset-password`, `/api/payments/webhook`, `/api/cron/notifications`
  - API authentifiées : `/api/auth/me`, `/api/auth/logout`, `/api/auth/change-password`, `/api/auth/2fa/*`, `/api/users/me`, `/api/exams/*`, `/api/courses`, `/api/questions`, `/api/bookings/*`, `/api/payments/*`, `/api/centres`, `/api/tarifs/current`, `/api/rgpd/*`, `/api/tts`
  - API admin : `/api/admin/*` (super-admin, administration, auto-ecole, centre-agree)

### 2.2 Base de données PostgreSQL 16

- **Hébergement** : Conakry DC (VM dédiée, 8 vCPU, 16 GB RAM)
- **Réplication** : streaming replication vers Kankan DC (DR, RPO ≤ 5 min)
- **Backups** : daily (full, 02:00 GMT), weekly (full + WAL, dimanche 03:00 GMT), rétention 30 jours
- **Tables critiques** (46 au total) :
  - `User` (~10 000 lignes attendues en année 1)
  - `ExamSession`, `Booking`, `ExamResult`
  - `Payment` (PII financière — ne stocke jamais le PIN)
  - `FraudAlert`, `AuditLog` (append-only)
  - `Notification`, `ScheduledNotification`
- **Chiffrement** : TLS obligatoire entre Next.js et PostgreSQL (`sslmode=require`)
- **Audit interne** : trigger PostgreSQL sur `User`, `Payment`, `Booking` (écrit dans `AuditLog`)

### 2.3 Cache Redis 7

- **Usage** :
  - Sessions JWT (clé `session:<userId>:<sessionId>`, TTL 24h)
  - Rate limiting (clé `ratelimit:<ip>:<route>`, fenêtre glissante 60s)
  - File de notifications (clé `notif:queue`, liste)
  - Locks distribués (clé `lock:booking:<sessionId>`, TTL 30s)
- **Persistance** : RDB toutes les 5 min (background save)
- **Chiffrement** : TLS optionnel (à activer en production)

### 2.4 Reverse proxy Nginx

- **Version** : Nginx 1.26.x (image officielle `nginx:alpine`)
- **Fonctions** :
  - Terminaison TLS secondaire (Caddy en edge)
  - WAF basique (limit_req, limit_conn,OWASP ModSecurity rules optionnelles)
  - Headers de sécurité (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
  - Compression gzip/brotli
  - Cache statique (assets Next.js `_next/static/*`, TTL 1 an)

### 2.5 Edge Caddy

- **Version** : Caddy 2.8.x
- **Fonctions** :
  - TLS automatique (Let's Encrypt / ACME)
  - HTTP/3 (QUIC)
  - HSTS (max-age 31536000, includeSubDomains, preload)
  - Redirection HTTP → HTTPS
  - Rate limit global (1000 req/min par IP)

## 3. Intégrations externes

### 3.1 Orange Money

- **Endpoint** : `https://api.orange.com/orange-money-webpay/dev/v1/webpayments` (prod) / `.../sandbox/...` (dev)
- **Authentification** : OAuth 2.0 client credentials (token TTL 1h, refresh automatique)
- **Webhooks entrants** : `POST /api/payments/webhook` signés HMAC-SHA256
- **Données échangées** : montant, numéro de téléphone (masqué), référence marchand, statut
- **Données NON échangées** : PIN, solde compte, identité bancaire

### 3.2 MTN MoMo

- **Endpoint** : `https://sandbox.momodeveloper.mtn.com/collection/v1_0/user/...` (sandbox) / `https://momodeveloper.mtn.com/...` (prod)
- **Authentification** : API Key + Subscription Key (header `Ocp-Apim-Subscription-Key`)
- **Webhooks entrants** : `POST /api/payments/webhook` signés HMAC-SHA512 (MTN)
- **Données échangées** : montant, numéro de téléphone, référence externe, statut

### 3.3 SMS Orange

- **Endpoint** : `https://api.orange.com/smsmessaging/v1/outbound/tel%3A%2B<sender>/requests`
- **Authentification** : OAuth 2.0 (token partagé avec Orange Money)
- **Usage** : convocations, rappels J-1, OTP 2FA (en remplacement de TOTP si 2FA SMS activé)
- **Volume estimé** : 200 SMS/jour (pic 500 lors des convocations massives)

### 3.4 SMTP (Postfix relay)

- **Endpoint** : `smtp://relay.conakry-dc.gn:587` (STARTTLS) ou `smtps://...:465` (TLS implicite)
- **Authentification** : login + password (env var `SMTP_USER` / `SMTP_PASSWORD`)
- **Usage** : emails administratifs (création de compte, reset password), RGPD (export, accusé de réception)
- **Volume estimé** : 50 emails/jour (essentiellement auto-écoles et admins)

### 3.5 Sentry (optionnel)

- **DSN** : `https://<project>@sentry.io/<project>` (URL HTTPS)
- **Données envoyées** : stack traces, breadcrumbs, tags (userId, role, route), user agent
- **PII filtering** : `beforeSend` hook filtre les champs `password`, `token`, `email` (si désactivé)

## 4. CI/CD pipeline

### 4.1 GitHub Actions

- **Workflow** : `.github/workflows/ci.yml`
- **Étapes** :
  1. Checkout (actions/checkout@v4)
  2. Setup Node 20 (actions/setup-node@v4)
  3. Install dépendances (`npm ci`)
  4. Lint (`npm run lint`)
  5. Type-check (`npx tsc --noEmit`)
  6. Tests unitaires (`npm test -- --ci --maxWorkers=2`)
  7. Build (`npm run build`)
  8. Scan SCA (`npm audit --audit-level=high`)
  9. Build Docker image (`docker build`)
  10. Push registry interne (`docker push registry.conakry-dc.gn/coderoute:<sha>`)

### 4.2 Déploiement

- **Stratégie** : rolling update (1 pod à la fois, health check 30s)
- **Rollback** : `kubectl rollout undo deployment/coderoute` (≤ 5 min)
- **Canary** : non implémenté en Sprint 11 (prévu Sprint 14)

## 5. Stockage et données

### 5.1 Volumes persistants

- `pgdata-conakry` : 100 GB SSD, données PostgreSQL Conakry
- `pgdata-kankan` : 100 GB SSD, données PostgreSQL Kankan (réplica)
- `redis-data` : 5 GB SSD, persistance RDB Redis
- `backups-conakry` : 500 GB HDD, backups quotidiens + hebdo
- `backups-kankan` : 500 GB HDD, réplication des backups Conakry

### 5.2 Médias statiques

- Images panneaux, scénarios, couvertures de cours : stockés dans `/public/signs/`, `/public/scenarios/`, `/public/courses/` (servis par Nginx, cache 1 an).
- Vidéos scénarios : `/public/videos/` (servis par Nginx, cache 1 an, range requests).
- Audio narrations : `/upload/audio/` (mp3, 50 fichiers de ~500 KB) — en production, migrés vers object storage (MinIO) en Sprint 12.

### 5.3 Logs

- **Application** : `console.log` capturé par Docker, envoyé à Loki (Grafana stack).
- **Accès Nginx** : format JSON, envoyé à Loki.
- **Audit PostgreSQL** : table `AuditLog` (append-only) + dump quotidien.
- **Rétention** : 90 jours en ligne, 1 an archivé (compression gzip).

## 6. Secrets et configuration

### 6.1 Secret manager

- **Dev** : fichiers `.env` (gitignored, généré par `scripts/generate-secrets.sh`).
- **Staging/Prod** : variables d'environnement Docker, injectées via `docker-compose.production.yml` et un fichier `.env.production` non commité, stocké chiffré sur la VM (âge du sysadmin).

### 6.2 Inventaire (sans valeurs)

| Secret | Usage | Rotation |
|---|---|---|
| `SESSION_SECRET` | Signature JWT sessions (32+ chars) | Annuelle |
| `JWT_SECRET` | Signature access tokens (32+ chars) | Annuelle |
| `CSRF_SECRET` | Signature tokens CSRF (32+ chars) | Annuelle |
| `CRON_SECRET` | Auth header `/api/cron/*` (32+ chars) | Trimestrielle |
| `POSTGRES_PASSWORD` | User PostgreSQL applicatif (32 chars) | Semestrielle |
| `POSTGRES_REPL_PASSWORD` | User réplication (32 chars) | Semestrielle |
| `REDIS_PASSWORD` | Auth Redis (32 chars) | Semestrielle |
| `WEBHOOK_ORANGE_MONEY_SECRET` | HMAC webhooks Orange (32+ chars) | Annuelle |
| `WEBHOOK_MTN_MONEY_SECRET` | HMAC webhooks MTN (32+ chars) | Annuelle |
| `WEBHOOK_CELCOM_MONEY_SECRET` | HMAC webhooks Celcom (32+ chars) | Annuelle |
| `WEBHOOK_ORANGE_SMS_SECRET` | HMAC webhooks SMS Orange (32+ chars) | Annuelle |
| `ORANGE_CLIENT_ID` + `_SECRET` | OAuth Orange APIs | Annuelle |
| `MOMO_API_KEY` + `SUBSCRIPTION_KEY` | API MTN MoMo | Annuelle |
| `SMTP_USER` + `SMTP_PASSWORD` | Auth SMTP relay | Semestrielle |
| `SENTRY_DSN` | Sentry project (URL publique) | N/A (DSN est public) |
| `BACKUP_ENCRYPTION_KEY` | Chiffrement backups (32+ chars) | Annuelle + re-chiffrement |
| `SEED_*_PASSWORD` | Mots de passe seed (dev/staging only) | N/A en prod |
| `E2E_*_PASSWORD` | Mots de passe tests E2E | N/A en prod |
| `BOOTSTRAP_ADMIN_*` | Admin initial (bootstrap only) | Révoqué après 1er login |
| `DPO_NAME`, `DPO_EMAIL`, `DPO_PHONE` | Contact DPO (RGPD) | À jour |
| `AGPD_NOTIFICATION_EMAIL` | Email AGPD pour notification 72h | À jour |

## 7. Points d'audit prioritaires

L'auditeur doit porter une attention particulière aux points suivants, identifiés comme à risque par l'équipe interne :

1. **Webhooks Mobile Money** (`/api/payments/webhook`) — vulnérabilité potentielle : bypass HMAC, replay attack, race condition double-paiement.
2. **Réservation d'examen** (`/api/bookings`) — vulnérabilité potentielle : double réservation, contournement du paiement, manipulation du tarif.
3. **Export RGPD** (`/api/rgpd/export`) — vulnérabilité potentielle : fuite de données d'un autre utilisateur, déni de service (génération massive).
4. **Authentification 2FA** (`/api/auth/2fa/*`) — vulnérabilité potentielle : bypass du 2FA, brute force du code TOTP (6 digits).
5. **Audit log** (`src/lib/audit-log.ts`) — vulnérabilité potentielle : bypass de l'audit, modification de logs (append-only à vérifier).
6. **Rate limiting** (`src/lib/rate-limit.ts`) — vulnérabilité potentielle : bypass via rotation IP, contournement par header X-Forwarded-For.
7. **Permissions administrateur** (`/api/admin/*`) — vulnérabilité potentielle : escalade de privilèges, IDOR sur `/api/admin/users/[id]`.
8. **Cron notifications** (`/api/cron/notifications`) — vulnérabilité potentielle : exécution non autorisée si `CRON_SECRET` divulgué.

## 8. Métriques de sécurité existantes

L'équipe interne a déjà mis en place les métriques suivantes (à valider par l'auditeur) :

- **0 vulnérabilité `npm audit`** niveau `high` ou `critical` (à la date d'audit).
- **48/48 contrôles automatisés** passent (`scripts/security-audit.mjs`).
- **420 tests Jest** passent (couverture 73% sur `src/lib/`).
- **11 tests Playwright E2E** passent (smoke, auth, exam, payment, rgpd).
- **AIPD complet** (~12 000 mots, 15 risques, 18 mesures) — `docs/AIPD.md`.
- **Registre des traitements** : 12 traitements documentés — `docs/REGISTRE-TRAITEMENTS.md`.
- **66 tests Jest RGPD** dans `src/lib/__tests__/rgpd.test.ts`.
- **Formations** : 3 guides (~25 500 mots) pour admin, ops, candidat.
- **Backups chiffrés** : test de restauration mensuel (calendarisé).

## 9. Conclusion

Ce périmètre technique constitue la base de l'audit. Tout écart entre la description ci-dessus et la réalité observée par l'auditeur doit être signalé dans le rapport final, section « Constats de périmètre ».
