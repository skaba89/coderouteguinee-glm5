# CodeRoute Guinée — Plan de Remédiation Audit Externe

> **Template de suivi** pour intégrer les constats de l'audit externe dans le cycle de vie du projet.
>
> Source : rapport final de l'auditeur (cf. `docs/audit-externe/MANUEL-AUDITEUR.md`)
> Propriétaire : RSSI DNTT
> Mise à jour : hebdomadaire (lundi 09h, comité de pilotage sécurité)

---

## Sommaire

1. [Méthodologie de remédiation](#méthodologie-de-remédiation)
2. [Tableau de bord consolidé](#tableau-de-bord-consolidé)
3. [Détail des constats](#détail-des-constats)
4. [Calendrier de remédiation](#calendrier-de-remédiation)
5. [Validation et clôture](#validation-et-clôture)

---

## Méthodologie de remédiation

### Workflow de traitement d'un constat

```
Constat dans le rapport d'audit
        ↓
[T+0]  Création ticket GitHub (label "audit-finding")
        ↓
[T+1]  Analyse par Tech Lead + RSSI (impact réel, exploitabilité)
        ↓
[T+3]  Décision : Accepter / Corriger / Contourner
        ↓
[T+x]  Si correction : implémentation + tests + revue de code
        ↓
[T+x+7] Déploiement en staging + validation auditeur
        ↓
[T+x+14] Déploiement en production
        ↓
[T+x+21] Clôture du constat (rapport de remédiation)
```

### Critères de priorisation

| Priorité | Définition                                                                 | Délai correction |
|----------|---------------------------------------------------------------------------|------------------|
| **P0**   | Critique — exploitation possible, impact fort sur PII ou disponibilité    | 7 jours          |
| **P1**   | Élevée — exploitation possible en chaîne, ou impact modéré isolé          | 30 jours         |
| **P2**   | Moyenne — exploitation difficile, impact limité                            | 90 jours         |
| **P3**   | Basse — durcissement, défense en profondeur                                | 180 jours        |
| **P4**   | Information — aucune action corrective prévue (justification requise)     | —                |

### Statuts possibles

- `OPEN` — Constat identifié, non encore traité
- `IN_PROGRESS` — Correction en cours de développement
- `REVIEW` — PR en cours de revue
- `STAGING` — Déployé en staging, validation en cours
- `PROD` — Déployé en production
- `VERIFIED` — Validé par l'auditeur (revue de remédiation)
- `CLOSED` — Clôturé (validation + recul opérationnel ≥ 30 jours)
- `ACCEPTED` — Risque accepté formellement ( Sponsor DNTT + DPO)

---

## Tableau de bord consolidé

> **Note** : remplir ce tableau à partir du rapport final de l'auditeur. Les lignes ci-dessous sont des exemples.

| ID      | Catégorie     | Sévérité | Statut      | Propriétaire | Échéance     | CVE/CVSS      |
|---------|---------------|----------|-------------|--------------|--------------|---------------|
| A-001   | Auth          | Critique | OPEN        | Tech Lead    | 2026-07-01   | 9.8           |
| A-002   | Auth          | Élevée   | OPEN        | Tech Lead    | 2026-07-15   | 7.5           |
| A-003   | Injection     | Élevée   | OPEN        | RSSI         | 2026-07-15   | 7.2           |
| A-004   | Configuration | Moyenne  | OPEN        | Ops          | 2026-08-15   | 5.3           |
| A-005   | RGPD          | Élevée   | OPEN        | DPO          | 2026-07-15   | N/A           |
| A-006   | Dependencies  | Moyenne  | OPEN        | Tech Lead    | 2026-08-15   | CVE-2026-1234 |
| A-007   | Logging       | Basse    | OPEN        | Ops          | 2026-11-15   | 3.1           |
| A-008   | WAF           | Basse    | OPEN        | RSSI         | 2026-11-15   | 2.4           |
| ...     | ...           | ...      | ...         | ...          | ...          | ...           |

### Synthèse automatique

```bash
# Compter par sévérité et statut (à intégrer dans le rapport hebdo)
./scripts/audit-remediation-stats.sh
```

Output attendu :

```
SÉVÉRITÉ       TOTAL   OPEN    IN_PROGRESS   CLOSED
Critique       1       1       0             0
Élevée         3       3       0             0
Moyenne        2       2       0             0
Basse          2       2       0             0
Information    0       0       0             0
TOTAL          8       8       0             0

TAUX DE REMÉDIATION : 0%
```

---

## Détail des constats

> Pour chaque constat du rapport d'audit, créer une entrée avec le format ci-dessous.
> Remplacer les placeholders `<...>` par les informations du rapport.

### A-001 — [Titre court du constat]

**Catégorie** : Authentification
**Sévérité** : Critique (CVSS 9.8)
**Statut** : OPEN
**Propriétaire** : Tech Lead
**Échéance** : 2026-07-01

#### Description

> Recopier ici la description exacte du rapport d'audit (citation).

#### Impact

> Décrire l'impact potentiel : quelles données, quels utilisateurs, quel scénario d'exploitation.

#### Preuve de concept

> Recopier la PoC de l'auditeur (payload, commandes, captures).

#### Localisation

- Fichier(s) : `src/lib/session.ts:42-58`
- Endpoint(s) : `POST /api/auth/login`
- Environnement(s) : Staging + Production

#### Cause racine

> Après analyse technique, décrire la cause racine (pas seulement le symptôme).

#### Plan de correction

1. **Correctif immédiat** (T+1 jour) : [description]
2. **Correctif structurel** (T+7 jours) : [description]
3. **Test de non-régression** : [description du test ajouté]
4. **Vérification auditeur** : [description du test à fournir à l'auditeur]

#### Risque résiduel

> Après correction, quel risque subsiste ? Niveau résiduel + justification.

#### Décision de risque accepté

Si le risque résiduel est accepté (et non corrigé complètement) :

- **Décision par** : Sponsor DNTT + DPO + RSSI
- **Date de décision** : AAAA-MM-JJ
- **Justification** : [pourquoi on accepte]
- **Mesure compensatoire** : [ce qu'on met en place à la place]
- **Date de révision** : AAAA-MM-JJ (réévaluer dans 6 mois)

#### Références

- Ticket GitHub : #123
- PR : #124
- Commit : abc1234
- Déploiement staging : 2026-06-25 14h30 GMT
- Déploiement prod : 2026-06-28 10h00 GMT
- Validation auditeur : [date + nom]

---

### A-002 — [Titre court]

*(Reproduire le même template pour chaque constat)*

---

## Calendrier de remédiation

### Vue Gantt simplifiée

```
                    Juin 2026              Juillet 2026           Août 2026
Semaine            S1  S2  S3  S4          S1  S2  S3  S4          S1  S2  S3  S4
A-001 (P0)         ▓▓▓▓▓▓▓
A-002 (P1)             ▓▓▓▓▓▓▓▓▓▓▓▓
A-003 (P1)             ▓▓▓▓▓▓▓▓▓▓▓▓
A-004 (P2)                     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
A-005 (P1)             ▓▓▓▓▓▓▓▓▓▓▓▓
A-006 (P2)                     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
A-007 (P3)                                                 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
A-008 (P3)                                                 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
```

### Jalons clés

| Date         | Jalon                                                    | Critère de sortie                |
|--------------|----------------------------------------------------------|----------------------------------|
| 2026-07-01   | Tous les P0 corrigés en prod                             | Validation auditeur              |
| 2026-07-15   | Tous les P1 corrigés en prod                             | Validation auditeur              |
| 2026-08-15   | Tous les P2 corrigés en prod                             | Validation auditeur              |
| 2026-09-01   | Rapport de remédiation v1 transmis à l'AGPD              | Sign-off DPO                     |
| 2026-11-15   | Tous les P3 traités (corrigés ou risque accepté)         | Comité sécurité                  |
| 2027-02-15   | Bilan annuel remédiation (90 jours après clôture P3)     | Comité sécurité + AGPD           |

### Comité de pilotage sécurité

- **Fréquence** : hebdomadaire (lundi 09h-10h GMT)
- **Participants** : Sponsor DNTT, RSSI, DPO, Tech Lead, Ops, Auditeur (si besoin)
- **Ordre du jour type** :
  1. Revue des constats OPEN (avancement, blocages)
  2. Décisions de risque accepté
  3. Planning des déploiements de la semaine
  4. Retours de l'auditeur (le cas échéant)
  5. Préparation du rapport mensuel AGPD

---

## Validation et clôture

### Critères de clôture d'un constat

Un constat ne peut être clôturé (`CLOSED`) que si :

1. **Correctif déployé en production** depuis ≥ 30 jours
2. **Aucune régression** observée durant cette période
3. **Test de non-régression** ajouté à la CI et passant
4. **Validation de l'auditeur** obtenue par écrit
5. **Mise à jour de l'AIPD** si le constat impacte les mesures de sécurité décrites

### Procédure de clôture

```bash
# 1. Créer le rapport de remédiation
./scripts/generate-remediation-report.sh A-001

# 2. Soumettre à l'auditeur pour validation
# (email avec PDF du rapport + accès staging pour re-test)

# 3. Après validation auditeur, mettre à jour le statut
# Dans ce fichier : changer "OPEN" → "VERIFIED"
# Puis après 30 jours : "VERIFIED" → "CLOSED"

# 4. Mettre à jour le registre des violations AGPD si applicable
# docs/audit-externe/REGISTRE-VIOLATIONS.md
```

### Rapport final de remédiation

À l'issue du traitement de tous les constats (ou au plus tard 6 mois après remise du rapport d'audit), le RSSI établit un **rapport final de remédiation** comprenant :

1. Synthèse globale (taux de remédiation par sévérité)
2. Liste des constats clôturés (avec preuves de correction)
3. Liste des risques acceptés (avec justifications)
4. Liste des constats en cours (avec planning réel vs planning prévu)
5. Bilan des améliorations structurelles apportées
6. Recommandations pour les futurs audits

Ce rapport est :

- Transmis au **Sponsor DNTT** pour validation
- Communiqué à l'**AGPD** dans le cadre du suivi réglementaire
- Archivé pendant **5 ans** (article 35 — registre des violations)

---

## Annexes

### Annexe 1 — Templates de communication à l'auditeur

#### Email — Notification de correction d'un constat

```
Objet: [CodeRoute Guinée] Constat A-001 corrigé — demande de re-test

Bonjour {NOM_AUDITEUR},

Nous vous informons que le constat A-001 ("{TITRE_COURT}") a été corrigé
sur l'environnement de staging.

Résumé du correctif :
- Fichier(s) modifié(s) : src/lib/session.ts
- PR : https://github.com/skaba89/coderouteguinee-glm5/pull/124
- Déploiement staging : 2026-06-25 14h30 GMT
- Tests de non-régression : 5 tests ajoutés (passent en CI)

Nous vous invitons à procéder au re-test sur l'environnement staging
(URL : https://staging.coderoute.gov.gn). Votre accès reste valide jusqu'au
{DATE_FIN_ACCES}.

Merci de bien vouloir nous confirmer la validation (ou non) du correctif
dans un délai de 7 jours.

Cordialement,

{NOM_RSSI}
RSSI — CodeRoute Guinée
```

#### Email — Demande d'acceptation de risque

```
Objet: [CodeRoute Guinée] Constat A-007 — Demande d'acceptation de risque

Bonjour {NOM_DIRECTEUR_DNTT},

Suite à l'audit externe conduit par {CABINET_AUDIT}, le constat A-007
("{TITRE_COURT}", sévérité Basse CVSS 3.1) a été identifié.

Après analyse technique, nous recommandons d'accepter ce risque
plutôt que de procéder à la correction, pour les raisons suivantes :

1. [Justification technique]
2. [Justification économique]
3. [Justification opérationnelle]

Mesures compensatoires proposées :
- [Mesure 1]
- [Mesure 2]

Coût estimé de la correction : [montant + durée]
Coût estimé du risque résiduel : [montant estimé en cas d'exploitation]

Merci de bien vouloir valider cette décision dans un délai de 15 jours.
En cas d'acceptation, le risque sera réévalué dans 6 mois.

Cordialement,

{NOM_RSSI}
RSSI — CodeRoute Guinée
```

### Annexe 2 — Métriques de suivi

| Métrique                                | Cible    | Fréquence  |
|-----------------------------------------|----------|------------|
| Taux de remédiation (P0 + P1)           | 100%     | Mensuelle  |
| Délai moyen de correction (P0)          | < 7 jours| Mensuelle  |
| Délai moyen de correction (P1)          | < 30 jours| Mensuelle |
| Taux de régression post-correctif       | < 5%     | Mensuelle  |
| Nombre de risques acceptés              | < 10% du total | Mensuelle |
| Taux de validation auditeur             | ≥ 90%    | Mensuelle  |

### Annexe 3 — Liens utiles

- Dépôt GitHub : https://github.com/skaba89/coderouteguinee-glm5
- Tableau Trello / GitHub Projects : [à configurer]
- Rapport d'audit original : `docs/audit-externe/rapport-final-v1.0.pdf` (à déposer après remise)
- Registre des violations AGPD : `docs/audit-externe/REGISTRE-VIOLATIONS.md`
- AIPD : `docs/AIPD.md`
