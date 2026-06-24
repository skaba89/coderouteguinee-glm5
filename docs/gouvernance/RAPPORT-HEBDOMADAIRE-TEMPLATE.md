# Rapport Hebdomadaire Sécurité — Template

> **Template à remplir chaque mardi 12h00** par le RSSI pour le comité de pilotage sécurité.
> Diffusion : membres CPS + direction DNTT (synthèse).
> Archivage : `docs/gouvernance/rapports/S{AAAA}-S{N}.md`.

---

# Rapport Hebdomadaire Sécurité — S{AAAA}-S{N}

**Période** : du {lundi J-7} au {dimanche J}
**Rédacteur** : {Nom RSSI}
**Date rédaction** : {mardi J+1}
**Statut global** : 🟢 Vert / 🟡 Orange / 🔴 Rouge

---

## 1. Synthèse Exécutive (5 lignes max)

{Résumé exécutif pour direction. Exemple : "Semaine calme côté sécurité. 1 vulnérabilité P2 remédiée (audit). 3 tentatives phishing bloquées par WAF. Audit externe Phase 3 en cours, 28/35 scénarios testés, 0 P0 trouvé. Plateforme stable 99.7%."}

---

## 2. KPI Sécurité — Tableau de Bord

### 2.1 Indicateurs opérationnels

| Indicateur | Cette semaine | Semaine précédente | Tendance | Seuil | Statut |
|------------|---------------|--------------------|----|--------|--------|
| Tentatives connexion échouées | {n} | {n-1} | ↑/↓/→ | < 100 | 🟢/🟡/🔴 |
| Comptes bloqués (rate limit) | {n} | {n-1} | | < 10 | |
| IP bannies (geo/WAF) | {n} | {n-1} | | < 30 | |
| Alertes WAF ModSecurity | {n} | {n-1} | | < 20 | |
| Alertes fraude examen | {n} | {n-1} | | < 5 | |
| Vulnérabilités ouvertes (audit) | {n} | {n-1} | | < 5 | |
| Tickets sécurité ouverts | {n} | {n-1} | | < 10 | |
| Disponibilité plateforme (7j) | {%} | {%} | | ≥ 99.5% | |

### 2.2 Indicateurs conformité RGPD

| Indicateur | Cette semaine | Statut |
|------------|---------------|--------|
| Incidents RGPD ouverts (≤ 72h) | {n} | 🟢/🔴 |
| Demandes droits personnes en attente > 30j | {n} | 🟢/🔴 |
| Notifications AGPD en retard | {n} | 🟢/🔴 |
| Audits accès sensibles (anomalies) | {n} | 🟢/🔴 |

### 2.3 Indicateurs audit externe

| Indicateur | Valeur | Cible |
|------------|--------|-------|
| Phase en cours | Phase {X} — {nom} | — |
| Avancement global | {%} | 100% à J+45 |
| Jours restants | {J} | — |
| Constats cumulés | {total} (P0:{n} P1:{n} P2:{n} P3:{n} P4:{n}) | — |
| Constats cette semaine | {n} | — |
| Constats remédiés | {n} / {total} | — |
| Blocages auditeur | {liste ou néant} | 0 |

---

## 3. Incidents de la Semaine

### 3.1 Incidents actifs (ouverts cette semaine ou non clôturés)

| # | Date | Sévérité | Description | Statut | Responsable | ETA clôture |
|---|------|----------|-------------|--------|-------------|-------------|
| {id} | {date} | P{n} | {desc} | En cours / Contenu / Clôturé | {qui} | {date} |

### 3.2 Incidents clôturés cette semaine

| # | Date ouverture | Date clôture | Durée | Description | Actions correctives | Post-mortem |
|---|----------------|--------------|-------|-------------|---------------------|-------------|
| {id} | {date} | {date} | {n}h | {desc} | {résumé} | Lien |

### 3.3 Leçons apprises (si post-mortem réalisé)

- **{Leçon 1}** : {description} → {action préventive}
- **{Leçon 2}** : ...

---

## 4. Avancement Audit Externe

### 4.1 Phase en cours

- **Phase** : {numéro} — {nom}
- **Jours écoulés / total** : {n} / {n}
- **Avancement** : {%}
- **Activités réalisées cette semaine** :
  - {activité 1}
  - {activité 2}
- **Prochaines étapes** : {résumé}

### 4.2 Constats importants de la semaine

| # | Sévérité | Description | Statut remédiation |
|---|----------|-------------|---------------------|
| {id} | P{n} | {desc courte} | À remédier / En cours / Remédié / Re-test OK |

### 4.3 Blocages & escalations

- {Blocage 1 ou néant}
- {Escalation 1 ou néant}

---

## 5. Avancement Remédiation

### 5.1 Vue consolidée

| Sévérité | Total | Ouverts | En cours | Remédiés | Re-test OK | Taux remédiation |
|----------|-------|---------|----------|----------|------------|------------------|
| P0 | {n} | {n} | {n} | {n} | {n} | {%} |
| P1 | {n} | {n} | {n} | {n} | {n} | {%} |
| P2 | {n} | {n} | {n} | {n} | {n} | {%} |
| P3 | {n} | {n} | {n} | {n} | {n} | {%} |
| P4 | {n} | {n} | {n} | {n} | {n} | {%} |
| **Total** | {n} | {n} | {n} | {n} | {n} | {%} |

### 5.2 Remédiations clôturées cette semaine

| # | Sévérité | Description | Effort (jh) | Validé par |
|---|----------|-------------|-------------|------------|
| {id} | P{n} | {desc} | {n} | {qui} |

### 5.3 Remédiations en retard

| # | Sévérité | Délai initial | Retard | Cause | Plan de rattrapage |
|---|----------|---------------|--------|-------|-------------------|
| {id} | P{n} | {date} | {n}j | {cause} | {plan} |

---

## 6. Décisions du Comité (mardi 14h00)

### 6.1 Décisions prises cette semaine

| # | Sujet | Décision | Responsable | Délai exécution |
|---|-------|----------|-------------|------------------|
| 1 | {sujet} | {décision} | {qui} | {date} |

### 6.2 Risques acceptés cette semaine

| # | Risque | Sévérité | Justification | Décidé par | Suivi |
|---|--------|----------|---------------|------------|-------|
| 1 | {risque} | P{n} | {justif} | {qui} | {date revue} |

### 6.3 Décisions en attente (à traiter prochaine réunion)

- {décision 1}
- {décision 2}

---

## 7. Communications

### 7.1 Internes

| Cible | Canal | Objet | Date | Statut |
|-------|-------|-------|------|--------|
| Direction DNTT | Email | {sujet} | {date} | Envoyé / En prép |
| Équipe MOE | Slack | {sujet} | {date} | Envoyé |
| Centres pilotes | WhatsApp | {sujet} | {date} | Envoyé |

### 7.2 Externes

| Cible | Canal | Objet | Date | Statut | Validation |
|-------|-------|-------|------|--------|------------|
| AGPD | Email officiel | {sujet} | {date} | Envoyé | {qui} |
| Presse | Communiqué | {sujet} | {date} | En prép | Direction |
| Personnes concernées | Email/SMS | {sujet} | {date} | Envoyé | {qui} |

### 7.3 Communications prévues semaine prochaine

- {comm 1}
- {comm 2}

---

## 8. Actions en Cours

### 8.1 Actions sécurité en cours

| # | Action | Responsable | Échéance | Avancement | Blocage |
|---|--------|-------------|----------|------------|---------|
| 1 | {action} | {qui} | {date} | {%} | {non/oui} |

### 8.2 Nouvelles actions de la semaine

- {action 1}
- {action 2}

### 8.3 Actions clôturées

- {action 1}

---

## 9. Prévisions Semaine Suivante

### 9.1 Événements prévus

- {événement 1} — {date}
- {événement 2} — {date}

### 9.2 Risques anticipés

- {risque 1} — {mitigation}

### 9.3 Priorités

1. {priorité 1}
2. {priorité 2}
3. {priorité 3}

---

## 10. Annexes

### 10.1 Liens utiles

- Dashboard Grafana : {URL}
- Plan remédiation : `docs/audit-externe/PLAN-REMEDIATION.md`
- Registre violations : `docs/audit-externe/REGISTRE-VIOLATIONS.md`
- PV réunion CPS : `docs/gouvernance/pv/PV-{date}.md`

### 10.2 Glossaire

- **CPS** : Comité de Pilotage Sécurité
- **RSSI** : Responsable Sécurité des Systèmes d'Information
- **AGPD** : Autorité Guinéenne de Protection des Données
- **P0/P1/P2/P3/P4** : Niveaux de sévérité (P0 critique, P4 information)
- **CVSS** : Common Vulnerability Scoring System

### 10.3 Contacts d'urgence

| Rôle | Nom | Téléphone | Email |
|------|-----|-----------|-------|
| RSSI | {nom} | {tel} | {email} |
| MOE | {nom} | {tel} | {email} |
| Directeur DNTT | {nom} | {tel} | {email} |
| Auditeur principal | {nom} | {tel} | {email} |

---

**Rédigé par** : {Nom RSSI}, {Date}
**Validé par** : {Nom président CPS}, {Date}
**Diffusé à** : {liste diffusion}
**Classification** : Confidentiel DNTT
**Archivage** : 5 ans (art. 35 Loi L/2022/018/AN)
