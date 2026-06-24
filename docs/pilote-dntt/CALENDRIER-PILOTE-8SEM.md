# Calendrier Opérationnel Pilote DNTT — 8 Semaines

> **Planning détaillé semaine par semaine** du pilote DNTT CodeRoute Guinée.
> Période : du **Jour J** (lancement officiel) au **Jour J+56** (bilan final).
> 3 centres pilotes : Conakry-Kaloum (200 places), Kankan (80), Labé (50).

---

## Vue d'Ensemble

| Phase | Semaines | Objectif principal | Livrable clé |
|-------|----------|--------------------|--------------|
| Phase 0 — Pré-lancement | J-14 à J-1 | Préparation infrastructure + comptes | Comptes créés, staging validé |
| Phase 1 — Démarrage | S1 (J à J+7) | Onboarding 50 candidats pilote | 50 inscrits, 1er examen passé |
| Phase 2 — Montée en charge | S2-S3 (J+8 à J+21) | 150 candidats actifs | Premiers retours qualitatifs |
| Phase 3 — Régime nominal | S4-S6 (J+22 à J+49) | 330 candidats, flux complet | Tableau bord stabilisé |
| Phase 4 — Bilan & recommandation | S7-S8 (J+50 à J+56) | Évaluation GO/NO-GO | Rapport final + décision |

---

## Phase 0 — Pré-Lancement (J-14 à J-1)

### J-14 : Validation finale infrastructure

- [ ] Audit externe démarré (voir `docs/audit-externe/CALENDRIER-AUDIT-45J.md`)
- [ ] Staging jumeau prod opérationnel (`scripts/prepare-staging-twin.sh`)
- [ ] Test restore backup mensuel exécuté (`scripts/test-backup-restore.sh`)
- [ ] Monitoring Prometheus + Grafana + 27 alertes actives
- [ ] WAF ModSecurity en mode `DetectionOnly`
- [ ] Géoblocage activé en politique `diaspora`
- [ ] Rate limiting dynamique Redis testé

### J-10 : Création des comptes

- [ ] Exécuter `scripts/pilot-create-accounts.ts` :
  - 3 centres pilotes (Conakry-Kaloum, Kankan, Labé)
  - 5 comptes administration (agents DNTT)
  - 10 auto-écoles pilotes
  - 1 super-admin Tech Lead
- [ ] Transmission credentials en main propre (enveloppes scellées)
- [ ] Confirmation réception et premier login de chaque acteur

### J-7 : Formation des équipes

- [ ] Formation agents DNTT (4h) : interface, gestion candidats, examens, paiements, incidents
- [ ] Formation auto-écoles (3h) : inscription candidats, suivi, paiement
- [ ] Formation centres agréés (2h) : organisation examens, remontée résultats
- [ ] Support DNTT (2h) : tickets, escalations, FAQ
- [ ] Documentation remise : `docs/pilote-dntt/PLAN-LANCEMENT-PILOTE.md` + `docs/pilote-dntt/CONVENTION-CENTRE-PILOTE.md`

### J-3 : Tests de bout en bout

- [ ] Exécuter `scripts/test-exam-flow.sh` (flux complet candidat)
- [ ] Exécuter `scripts/test-momo-flow.ts` (flux paiement Orange + MTN sandbox)
- [ ] Lancer test E2E Playwright `e2e/pilot-full-flow.spec.ts`
- [ ] Tests de charge k6 (scénario `load-tests/pilot-realistic.js`) — viser 100 VU
- [ ] Vérification des webhooks Orange/MTN en mode sandbox

### J-1 : Go/No-Go pré-lancement

**Réunion comité pilotage exceptionnelle (10h00, salle DNTT Conakry)**

Critères Go :
- ✅ Audit externe a démarré, aucun P0 trouvé
- ✅ Tous les tests E2E passent
- ✅ Monitoring opérationnel, 0 alerte critique
- ✅ Comptes créés et testés (1 login par rôle)
- ✅ Conventions centres signées (3/3)
- ✅ Canaux support opérationnels (WhatsApp, email, téléphone)

**Décision** : GO / GO conditionnel / NO-GO + report

---

## Phase 1 — Démarrage (S1 : J à J+7)

### Jour J — Lancement officiel

| Heure | Action | Responsable |
|-------|--------|-------------|
| 08h00 | Vérification matinale (runbook ops §2.1) | MOE |
| 09h00 | Conférence de presse DNTT — annonce pilote | Directeur DNTT |
| 10h00 | Email d'annonce aux 50 premiers candidats pré-inscrits | Support |
| 11h00 | Ouverture officielle des inscriptions sur la plateforme | MOE |
| 14h00 | Première session formation en ligne ouverte | MOE |
| 17h00 | Point quotidien : inscriptions du jour, incidents | Chef projet |
| 18h00 | Vérification soir (runbook ops §2.1) | MOE |

### J+1 à J+3 : Onboarding progressif

- **Cible J+3** : 50 candidats inscrits (répartis : 30 Conakry, 12 Kankan, 8 Labé)
- Email de bienvenue multilingue (FR/Pular/Soussou/Malinké) envoyé automatiquement
- 1er quiz de révision disponible
- Support disponible 8h-20h (WhatsApp + email)
- Surveillance accrue : checks Prometheus toutes les 5 minutes

### J+4 à J+6 : Premiers paiements

- Activation paiements Orange Money + MTN MoMo
- Cible J+6 : 30 paiements réussis, taux échec < 3%
- Test remboursement sur 1 transaction (sandbox fermée, vraie transaction 1 GNF)
- Vérification webhooks HMAC reçus et traités < 5s

### J+7 : Premier examen code

- 10 premiers candidats présentent l'examen code (Conakry-Kaloum)
- Surveillance anti-fraude (timeout, screenshot, tab switching)
- Génération des résultats, notification aux candidats
- **Réunion fin S1** (vendredi 16h00) :
  - Tableau bord KPI S1 rempli
  - Identification premiers points de friction
  - Plan correctif S2

---

## Phase 2 — Montée en charge (S2-S3 : J+8 à J+21)

### S2 (J+8 à J+14)

- **Objectif** : 100 candidats cumulés, 30 examens code passés
- Activation centre Kankan (J+10) et Labé (J+12)
- Communication radio + TV régionale pour recrutement candidats
- Lancement sondage NPS post-examen (1ère mesure S2)
- Premier rapport hebdo complet (à diffuser lundi S3)

### S3 (J+8+7 à J+21)

- **Objectif** : 150 candidats cumulés, 50 examens code, 10 examens conduite
- Premiers examens conduite (Conakry-Kaloum uniquement)
- Revue mi-parcelle avec centres pilotes (entretiens semi-directifs)
- Activation mode WAF `On` si 0 faux positif sur 14 jours (`docs/ops/WAF-TUNING.md`)
- Premier audit intermédiaire externe (rapport mi-parcours)
- Comité pilotage élargi : MOA + MOE + RSSI + représentants centres + DNTT

---

## Phase 3 — Régime Nominal (S4-S6 : J+22 à J+49)

### S4 (J+22 à J+28)

- **Objectif** : 220 candidats cumulés, régime nominal atteint
- Examens conduite ouverts à Kankan et Labé
- 1er comité de pilotage mensuel (jeudi S4)
- Évaluation qualitative auto-écoles (entretien S4 — voir §3.2 tableau de bord)
- Audit externe : remise rapport provisoire (J+25)

### S5 (J+29 à J+35)

- **Objectif** : 270 candidats cumulés, 200 examens code, 50 examens conduite
- Remédiation vulnérabilités audit externe (P0 et P1 clôturés)
- Tests de charge accrus (200 VU, scénario pics d'inscription)
- Vérification restore backup mensuel (J+30)

### S6 (J+36 à J+42)

- **Objectif** : 300 candidats cumulés, flux complet stabilisé
- Remise rapport audit externe final (J+42)
- Plan de remédiation post-audit défini (`docs/audit-externe/PLAN-REMEDIATION.md`)
- Communication DNTT officielle sur résultats intermédiaires (si positifs)

---

## Phase 4 — Bilan & Recommandation (S7-S8 : J+50 à J+56)

### S7 (J+50 à J+56)

- **Objectif** : 330 candidats cumulés (objectif final)
- Évaluation qualitative finale auto-écoles (entretien S7)
- Sondage NPS final
- Rédaction rapport bilan pilote (4 jours)
- Préparation dossier GO/NO-GO pour décision généralisation

### S8 (J+57 à J+63 — semaine post-pilote)

- **Jour J+57** : Présentation rapport bilan au Directeur DNTT
- **Jour J+58** : Comité de pilotage élargi + DNTT direction
- **Jour J+60** : Présentation au Ministère des Transports
- **Jour J+63** : Décision officielle GO/NO-GO généralisation

### Rapport final pilote (livrable S8)

Structure obligatoire :

1. **Synthèse exécutive** (2 pages max)
2. **Indicateurs clés** (tableau de bord KPI S0→S8 complet)
3. **Analyse qualitative** (retours candidats, auto-écoles, centres)
4. **Bilan sécurité** (incidents, audit, RGPD)
5. **Bilan financier** (coûts pilote, recettes, projection généralisation)
6. **Leçons apprises** (top 10 succès, top 10 difficultés)
7. **Recommandations** (GO/NO-GO + conditions + plan généralisation 6 mois)
8. **Annexes** (rapports hebdo, comptes rendus réunions, NPS détaillés)

---

## Gouvernance Hebdomadaire

### Réunions récurrentes (à programmer dès J-7)

| Réunion | Jour / heure | Durée | Participants | Objet |
|---------|--------------|-------|--------------|-------|
| Stand-up quotidien | Lun-Ven 09h00 | 15 min | MOE + chef projet | Quick status, blocages |
| Revue KPI hebdo | Lundi 10h00 | 1h | Comité pilotage | Analyse tableau bord S-1 |
| Comité pilotage sécurité | Mardi 14h00 | 1h30 | MOE + RSSI + MOA | Incidents, audit, RGPD |
| Support aux centres | Mercredi 11h00 | 1h | Centres + support | Points de friction |
| Sync audit externe | Jeudi 10h00 | 30 min | RSSI + auditeur | Avancement audit |
| Rétrospective hebdo | Vendredi 16h00 | 1h | Toute l'équipe | Ce qui marche / à améliorer |

### Comité de pilotage mensuel (S4, S8)

- Participants étendus : Directeur DNTT, MOA, MOE, RSSI, représentants 3 centres, 2 auto-écoles, 1 candidat
- Format : présentation KPI + témoignages + décisions
- Livrable : compte rendu + décisions validées

---

## Risques & Mitigations Pilote

| # | Risque | Probabilité | Impact | Mitigation |
|---|--------|-------------|--------|------------|
| 1 | Panne Internet Conakry > 4h | Moyenne | Critique | Bascule Kankan, communication SMS, mode hors-ligne |
| 2 | Webhook Orange/MTN indisponible | Faible | Élevé | File d'attente retry, surveillance P95, sandbox tests |
| 3 | Fraude examen organisée | Moyenne | Élevé | Détection < 1s, ban IP, audit logs, surveillance physique centre |
| 4 | Volume inscriptions < cible S3 | Moyenne | Moyen | Communication radio/TV, partenariat auto-écoles, bonus 1er inscrits |
| 5 | Audit externe découvre P0 | Faible | Critique | Plan remédiation 48h, communication transparente DNTT |
| 6 | Incident RGPD (fuite données) | Très faible | Critique | Notification 72h AGPD, communication personnes concernées, registre |
| 7 | Centre pilote défection | Faible | Moyen | Convention signée, plan B (centre de substitution), clause résiliation |
| 8 | Surcharge plateforme pic | Moyenne | Élevé | Auto-scaling, rate limit dynamique, queue Redis, tests charge k6 |

---

## Communication Interne

### Canaux

- **Slack** `#pilot-dntt` : conversations quotidiennes équipe
- **Slack** `#pilot-alerts` : alertes automatiques (KPI, monitoring)
- **Slack** `#securite` : incidents, audit, RGPD
- **Email** `pilote-dntt@dntt.gouv.gn` : communications officielles
- **WhatsApp** `+224 6XX XX XX XX` : groupe support centres pilotes
- **Nextcloud DNTT** : documents partagés, rapports, comptes rendus

### Procédure escalade

| Niveau | Délai | Qui | Comment |
|--------|-------|-----|---------|
| 1 | Immédiat | Support | Ticket |
| 2 | < 30 min | Chef projet | Slack #pilot-alerts + tel |
| 3 | < 1h | MOE | Email + tel |
| 4 | < 2h | RSSI (si sécurité) | Email + tel + comité pilotage |
| 5 | < 4h | Directeur DNTT (si critique) | Email officiel + réunion |

---

## Communication Externe

### Calendrier presse

| Date | Événement | Canal | Cible |
|------|-----------|-------|-------|
| J-7 | Annonce pilote imminent | Communiqué presse | Presse nationale |
| J | Lancement officiel | Conférence presse + Radio/TV | Public guinéen |
| J+14 | Bilan 1er quinzaine | Interview radio | Candidats potentiels |
| J+35 | Bilan mi-parcours | Conférence presse | Public + partenaires |
| J+63 | Bilan final + décision GO/NO-GO | Conférence presse + Ministre | Public guinéen |

### Communication candidats

- Email transactionnel à chaque étape (inscription, paiement, convocation, résultat)
- SMS convocation examen (J-2)
- Sondage NPS post-examen (J+1)
- Newsletter mensuelle pilote

---

**Version** : 1.0
**Dernière mise à jour** : pré-pilote
**Propriétaire** : Chef de projet DNTT CodeRoute
**Validation** : Directeur DNTT, MOA, MOE, RSSI
