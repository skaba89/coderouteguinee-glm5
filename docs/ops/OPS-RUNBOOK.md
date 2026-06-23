# CodeRoute Guinée — Runbook Ops (Sprint 12)

Ce runbook décrit les procédures opérationnelles pour exploiter la plateforme CodeRoute Guinée en production et en staging. Il est destiné à l'équipe ops (2 opérateurs formés, un par DC) et au Tech Lead.

## 1. Architecture cible

```
                    ┌─────────────────────────┐
                    │  Internet public         │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  Caddy (TLS, HSTS)       │
                    │  Edge reverse-proxy      │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  Nginx (WAF, rate limit) │
                    └────────────┬─────────────┘
                                 │
        ┌────────────────────────▼────────────────────────┐
        │  Next.js 14 standalone (Docker)                  │
        │  ├─ /api/* routes                                 │
        │  ├─ /api/health (liveness)                       │
        │  └─ /api/metrics (Prometheus)                    │
        └─────┬─────────────┬──────────────┬───────────────┘
              │             │              │
        ┌─────▼─────┐ ┌────▼────┐ ┌───────▼────────┐
        │PostgreSQL │ │  Redis  │ │  Prometheus    │
        │  16       │ │   7     │ │  + Grafana     │
        │Conakry DC │ │sessions │ │  + Loki        │
        └─────┬─────┘ └─────────┘ │  + Alertmgr    │
              │                   └────────────────┘
        ┌─────▼────────────┐
        │  Kankan DC (DR)  │
        │  Postgres réplica│
        └──────────────────┘
```

## 2. Procédures quotidiennes (daily ops)

### 2.1 Vérification matinale (08h00 GMT)

Le premier opérateur du jour doit vérifier :

1. **Page Grafana "Infrastructure"** : tous les services UP, jauges dans le vert.
2. **Page Grafana "Application"** : error rate < 1%, p95 < 1s.
3. **Page Grafana "Business"** : pas de chute anormale des bookings / payments.
4. **Canal Slack `#alerts-critical`** : pas d'alerte non acquittée.
5. **Sentry** : pas d'erreur nouvelle signalée dans la nuit.
6. **Email backup** : le backup de 02h00 a réussi (vérifier le log email).
7. **Disponibilité publique** : `curl https://coderoute.gov.gn/api/health` retourne 200.

Si un de ces points est en échec, déclencher la procédure d'incident correspondante (section 4).

### 2.2 Surveillance continue (journee)

L'opérateur de jour surveille :

- **Slack `#alerts-warning`** : traiter dans l'heure.
- **Slack `#alerts-critical`** : traiter immédiatement (SMS déclenché).
- **Grafana "Application"** : surveiller les pics de latence ou d'erreur.
- **Grafana "Business"** : surveiller les échecs de paiement (alerte auto à > 10%).

### 2.3 Vérification du soir (18h00 GMT)

- Confirmer que tous les candidats programmés ont pu passer leur examen (compare bookings vs exam results).
- Vérifier les backups (full + WAL archive) sur Conakry ET Kankan.
- Préparer le handover à l'opérateur de garde (Slack `#ops-handover`).

## 3. Procédures hebdomadaires

### 3.1 Lundi matin — Revue hebdomadaire

- **Revue des alertes** : combien d'alertes warning/critical déclenchées la semaine passée ? Tendances ?
- **Revue des capacités** : disk space, DB size, Redis memory — anticiper la croissance.
- **Test de restore backup** : exécuter `scripts/test-backup-restore.sh` sur un staging.
- **Mise à jour des dépendances** : `npm audit`, `npm outdated`, planifier les mises à jour sécurité.
- **Revue des logs Sentry** : erreurs récurrentes à corriger.

### 3.2 Vendredi soir — Préparation week-end

- Vérifier que l'opérateur de garde est identifié et joinable.
- Préparer le canal `#incident-response` en cas d'alerte critique.
- Confirmer qu'aucun déploiement n'est planifié le week-end (freeze deploys vendredi 17h → lundi 9h).

## 4. Procédures d'incident

### 4.1 App down

**Symptôme** : `curl https://coderoute.gov.gn/api/health` retourne 503 ou timeout. Alerte `AppDown` déclenchée.

**Diagnostic** :
1. SSH sur `app-prod-1.conakry-dc.gn`.
2. `docker ps` : vérifier que `coderoute-app` est UP.
3. Si DOWN : `docker logs coderoute-app --tail 100` pour identifier la cause (OOM, crash, config).
4. Si OOM : augmenter la limite mémoire dans `docker-compose.production.yml` et redémarrer.
5. Si config erronée : corriger `.env.production`, redémarrer avec `docker compose up -d app`.

**Rollback** :
```bash
# Identifier la dernière version stable
docker images coderoute-guinee --format "{{.Tag}} {{.CreatedAt}}" | head -5
# Redémarrer sur la version précédente
docker compose -f docker-compose.production.yml up -d app --no-deps --force-recreate
```

**Communication** : si downtime > 5 min, notifier `#incident-response` et le sponsor DNTT.

### 4.2 High error rate

**Symptôme** : Alerte `AppHighErrorRate` (5xx > 5%). Grafana "Application" montre une hausse.

**Diagnostic** :
1. **Sentry** : identifier l'erreur la plus fréquente.
2. **Grafana Loki** : filtrer `{container="coderoute-app"} |= "ERROR"` pour les 30 dernières minutes.
3. **PostgreSQL** : `SELECT * FROM pg_stat_activity WHERE state = 'active'` — vérifier les requêtes lentes.
4. **Redis** : `redis-cli INFO clients` — vérifier le nombre de connexions.

**Actions** :
- Si une route spécifique est en erreur : désactiver temporairement la route (commenter dans Next.js + redéployer).
- Si DB saturée : augmenter `max_connections` temporairement, planifier un scale-up.
- Si Redis saturé : purger les clés non critiques (`redis-cli FLUSHDB` sur la DB des rate limits uniquement).

### 4.3 Postgres down

**Symptôme** : Alerte `PostgresDown`. App retourne 500 sur toutes les routes DB.

**Diagnostic** :
1. SSH sur `db-prod-1.conakry-dc.gn`.
2. `docker ps | grep postgres` — vérifier que le conteneur est UP.
3. Si DOWN : `docker logs coderoute-db --tail 100`.
4. Causes possibles : disk full (vérifier `df -h`), OOM, corruption WAL.

**Actions** :
- Si disk full : purger les anciens WAL (`pg_archivecleanup`), supprimer les vieux backups.
- Si OOM : redémarrer avec plus de RAM, ajuster `shared_buffers`.
- Si corruption : basculer sur le réplica Kankan (section 4.4).

### 4.4 Bascule DR (Conakry → Kankan)

**Procédure exceptionnelle** — seulement si Conakry est injoignable pour > 30 min.

1. **Vérifier que le réplica Kankan est synchronisé** :
   ```bash
   ssh db-prod-2.kankan-dc.gn
   sudo -u postgres psql -c "SELECT pg_is_in_recovery();"
   # Doit retourner 't' (en mode réplica)
   sudo -u postgres psql -c "SELECT * FROM pg_stat_replication;"
   ```

2. **Promouvoir Kankan en primaire** :
   ```bash
   sudo -u postgres pg_ctl promote -D /var/lib/postgresql/data
   ```

3. **Mettre à jour la configuration de l'app** :
   - Éditer `.env.production` sur `app-prod-1` : `DATABASE_URL=postgresql://...@db-prod-2.kankan-dc.gn:5432/...`
   - Redémarrer l'app : `docker compose restart app`

4. **Vérifier** : `curl https://coderoute.gov.gn/api/health` doit retourner 200.

5. **Notifier le DPO** : la bascule DR est un événement à documenter (registre des traitements).

6. **Planifier la reconstruction de Conakry** : une fois Conakry de retour, le remettre en réplica de Kankan (rôles inversés temporairement).

### 4.5 Payment failures

**Symptôme** : Alerte `PaymentFailureRateHigh` (> 10% sur 15 min).

**Diagnostic** :
1. **Grafana "Business"** : identifier le provider (Orange Money vs MTN MoMo).
2. **Logs webhooks** : `docker logs coderoute-app --tail 200 | grep "webhook"`.
3. **Statut opérateur** : vérifier les pages de statut Orange / MTN (si elles existent).
4. **Connectivité API opérateur** :
   ```bash
   curl -I https://api.orange.com/orange-money-webpay/dev/v1/webpayments
   curl -I https://momodeveloper.mtn.com/collection/v1_0/user
   ```

**Actions** :
- Si API opérateur down : basculer en mode "paiement différé" (candidats peuvent réserver, paiement à valider manuellement).
- Si webhook secret invalide : vérifier `WEBHOOK_ORANGE_MONEY_SECRET` dans `.env.production`, comparer avec la console opérateur.
- Si burst d'erreurs 5xx sur `/api/payments/webhook` : vérifier le code d'erreur, corriger le bug, redéployer.

**Communication** : notifier les auto-écoles et centres que les paiements peuvent être retardés. Prévoir un mode exceptionnel (validation manuelle).

### 4.6 Backup missing

**Symptôme** : Alerte `NoBackupsFor24h`.

**Diagnostic** :
1. SSH sur le conteneur backup : `docker exec -it coderoute-backup sh`.
2. Vérifier le cron : `crontab -l`.
3. Lancer manuellement : `/backup-db.sh` et observer les erreurs.
4. Causes possibles : DB injoignable, disque backup plein, clé GPG expirée.

**Actions** :
- Lancer un backup manuel immédiatement après résolution.
- Vérifier les backups restants (7 derniers jours minimum).
- Si tous les backups récents sont corrompus : déclencher la procédure d'incident majeur (notification AGPD).

### 4.7 Redis down

**Symptôme** : Alerte `RedisDown`. Sessions utilisateurs invalidées, rate limiting désactivé.

**Actions** :
1. SSH sur `redis-prod-1.conakry-dc.gn`.
2. `docker restart coderoute-redis`.
3. Si Redis ne redémarre pas : vérifier `docker logs coderoute-redis`.
4. Si corruption : restaurer depuis le dernier RDB (`/data/dump.rdb`), ou recréer vide (les sessions seront perdues, utilisateurs devront se reconnecter).

**Impact** : tous les utilisateurs connectés doivent se reconnecter. Pas de perte de données métier (DB PostgreSQL intacte).

## 5. Procédures de déploiement

### 5.1 Déploiement standard (rolling)

```bash
# 1. Pre-deploy checklist
bash scripts/pre-deploy-checklist.sh

# 2. Build nouvelle image Docker
docker build -t coderoute-guinee:$(git rev-parse --short HEAD) .

# 3. Push registry interne
docker push registry.conakry-dc.gn/coderoute-guinee:$(git rev-parse --short HEAD)

# 4. Déploiement rolling
docker compose -f docker-compose.production.yml up -d app --no-deps

# 5. Vérifier santé
curl https://coderoute.gov.gn/api/health
curl https://coderoute.gov.gn/api/metrics | head -10

# 6. Surveiller 15 min
# - Grafana error rate
# - Sentry nouvelles erreurs
# - Slack #alerts-critical
```

### 5.2 Rollback

```bash
# Identifier la dernière version stable
docker images registry.conakry-dc.gn/coderoute-guinee --format "{{.Tag}} {{.CreatedAt}}" | head -5

# Éditer docker-compose.production.yml pour pointer sur l'ancien tag
# Puis :
docker compose -f docker-compose.production.yml up -d app --no-deps --force-recreate
```

### 5.3 Migration base de données

```bash
# 1. Backup avant migration (obligatoire)
bash scripts/backup-db.sh

# 2. Tester la migration sur staging
npx prisma migrate dev --name <description>

# 3. Appliquer sur production
DATABASE_URL=postgresql://... npx prisma migrate deploy

# 4. Vérifier
npx prisma db pull --print | head -50

# 5. Si rollback nécessaire : restaurer le backup
# (à n'utiliser qu'en cas de corruption avérée)
```

## 6. Procédures de maintenance

### 6.1 Maintenance planifiée (annonce J-7)

1. **J-7** : annoncer la maintenance par email à tous les centres et auto-écoles.
2. **J-1** : rappel SMS aux candidats ayant un examen le jour J.
3. **Jour J** :
   - 06h00 : mise en maintenance (page statique sur Nginx).
   - 06h05 : exécuter les tâches de maintenance (migration, mise à jour).
   - 07h00 : tests de non-régression (Jest + Playwright sur staging).
   - 07h30 : lever la maintenance.
   - 08h00 : surveillance renforcée 2h.
4. **J+1** : compte-rendu de maintenance dans `#ops-handover`.

### 6.2 Rotation des secrets (trimestrielle)

```bash
# 1. Générer les nouveaux secrets
bash scripts/generate-secrets.sh --rotate-all > .env.production.new

# 2. Vérifier manuellement les valeurs
diff .env.production .env.production.new

# 3. Déployer en rolling (redémarre l'app, pas d'indisponibilité)
cp .env.production.new .env.production
docker compose -f docker-compose.production.yml up -d app --no-deps

# 4. Vérifier la santé
curl https://coderoute.gov.gn/api/health

# 5. Archiver l'ancien .env.production chiffré (30 jours pour audit)
gpg --encrypt --recipient rssi@coderoute-gn.org .env.production.old
mv .env.production.old.gpg /var/backups/secrets/$(date +%Y%m%d)-env-production.gpg
shred -u .env.production.old

# 6. Documenter dans le registre des rotations
echo "$(date) — Rotation trimestrielle complète" >> docs/audit-externe/secret-rotations.log
```

### 6.3 Test de restore backup mensuel

```bash
# À exécuter depuis un serveur séparé (pas la prod)
BACKUP_ENCRYPTION_KEY=xxx \
BACKUP_DIR=/var/backups/coderoute \
SMTP_HOST=smtp.conakry-dc.gn \
bash scripts/test-backup-restore.sh
```

Le script :
1. Sélectionne le dernier backup (≤ 7 jours).
2. Le déchiffre.
3. Le restaure sur un PostgreSQL temporaire.
4. Vérifie l'intégrité (14 tables attendues, hachage argon2id, pas de paiements orphelins).
5. Envoie un rapport par email + Slack.

## 7. Monitoring & alerting

### 7.1 Dashboards Grafana

3 dashboards disponibles sur `https://grafana.coderoute-gn.org` :

| Dashboard | UID | Contenu |
|---|---|---|
| Application | `coderoute-app` | Req/s, error rate, p95/p99, exam submissions, payment webhooks, app logs |
| Business | `coderoute-business` | KPIs métier : candidats, bookings, revenue, pass rate, fraud alerts |
| Infrastructure | `coderoute-infra` | DB/Redis/host status, connections, CPU/RAM/disk, container status, recent alerts |

### 7.2 Règles d'alerting

Les règles sont définies dans `monitoring/prometheus/alert-rules.yml` et groupées par sévérité :

- **Critical** (Slack `#alerts-critical` + SMS on-call) :
  - `AppDown` (2 min)
  - `AppHighErrorRate` (5xx > 5% pendant 5 min)
  - `PostgresDown` (1 min)
  - `PostgresConnectionPoolExhausted` (> 95%, 1 min)
  - `RedisDown` (1 min)
  - `HostDiskSpaceCritical` (> 95%, 5 min)
  - `PaymentFailureRateHigh` (> 10%, 15 min)
  - `ExamSubmissionFailureRate` (> 5%, 10 min)
  - `NoBackupsFor24h` (24h + 1h)

- **Warning** (Slack `#alerts-warning`) :
  - `AppHighLatency` (p95 > 2s, 5 min)
  - `PostgresHighConnections` (> 80%, 5 min)
  - `PostgresSlowQueries` (seq scans > 1/s, 10 min)
  - `RedisHighMemory` (> 90%, 5 min)
  - `HostHighCpuLoad` (> 80%, 10 min)
  - `FraudAlertsSpike` (> 5/h, 30 min)
  - `SSLCertExpiringSoon` (< 14 jours)

### 7.3 Canaux de notification

| Canal | Usage |
|---|---|
| Slack `#alerts-critical` | Alertes critiques (acquitter dans l'heure) |
| Slack `#alerts-warning` | Alertes warning (acquitter dans 4h) |
| Slack `#alerts-info` | Alertes info (lecture hebdo) |
| Slack `#incident-response` | Cellule de crise active |
| Slack `#ops-handover` | Handover opérateurs |
| Email on-call (SMS via passerelle) | Alerte critique si Slack indisponible |
| Sentry | Erreurs applicatives détaillées |

## 8. Contacts

| Rôle | Nom | Email | Téléphone |
|---|---|---|---|
| Tech Lead | _à compléter_ | tech@coderoute-gn.org | +224 ... |
| Ops Conakry | _à compléter_ | ops-conakry@coderoute-gn.org | +224 ... |
| Ops Kankan | _à compléter_ | ops-kankan@coderoute-gn.org | +224 ... |
| RSSI | _à compléter_ | rssi@coderoute-gn.org | +224 ... |
| DPO | _à compléter_ | dpo@coderoute-gn.org | +224 ... |
| Sponsor DNTT | _à compléter_ | dntt@coderoute-gn.org | +224 ... |
| Hébergeur Conakry DC | _à compléter_ | support@conakry-dc.gn | +224 ... |
| Hébergeur Kankan DC | _à compléter_ | support@kankan-dc.gn | +224 ... |
| Orange Money support | — | support@orange-gn.com | +224 303 00 00 00 |
| MTN MoMo support | — | support@mtn-gn.com | +224 666 00 00 00 |

## 9. Outils

| Outil | URL | Usage |
|---|---|---|
| Grafana | https://grafana.coderoute-gn.org | Dashboards |
| Prometheus | https://prometheus.coderoute-gn.org | Métriques brutes |
| Alertmanager | https://alertmanager.coderoute-gn.org | État des alertes |
| Loki | https://loki.coderoute-gn.org | Logs agrégés |
| Sentry | https://sentry.io/organizations/coderoute-gn | Erreurs applicatives |
| GitHub | https://github.com/skaba89/coderouteguinee-glm5 | Code source + CI/CD |
| Docker registry | https://registry.conakry-dc.gn | Images Docker |

## 10. Procédure en cas de compromission avérée

Si un incident de sécurité est avéré (intrusion, fuite de données) :

1. **Confinement immédiat** (RSSI + Ops) :
   - Isoler le serveur compromis du réseau.
   - Révoquer tous les secrets (cf. section 6.2).
   - Couper les accès externes (sauf Slack et email pour communication).

2. **Activation de la cellule de crise** :
   - Sponsor DNTT, RSSI, DPO, Tech Lead, Ops.
   - Canal Slack `#incident-response`.

3. **Investigation** :
   - Préserver les preuves (snapshot VM, logs Sentry, audit log PostgreSQL).
   - Identifier l'étendue de la compromission (quelles données, quelles périodes).

4. **Notification AGPD** (DPO) :
   - Dans les 72h après prise de conscience.
   - Cf. `docs/audit-externe/modele-notification-agpd.md`.

5. **Communication aux personnes** (DPO) :
   - Si risque élevé, communiquer aux personnes concernées (article 34).
   - Cf. `docs/audit-externe/runbook-incident-agpd.md` section Phase 7.

6. **Restauration** :
   - Reconstruire le serveur depuis une image propre.
   - Restaurer le backup le plus récent non compromis.
   - Déployer la version corrigée.
   - Surveillance renforcée 7 jours.

7. **Post-mortem** :
   - Rédiger un rapport dans `docs/audit-externe/post-mortem-<date>.md`.
   - Compléter le `docs/audit-externe/REGISTRE-VIOLATIONS.md`.
   - Leçons apprises à intégrer au prochain sprint.

---

**Version** : 1.0 — Sprint 12
**Dernière mise à jour** : 2026-06-24
**Prochaine révision** : après chaque incident ou trimestriellement
