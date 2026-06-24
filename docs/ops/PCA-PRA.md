# Plan de Continuité et Reprise d'Activité (PCA/PRA) — CodeRoute Guinée

> **Document stratégique** définissant les procédures de continuité et de reprise d'activité.
- Conforme à la norme ISO 22301:2019 (Societal security — Business continuity management systems).
- Aligné avec la Loi L/2022/018/AN (article 34 : mesures de sécurité).
- Propriétaire : MOE + RSSI. Validation : Directeur DNTT.

---

## 1. Objectifs & Périmètre

### 1.1 Objectifs

Le PCA/PRA a pour but de garantir que CodeRoute Guinée puisse :
- Continuer à fonctionner en mode dégradé en cas d'incident majeur
- Revenir à un fonctionnement nominal dans des délais acceptables
- Préserver l'intégrité et la confidentialité des données personnelles
- Communiquer transparentement avec les parties prenantes
- Reprendre l'activité sans perte de données critique

### 1.2 Périmètre

| Périmètre | Inclus |
|-----------|--------|
| Plateforme CodeRoute | ✅ Application Next.js + API + DB |
| Infrastructure | ✅ Conakry DC + Kankan DC (DR) |
| Paiements | ✅ Orange Money + MTN MoMo webhooks |
| Communications | ✅ SMS Orange + email Sendinblue |
| Monitoring | ✅ Prometheus + Grafana + Loki + Alertmanager |
| Backups | ✅ Quotidiens chiffrés GPG + restoration testée |
| Support | ✅ WhatsApp + email + téléphone |
| Audit externe | ✅ Accès staging, archives |

### 1.3 exclusions

- Téléphonie mobile opérateurs (responsabilité Orange/MTN)
- Internet global (responsabilité FAI)
- Infrastructures électriques nationales (responsabilité EDG)
- Catastrophes naturelles majeures (force majeure)

---

## 2. Analyse d'Impact Business (BIA)

### 2.1 Processus critiques

| Processus | Criticité | RTO | RPO | Impact si arrêt |
|-----------|-----------|-----|-----|-----------------|
| Inscription candidats | Élevée | 4h | 0 | Perte nouveaux candidats |
| Paiement Mobile Money | Critique | 1h | 0 | Perte revenu + mécontentement |
| Examen en cours | Critique | 5 min | 0 | Annulation examens, reprogrammation |
| Consultation cours/quiz | Moyenne | 8h | 0 | Insatisfaction, mais pas bloquant |
| Notifications SMS/email | Moyenne | 4h | 0 | Communications retardées |
| Support candidats | Élevée | 2h | 0 | Insatisfaction, escalade |
| Audit log | Critique | 0 | 0 | Perte traçabilité (sanctions légales) |
| Backup | Critique | 24h | 24h | Risque perte données définitive |

### 2.2 Définitions

- **RTO** (Recovery Time Objective) : durée maximale acceptable pour restaurer le service
- **RPO** (Recovery Point Objective) : perte de données maximale acceptable
- **MTTR** (Mean Time To Recovery) : temps moyen de restauration constaté
- **MTBF** (Mean Time Between Failures) : temps moyen entre pannes

### 2.3 Cibles CodeRoute

| Indicateur | Cible | Actuel (pilote) |
|------------|-------|------------------|
| RTO critique (paiement, examen) | ≤ 30 min | À mesurer |
| RTO élevé (inscription, support) | ≤ 4h | À mesurer |
| RTO moyen (cours, notifications) | ≤ 8h | À mesurer |
| RPO global | ≤ 5 min | 24h (backup) → 5 min (replication) |
| Uptime cible | ≥ 99.5% | À mesurer |
| Uptime stretch | ≥ 99.9% | À atteindre post-pilote |

---

## 3. Architecture de Continuité

### 3.1 Architecture cible

```
                        ┌─────────────────┐
                        │  Public Internet │
                        └────┬─────────┬──┘
                             │         │
                        ┌────▼─────────▼────┐
                        │  Cloudflare CDN   │
                        │  (DDoS, WAF, TLS) │
                        └────┬─────────┬────┘
                             │         │
                   ┌─────────▼─┐     ┌─▼─────────┐
                   │ Conakry DC│     │ Kankan DC │
                   │ (Primary) │     │   (DR)    │
                   └─────┬─────┘     └─────┬─────┘
                         │                 │
                ┌────────┴────────┐ ┌──────┴───────┐
                │ App + DB + Redis│ │ App + DB DR  │
                │ (Active)        │ │ (Standby)    │
                └────────┬────────┘ └──────┬───────┘
                         │                 │
                         └────────┬────────┘
                                  │
                          Replication PostgreSQL
                          (streaming, async, < 5s lag)
```

### 3.2 Composants redondés

| Composant | Primaire (Conakry) | Secondaire (Kankan) | Bascule |
|-----------|---------------------|----------------------|---------|
| App Next.js | 2 instances Docker | 2 instances Docker | DNS round-robin + healthcheck |
| PostgreSQL 16 | Primaire | Réplica synchrone | Promote réplica (auto) |
| Redis 7 | Primaire | Réplica | Sentinel failover |
| Nginx reverse proxy | Actif | Actif | DNS |
| Prometheus + Grafana | Actif | Actif | Indépendant |
| Backups | Local + offsite | Local + offsite | Quotidien chiffré |

### 3.3 Stratégie de réplication

#### PostgreSQL

- **Mode** : streaming replication asynchrone (sync si latence réseau < 50ms)
- **Lag max** : 5 secondes
- **Promotion** : manuelle (via `pg_promote`) ou automatique (Patroni)
- **Retour** : reconstruction réplica après failback (2-4h)

#### Redis

- **Mode** : replica async (commande `REPLICAOF`)
- **Failover** : Redis Sentinel (quorum 3 nodes)
- **Cache perturbation** : accepté (reconstruction cache progressive)

#### Files de messages

- **Paiements webhook** : file persistante PostgreSQL (table `payment_events`)
- **Notifications** : file Redis + retry exponentiel
- **Audit log** : écriture directe PostgreSQL (synchrone)

---

## 4. Scénarios d'Incident & Procédures

### 4.1 Niveaux de gravité

| Niveau | Définition | Exemples | RTO |
|--------|------------|----------|-----|
| P0 — Critique | Service totalement indisponible | App down, DB down | 30 min |
| P1 — Élevé | Service majeur impacté | Paiement KO, examen KO | 4h |
| P2 — Modéré | Service partiel impacté | Cours lent, notifications retard | 8h |
| P3 — Faible | Anomalie mineure | Bug cosmétique, logs | 48h |
| P4 — Info | Amélioration | Optimisation, refactoring | Pas de délai |

### 4.2 Scénarios & procédures

#### Scénario 1 — Panne application Conakry

**Déclencheur** : `/api/health` retourne 500 ou timeout pendant > 1 min

**Procédure** :
1. Détection automatique (Prometheus alert `AppDown`)
2. Notification Slack `#pilot-alerts` + SMS astreinte MOE
3. Investigation (logs Loki, `docker logs`)
4. Si < 5 min : tentative restart container `docker compose restart app`
5. Si > 5 min : bascule traffic vers Kankan (DNS Cloudflare)
6. Communication candidats si > 15 min (SMS + email)
7. Post-mortem sous 5 jours

**RTO** : 5 min (restart) à 15 min (bascule Kankan)

#### Scénario 2 — Panne PostgreSQL primaire

**Déclencheur** : `pg_isready` échoue pendant > 30s

**Procédure** :
1. Détection Prometheus `PostgresDown`
2. Vérification automatique réplica Kankan (`pg_stat_wal_receiver`)
3. Décision : failover ou restauration ?
   - Si réplica OK + lag < 5s : **failover automatique** (Patroni)
   - Si réplica KO ou lag > 30s : **restauration backup** (test restore mensuel requis)
4. Promotion réplica : `pg_ctl promote -D /var/lib/postgresql/data`
5. Update connection string app (env variable `DATABASE_URL`)
6. Restart app : `docker compose restart app`
7. Communication : si > 30 min, SMS candidats
8. Post-mortem + reconstruction nouveau réplica sous 24h

**RTO** : 5-10 min (failover) à 4h (restore backup)
**RPO** : 0-5s (failover) à 24h (restore backup)

#### Scénario 3 — Panne Redis

**Déclencheur** : `redis-cli ping` échoue pendant > 30s

**Procédure** :
1. Détection `RedisDown`
2. Application continue en mode dégradé (cache in-memory fallback)
3. Tentative restart Redis : `docker compose restart redis`
4. Si échec : bascule réplica Redis (Sentinel automatique)
5. Si échec : mode dégradé (rate limit in-memory, pas de cache)
6. Communication interne (pas externe sauf si > 2h)

**RTO** : 5 min (restart) à 30 min (Sentinel failover)
**RPO** : variable (cache perturbation acceptée)

#### Scénario 4 — Panne Internet Conakry

**Déclencheur** : ping datacenter Conakry échoue depuis Cloudflare > 2 min

**Procédure** :
1. Vérification opérateurs (Orange, MTN, Guinea Telecom)
2. Si coupure générale Conakry : **bascule traffic Kankan**
3. Communication SMS candidats (via passerelle Orange SMS qui peut encore fonctionner)
4. Si coupure > 4h : report examens prévus (reprogrammation gratuite)
5. Surveillance restauration opérateurs
6. Retour à Conakry quand réseau restauré

**RTO** : 15-30 min
**RPO** : 5s (réplication PostgreSQL)

#### Scénario 5 — Coupure électrique datacenter

**Déclencheur** : détection UPS + alerte température

**Procédure** :
1. Vérification onduleurs (autonomie 30 min)
2. Si coupure prolongée : démarrage groupe électrogène (autonomie 24h)
3. Si groupe électrogène défaillant : bascule Kankan
4. Surveillance température serveurs (arrêt propre si > 35°C)
5. Communication interne + decision examens

**RTO** : 5 min (groupe) à 30 min (bascule Kankan)

#### Scénario 6 — Attaque DDoS

**Déclencheur** : trafic > 10x normale pendant > 5 min, erreurs 5xx > 50%

**Procédure** :
1. Détection Cloudflare (auto-mitigation)
2. Activation mode "I'm under attack" Cloudflare
3. Vérification WAF logs (règles déclenchées)
4. Si attaque L7 : tuning WAF règles
5. Si attaque L3/L4 : Cloudflare absorbs
6. Communication si impact utilisateurs
7. Post-mortem + amélioration règles

**RTO** : 5-15 min

#### Scénario 7 — Ransomware / Compromission

**Déclencheur** : détection comportement anormal (chiffrement fichiers, accès massif)

**Procédure** :
1. **Confinement immédiat** : déconnexion réseau serveurs compromis
2. Isolation : bascule trafic vers infra saine (Kankan)
3. **Investigation** : analyse logs, identification périmètre compromis
4. **Notification AGPD sous 72h** (violation données personnelles)
5. Communication personnes concernées (art. 34 Loi L/2022/018/AN)
6. Restauration depuis backup sain (vérifier intégrité)
7. Rotation tous les secrets (mots de passe, clés API, certificats)
8. Audit complet sécurité (auditeur externe si besoin)
9. Post-mortem + plan durcissement
10. Décisions : poursuite service / pause / arrêt

**RTO** : 4-24h (selon ampleur)
**RPO** : 24h (backup précédent)

#### Scénario 8 — Fraude examen organisée

**Déclencheur** : alerte fraude severity=critical ou > 5 alertes en 1h

**Procédure** :
1. Suspension immédiate sessions concernées
2. Investigation RSSI (logs, IP, patterns)
3. Blocage comptes impliqués
4. Si fraude organisée inter-centres : notification DNTT direction
5. Communication centres pilotes concernés
6. Mise à jour registre fraude
7. Décision : notification AGPD ? (si données personnelles impliquées)
8. Renforcement mesures anti-fraude (nouvelles règles WAF, surveillance accrue)

**RTO** : < 1h (suspension + investigation initiale)

#### Scénario 9 — Bug critique application

**Déclencheur** : erreur 5xx > 5% ou fonctionnalité critique cassée

**Procédure** :
1. Investigation MOE (logs, git bisect)
2. Si fix possible < 1h : hotfix + deploy
3. Si fix long : **rollback** dernière version stable
4. Communication interne + candidats si impact visible
5. Post-mortem + correctif planifié

**RTO** : 15 min (rollback) à 2h (hotfix)

#### Scénario 10 — Défaillance équipe (pandémie, conflit)

**Déclencheur** : absentéisme massif équipe ops

**Procédure** :
1. Évaluation effectif disponible
2. Priorisation activités (paiement > examen > support > évolutif)
3. Activités suspendues : évolutions, audits internes, formation
4. Recours prestataires externes (si contrat)
5. Décision : pause pilote ou continuation dégradée

**RTO** : variable (selon effectif)

---

## 5. Sauvegardes & Restauration

### 5.1 Stratégie backup

| Type | Fréquence | Rétention | Stockage | Test restore |
|------|-----------|-----------|----------|--------------|
| PostgreSQL full | Quotidien 02h + 14h | 30 jours | Local + offsite (Kankan) | Mensuel |
| Redis snapshot | Quotidien 03h | 7 jours | Local | Trimestriel |
| Logs Loki | Temps réel | 90 jours | Local | N/A |
| Audit log DB | Temps réel (replication) | 5 ans | Local + offsite | Annuel |
| Configurations Git | Temps réel (commits) | Permanent | GitHub + local | N/A |
| Secrets (Vault) | Hebdo | 90 versions | Local chiffré | Trimestriel |

### 5.2 Chiffrement

- **Algorithme** : GPG (AES-256-CBC)
- **Clé** : `BACKUP_ENCRYPTION_KEY` (variable env, rotation annuelle)
- **Stockage clé** : Vault (HashiCorp) + copie physique coffre DNTT
- **Accès** : MOE + RSSI uniquement (audit log accès)

### 5.3 Procédure restauration

Voir `docs/ops/OPS-RUNBOOK.md` §3.3 (Procédure restauration).

Script automatisé : `scripts/test-backup-restore.sh` (18 checks d'intégrité).

Procédure manuelle (si script KO) :
1. Identification backup sain le plus récent
2. Déchiffrement GPG : `gpg --decrypt backup.sql.gpg > backup.sql`
3. Démarrage PostgreSQL temporaire (port 15432)
4. Restauration : `psql -h localhost -p 15432 -U postgres -d coderoute < backup.sql`
5. Vérifications (14 checks tables + 4 checks spécifiques)
6. Si OK : bascule application vers DB temporaire
7. Reconstruction DB primaire (réparation)
8. Bascule retour

### 5.4 Tests restore

- **Mensuel** : script `test-backup-restore.sh` exécuté 1er lundi du mois
- **Trimestriel** : test restore complète sur infra vierge (DR drill)
- **Annuel** : test restore avec équipe différente (knowledge sharing)

Voir `docs/ops/PCA-TEST-DRILL.md` pour le plan détaillé.

---

## 6. Communications en Cas d'Incident

### 6.1 Matrice communication

| Gravité | Interne | Candidats | Presse | AGPD |
|----------|---------|-----------|--------|------|
| P0 | Slack + SMS astreinte + tel | SMS + email si > 15 min | Si > 4h | Si RGPD |
| P1 | Slack + email | Email si > 1h | Si > 24h | Si RGPD |
| P2 | Slack | Email si > 4h | Non | Non |
| P3 | Slack | Non | Non | Non |
| P4 | Email récap | Non | Non | Non |

### 6.2 Messages pré-rédigés

Voir `docs/pilote-dntt/PLAN-COMMUNICATION.md` §5.4.

### 6.3 Cellule de crise

Activation sur incident P0 ou P1 avec impact étendu :
- Directeur DNTT (décision)
- RSSI (sécurité)
- MOE (technique)
- Communication DNTT (externe)
- Juriste (légal)
- Chef projet (coordination)

Lieu : salle crise DNTT + visio. Activation < 1h.

---

## 7. Post-Mortem

### 7.1 Déclencheur post-mortem

- Tout incident P0 ou P1
- Tout incident RGPD notifiable
- Tout incident avec communication externe
- Tout incident avec décision de rollback
- À la demande du RSSI ou Directeur DNTT

### 7.2 Délai

- Rédaction : sous 5 jours ouvrés après résolution
- Présentation CPS : mardi suivant
- Validation : RSSI + MOE + Directeur DNTT

### 7.3 Template

Voir `docs/gouvernance/POST-MORTEM-TEMPLATE.md`.

### 7.4 Actions

- Chaque post-mortem génère 1-5 actions correctives
- Actions tracées dans GitHub Issues
- Suivi en réunion CPS hebdo jusqu'à clôture
- Revue trimestrielle des actions post-mortem

---

## 8. Maintenance & Évolution du PCA/PRA

### 8.1 Mise à jour

- **Mensuelle** : mise à jour indicateurs (RTO/RPO réels vs cibles)
- **Trimestrielle** : revue complète scénarios + procédures
- **Annuelle** : audit complet PCA/PRA (consultant externe si besoin)
- **Sur incident** : mise à jour post-mortem

### 8.2 Formation & Exercices

| Type | Fréquence | Participants |
|------|-----------|--------------|
| Formation PCA/PRA | À l'onboarding + annuel | Tous ops |
| Exercice tabletop | Trimestriel | Équipe crise |
| DR drill | Trimestriel | MOE + RSSI |
- Test restore | Mensuel | MOE |
| Simulation phishing | Semestriel | Tous |
| Audit externe | Annuel | Cabinet + RSSI |

### 8.3 Indicateurs d'efficacité

| Indicateur | Cible | Mesure |
|------------|-------|--------|
| RTO réel vs cible | ≤ cible | Chaque incident |
| RPO réel vs cible | ≤ cible | Chaque incident |
| MTTR | < RTO | Mensuel |
| % incidents avec post-mortem | 100% P0/P1 | Mensuel |
| % actions post-mortem clôturées dans délai | ≥ 90% | Trimestriel |
| Taux réussite DR drill | 100% | Trimestriel |
| Taux réussite restore backup | 100% | Mensuel |

---

## 9. Annexes

### 9.1 Contacts d'urgence

| Rôle | Nom | Tel 24/7 | Email |
|------|-----|----------|-------|
| Directeur DNTT | {à remplir} | +224 6XX | directeur@dntt.gouv.gn |
| RSSI | {à remplir} | +224 6XX | rssi@coderoute.gov.gn |
| MOE | {à remplir} | +224 6XX | moe@coderoute.gov.gn |
| Chef projet | {à remplir} | +224 6XX | projet@coderoute.gov.gn |
| Opérateur DC Conakry | {à remplir} | +224 6XX | ops@dc-conakry.gn |
| Opérateur DC Kankan | {à remplir} | +224 6XX | ops@dc-kankan.gn |
| Orange Money support | {à remplir} | +224 6XX | support@orange-money.gn |
| MTN MoMo support | {à remplir} | +224 6XX | support@mtn-momo.gn |
| Cloudflare support | {à remplir} | International | support@cloudflare.com |
| AGPD | {à remplir} | +224 6XX | contact@agpd.gouv.gn |

### 9.2 Documents liés

- `docs/ops/OPS-RUNBOOK.md` — procédures opérationnelles détaillées
- `docs/audit-externe/runbook-incident-agpd.md` — incidents RGPD
- `docs/pilote-dntt/PLAN-COMMUNICATION.md` — communication crise
- `docs/gouvernance/COMITE-PILOTAGE-SECURITE.md` — gouvernance
- `docs/gouvernance/POST-MORTEM-TEMPLATE.md` — template post-mortem
- `docs/ops/PCA-TEST-DRILL.md` — plan DR drill trimestriel

### 9.3 Glossaire

| Terme | Définition |
|------|------------|
| PCA | Plan de Continuité d'Activité (garantir fonctionnement dégradé) |
| PRA | Plan de Reprise d'Activité (restaurer fonctionnement nominal) |
| BIA | Business Impact Analysis |
| RTO | Recovery Time Objective |
| RPO | Recovery Point Objective |
| MTTR | Mean Time To Recovery |
| MTBF | Mean Time Between Failures |
| DR | Disaster Recovery |
| DC | Datacenter |
| DR drill | Exercice de reprise d'activité |

---

**Version** : 1.0
**Date d'application** : dès validation
**Propriétaire** : MOE + RSSI
**Validation** : Directeur DNTT, MOA
**Prochaine révision** : 3 mois après lancement pilote
**Classification** : Confidentiel DNTT
