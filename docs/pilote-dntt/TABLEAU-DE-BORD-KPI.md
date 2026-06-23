# Tableau de Bord KPI — Pilote DNTT CodeRoute Guinée

> **Document de référence** pour le suivi hebdomadaire du pilote DNTT.
> Mis à jour chaque lundi 09h00 par le chef de projet DNTT.
> Période de pilotage : 8 semaines (J à J+56).
> Audience : comité de pilotage DNTT, MOA, MOE, RSSI.

---

## 1. KPI Stratégiques (objectifs finaux Sprint 8 = fin pilote)

| KPI | Cible | Seuil alerte | Seuil critique | Source |
|-----|-------|--------------|----------------|--------|
| Taux de réussite examen code | ≥ 60% | < 50% | < 40% | `ExamResult` |
| Taux de réussite examen conduite | ≥ 65% | < 55% | < 45% | `ExamResult` |
| Taux d'abandon candidats | ≤ 15% | > 20% | > 30% | `User.actif=false` |
| Taux d'usage paiement mobile | ≥ 95% | < 90% | < 80% | `Payment.provider` |
| Taux d'incidents paiement | ≤ 2% | > 3% | > 5% | `Payment.status=FAILED` |
| Temps moyen inscription → examen | ≤ 14 jours | > 18 jours | > 21 jours | `User.createdAt` vs `Booking.date` |
| Disponibilité plateforme (uptime) | ≥ 99.5% | < 99% | < 98% | Prometheus `up` |
| NPS candidats | ≥ 50 | < 35 | < 20 | Sondage post-examen |
| Taux de fraude détectée | ≤ 0.5% | > 1% | > 2% | `FraudAlert` |
| Conformité RGPD (incidents notifiés ≤ 72h) | 100% | < 100% | < 90% | Registre violations |

---

## 2. KPI Opérationnels Hebdomadaires

### 2.1 Acquisition & Engagement

| KPI | S0 | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 |
|-----|----|----|----|----|----|----|----|----|----|
| Nouveaux candidats inscrits | — | — | — | — | — | — | — | — | — |
| Candidats actifs (7j) | — | — | — | — | — | — | — | — | — |
| Sessions de révision cumulées | — | — | — | — | — | — | — | — | — |
| Temps moyen session (min) | — | — | — | — | — | — | — | — | — |
| Quiz complétés | — | — | — | — | — | — | — | — | — |
| Tentatives examen code | — | — | — | — | — | — | — | — | — |
| Tentatives examen conduite | — | — | — | — | — | — | — | — | — |

### 2.2 Performance Examen

| KPI | S0 | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 |
|-----|----|----|----|----|----|----|----|----|----|
| Examens code passés | — | — | — | — | — | — | — | — | — |
| Examens code réussis | — | — | — | — | — | — | — | — | — |
| Taux réussite code (%) | — | — | — | — | — | — | — | — | — |
| Examens conduite passés | — | — | — | — | — | — | — | — | — |
| Examens conduite réussis | — | — | — | — | — | — | — | — | — |
| Taux réussite conduite (%) | — | — | — | — | — | — | — | — | — |
| Notes moyennes (sur 40) | — | — | — | — | — | — | — | — | — |

### 2.3 Paiements

| KPI | S0 | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 |
|-----|----|----|----|----|----|----|----|----|----|
| Transactions Orange Money | — | — | — | — | — | — | — | — | — |
| Transactions MTN MoMo | — | — | — | — | — | — | — | — | — |
| Volume total (GNF) | — | — | — | — | — | — | — | — | — |
| Taux échec paiement (%) | — | — | — | — | — | — | — | — | — |
| Temps moyen confirmation (s) | — | — | — | — | — | — | — | — | — |
| Remboursements traités | — | — | — | — | — | — | — | — | — |

### 2.4 Centres Pilotes

| Centre | Capacité | Inscrits S0 | Inscrits S4 | Inscrits S8 | Taux remplissage |
|--------|----------|-------------|-------------|-------------|------------------|
| Conakry-Kaloum | 200 | — | — | — | — |
| Kankan | 80 | — | — | — | — |
| Labé | 50 | — | — | — | — |
| **Total** | **330** | — | — | — | — |

### 2.5 Sécurité & Conformité

| KPI | S0 | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 |
|-----|----|----|----|----|----|----|----|----|----|
| Tentatives connexion échouées | — | — | — | — | — | — | — | — | — |
| Comptes bloqués (rate limit) | — | — | — | — | — | — | — | — | — |
| IP bannies (geo/WAF) | — | — | — | — | — | — | — | — | — |
| Alertes WAF ModSecurity | — | — | — | — | — | — | — | — | — |
| Alertes fraude examen | — | — | — | — | — | — | — | — | — |
| Incidents RGPD notifiés | — | — | — | — | — | — | — | — | — |
| Tickets support sécurité | — | — | — | — | — | — | — | — | — |
| Vulnérabilités audit (ouvertes) | — | — | — | — | — | — | — | — | — |

### 2.6 Infrastructure & Performance

| KPI | Cible | S0 | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 |
|-----|-------|----|----|----|----|----|----|----|----|----|
| Uptime applicatif (%) | ≥ 99.5 | — | — | — | — | — | — | — | — | — |
| Temps réponse P95 (ms) | ≤ 500 | — | — | — | — | — | — | — | — | — |
| Temps réponse P99 (ms) | ≤ 1500 | — | — | — | — | — | — | — | — | — |
| Erreurs 5xx (/1000 req) | ≤ 5 | — | — | — | — | — | — | — | — | — |
| Connexions DB max concurrentes | ≤ 80 | — | — | — | — | — | — | — | — | — |
| Hit rate cache Redis (%) | ≥ 85 | — | — | — | — | — | — | — | — | — |
| Latence paiement webhook (P95) | ≤ 2s | — | — | — | — | — | — | — | — | — |
| Espace disque DB utilisé (%) | ≤ 70 | — | — | — | — | — | — | — | — | — |

---

## 3. KPI Qualitatifs (sondage post-examen)

### 3.1 Questionnaire candidat (échelle 1-5)

| Question | Cible | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 |
|----------|-------|----|----|----|----|----|----|----|----|
| Facilité d'inscription | ≥ 4.0 | — | — | — | — | — | — | — | — |
| Clarté interface (FR/Pular/Soussou/Malinké) | ≥ 4.0 | — | — | — | — | — | — | — | — |
| Qualité contenu révision | ≥ 4.0 | — | — | — | — | — | — | — | — |
| Fiabilité paiement mobile | ≥ 4.5 | — | — | — | — | — | — | — | — |
| Disponibilité créneaux examen | ≥ 4.0 | — | — | — | — | — | — | — | — |
| Satisfaction globale | ≥ 4.0 | — | — | — | — | — | — | — | — |
| NPS (recommandation 0-10) | ≥ 50 | — | — | — | — | — | — | — | — |

### 3.2 Retours auto-écoles (entretien semi-directif S4 et S8)

| Centre | S4 : points forts | S4 : points faibles | S8 : points forts | S8 : points faibles | Recommandation S8 |
|--------|-------------------|----------------------|--------------------|----------------------|-------------------|
| Conakry-Kaloum | — | — | — | — | — |
| Kankan | — | — | — | — | — |
| Labé | — | — | — | — | — |

---

## 4. Indicateurs Démo GO/NO-GO pour Généralisation

À la fin du pilote (S8), les 6 critères suivants doivent tous être au vert pour recommander la généralisation à l'ensemble du territoire :

| # | Critère | Seuil GO | Statut S8 | Décision |
|---|---------|----------|-----------|----------|
| 1 | Taux réussite code ≥ 60% | ≥ 60% | — | ⚪ |
| 2 | Taux réussite conduite ≥ 65% | ≥ 65% | — | ⚪ |
| 3 | Disponibilité plateforme ≥ 99.5% | ≥ 99.5% | — | ⚪ |
| 4 | Taux incidents paiement ≤ 2% | ≤ 2% | — | ⚪ |
| 5 | NPS ≥ 50 | ≥ 50 | — | ⚪ |
| 6 | 0 incident RGPD non notifié ≤ 72h | 100% | — | ⚪ |

**Règle de décision** : si 6/6 → GO généralisation ; si 5/6 → GO conditionnel avec plan correctif 30 jours ; si ≤ 4/6 → NO-GO et extension pilote 4 semaines.

---

## 5. Sources de Données & Scripts d'Extraction

### 5.1 Extraction hebdomadaire automatisée

Le script `scripts/pilot-kpi-extract.ts` exécute les requêtes SQL ci-dessous et génère un fichier JSON `reports/pilot-kpi-S{N}-{YYYY-MM-DD}.json` :

- `User` : `count`, `count where actif=true`, `count where createdAt >= weekStart`
- `ExamResult` : `count group by examType, passed`
- `Payment` : `count group by provider, status`, `sum amount group by provider`
- `Booking` : `count`, `avg date - createdAt`
- `FraudAlert` : `count group by severity`
- `AuditLog` : `count where eventType LIKE 'RATE_LIMIT_%' OR 'GEOBLOCK_%'`
- Prometheus range query : `avg_over_time(up[7d])`, `histogram_quantile(0.95, ...)`

### 5.2 Rapport hebdo

Le script `scripts/pilot-weekly-report.ts` consolide :
- Le JSON KPI de la semaine
- Le diff vs semaine précédente (delta absolu + %)
- Les alertes déclenchées (seuils atteints)
- Les tickets ouverts / fermés
- Le narratif chef de projet

Le rapport est généré en Markdown, converti en PDF (WeasyPrint) puis archivé dans `docs/pilote-dntt/rapports/S{N}.pdf`.

---

## 6. Calendrier de Publication

| Destinataire | Format | Délai | Canal |
|--------------|--------|-------|-------|
| Comité pilotage interne | Markdown + PDF | Lundi 09h00 | Email + Nextcloud |
| DNTT (MOA) | PDF synthèse 1 page | Lundi 12h00 | Email officiel |
| Centres pilotes | Email résumé 1 page | Mardi 09h00 | Email + WhatsApp |
| RSSI / Conformité | Dashboard Grafana live | Continu | Grafana + Slack #securite |
| Direction DNTT | Slide deck mensuel | 1er lundi mois | Réunion mensuelle |

---

## 7. Gestion des Alertes

### 7.1 Procédure seuil atteint

1. Détection automatique par le script `pilot-kpi-extract.ts` (comparaison vs seuils)
2. Génération d'un ticket GitHub `pilot-alert-{semaine}-{kpi}` automatique
3. Notification Slack canal `#pilot-alerts`
4. Le chef de projet ouvre un incident dans le registre `docs/pilote-dntt/INCIDENTS.md`
5. Plan correctif défini sous 48h, validé en comité pilotage suivant

### 7.2 Niveaux de gravité

- **Info** : seuil non atteint mais tendance sur 2 semaines → monitoring accru
- **Warning** : seuil alerte franchi → plan correctif sous 7 jours
- **Critical** : seuil critique franchi → escalation immédiate MOA + MOE + RSSI, plan correctif sous 48h, comité exceptionnel sous 72h
- **Blocker** : KPI stratégique non atteint à S8 → décision GO/NO-GO impactée

---

## 8. Archivage & Audit

- Tous les rapports hebdo sont archivés 5 ans (art. 35 Loi L/2022/018/AN)
- Les JSON KPI bruts sont versionnés dans Git (dossier `reports/`)
- Les PDF sont stockés sur Nextcloud DNTT avec accès restreint
- Le comité d'audit externe peut consulter ces données sur demande (NDA requis)

---

**Version** : 1.0
**Dernière mise à jour** : pré-pilote
**Propriétaire** : Chef de projet DNTT CodeRoute
**Validation** : MOA DNTT, MOE, RSSI
