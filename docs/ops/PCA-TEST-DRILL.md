# Plan de Test de Reprise d'Activité (DR Drill) — CodeRoute Guinée

> **Procédure trimestrielle** pour valider la capacité de reprise d'activité.
> Objectif : vérifier que le PRA décrit dans `PCA-PRA.md` fonctionne réellement.
> Conforme ISO 22301:2019 §8.5 (Exercice).
- Propriétaire : MOE + RSSI.

---

## 1. Objectifs du DR Drill

### 1.1 Objectifs principaux

1. **Valider** que la bascule Conakry → Kankan fonctionne en moins de 30 minutes (RTO cible)
2. **Mesurer** la perte de données réelle (RPO) lors d'une bascule
3. **Tester** les procédures de restauration backup
4. **Former** l'équipe ops aux procédures d'urgence
5. **Identifier** les écarts entre théorie (PCA/PRA) et pratique
6. **Documenter** les leçons apprises pour amélioration continue

### 1.2 Périmètre testé

| Composant | Testé | Méthode |
|-----------|-------|---------|
| Application Next.js | ✅ | Bascule traffic Kankan |
| PostgreSQL | ✅ | Failover réplica + restore backup |
| Redis | ✅ | Failover Sentinel |
| Nginx reverse proxy | ✅ | Bascule DNS |
| Monitoring | ✅ | Vérification alertes bascule |
| Communications | ✅ | Test SMS + email candidats (sur staging) |
| Documentation | ✅ | Revue runbook avec équipe |

---

## 2. Calendrier des Exercices

### 2.1 Calendrier annuel

| Trimestre | Date prévue | Type exercice | Périmètre | Durée |
|-----------|-------------|---------------|-----------|-------|
| Q1 (jan-mar) | 1er mardi février | Tabletop | Tous scénarios P0 | 2h |
| Q2 (av-juin) | 1er mardi mai | DR drill technique | Bascule infra complète | 4h |
| Q3 (juil-sep) | 1er mardi août | Tabletop + partiel | Scénario ransomware | 3h |
| Q4 (oct-déc) | 1er mardi novembre | DR drill complet | Bascule + restore + comms | 6h |

### 2.2 Pré-requis avant exercice

- [ ] Plan d'exercice validé par RSSI + MOE (J-7)
- [ ] Équipe briefée (J-3)
- [ ] Snapshot VM staging (point de restauration)
- [ ] Communication aux équipes : "exercice DR en cours" (pour éviter confusion)
- [ ] Activation mode "maintenance" sur staging (pas d'impact utilisateurs)
- [ ] Outils de monitoring prêts (Grafana, Loki, Prometheus)
- [ ] Documentation runbook à jour

---

## 3. Exercice Q2 — DR Drill Technique (4h)

### 3.1 Scénario

**Simulation** : panne complète datacenter Conakry (incendie declare 09h00, évacuation immédiate, indisponibilité 4h+).

**Objectif** : basculer toute la plateforme vers Kankan DC en moins de 30 minutes (RTO), avec perte de données < 5 min (RPO).

### 3.2 Participants & Rôles

| Rôle | Nom | Responsabilité |
|------|-----|----------------|
| Exercise Director | RSSI | Pilotage global, décision stop/continue |
| Incident Commander | MOE | Exécution technique |
| Communications | Chef projet | Simulation communication interne/externe |
| Scribe | {assigné} | Documentation chronologie |
| Observateur externe | {invité} | Objectivité, feedback |
- Equipe ops | 2-3 personnes | Exécution procédures |

### 3.3 Déroulement

#### Phase 1 — Détection (09h00-09h05)

| Heure | Action | Attendu | Réel | Écart |
|-------|--------|---------|------|-------|
| 09h00 | Déclenchement manuel (simulation panne) | — | — | — |
| 09h01 | Vérification alerting Prometheus | Alerte `DC-Conakry-Down` triggered | — | — |
| 09h02 | Notification Slack `#pilot-alerts` | Message envoyé < 1 min | — | — |
| 09h03 | Notification SMS astreinte MOE | SMS reçu < 2 min | — | — |
| 09h05 | Décision bascule (Incident Commander) | Décision prise < 5 min | — | — |

#### Phase 2 — Bascule (09h05-09h30)

| Heure | Action | Attendu | Réel | Écart |
|-------|--------|---------|------|-------|
| 09h06 | Vérification réplica Kankan | `pg_stat_wal_receiver` OK, lag < 5s | — | — |
| 09h08 | Promotion réplica Kankan | `pg_ctl promote` OK | — | — |
| 09h10 | Update connection string app | Variable env `DATABASE_URL` modifiée | — | — |
| 09h12 | Restart app Kankan | `docker compose restart app` OK | — | — |
| 09h15 | Vérification health Kankan | `/api/health` → 200 OK | — | — |
| 09h17 | Bascule DNS Cloudflare | TTL 60s, propagation < 5 min | — | — |
| 09h22 | Vérification traffic | Logs Kankan → 100% traffic | — | — |
| 09h25 | Test fonctionnel | Inscription test + paiement sandbox | — | — |
| 09h30 | Bascule complète déclarée | Service restauré < 30 min (RTO) | — | — |

#### Phase 3 — Validation (09h30-10h30)

| Heure | Action | Attendu | Réel |
|-------|--------|---------|------|
| 09h35 | Vérification intégrité données | 0 perte (RPO < 5 min) | — |
| 09h45 | Test complet fonctionnel | 10 scénarios E2E passants | — |
| 10h00 | Vérification monitoring | Prometheus + Grafana OK Kankan | — |
| 10h15 | Vérification backup | Backup Kankan démarré OK | — |
| 10h30 | Validation technique complète | Tous checks OK | — |

#### Phase 4 — Communication (10h30-11h00)

| Heure | Action | Attendu | Réel |
|-------|--------|---------|------|
| 10h35 | Simulation communication interne | Slack + email équipe OK | — |
| 10h45 | Simulation communication candidats | SMS (sur staging) OK | — |
| 10h55 | Simulation communication presse | Communiqué rédigé < 20 min | — |
| 11h00 | Communication complète validée | Tous canaux testés | — |

#### Phase 5 — Retour à la normale (11h00-12h00)

| Heure | Action | Attendu | Réel |
|-------|--------|---------|------|
| 11h05 | Décision retour Conakry (si restauré) | Décision prise | — |
| 11h15 | Reconstruction réplica Conakry | `pg_basebackup` démarré | — |
| 11h45 | Réplica sync | Lag < 5s | — |
| 11h55 | Bascule retour Conakry | DNS update OK | — |
| 12h00 | Fin exercice | Service nominal Conakry | — |

#### Phase 6 — Débriefing (12h00-13h00)

Réunion 1h avec tous les participants :
- Chronologie réelle vs attendue (écarts)
- Ce qui a bien fonctionné
- Ce qui n'a pas fonctionné
- Actions correctives
- Mise à jour PCA/PRA si besoin

### 3.4 Critères de succès

| Critère | Cible | Résultat exercice | Succès? |
|---------|-------|-------------------|---------|
| RTO bascule | ≤ 30 min | — | — |
| RPO perte données | ≤ 5 min | — | — |
| Alerting déclenché | < 2 min | — | — |
| Communication interne | < 30 min | — | — |
| Communication candidats | < 60 min | — | — |
| Test fonctionnel post-bascule | 10/10 E2E | — | — |
| Monitoring opérationnel Kankan | 100% | — | — |

---

## 4. Exercice Q4 — DR Drill Complet (6h)

### 4.1 Scénario

**Simulation** : ransomware détecté 09h00 sur serveur app Conakry. Chiffrement en cours, données potentiellement exfiltrées. Décision : isolement total Conakry, bascule Kankan, restauration backup, communication AGPD.

### 4.2 Phases

1. **Détection** (09h00-09h15) — alerte fraude + WAF + anomalies
2. **Confinement** (09h15-09h30) — déconnexion réseau Conakry
3. **Investigation** (09h30-10h30) — analyse logs, identification périmètre
4. **Bascule Kankan** (10h30-11h00) — failover infra complète
5. **Restauration backup** (11h00-12h00) — restore PostgreSQL sur nouveau primaire
6. **Notification AGPD** (12h00-12h30) — rédaction + envoi notification 72h
7. **Communication personnes concernées** (12h30-13h00) — templates multilingues
8. **Retour normal** (13h00-14h00) — vérification intégrité + reprise service
9. **Débriefing** (14h00-15h00) — post-mortem immédiat

### 4.3 Points spécifiques testés

- Détection ransomware (règles WAF + détection comportement)
- Procédure AGPD 72h (rédaction notification)
- Communication multilingue personnes concernées (4 langues)
- Restore backup vérifié (test intégrité)
- Rotation secrets (tous les mots de passe, clés API, certificats)
- Coordination multi-équipes (RSSI + MOE + comms + juriste + direction)

---

## 5. Exercice Q1 & Q3 — Tabletop (2-3h)

### 5.1 Format

Réunion en salle, sans exécution technique réelle. Lecture de scénarios, discussion des réponses.

### 5.2 Q1 — Scénarios multiples

- Scénario 1 : panne application Conakry
- Scénario 2 : panne PostgreSQL
- Scénario 3 : coupure Internet
- Scénario 4 : attaque DDoS
- Scénario 5 : fraude examen organisée

Pour chaque scénario : 20 min discussion + 5 min synthèse.

### 5.3 Q3 — Scénario ransomware

- Scénario ransomware détaillé (3h)
- Focus sur procédures légales (AGPD) et communication
- Pas d'exécution technique (déjà faite en Q2)

---

## 6. Outils & Ressources

### 6.1 Outils

| Outil | Usage |
|-------|-------|
| Grafana | Visualisation métriques |
| Loki | Recherche logs |
| Slack `#dr-drill` | Communication exercice |
| Zoom / Meet | Réunion tabletop |
| GitHub Issues | Actions correctives |
| Nextcloud DNTT | Partage documents |
| Script `test-backup-restore.sh` | Restore test |

### 6.2 Documents de référence

- `docs/ops/PCA-PRA.md` — Plan PCA/PRA complet
- `docs/ops/OPS-RUNBOOK.md` — Procédures opérationnelles
- `docs/audit-externe/runbook-incident-agpd.md` — Incidents RGPD
- `docs/gouvernance/POST-MORTEM-TEMPLATE.md` — Template post-mortem
- `scripts/test-backup-restore.sh` — Script restore
- `scripts/prepare-staging-twin.sh` — Préparation staging
- `scripts/simulate-incident.ts` — Simulation incidents

---

## 7. Indicateurs d'Effacité

### 7.1 Indicateurs par exercice

| Indicateur | Cible | Mesure |
|------------|-------|--------|
| RTO réel | ≤ RTO cible (30 min) | Chronométré |
| RPO réel | ≤ RPO cible (5 min) | Delta données |
| Taux de succès scénarios | 100% | Comparaison attendu/réel |
| Taux actions correctives clôturées | ≥ 90% à 30 jours | Suivi GitHub Issues |

### 7.2 Indicateurs annuels

| Indicateur | Cible |
|------------|-------|
| Nombre exercices réalisés | 4/an (1 par trimestre) |
| Taux participation équipe | ≥ 80% |
| Taux réussite exercices | ≥ 75% |
- Amélioration RTO/RPO année N vs N-1 | RTO ↓ 10% |

---

## 8. Communication Exercice

### 8.1 Avant exercice (J-7)

- Email équipe : "DR Drill prévu {date}, merci de bloquer l'agenda"
- Briefing J-3 : présentation scénario (sans détails techniques pour réalisme)
- Snapshot VM staging
- Vérification accès outils (Grafana, Loki, etc.)

### 8.2 Pendant exercice

- Slack `#dr-drill` : toutes les actions documentées
- Statut clair "EXERCICE - PAS D'IMPACT UTILISATEURS"
- Scribe documente chronologie en temps réel

### 8.3 Après exercice

- Débriefing immédiat (1h)
- Rapport post-mortem sous 5 jours
- Présentation CPS suivant (mardi)
- Diffusion leçons apprises à toute l'équipe

---

## 9. Amélioration Continue

### 9.1 Revue annuelle PCA/PRA

À l'issue du DR Drill Q4 :
- Mise à jour PCA/PRA selon leçons
- Mise à jour runbook si besoin
- Nouvelles alertes Prometheus si écarts détectés
- Nouvelles règles WAF si scénarios sécurité
- Formation complémentaire si lacunes identifiées

### 9.2 Mise à jour calendrier

- Calendrier N+1 validé en décembre
- Adaptation selon retours d'expérience
- Possibilité d'exercice exceptionnel (post-incident majeur)

---

## 10. Annexe — Checklist Exercice

### 10.1 Avant exercice (J-7 à J-1)

- [ ] Date validée par RSSI + MOE
- [ ] Plan d'exercice rédigé et validé
- [ ] Équipe briefée (J-3)
- [ ] Snapshot staging effectué
- [ ] Outils monitoring opérationnels
- [ ] Slack `#dr-drill` créé
- [ ] Documentation runbook à jour
- [ ] Communication "exercice en cours" prête

### 10.2 Pendant exercice

- [ ] Scribe assigné
- [ ] Chronologie documentée temps réel
- [ ] Captures d'écran Grafana / Loki
- [ ] Logs sauvegardés
- [ ] Décisions tracées
- [ ] Actions correctives identifiées

### 10.3 Après exercice

- [ ] Débriefing immédiat (1h)
- [ ] Rapport post-mortem rédigé (5 jours)
- [ ] Actions correctives créées dans GitHub
- [ ] Présentation CPS (mardi suivant)
- [ ] Mise à jour PCA/PRA si besoin
- [ ] Mise à jour runbook si besoin
- [ ] Formation équipe si besoin
- [ ] Archivage documents exercice (5 ans)

---

**Version** : 1.0
**Propriétaire** : MOE + RSSI
**Validation** : Directeur DNTT
**Prochaine révision** : annuelle (décembre)
**Classification** : Confidentiel DNTT
