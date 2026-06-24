# Charte du Comité de Pilotage Sécurité — CodeRoute Guinée

> **Gouvernance hebdomadaire sécurité** du projet CodeRoute Guinée.
> Le comité se réunit chaque **mardi 14h00-15h30** pendant toute la durée du pilote DNTT (8 semaines) et de l'audit externe (45 jours), puis mensuellement en régime nominal.

---

## 1. Objet & Mandat

### 1.1 Objet

Le Comité de Pilotage Sécurité (CPS) est l'instance décisionnelle hebdomadaire chargée de :
- Surveiller la posture de sécurité globale de CodeRoute Guinée
- Piloter l'exécution du plan d'audit externe
- Piloter la remédiation des vulnérabilités identifiées
- Valider les décisions de sécurité impactant le pilote DNTT
- Arbitrer les acceptations de risque résiduel
- Préparer les décisions GO/NO-GO pour la direction

### 1.2 Mandat

Le CPS a autorité pour :
- ✅ Valider les plans de remédiation et leurs délais
- ✅ Décider l'activation/désactivation des contrôles sécurité (WAF, géoblocage, rate limiting)
- ✅ Arbitrer les acceptations de risque P3 et inférieur
- ✅ Déclencher les procédures d'incident (réunion exceptionnelle, communication)
- ✅ Valider les communications aux personnes concernées (RGPD art. 33-34)
- ❌ Pas d'autorité sur les acceptations P0/P1 (réservées à la direction DNTT)
- ❌ Pas d'autorité budgétaire au-delà de 5M GNF (réservée à la direction)

### 1.3 Période d'activité

- **Phase active** : du J-7 (pré-pilote) à J+63 (fin pilote + décision GO/NO-GO)
- **Phase transition** : 3 mois post-pilote (mensuel)
- **Phase nominale** : trimestriel ensuite

---

## 2. Composition

### 2.1 Membres permanents (présence obligatoire)

| Rôle | Organisation | Responsabilité |
|------|--------------|----------------|
| Président | RSSI DNTT CodeRoute | Animation, décisions, reporting direction |
| MOA | DNTT | Besoins métier, priorisation, validation communications |
| MOE | Prestataire Tech Lead | Exécution technique, remédiation, planning |
| Chef projet | DNTT / MOE | Coordination pilote, KPI, suivi |
| Auditeur principal | Cabinet d'audit externe | Avancement audit, constats, recommandations (invité Phase 1-6 audit) |

### 2.2 Membres invités (selon ordre du jour)

| Rôle | Quand |
|------|-------|
| Directeur DNTT | Décisions P0/P1, GO/NO-GO |
| Représentant AGPD | Si incident RGPD notifiable |
| Représentant centres pilotes | Si impact opérationnel centres |
| Juriste DNTT | Si questions légales / conventions |
| Communication DNTT | Si communication externe requise |
| Expert cybersécurité externe | Si besoin expertise ponctuelle |

### 2.3 Quorum

- **Quorum minimum** : 3 membres permanents dont obligatoirement RSSI + (MOA ou MOE)
- En cas d'absence du président : vice-président (MOE) anime
- Décisions validées à la majorité simple, voix prépondérante du président en cas d'égalité

---

## 3. Réunions

### 3.1 Calendrier type

| Jour | Heure | Durée | Lieu |
|------|-------|-------|------|
| Mardi | 14h00-15h30 | 90 min | Salle réunion DNTT + visio |
| Exceptionnel | Selon besoin | 30-60 min | Visio |

### 3.2 Ordre du jour type (90 min)

| Tranche | Durée | Objet |
|---------|-------|-------|
| 1. Ouverture | 5 min | Présents, excusés, validation PV précédent |
| 2. KPI sécurité semaine | 15 min | Tableau bord sécurité (cf. §4) |
| 3. Incidents de la semaine | 15 min | Revue incidents, statut, leçons |
| 4. Avancement audit externe | 15 min | % avancement, constats semaine, blocages |
| 5. Avancement remédiation | 15 min | Tickets ouverts/fermés, P0/P1 prioritaires |
| 6. Décisions à prendre | 15 min | Acceptations risque, activations contrôles |
| 7. Communications | 5 min | Internes, externes, personnes concernées |
| 8. Divers & questions | 5 min | Open floor |

### 3.3 Préparation (chaque participant)

- **Lundi 17h00** : envoi des éléments d'ordre du jour au président
- **Mardi 09h00** : envoi ordre du jour final + documents à tous les membres
- **Mardi 12h00** : chaque membre a lu les documents

### 3.4 Restitution

- **Mercredi 12h00** : PV de réunion envoyé (décisions, actions, responsables, délais)
- **Jeudi 09h00** : synthèse 1 page envoyée à direction DNTT (sauf confidentiel)

---

## 4. Tableau de Bord Sécurité Hebdomadaire

### 4.1 Indicateurs revus chaque mardi

#### Sécurité opérationnelle

| Indicateur | Source | Seuil vert | Seuil rouge |
|------------|--------|------------|-------------|
| Tentatives connexion échouées (7j) | AuditLog | < 100 | > 500 |
| Comptes bloqués (rate limit) | Redis | < 10 | > 50 |
| IP bannies (geo/WAF) | Nginx logs | < 30 | > 100 |
| Alertes WAF ModSecurity | WAF logs | < 20 | > 100 |
| Alertes fraude examen | FraudAlert | < 5 | > 15 |
| Vulnérabilités ouvertes (audit) | PLAN-REMEDIATION.md | < 5 | > 15 |
| Tickets sécurité ouverts | GitHub | < 10 | > 30 |
| Disponibilité plateforme (7j) | Prometheus | ≥ 99.5% | < 99% |

#### Conformité RGPD

| Indicateur | Source | Seuil vert | Seuil rouge |
|------------|--------|------------|-------------|
| Incidents RGPD ouverts (≤ 72h) | REGISTRE-VIOLATIONS.md | 0 | ≥ 1 |
| Demandes droits personnes (en attente > 30j) | Tickets | 0 | ≥ 1 |
| Notifications AGPD en retard | REGISTRE | 0 | ≥ 1 |
| Audits accès sensibles ( anomalies) | AuditLog | 0 | ≥ 1 |

#### Audit externe

| Indicateur | Source | Cible |
|------------|--------|-------|
| Avancement phase en cours | Calendar | % prévu |
| Constats cumulés | Rapports | suivi P0-P4 |
| Constats remédiés | GitHub | trend |
| Blocages auditeur | Sync hebdo | 0 |
| Jours restants | Calendar | countdown |

### 4.2 Format de restitution

Le président présente un dashboard Grafana live (10 min) puis commentaires (5 min).

---

## 5. Processus Décisionnels

### 5.1 Matrice de décision par sévérité

| Sévérité | Décidé par | Délai correction | Communication |
|----------|------------|------------------|---------------|
| P0 (CVSS ≥ 9) | Direction DNTT | 48h | Immédiate interne + AGPD si RGPD |
| P1 (CVSS 7-8.9) | CPS | 7 jours | Interne CPS |
| P2 (CVSS 4-6.9) | CPS | 30 jours | Suivi hebdo |
| P3 (CVSS 0-3.9) | MOE | 90 jours | Reporting mensuel |
| P4 (information) | MOE | Pas de délai | Documentation |

### 5.2 Procédure acceptation de risque

1. **Identification** : MOE identifie un risque résiduel après remédiation
2. **Documentation** : fiche risque (description, impact, probabilité, mesures compensatoires)
3. **Présentation CPS** : analyse coût/bénéfice de la remédiation complémentaire
4. **Décision** :
   - P3 et inférieur : CPS peut accepter (majorité)
   - P2 : CPS recommande, direction valide
   - P0/P1 : Direction seule peut accepter
5. **Traçabilité** : registre des risques acceptés dans `docs/gouvernance/REGISTRE-RISQUES.md`
6. **Revue** : revue trimestrielle des risques acceptés

### 5.3 Procédure urgence (incident en cours)

1. Détection (automatique ou manuelle)
2. Notification immédiate Slack `#securite-incident`
3. Réunion exceptionnelle CPS sous 1h (présents minimum : RSSI + MOE + 1 autre)
4. Décision de confinement
5. Exécution procédure `runbook-incident-agpd.md`
6. Communication selon gravité
7. Post-mortem sous 5 jours ouvrés

---

## 6. Documentation & Traçabilité

### 6.1 Documents vivants

| Document | Localisation | Mise à jour |
|----------|--------------|-------------|
| PV des réunions CPS | `docs/gouvernance/pv/` | Hebdo |
| Registre des risques acceptés | `docs/gouvernance/REGISTRE-RISQUES.md` | Sur décision |
| Registre des violations RGPD | `docs/audit-externe/REGISTRE-VIOLATIONS.md` | Sur incident |
| Plan de remédiation audit | `docs/audit-externe/PLAN-REMEDIATION.md` | Hebdo |
| Suivi KPI sécurité | Grafana dashboard | Temps réel |
| Comptes rendus sync audit | `docs/audit-externe/sync/` | Hebdo |

### 6.2 Archivage

- PV et décisions : 10 ans (responsabilité MOA)
- Registre violations : 5 ans (art. 35 Loi L/2022/018/AN)
- Risques acceptés : 5 ans après fermeture du risque
- Logs techniques : 90 jours (Loki)

### 6.3 Confidentialité

- PV de réunion : Confidentiel DNTT (diffusion restreinte membres + direction)
- Constats audit avant remédiation : Confidentiel auditeur + RSSI + MOE uniquement
- Rapports audit finaux : Confidentiel DNTT + cabinet + AGPD (sur demande)
- Communications externes : validées par direction DNTT

---

## 7. Communication

### 7.1 Canaux internes équipe

- **Slack `#securite`** : discussions techniques, alertes non urgentes
- **Slack `#securite-incident`** : incidents en cours (urgence)
- **Email `securite@dntt.gouv.gn`** : communications officielles, PV
- **Nextcloud `gouvernance/`** : documents partagés
- **Téléphone rouge RSSI** : urgences critiques 24/7

### 7.2 Escalade direction

| Événement | Délai | Canal |
|-----------|-------|-------|
| Incident P0 en cours | Immédiat | Tel direct Directeur |
| Vulnérabilité P0 audit | < 4h | Email + tel |
| Incident RGPD notifiable | < 4h | Email officiel + tel |
| Décision GO/NO-GO | Selon planning | Réunion formelle |
| Rapport hebdo synthèse | Jeudi 09h00 | Email |

### 7.3 Communication externe

- Toute communication externe (presse, partenaires, AGPD) est validée par :
  1. Rédaction par RSSI ou communication
  2. Validation juridique (juriste DNTT)
  3. Validation direction DNTT
  4. Diffusion

---

## 8. Revue & Amélioration Continue

### 8.1 Rétrospective mensuelle

Le premier mardi de chaque mois, 30 min supplémentaires (16h00-16h30) :
- Ce qui a bien fonctionné (3 points)
- Ce qui n'a pas fonctionné (3 points)
- Actions d'amélioration (3 max, assignées)
- Mise à jour de la présente charte si nécessaire

### 8.2 Indicateurs d'efficacité du CPS

| Indicateur | Cible | Mesure |
|------------|-------|--------|
| Taux de présence membres permanents | ≥ 80% | Trimestriel |
| % décisions exécutées dans les délais | ≥ 90% | Mensuel |
| Délai moyen remédiation P1 | ≤ 7 jours | Mensuel |
| Délai moyen remédiation P2 | ≤ 30 jours | Mensuel |
| Nombre d'incidents mal gérés (post-mortem) | 0 | Trimestriel |

### 8.3 Audit du CPS

Tous les 6 mois, le CPS fait l'objet d'une auto-évaluation :
- Questionnaire anonyme aux membres
- Synthèse par le président
- Plan d'amélioration formalisé
- Présentation à la direction

---

## 9. Liens avec les Autres Instances

| Instance | Relation | Fréquence |
|----------|----------|-----------|
| Comité pilotage DNTT (lundi 10h) | Le CPS lui remonte synthèse sécurité | Hebdo |
| Comité pilotage pilote (vendredi 16h) | Le CPS lui remonte incidents/risques impactant pilote | Hebdo |
| Direction DNTT (mensuel) | Reporting sécurité + décisions P0/P1 | Mensuel |
| Ministère des Transports (trimestriel) | Synthèse sécurité si generalisation | Trimestriel |
| AGPD (sur demande) | Cooperation sur incidents RGPD | Ad hoc |

---

## 10. Annexe — Modèle PV de Réunion

```markdown
# PV CPS — {Date}

## Présents
- {Nom} ({Rôle})
- ...

## Excusés
- {Nom} ({Rôle})

## Ordre du jour
1. KPI sécurité
2. Incidents
3. Avancement audit
4. Avancement remédiation
5. Décisions
6. Communications

## Discussions & décisions

### 1. KPI sécurité
- {Synthèse 5 lignes}
- Décision : {décision ou néant}

### 2. Incidents
- {Synthèse}
- Décision : {décision}

[...]

## Actions

| # | Action | Responsable | Délai | Statut |
|---|--------|-------------|-------|--------|
| 1 | {action} | {qui} | {date} | À faire |

## Prochaine réunion
{Date} à 14h00, salle {lieu}
```

---

**Version** : 1.0
**Date d'application** : à partir du lancement du pilote DNTT
**Propriétaire** : RSSI DNTT CodeRoute
**Validation** : Directeur DNTT, MOA, MOE
**Prochaine révision** : 3 mois après lancement pilote
