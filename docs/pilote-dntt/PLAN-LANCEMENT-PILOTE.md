# CodeRoute Guinée — Plan de lancement pilote DNTT

## 1. Contexte et objectif

Ce document décrit le plan de lancement **pilote** de la plateforme CodeRoute Guinée, en vue de la mise en production progressive supervisée par la Direction Nationale des Transports Terrestres (DNTT).

L'objectif du pilote est de valider en conditions réelles — avec un volume maîtrisé d'utilisateurs réels — que la plateforme est prête pour un déploiement national. Le pilote se déroule sur **8 semaines** et couvre 3 centres agréés pilotes dans 3 régions différentes.

## 2. Critères de pré-requis (Gate 0)

Avant lancement du pilote, les conditions suivantes doivent être **toutes** remplies ( Gate 0) :

### 2.1 Technique

- [ ] **Audit externe** clos, 0 vulnérabilité critique non remédiée.
- [ ] **Tests de charge** (Sprint 11) tous passés : p95 conforme aux SLO, 0 fuite de données, 0 double-paiement.
- [ ] **Exercice AGPD** réalisé, registre des violations initialisé.
- [ ] **AIPD** validée par le DPO et l'AGPD (accusé de réception).
- [ ] **Registre des traitements** à jour et publié.
- [ ] **Backups** opérationnels (test de restauration réussi sur les 7 derniers jours).
- [ ] **Monitoring** (Prometheus + Grafana) opérationnel, alertes actives.
- [ ] **DR Kankan** testé (bascule Conakry → Kankan réussie en < 5 min).
- [ ] **PWA** installable sur Android (test sur 3 modèles bas de gamme Tecno/Itel) et iPhone (Safari).
- [ ] **Performance** : Lighthouse score ≥ 80 sur mobile 3G.

### 2.2 Organisationnel

- [ ] **DPO** nommé officiellement (arrêté ministériel).
- [ ] **RSSI** nommé et formé.
- [ ] **Tech Lead** dédié à minima 50% de son temps pendant le pilote.
- [ ] **Ops** : 2 opérateurs formés (un par DC, Conakry + Kankan).
- [ ] **Support candidat** : 2 agents formés ( hotline 8h-18h GMT).
- [ ] **Conventions** Orange Money et MTN MoMo signées (mode production).
- [ ] **Convention SMS Orange** signée.
- [ ] **Domaine DNS** `coderoute.gov.gn` réservé, TLS Let's Encrypt ou certificat officiel.

### 2.3 Légal et conformité

- [ ] **Mentions légales** publiées et accessibles depuis le footer.
- [ ] **Politique de confidentialité** publiée.
- [ ] **Politique cookies** publiée (bannière de consentement).
- [ ] **CGU** candidats publiées.
- [ ] **CGU** auto-écoles publiées.
- [ ] **Convention centres agréés** rédigée et signée par les 3 centres pilotes.
- [ ] **AIPD** validée AGPD.
- [ ] **Registre des traitements** AGPD soumis.

### 2.4 Formation

- [ ] **3 guides de formation** (admin, ops, candidat) diffusés.
- [ ] **Sessions de formation** réalisées pour :
  - 3 responsables de centres pilotes (1 journée chacun).
  - 5 agents DNTT administration (2 jours).
  - 2 opérateurs ops (3 jours).
  - 10 candidats testeurs (2h en présentiel).
- [ ] **Vidéos de démonstration** (FR + Pular + Soussou + Malinké) publiées sur la plateforme.

## 3. Centres pilotes

### 3.1 Sélection

Trois centres agréés pilotes sont retenus, représentatifs de la diversité géographique et opérationnelle :

| Centre | Région | Capacité | Profil | Justification du choix |
|---|---|---|---|---|
| Centre de Conakry-Kaloum | Conakry | 200 candidats/jour | Urbain dense, fort volume | Test de charge réel, diversité ethnolinguistique maximale |
| Centre de Kankan | Kankan | 80 candidats/jour | Régional, dr | Test du site de secours (DR), connexion réseau moins stable |
| Centre de Labé | Labé | 50 candidats/jour | Rural, faible volume | Test en conditions réseau dégradées (3G/Edge), majorité Pularophone |

### 3.2 Critères de sélection des centres

- Engagement signé du responsable de centre à participer au pilote (8 semaines).
- Infrastructure minimale : 5 ordinateurs fonctionnels, connexion Internet (≥ 2 Mbps), onduleur.
- Au moins 1 agent formé sur place (formation assurée par l'équipe CodeRoute).
- Capacité à recevoir un agent DNTT pour observation les 2 premières semaines.
- Engagement à utiliser **exclusivement** CodeRoute Guinée pour les examens pendant le pilote (pas de double système papier + digital).

## 4. Calendrier du pilote

Le pilote se déroule sur **8 semaines** selon le calendrier suivant :

### Semaine 0 — Préparation finale (J-7 à J)

- Déploiement de la version pilote en production (rollback possible).
- Création des comptes pour les 3 centres pilotes (10 comptes admin/centre).
- Migration des candidats historiques des 3 centres (environ 1 500 candidats au total).
- Tests de bout en bout (Playwright) sur la production, dernière vérification.
- Communication interne DNTT : annonce du pilote, répartition des rôles.
- Mise en place du dashboard de monitoring pilote (Grafana, accessible au sponsor).

### Semaine 1 — Démarrage contrôlé (J+1 à J+7)

**Objectif** : valider que la plateforme fonctionne en conditions réelles, avec un volume très faible.

- **Lundi** : ouverture aux candidats du Centre de Conakry-Kaloum uniquement (20 candidats).
- **Mardi-mercredi** : montée en charge progressive (40 puis 60 candidats).
- **Jeudi-vendredi** : observation, collecte des retours.
- **Métriques surveillées** :
  - Taux de succès des paiements Orange/MTN (objectif ≥ 95%).
  - Taux de soumission d'examen sans erreur (objectif ≥ 99%).
  - Latence moyenne (objectif p95 < 1s).
  - Nombre de tickets support (objectif < 10 tickets).
- **À la fin de la semaine** : go/no-go pour extension à Kankan.

### Semaine 2 — Extension Kankan (J+8 à J+14)

- **Lundi** : ouverture au Centre de Kankan (80 candidats attendus).
- Surveillance accrue : 2 ops dédiés, 1 agent DNTT sur site Kankan.
- **Métriques nouvelles** :
  - Taux de succès en conditions réseau dégradées (objectif ≥ 90%).
  - Bascule DR test (sans candidats, créneau nocturne).
- **À la fin de la semaine** : go/no-go pour extension à Labé.

### Semaine 3 — Extension Labé (J+15 à J+21)

- **Lundi** : ouverture au Centre de Labé (50 candidats attendus).
- Surveillance de la performance en 3G/Edge.
- **Métriques nouvelles** :
  - Temps de chargement initial sur 3G (objectif < 5s).
  - Taux d'abandon avant la fin de l'examen (objectif < 5%).
  - Taux de succès des SMS OTP en zone rurale (objectif ≥ 85%).

### Semaines 4-6 — Régime nominal (J+22 à J+42)

- Les 3 centres fonctionnent en régime nominal.
- Surveillance continue via Grafana.
- **Audit de mi-parcours** par l'auditeur externe (1 journée).
- **Tests de charge** réels (k6) en conditions de pointe (simulation d'un jour d'examen national).
- **Recueil de satisfaction** candidats (sondage en ligne, échantillon 200 candidats).

### Semaine 7 — Test de montée en charge (J+43 à J+49)

- **Simulation** d'un déploiement national : ouverture à 5 centres supplémentaires (non-recrutés réellement, simulés).
- **Stress test** : générer 5 000 candidats fictifs (anonymisés) pour valider la capacité.
- **Validation** : si tous les SLO sont respectés, le pilote est prêt pour la phase 2 (déploiement national).

### Semaine 8 — Clôture et bilan (J+50 à J+56)

- **Bilan quantitatif** : nombre de candidats traités, taux de succès, temps moyen, coûts.
- **Bilan qualitatif** : satisfaction candidats, satisfaction centres, satisfaction DNTT.
- **Rapport de pilote** : 30 pages max, diffusé au ministre et à l'AGPD.
- **Décision go/no-go** pour le déploiement national (phase 2).

## 5. Métriques de succès du pilote

Le pilote est considéré **réussi** si les objectifs suivants sont tous atteints :

### 5.1 Métriques techniques

| Métrique | Objectif | Mesure |
|---|---|---|
| Disponibilité plateforme | ≥ 99.5% | UptimeRobot sur `/api/health` |
| Taux de succès paiement | ≥ 95% | Comptage webhooks `/status=success` |
| Taux de soumission examen | ≥ 99% | Comptage `POST /api/exams` |
| Latence API p95 | < 1s | Grafana sur `/api/*` |
| Temps chargement initial 3G | < 5s | Lighthouse mobile 3G |
| Taux d'erreur 5xx | < 0.1% | Comptage Nginx |
| Aucune fuite de données | 0 incident | Surveillance audit log |

### 5.2 Métriques métier

| Métrique | Objectif | Mesure |
|---|---|---|
| Candidats inscrits | ≥ 1 500 | Comptage table `User` |
| Examens réussis | ≥ 1 000 | Comptage `ExamResult.score ≥ 12/20` |
| Réservations traitées | ≥ 1 500 | Comptage table `Booking` |
| Paiements traités | ≥ 1 500 | Comptage table `Payment.status=success` |
| Taux d'abandon examen | < 5% | Comptage `Booking` sans `ExamResult` |

### 5.3 Métriques satisfaction

| Métrique | Objectif | Mesure |
|---|---|---|
| Satisfaction candidat | ≥ 4/5 | Sondage post-examen |
| Satisfaction centre | ≥ 4/5 | Sondage responsables |
| Taux de tickets support | < 5% candidats | Comptage hotline |
| Délai résolution tickets | < 24h (P1), < 72h (P2) | SLA support |

## 6. Gouvernance du pilote

### 6.1 Comité de pilotage

Composition :
- Sponsor DNTT (Directeur National)
- DPO interne
- RSSI interne
- Tech Lead
- 3 responsables de centres pilotes
- Représentant AGPD (observateur)

Fréquence : **hebdomadaire** (visio le mardi 10h GMT), plus réunion exceptionnelle si incident.

Ordre du jour type :
1. Revue métriques semaine écoulée (15 min).
2. Incidents et actions correctives (15 min).
3. Décisions de la semaine à venir (15 min).
4. Points bloquants (15 min).

### 6.2 Cellule de crise

Activée en cas d'incident critique (Cf. runbook AGPD). Composition :
- Sponsor DNTT (décideur)
- RSSI (pilote technique)
- DPO (conformité)
- Tech Lead (exécution)
- Ops Conakry + Ops Kankan

Canal de communication : Slack `#incident-response`, visioconférence Jitsi.

### 6.3 Support candidat

- **Hotline** : numéro DNTT dédié (8h-18h GMT, lundi-vendredi).
- **Email** : `support@coderoute-gn.org` (réponse < 24h).
- **Chat** : widget Crisp sur la plateforme (réponse < 1h en journée).
- **FAQ** : page `/faq` couvrant 50 questions fréquentes en 4 langues.
- **Vidéos** : 5 tutoriels vidéo (inscription, paiement, examen, résultats, convocation) en 4 langues.

## 7. Communication

### 7.1 Communication interne

- **Annonce interne DNTT** : J-7, email + réunion générale.
- **Newsletter hebdomadaire** : diffuseur `pilote@coderoute-gn.org`, bilan de la semaine et décisions.
- **Tableau de bord** : Grafana accessible au sponsor et au comité, URL privée.

### 7.2 Communication externe

- **Communiqué de presse** : à J+0, annoncé par le ministère des Transports.
- **Page pilote** : `coderoute.gov.gn/pilote-2026` expliquant le projet et les centres pilotes.
- **Réseaux sociaux** : 3 posts Facebook/Twitter par semaine pendant le pilote.
- **Radio** : 2 passages radio (RTG) pendant le pilote.
- **Presse écrite** : 1 article dans le magazine Guinée-News à mi-parcours.

### 7.3 Communication aux candidats

- **Email de bienvenue** : envoyé à l'inscription (FR + langue maternelle).
- **SMS de convocation** : envoyé 48h avant l'examen.
- **SMS de rappel** : envoyé 2h avant l'examen.
- **Email post-examen** : envoyé 1h après l'examen, avec résultat et sondage de satisfaction.

## 8. Gestion des risques

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Panne Internet Conakry DC | Moyenne | Élevé | DR Kankan, bascule en 5 min |
| Panne Orange Money | Moyenne | Élevé | Bascule MTN MoMo, paiement manuel exceptionnel |
| Bug bloquant en production | Faible | Critique | Rollback < 5 min, hotfix < 2h |
| Fuite de données | Faible | Critique | Runbook AGPD, 0 confiance |
| Saturation DB | Faible | Élevé | Connection pool monitoré, scale-up possible |
| Faible adoption candidats | Moyenne | Moyen | Communication radio, formations |
| Résistance centres | Moyenne | Moyen | Convention claire, formations |
| Attaque DDoS | Faible | Moyen | Cloudflare en edge, rate limit Nginx |

## 9. Décision de fin de pilote

À la fin de la semaine 8 (J+56), le comité de pilotage statue sur la suite :

### 9.1 Go pour déploiement national (phase 2)

Conditions :
- Tous les objectifs techniques remplis (section 5.1).
- Au moins 80% des objectifs métier remplis (section 5.2).
- Au moins 4/5 de satisfaction candidat et centre (section 5.3).
- Aucun incident critique non résolu.
- Plan de remédiation des recommandations d'audit validé.

Décision : passage en phase 2 — déploiement sur 10 centres supplémentaires, puis 30, puis 100 sur 6 mois.

### 9.2 Go conditionnel

Conditions :
- Objectifs partiellement remplis (< 80% mais > 60%).
- Aucun incident critique.
- Plan de remédiation clair sur 4 semaines.

Décision : prolongation du pilote de 4 semaines avec actions correctives.

### 9.3 No-go

Conditions :
- Incident critique non résolu.
- Satisfaction < 3/5.
- Fuite de données avérée.
- Insatisfaction forte du sponsor DNTT.

Décision : retour en phase de stabilisation, nouvelle tentative dans 3 mois après audit approfondi.

## 10. Post-pilote

### 10.1 Si Go

- **Phase 2** : déploiement progressif sur 100 centres en 6 mois.
- **Recrutement** : 2 ops supplémentaires, 1 DPO adjoint.
- **Évolution** : roadmap Sprint 12 à 20 (videoprojecteur, supervision nationale, IA anti-fraude).
- **Communication** : conférence de presse ministérielle, lancement officiel.

### 10.2 Si No-go

- **Audit approfondi** : 2 semaines d'investigation.
- **Plan de remédiation** : 3 mois de correctifs.
- **Nouveau pilote** : redémarrage sur 8 semaines.

## 11. Annexes

### Annexe A — Checklist pré-pilote (Gate 0)

À compléter avant J-7.

### Annexe B — Tableau de bord Grafana

URL : `https://grafana.coderoute-gn.org/d/pilote-2026`

Panels :
- Trafic temps réel (req/s, VUs actifs).
- Latence p50/p95/p99 par route.
- Taux d'erreur 5xx.
- Connexions DB (actives / pool).
- Taux de succès paiements Orange/MTN.
- Nombre de candidats connectés.
- Taux de soumission examen.
- Alertes actives (Sentry + Prometheus).

### Annexe C — Templates de communication

- Email de bienvenue candidat (FR + Pular + Soussou + Malinké).
- SMS convocation.
- Email post-examen avec sondage.
- Communiqué de presse J+0.
- Newsletter hebdomadaire interne.

### Annexe D — Convention centre pilote

Modèle de convention à signer entre la DNTT et chaque centre pilote, couvrant :
- Durée et conditions de participation.
- Engagements du centre (formation, usage exclusif).
- Engagements de la DNTT (support, accès gratuit).
- Données et confidentialité.
- Conditions de sortie.

---

**Version** : 1.0 — Sprint 11
**Dernière mise à jour** : 2026-06-24
**Validation** : Sponsor DNTT, DPO, RSSI, Tech Lead
