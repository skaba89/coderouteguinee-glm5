# Post-Mortem Template — Incident CodeRoute Guinée

> **Template à remplir pour chaque incident P0, P1 ou incident RGPD notifiable**.
> Rédigé sous 5 jours ouvrés après résolution. Présenté au CPS le mardi suivant.
> Inspiré du format Google Post-Mortem (blameless, factuel, orienté actions).

---

# Post-Mortem — {Titre incident court}

**Date incident** : {YYYY-MM-DD HH:MM}
**Date résolution** : {YYYY-MM-DD HH:MM}
**Durée totale** : {n}h {n}min
**Gravité** : P0 / P1 / P2 / P3
**Rédacteur** : {Nom}
**Date rédaction** : {YYYY-MM-DD}
**Statut** : Brouillon / En revue / Validé

---

## 1. Résumé Exécutif (5 lignes max)

{Description concise de l'incident pour lecteur non technique. Exemple : "Le 23 juin 2026 entre 14h23 et 15h07, la plateforme CodeRoute a été indisponible pour 95% des candidats suite à une panne PostgreSQL primaire. Bascule réussie sur Kankan DC en 12 min. 0 donnée perdue. 3 examens en cours annulés et reprogrammés gratuitement."}

---

## 2. Chronologie Détaillée

Format : heure UTC + heure locale (GMT) — préciser le timezone.

| Heure | Événement | Source | Action |
|-------|-----------|--------|--------|
| {HH:MM} | {description événement déclencheur} | {Alerte Prometheus / Manuel / Utilisateur} | {Détection} |
| {HH:MM} | {action 1} | {Qui} | {Résultat} |
| {HH:MM} | {action 2} | {Qui} | {Résultat} |
| {HH:MM} | {résolution} | {Qui} | {Service restauré} |
| {HH:MM} | {communication externe} | {Communication} | {SMS candidats envoyés} |

---

## 3. Impact

### 3.1 Impact business

| Indicateur | Valeur |
|------------|--------|
| Utilisateurs impactés | {n} candidats, {n} centres, {n} auto-écoles |
| Transactions perdues | {n} paiements échoués, volume {GNF} |
| Examens impactés | {n} annulés, {n} reportés |
| Durée indisponibilité | {n}h {n}min |
| % traffic impacté | {%} |

### 3.2 Impact financier

| Poste | Montant (GNF) |
|-------|---------------|
| Revenu perdu (paiements échoués) | {montant} |
| Coût reprogrammation examens | {montant} |
| Coût communication (SMS/email) | {montant} |
| Coût équipe ops (heures supplémentaires) | {montant} |
| **Total** | **{total}** |

### 3.3 Impact réputation

| Indicateur | Valeur |
|------------|--------|
| Plaintes support | {n} tickets |
| Mentions presse | {n} articles |
| Réseaux sociaux | {n} mentions, {n} négatives |
| NPS impact | {avant} → {après} (si mesuré) |

### 3.4 Impact RGPD

| Question | Réponse |
|----------|---------|
| Données personnelles impliquées ? | Oui/Non |
| Violation au sens art. 33 Loi L/2022/018/AN ? | Oui/Non |
| Notification AGPD déclenchée ? | Oui/Non (si Oui : date {YYYY-MM-DD HH:MM}) |
| Notification personnes concernées ? | Oui/Non |
| Registre violations mis à jour ? | Oui/Non |

---

## 4. Cause Racine

### 4.1 Analyse 5 Pourquoi (5 Whys)

1. **Pourquoi l'incident s'est-il produit ?** — {cause immédiate}
2. **Pourquoi {cause immédiate} ?** — {cause niveau 2}
3. **Pourquoi {cause niveau 2} ?** — {cause niveau 3}
4. **Pourquoi {cause niveau 3} ?** — {cause niveau 4}
5. **Pourquoi {cause niveau 4} ?** — {cause racine}

### 4.2 Cause racine identifiée

{Description factuelle de la cause racine. Pas de blame ("l'engineer a oublié" → "le processus de revue ne vérifiait pas X").}

### 4.3 Facteurs contributifs

- {Facteur 1 : ex. documentation incomplète, alerting manquant, etc.}
- {Facteur 2}
- {Facteur 3}

### 4.4 Ce qui a bien fonctionné

- {Détection rapide par Prometheus alert}
- {Bascule automatique Kankan OK}
- {Communication transparente candidats}
- {Restauration < RTO cible}

### 4.5 Ce qui n'a pas bien fonctionné

- {Alerte non routée sur le bon canal Slack}
- {Backup restore partiellement échoué}
- {Communication interne retardée}
- {Documentation runbook incomplète}

---

## 5. Résolution

### 5.1 Actions immédiates (pendant l'incident)

| # | Action | Qui | Quand | Résultat |
|---|--------|-----|-------|----------|
| 1 | {action} | {nom} | {HH:MM} | {résultat} |

### 5.2 Solution temporaire (workaround)

{Description de la solution temporaire appliquée pendant l'incident. Exemple : "Bascule traffic vers Kankan DC, capacité réduite 50%."}

### 5.3 Solution permanente

{Description de la solution permanente appliquée après l'incident. Exemple : "Mise à jour PostgreSQL 16.4 → 16.5 (correctif bug), surveillance accrue lag réplication."}

---

## 6. Actions Correctives

### 6.1 Actions immédiates (≤ 7 jours)

| # | Action | Responsable | Échéance | Statut | Ticket GitHub |
|---|--------|-------------|----------|--------|---------------|
| 1 | {action corrective} | {qui} | {date} | À faire / En cours / Fait | #{n} |

### 6.2 Actions court terme (≤ 30 jours)

| # | Action | Responsable | Échéance | Statut | Ticket GitHub |
|---|--------|-------------|----------|--------|---------------|
| 1 | {action} | {qui} | {date} | À faire | #{n} |

### 6.3 Actions long terme (≤ 90 jours)

| # | Action | Responsable | Échéance | Statut | Ticket GitHub |
|---|--------|-------------|----------|--------|---------------|
| 1 | {action} | {qui} | {date} | À faire | #{n} |

### 6.4 Risques résiduels acceptés

| Risque | Justification | Validé par | Date revue |
|--------|---------------|------------|------------|
| {risque résiduel} | {justification} | {RSSI / Directeur} | {date} |

---

## 7. Leçons Apprises

### 7.1 Leçons techniques

- {Leçon 1 : ex. "Le seuil d'alerte PostgreSQL lag était trop permissif (30s vs 5s)"}
- {Leçon 2}
- {Leçon 3}

### 7.2 Leçons processus

- {Leçon 1 : ex. "Le runbook PostgresDown ne mentionnait pas le cas spécifique de corruption WAL"}
- {Leçon 2}

### 7.3 Leçons organisationnelles

- {Leçon 1 : ex. "L'astreinte MOE n'était pas joignable sur Slack mobile (notification silencieuse)"}
- {Leçon 2}

### 7.4 Leçons communication

- {Leçon 1 : ex. "Le template SMS candidat en Pular n'était pas prêt, délai de 30 min pour traduction"}
- {Leçon 2}

---

## 8. Mise à Jour Documentation

| Document | Modification | Responsable | Échéance |
|----------|--------------|-------------|----------|
| `docs/ops/OPS-RUNBOOK.md` | Ajout scénario {X} | {qui} | {date} |
| `docs/audit-externe/REGISTRE-VIOLATIONS.md` | Mise à jour si RGPD | {RSSI} | {date} |
| `docs/ops/PCA-PRA.md` | Mise à jour RTO/RPO réels | {MOE} | {date} |
| Monitoring | Nouvelle alerte {X} | {MOE} | {date} |
| Formation | Session {X} pour équipe | {MOE} | {date} |

---

## 9. Annexes

### 9.1 Captures d'écran / Logs

- {Capture Grafana pendant incident}
- {Logs Loki pertinents}
- {Alertes Slack reçues}
- {SMS envoyés aux candidats}

### 9.2 Références

- Runbook appliqué : `docs/ops/OPS-RUNBOOK.md` §{section}
- Procédure AGPD : `docs/audit-externe/modele-notification-agpd.md`
- Communication : `docs/pilote-dntt/PLAN-COMMUNICATION.md` §{section}

### 9.3 participants

- **Incident commander** : {Nom}
- **Communications lead** : {Nom}
- **Operations** : {Nom}
- **SME (Subject Matter Expert)** : {Nom}
- **Scribe** : {Nom}

---

## 10. Validation

| Rôle | Nom | Date | Signature (email) |
|------|-----|------|-------------------|
| Rédacteur | {nom} | {date} | {email} |
| RSSI | {nom} | {date} | {email} |
| MOE | {nom} | {date} | {email} |
| Directeur DNTT (si P0) | {nom} | {date} | {email} |

---

## 11. Diffusion & Archivage

- **Diffusion** : Comité Pilotage Sécurité (mardi suivant), Direction DNTT, équipe ops
- **Classification** : Confidentiel DNTT (sauf si communicable)
- **Archivage** : `docs/gouvernance/post-mortems/{YYYY-MM-DD}-{titre}.md` — 5 ans
- **Version publique** (si communication externe) : `docs/audit-externe/public/{titre}.md` (anonymisée)

---

## Rappel — Principes Post-Mortem (Blameless)

1. **Blameless** : on analyse les systèmes et processus, pas les personnes
2. **Factuel** : descriptions précises, pas de jugement
3. **Orienté actions** : chaque leçon débouche sur une action concrète
4. **Transparence** : le post-mortem est partageable en interne sans restriction
5. **Suivi** : les actions sont tracées jusqu'à clôture effective
6. **Apprentissage** : capitalisation dans `LECONS-APPRIS.md`

---

**Version template** : 1.0
**Propriétaire** : RSSI
**Validation** : Directeur DNTT
