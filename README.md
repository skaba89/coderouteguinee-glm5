# CodeRoute Guinée

Plateforme numérique officielle pour l'examen du permis de conduire en République de Guinée.

## Aperçu

**CodeRoute Guinée** est une application web progressive (PWA) développée pour la Direction Nationale des Transports Terrestres (DNTT) afin de digitaliser l'inscription, le paiement et la passation de l'examen théorique du code de la route.

### Caractéristiques principales

- **Inscription en ligne** des candidats avec génération d'un numéro unique `GN-CODE-AAAA-XXXXXX`
- **Paiement Mobile Money** intégré (Orange Money, MTN MoMo, Celcom Money) avec webhooks HMAC signés
- **Examen théorique** : 40 questions à choix multiples en 30 minutes, seuil de réussite 35/40
- **4 langues** : français, Pular (ff), Soussou (sus), Malinké (man)
- **5 rôles** : candidat, auto-école, centre agréé, administration, super-administration
- **Mode hors ligne** (PWA) : consultation des cours et entraînement sans connexion
- **Conformité RGPD** : Loi L/2022/018/AN de Guinée (voir `docs/`)

## Stack technique

- **Frontend** : Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend** : API Routes Next.js, Prisma ORM, PostgreSQL 16 (prod) / SQLite (dev)
- **Sécurité** : argon2id, JWT httpOnly cookies, 2FA TOTP, CSRF HMAC, rate limiting Redis
- **Paiement** : Orange Money, MTN MoMo, Celcom Money (webhooks HMAC-SHA256)
- **Monitoring** : Sentry (optionnel), Prometheus + Grafana
- **Infrastructure** : Docker (non-root), Nginx (TLS 1.2+), data centers Conakry (primaire) + Kankan (PRA)

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Copier le template d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs (DATABASE_URL, secrets, etc.)

# 3. Générer les secrets forts
bash scripts/generate-secrets.sh >> .env

# 4. Initialiser la base de données
npm run db:generate
npm run db:push
npm run db:seed

# 5. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Tests

```bash
# Tests unitaires (Jest)
npm test

# Tests end-to-end (Playwright)
npx playwright install chromium
npm run test:e2e

# Tests de charge (k6)
k6 run --vus 50 --duration 30s load-tests/health.js
bash load-tests/run-all.sh --smoke
```

Voir :
- `e2e/README.md` — Guide des tests E2E
- `load-tests/README.md` — Guide des tests de charge

## Sécurité

```bash
# Audit de sécurité automatisé (7 catégories, 44+ vérifications)
node scripts/security-audit.mjs

# Checklist pré-déploiement (17 vérifications)
bash scripts/pre-deploy-checklist.sh .env.production
```

Voir :
- `docs/AIPD.md` — Analyse d'Impact sur la Protection des Données
- `docs/POLITIQUE-CONFIDENTIALITE.md` — Politique de confidentialité RGPD
- `docs/MENTIONS-LEGALES.md` — Mentions légales
- `docs/POLITIQUE-COOKIES.md` — Politique de cookies

## Déploiement

```bash
# 1. Construire l'image Docker
docker build -t coderoute-gn:latest .

# 2. Démarrer la stack complète (app + db + nginx + backup)
docker compose -f docker-compose.production.yml up -d

# 3. Créer le premier super-admin
BOOTSTRAP_ADMIN_EMAIL=admin@coderoute-gn.org \
BOOTSTRAP_ADMIN_PASSWORD=$(openssl rand -base64 24) \
npx tsx scripts/bootstrap-admin.ts
```

Voir :
- `docs/DEPLOYMENT.md` — Guide de déploiement détaillé
- `docker-compose.production.yml` — Stack Docker de production
- `Dockerfile` — Image multi-stage (non-root, tini PID 1)

## Documentation

| Document | Description |
|---|---|
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Guide de déploiement en production |
| [`docs/MOBILE-MONEY-SETUP.md`](docs/MOBILE-MONEY-SETUP.md) | Configuration Orange Money / MTN MoMo |
| [`docs/ORANGE_SMS_SETUP.md`](docs/ORANGE_SMS_SETUP.md) | Configuration SMS Orange |
| [`docs/POSTGRESQL_MIGRATION.md`](docs/POSTGRESQL_MIGRATION.md) | Migration SQLite → PostgreSQL |
| [`docs/MENTIONS-LEGALES.md`](docs/MENTIONS-LEGALES.md) | Mentions légales du service |
| [`docs/POLITIQUE-CONFIDENTIALITE.md`](docs/POLITIQUE-CONFIDENTIALITE.md) | Politique RGPD (Loi L/2022/018/AN) |
| [`docs/POLITIQUE-COOKIES.md`](docs/POLITIQUE-COOKIES.md) | Politique de cookies |
| [`docs/AIPD.md`](docs/AIPD.md) | Analyse d'Impact Protection des Données |

## Roadmap

- ✅ **Sprint 1** — Sécurité & infrastructure minimale
- ✅ **Sprint 2** — Intégrations réelles (SMTP, Sentry, HMAC, health)
- ✅ **Sprint 3** — Tests & conformité (Playwright, k6, RGPD, audit)
- 🚧 **Sprint 4** — Pilote DNTT (centre de Conakry, ~200 candidats)
- 📋 **Sprint 5** — Déploiement national (tous centres agréés)

## Licence

© Direction Nationale des Transports Terrestres (DNTT), République de Guinée. Tous droits réservés.

La base de données des questions d'examen est protégée par la Loi L/2017/039/AN sur la propriété intellectuelle. Le code source est protégé par le droit d'auteur guinéen. Contact : `contact@transport.gov.gn`.

## Contact

- **DNTT** : BP 1234, Kaloum, Conakry, République de Guinée
- **Email général** : `contact@transport.gov.gn`
- **DPO (RGPD)** : `dpo@transport.gov.gn`
- **Réclamations** : `reclamation@transport.gov.gn`
- **Téléphone** : +224 620 00 00 00
