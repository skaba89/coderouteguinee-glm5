# CodeRoute Guinée — Guide de Déploiement Production

> Plateforme nationale digitale pour l'examen théorique du permis de conduire en République de Guinée

## Table des matières

1. [Pré-requis](#pré-requis)
2. [Configuration de l'environnement](#configuration-de-lenvironnement)
3. [Déploiement avec PostgreSQL](#déploiement-avec-postgresql)
4. [Déploiement avec Docker](#déploiement-avec-docker)
5. [Configuration des secrets](#configuration-des-secrets)
6. [Intégration Mobile Money](#intégration-mobile-money)
7. [Notifications Email/SMS](#notifications-emailsms)
8. [Sauvegardes automatiques](#sauvegardes-automatiques)
9. [Surveillance et logs](#surveillance-et-logs)
10. [Procédure de mise à jour](#procédure-de-mise-à-jour)

---

## Pré-requis

### Serveur de production

- **OS**: Ubuntu 22.04 LTS ou Debian 12
- **RAM**: minimum 4 GB (8 GB recommandé)
- **CPU**: 2 vCPU minimum (4 recommandé)
- **Stockage**: 40 GB SSD minimum
- **Node.js**: 20.x LTS
- **PostgreSQL**: 15 ou supérieur (recommandé) ou SQLite pour petits déploiements
- **Nginx/Caddy**: reverse-proxy avec TLS

### Logiciels requis

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL 15
sudo apt-get install -y postgresql postgresql-contrib

# Outils
sudo apt-get install -y git build-essential sqlite3
```

---

## Configuration de l'environnement

### 1. Cloner le projet

```bash
git clone https://github.com/votre-org/coderoute-guinee.git
cd coderoute-guinee
```

### 2. Installer les dépendances

```bash
npm ci
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet:

```bash
# ─── Base de données ──────────────────────────────────────
# Pour PostgreSQL en production:
DATABASE_URL=postgresql://coderoute:STRONG_PASSWORD@localhost:5432/coderoute?schema=public

# Pour SQLite en développement:
# DATABASE_URL=file:./db/custom.db

# ─── Sécurité session ─────────────────────────────────────
# Générez avec: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
SESSION_SECRET=your_64_byte_hex_secret_here

# ─── Sécurité CSRF ────────────────────────────────────────
# Générez avec: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
CSRF_SECRET=your_64_byte_hex_csrf_secret_here

# ─── Mots de passe seed (optionnel) ──────────────────────
# Si non définis, des mots de passe aléatoires seront générés
SEED_ADMIN_PASSWORD=StrongAdminPass2024!
SEED_INSPECTOR_PASSWORD=StrongInspectPass2024!
SEED_CENTRE_PASSWORD=StrongCentrePass2024!
SEED_CANDIDAT_PASSWORD=StrongCandidatPass2024!

# ─── Email (SMTP) ─────────────────────────────────────────
SMTP_HOST=smtp.votre-fournisseur.gn
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@coderoute-gn.org
SMTP_PASS=your_smtp_password
SMTP_FROM_NAME=CodeRoute Guinée
SMTP_FROM_EMAIL=noreply@coderoute-gn.org

# ─── SMS ──────────────────────────────────────────────────
SMS_PROVIDER=orange  # orange | mtn | celcom | console
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=CodeRoute
SMS_API_URL=https://api.sms-provider.com/send

# ─── Mobile Money (voir docs/MOBILE-MONEY-SETUP.md) ──────
ORANGE_MONEY_API_URL=https://api.orange.com/om/equity/v1
ORANGE_MONEY_API_KEY=your_orange_api_key
ORANGE_MONEY_WEBHOOK_SECRET=your_orange_webhook_secret

MTN_MONEY_API_URL=https://ericssonbasicapi2.azure-api.net/collection/v1_2
MTN_MONEY_API_KEY=your_mtn_api_key
MTN_MONEY_WEBHOOK_SECRET=your_mtn_webhook_secret

CELCOM_MONEY_API_URL=https://api.celcom-gn.com/payment/v1
CELCOM_MONEY_API_KEY=your_celcom_api_key
CELCOM_MONEY_WEBHOOK_SECRET=your_celcom_webhook_secret

# ─── Application ──────────────────────────────────────────
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://coderoute-gn.org
```

---

## Déploiement avec PostgreSQL

### 1. Créer la base de données

```bash
sudo -u postgres psql <<EOF
CREATE USER coderoute WITH PASSWORD 'STRONG_PASSWORD';
CREATE DATABASE coderoute OWNER coderoute;
GRANT ALL PRIVILEGES ON DATABASE coderoute TO coderoute;
\q
EOF
```

### 2. Basculer vers PostgreSQL

```bash
npm run db:use-postgres
```

### 3. Initialiser le schéma

```bash
npx prisma generate
npx prisma migrate deploy
```

### 4. Peupler la base (seed)

```bash
npm run db:seed
```

### 5. Construire l'application

```bash
npm run build
```

### 6. Démarrer le serveur

```bash
npm run start
```

L'application sera disponible sur `http://localhost:3000`.

---

## Déploiement avec Docker

### 1. Créer le Dockerfile

```dockerfile
FROM node:20-slim

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci

# Générer le client Prisma
RUN npx prisma generate

# Copier le code source
COPY . .

# Construire l'application
RUN npm run build

# Exposer le port
EXPOSE 3000

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Démarrer l'application
CMD ["npm", "start"]
```

### 2. Créer le docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - db
    restart: always

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: coderoute
      POSTGRES_PASSWORD: STRONG_PASSWORD
      POSTGRES_DB: coderoute
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - app
    restart: always

volumes:
  postgres_data:
```

### 3. Démarrer

```bash
docker-compose up -d
```

---

## Configuration des secrets

### Génération des secrets

```bash
# Session secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# CSRF secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Webhook secrets (32 bytes par provider)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Rotation des secrets

**IMPORTANT**: Si vous devez changer `SESSION_SECRET`, toutes les sessions utilisateur seront invalidées. Planifiez une maintenance.

```bash
# 1. Prévenir les utilisateurs
# 2. Générer un nouveau secret
NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# 3. Mettre à jour .env
sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=$NEW_SECRET|" .env

# 4. Redémarrer l'application
sudo systemctl restart coderoute
```

---

## Intégration Mobile Money

Voir le guide détaillé: [docs/MOBILE-MONEY-SETUP.md](./docs/MOBILE-MONEY-SETUP.md)

### Étapes résumées

1. **Orange Money**: S'inscrire sur https://developer.orange.com
2. **MTN MoMo**: S'inscrire sur https://momodeveloper.mtn.com
3. **Celcom Money**: Contacter Celcom Guinée business

Configurez les webhooks vers: `https://votre-domaine.gn/api/payments/webhook`

---

## Notifications Email/SMS

### Email (SMTP)

Le système supporte n'importe quel fournisseur SMTP. Recommandations pour la Guinée:

- **Gmail**: `smtp.gmail.com:587` (avec mot de passe d'application)
- **Outlook**: `smtp.office365.com:587`
- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`

### SMS

Pour l'envoi de SMS en Guinée, contactez les opérateurs locaux:

- **Orange Business**: API SMS Orange Guinée
- **MTN Business**: API SMS MTN Guinée
- **Fournisseurs internationaux**: Twilio, Vonage, Africa's Talking

En mode développement (`SMS_PROVIDER=console`), les SMS sont affichés dans la console.

---

## Sauvegardes automatiques

### Sauvegarde manuelle

```bash
npm run backup
```

### Sauvegarde automatique (cron)

Ajoutez à `/etc/crontab`:

```cron
# Sauvegarde quotidienne à 02:00
0 2 * * * coderoute cd /opt/coderoute && npm run backup >> /var/log/coderoute-backup.log 2>&1

# Sauvegarde hebdomadaire complète (dimanche à 01:00)
0 1 * * 0 coderoute cd /opt/coderoute && npm run backup >> /var/log/coderoute-backup-weekly.log 2>&1
```

### Restauration

```bash
# Décompresser la sauvegarde
gunzip backups/coderoute_backup_YYYYMMDD_HHMMSS.db.gz

# Restaurer (SQLite)
sqlite3 db/custom.db ".restore backups/coderoute_backup_YYYYMMDD_HHMMSS.db"

# Pour PostgreSQL:
# psql -U coderoute -d coderoute < backup.sql
```

### Sauvegarde offsite

Recommandé: synchroniser les sauvegardes vers un stockage objet (S3, Backblaze B2):

```bash
# Exemple avec AWS CLI
aws s3 sync backups/ s3://coderoute-backups/$(date +%Y/%m/%d)/ --delete
```

---

## Surveillance et logs

### Logs applicatifs

Les logs sont écrits dans:
- `dev.log` — serveur de développement
- `server.log` — serveur de production
- Console systemd: `journalctl -u coderoute -f`

### Logs d'audit

Tous les événements de sécurité sont tracés dans la table `AuditLog`. Consultez-les via:
- Dashboard admin → Onglet "Journal d'audit"
- API: `GET /api/admin/audit-logs`

### Métriques recommandées

Surveillez ces métriques en production:

1. **Performance**: temps de réponse API, temps de chargement pages
2. **Erreurs**: taux d'erreur 5xx, exceptions non gérées
3. **Sécurité**: tentatives de connexion échouées, alertes CSRF, rate limit dépassé
4. **Business**: nombre d'inscriptions, paiements, examens passés

### Outils recommandés

- **Sentry**: tracking d'erreurs (https://sentry.io)
- **Datadog**: monitoring complet
- **PM2**: gestion de processus Node.js
- **Uptime Robot**: surveillance de disponibilité

---

## Procédure de mise à jour

### 1. Sauvegarder

```bash
npm run backup
```

### 2. Télécharger les nouveautés

```bash
git fetch origin
git checkout main
git pull origin main
```

### 3. Installer les dépendances

```bash
npm ci
```

### 4. Migrer la base de données

```bash
npx prisma migrate deploy
```

### 5. Reconstruire

```bash
npm run build
```

### 6. Redémarrer

```bash
sudo systemctl restart coderoute
```

### 7. Vérifier

```bash
curl -f https://votre-domaine.gn/api || echo "Service DOWN"
journalctl -u coderoute -n 50 --no-pager
```

---

## Rollback (retour arrière)

En cas de problème après mise à jour:

```bash
# 1. Stopper le service
sudo systemctl stop coderoute

# 2. Revenir à la version précédente
git checkout <previous-commit-hash>

# 3. Restaurer la base de données
gunzip backups/coderoute_backup_YYYYMMDD_HHMMSS.db.gz
sqlite3 db/custom.db ".restore backups/coderoute_backup_YYYYMMDD_HHMMSS.db"

# 4. Réinstaller les dépendances
npm ci

# 5. Reconstruire et redémarrer
npm run build
sudo systemctl start coderoute
```

---

## Contact et support

- **Ministère des Transports — République de Guinée**
- **Équipe technique CodeRoute Guinée**
- **Email**: support@coderoute-gn.org
- **Téléphone**: +224 XXX XX XX XX

---

## Checklist de déploiement production

- [ ] Serveur configuré (Node.js 20, PostgreSQL 15)
- [ ] Variables d'environnement définies (.env)
- [ ] `SESSION_SECRET` généré (64 bytes)
- [ ] `CSRF_SECRET` généré (64 bytes)
- [ ] Base de données créée et migrée
- [ ] Seed exécuté avec mots de passe forts
- [ ] HTTPS configuré (Let's Encrypt ou certificat acheté)
- [ ] Reverse-proxy (Nginx/Caddy) configuré
- [ ] Pare-feu configuré (ufw) — ports 80, 443, 22 uniquement
- [ ] Mobile Money: APIs configurées pour les 3 providers
- [ ] Mobile Money: Webhooks configurés et testés
- [ ] SMTP configuré et testé
- [ ] SMS provider configuré
- [ ] Sauvegardes automatiques (cron)
- [ ] Sauvegardes offsite (S3 ou équivalent)
- [ ] Surveillance uptime (Uptime Robot ou équivalent)
- [ ] Tracking d'erreurs (Sentry ou équivalent)
- [ ] Test de bout en bout effectué (inscription → paiement → convocation)
- [ ] Test de restauration de sauvegarde effectué
- [ ] Documentation interne préparée pour l'équipe ops
