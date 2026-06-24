# Playbook Surveillance — Première Semaine Pilote (S1)

> **Guide opérationnel** pour surveiller le pilote pendant sa première semaine (J à J+7).
> Complète le `RUNBOOK-GO-LIVE.md` (Jour J) et prépare la transition vers régime nominal (S2+).
> Propriétaire : MOE + RSSI.

---

## 1. Objectifs Semaine 1

1. **Stabilité** : uptime ≥ 99.5%, 0 incident P0
2. **Acquisition** : 50 candidats inscrits, 30 actifs (login 7j)
3. **Engagement** : 80% des inscrits ont complété au moins 1 quiz
4. **Paiements** : 30 transactions réussies, taux échec < 3%
5. **Premier examen** : 10 candidats présentent code J+7
6. **Sécurité** : 0 incident RGPD, fraude < 1%
7. **NPS initial** : sondage post-examen J+7

---

## 2. Routine Quotidienne (J+1 à J+7)

### 2.1 Vérification matinale 08h00 (15 min)

**Responsable** : MOE

| # | Action | Outil | Seuil alerte |
|---|--------|-------|--------------|
| 1 | Vérification services Docker | `docker compose ps` | Tous "Up (healthy)" |
| 2 | Endpoint health | `curl /api/health` | 200 OK |
| 3 | Endpoint metrics | `curl /api/metrics` | 200 + métriques |
| 4 | Backup nuit | `ls -lh /backups/*.gpg` | Fichier présent > 1 MB |
| 5 | Alertes Prometheus | Grafana → Alerting | 0 critique |
| 6 | Logs erreurs Loki | Loki → "error" filter | < 100 erreurs 5min |
| 7 | Tickets support | GitHub Issues / Slack | < 10 ouverts |
| 8 | Slack `#pilot-dntt` | Revue messages nuit | Points bloquants |
| 9 | Tendance inscriptions | `pilot-kpi-extract.ts --week=1` | Croissance journalière |
| 10 | WAF logs | `docker logs waf-modsecurity --tail 20` | 0 attaque critique |

### 2.2 Surveillance journée (09h00-18h00)

- **Grafana dashboard application** ouvert en permanence sur écran ops
- **Slack `#pilot-alerts`** : notification immédiate sur seuil
- **WhatsApp support** : réponse < 30 min pendant 8h-20h
- **Email support** : réponse < 2h
- **Stand-up quotidien 09h00** (15 min, équipe complète)

### 2.3 Vérification soir 18h00 (15 min)

| # | Action | Seuil |
|---|--------|-------|
| 1 | Uptime jour | ≥ 99.5% |
| 2 | Latence P95 jour | ≤ 500 ms |
| 3 | Erreurs 5xx / 1000 req | ≤ 5 |
| 4 | Inscriptions cumul jour | ≥ cible |
| 5 | Paiements réussis jour | Volume attendu |
| 6 | Alertes fraude jour | < 5 |
| 7 | Tickets support nouveaux | Tendance |
| 8 | Backup soir déclenché | Fichier créé 18h00 |

### 2.4 Astreinte nuit (20h00-08h00)

- MOE + RSSI d'astreinte (rotation semaison)
- Alerting SMS pour P0 (PostgresDown, AppDown, BackupMissing)
- Intervention physique si datacenter Conakry
- Procédure escalade : voir `RUNBOOK-GO-LIVE.md` §5.2

---

## 3. Calendrier Détaillé J+1 à J+7

### J+1 (Mardi) — Consolidation post-lancement

**Focus** : stabilisation, premiers retours utilisateurs

- 09h00 : stand-up, revue incidents J
- 10h00 : sync avec support (WhatsApp candidats)
- 11h00 : audit logs sécurité (RSSI)
- 14h00 : test premier paiement réel (sandbox fermée, 1 GNF)
- 16h00 : newsletter équipe (MOE → tous)
- 17h00 : point fin journée
- 18h00 : vérification soir

**Cible J+1** : 20 candidats inscrits cumul, 5 quiz complétés, 0 P0

### J+2 (Mercredi) — Activation support avancé

**Focus** : premiers paiements, première session quiz collective

- 09h00 : stand-up
- 10h00 : première session quiz collective (Conakry-Kaloum)
- 11h00 : sync support centres
- 14h00 : revue paiements J+1 et J+2 (taux échec)
- 16h00 : revue alertes fraude
- 17h00 : point fin journée
- 18h00 : vérification soir

**Cible J+2** : 30 candidats inscrits, 10 quiz, 5 paiements réussis

### J+3 (Jeudi) — Sync audit externe

**Focus** : avancement audit, premiers constats

- 09h00 : stand-up
- 10h00 : sync hebdo auditeur (jeudi 10h00, 30 min)
- 11h00 : revue KPI S1 (mi-semaine)
- 14h00 : tests sécurité (RSSI)
- 16h00 : revue tickets support
- 17h00 : point fin journée

**Cible J+3** : 35 candidats inscrits, 15 quiz, 10 paiements réussis

### J+4 (Vendredi) — Préparation week-end

**Focus** : préparation faible charge, garde renforcée

- 09h00 : stand-up
- 10h00 : revue semaine (toute équipe, 1h)
- 11h00 : planification garde week-end
- 14h00 : backup restore test (sur staging)
- 16h00 : communication candidats "bon week-end"
- 17h00 : rétrospective hebdo (vendredi 16h00)
- 18h00 : vérification soir + briefing garde

**Cible J+4** : 40 candidats inscrits, 25 quiz, 15 paiements réussis

### J+5 et J+6 (Samedi + Dimanche) — Surveillance réduite

**Focus** : garde minimale, surveillance automatique

- 1 MOE + 1 support en garde 8h-20h
- Monitoring automatique actif (alerting SMS P0)
- Pas d'actions planifiées (pas de déploiement, pas de migration)
- Vérification matinale 09h00 + soir 18h00 (10 min chacune)
- Si incident : appel chef projet + RSSI

**Cible week-end** : 50 candidats inscrits (objectif S1), engagement stable

### J+7 (Lundi S2) — Premier examen + revue S1

**Focus** : 1er examen code, bilan semaine 1

| Heure | Action |
|-------|--------|
| 08h00 | Vérification matinale (renforcée, 30 min) |
| 09h00 | Stand-up + revue week-end |
| 10h00 | **Réunion revue KPI S1** (comité pilotage, 1h) |
| 11h00 | Préparation 1er examen (centre Conakry-Kaloum) |
| 14h00 | **1er examen code** (10 candidats) |
| 16h00 | Génération résultats + notification candidats |
| 17h00 | Sondage NPS post-examen envoyé |
| 18h00 | Vérification soir + bilan S1 |

**Cible J+7** :
- 50 candidats inscrits cumul
- 1er examen code (10 candidats)
- Taux réussite ≥ 50% (première mesure)
- NPS post-examen mesuré
- 0 incident P0 sur S1
- Uptime S1 ≥ 99.5%

---

## 4. Seuils d'Alerte Spécifiques S1

### 4.1 Seuils critiques (intervention immédiate < 1h)

| KPI | Seuil critique | Action |
|-----|----------------|--------|
| Uptime | < 99% | Runbook AppDown |
| Latence P95 | > 1500 ms | Optimisation DB + cache |
| Erreurs 5xx | > 10/1000 | Investigation logs |
| Tentatives connexion échouées | > 200/h | Rate limit + investigation |
| Paiements échec | > 10% | Pause paiements + investiguer |
| Alertes fraude critique | > 2 | RSSI investigation immédiate |
| Backup manquant | Aucun backup 24h | Runbook BackupMissing |
| Incident RGPD | Tout | Notification AGPD 72h |

### 4.2 Seuils warning (intervention < 4h)

| KPI | Seuil warning | Action |
|-----|---------------|--------|
| Uptime | < 99.5% | Investiguer tendances |
| Latence P95 | > 800 ms | Optimisation |
| Inscriptions J | < 5/jour | Communication renforcée |
| Quiz completion | < 50% inscrits | Amélioration UX |
| Tickets support ouverts | > 15 | Renfort support |
| Alertes WAF | > 50/jour | Tuning WAF |

---

## 5. Communication S1

### 5.1 Interne

| Canal | Fréquence | Objet |
|-------|-----------|-------|
| Slack `#pilot-dntt` | Continu | Conversations équipe |
| Slack `#pilot-alerts` | Auto | Alertes KPI |
| Email équipe | Quotidien 17h00 | Bilan jour MOE |
| Réunion stand-up | Quotidien 09h00 | Quick status |
| Réunion fin journée | Quotidien 17h00 | Bilan + actions |
| Rétrospective S1 | Vendredi 16h00 | Bilan semaine |
| Revue KPI S1 | Lundi S2 10h00 | Comité pilotage |

### 5.2 Candidats

| Canal | Fréquence | Objet |
|-------|-----------|-------|
| Email transactionnel | À chaque action | Inscription, paiement, convocation |
| SMS | J-2 examen | Convocation |
| Email newsletter | J+3 | "Comment se passe votre pilote ?" |
| Sondage NPS | J+7 post-examen | Satisfaction |
| WhatsApp support | 8h-20h | Questions/réponses |

### 5.3 Centres pilotes

| Canal | Fréquence | Objet |
|-------|-----------|-------|
| WhatsApp groupe | Continu | Support centres |
| Visio | Mercredi 11h00 | Point hebdo centres |
| Email | Vendredi 17h00 | Bilan semaine |

### 5.4 Presse

| Action | Date |
|--------|------|
| Communiqué J+1 bilan lancement | J+1 12h00 |
| Interview radio Espace FM | J+3 08h00 |
| Article presse écrite | J+5 |

---

## 6. Indicateurs à Surveiller Spécifiquement S1

### 6.1 Indicateurs santé plateforme

- Uptime (% par jour et cumul S1)
- Latence P50, P95, P99 (ms)
- Taux erreur 5xx (/1000 req)
- Connexions DB (max, moyenne)
- Hit rate cache Redis (%)
- CPU / RAM / disque (hôte + containers)
- Trafic réseau (in/out)
- Nombre requêtes/sec (pic vs moyenne)

### 6.2 Indicateurs business

- Nouveaux candidats / jour
- Candidats actifs (login 24h, 7j)
- Sessions quiz / jour
- Tentatives examen / jour
- Taux conversion inscription → paiement
- Taux conversion paiement → examen
- Panier moyen (GNF)
- Volume total paiements (GNF)

### 6.3 Indicateurs sécurité

- Tentatives connexion échouées (par IP, par user)
- Comptes bloqués rate limit
- IP bannies (geo + WAF)
- Alertes WAF (par règle)
- Alertes fraude (par sévérité)
- Logs audit (volume, anomalies)
- Activités suspectes (RSSI revue quotidienne)

### 6.4 Indicateurs support

- Tickets ouverts (total + nouveaux / jour)
- Tickets fermés / jour
- Temps moyen résolution (SLA: < 24h)
- Satisfaction support (sondage)
- Top 5 catégories problèmes
- Tickets escaladés MOE

---

## 7. Procédures Spécifiques S1

### 7.1 Activation WAF mode `On` (J+3 si conditions remplies)

Pré-requis :
- 0 faux positif sur 3 jours (J à J+3)
- 0 ticket support lié à WAF
- Validation RSSI + MOE

Procédure :
1. J+3 10h00 : passage `MODSEC_DEFAULT_PHASE=On`
2. Surveillance accrue 4h (alerting chaque 5 min)
3. Si faux positif détecté : ajout exclusion dans `nginx/modsec/custom-rules.conf`
4. Si > 5 faux positifs / heure : rollback `DetectionOnly`
5. Validation définitive J+7 (post-rétrospective)

### 7.2 Activation géoblocage politique `strict` (J+5 si conditions)

Pré-requis :
- 0 candidat légitime bloqué sur 5 jours
- Top 10 pays origine traffic = Guinée + 5 pays diaspora
- Validation RSSI

Procédure :
1. J+5 14h00 : passage `GEOBLOCK_POLICY=strict`
2. Surveillance 24h
3. Si candidat légitime bloqué : ajout CIDR allowlist
4. Validation définitive J+7

### 7.3 Premier test restore backup (J+4)

Sur staging uniquement (pas en prod) :
```bash
./scripts/test-backup-restore.sh
```
- Vérifier 18 checks d'intégrité
- Documenter temps total restore
- Si échec : plan correctif avant S2

### 7.4 Sync audit externe (chaque jeudi 10h00)

Voir `CALENDARIER-AUDIT-45J.md` §Suivi Hebdomadaire Audit

---

## 8. Risques Spécifiques S1 & Mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Bug critique non détecté en pré-prod | Moyenne | Critique | Rollback < 30 min, surveillance accrue |
| Surcharge plateforme pic | Moyenne | Élevé | Auto-scaling, rate limit dynamique |
| Panne Internet Conakry | Faible | Critique | Bascule Kankan, communication SMS |
| Faible adoption candidats | Moyenne | Élevé | Communication radio/TV, bonus 1er inscrits |
| Fraude organisée | Faible | Élevé | Détection < 1s, ban IP, audit logs |
| Webhook Orange/MTN down | Faible | Élevé | File retry, surveillance P95 |
| Erreur manipulation admin | Moyenne | Moyen | Formation + 2FA + audit log |
| Maladie / absence key people | Faible | Moyen | Backup chacun, documentation à jour |

---

## 9. Rétrospective S1 (Vendredi 16h00, 1h)

### 9.1 Format

- 5 min : présentation KPI S1
- 15 min : "Ce qui a bien fonctionné" (3 points max)
- 15 min : "Ce qui n'a pas fonctionné" (3 points max)
- 15 min : Actions d'amélioration (3 max, assignées)
- 10 min : Décisions S2

### 9.2 Livrable

Document `docs/pilote-dntt/retrospectives/S1-{date}.md` :
- KPI consolidés S1 (tableau)
- Forces / faiblesses
- Actions correctives S2 (qui, quoi, quand)
- Décisions prises
- Leçons apprises (à reporter dans `LECONS-APPRIS.md`)

### 9.3 Diffusion

- Email à toute l'équipe pilote (vendredi 18h00)
- Présentation au comité pilotage lundi S2 10h00
- Archive Nextcloud DNTT

---

## 10. Revue KPI S1 (Lundi S2 10h00, 1h)

### 10.1 Ordre du jour

1. Présentation tableau de bord S1 complet (15 min)
2. Analyse écarts vs cibles (15 min)
3. Retours qualitatifs centres pilotes (10 min)
4. Décisions ajustements S2 (15 min)
5. Communication direction DNTT (5 min)

### 10.2 Décisions possibles

- **Poursuite pilote S2** (si 80% KPI S1 atteints)
- **Poursuite avec plan correctif** (si 60-80% KPI S1)
- **Report 1 semaine** (si < 60% KPI S1 ou incident P0)
- **Arrêt pilote** (si incident critique non résolu ou fraude majeure)

### 10.3 Livrable

- Rapport S1 généré par `pilot-weekly-report.ts --week=1`
- Compte rendu réunion (PV)
- Mise à jour `TABLEAU-DE-BORD-KPI.md` avec valeurs S1
- Email à Directeur DNTT (synthèse 1 page)

---

## 11. Transition vers Régime Nominal (S2+)

À partir de S2, les pratiques suivantes deviennent standard :

- Surveillance continue (moins intensive que S1)
- Stand-up quotidien 09h00 (15 min, maintenu)
- Revue KPI hebdo lundi 10h00 (1h)
- Sync audit hebdo jeudi 10h00 (30 min)
- Rétrospective hebdo vendredi 16h00 (1h)
- Comité pilotage sécurité mardi 14h00 (1h30)
- Garde astreinte MOE + RSSI (rotation semaison)
- Tests restore backup mensuels (1er lundi du mois)

Voir `CALENDRIER-PILOTE-8SEM.md` pour la suite S2-S8.

---

**Version** : 1.0
**Propriétaire** : MOE + RSSI
**Validation** : Directeur DNTT, MOA
**Période d'application** : J à J+7 (Semaine 1 du pilote)
