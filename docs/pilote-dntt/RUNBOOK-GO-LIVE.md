# Runbook Go-Live — Jour J du Pilote DNTT CodeRoute Guinée

> **Procédure opérationnelle pas à pas** pour le jour de lancement officiel du pilote.
> À exécuter le **Jour J** entre **07h00 et 19h00** par l'équipe ops.
> Toute déviation doit être tracée dans `docs/pilote-dntt/INCIDENTS-JOUR-J.md`.

---

## 1. Pré-Requis (à valider J-1 soir)

### 1.1 Checklist finale J-1 18h00

- [ ] Audit externe démarré, 0 P0 ouvert
- [ ] Staging jumeau prod opérationnel (`scripts/prepare-staging-twin.sh` exécuté avec succès)
- [ ] Test restore backup mensuel OK (`scripts/test-backup-restore.sh`)
- [ ] Monitoring Prometheus + Grafana + 27 alertes actives
- [ ] WAF ModSecurity en mode `DetectionOnly` (passer `On` au S3 si 0 faux positif)
- [ ] Géoblocage politique `diaspora` activé
- [ ] Rate limiting dynamique Redis testé (mode normal)
- [ ] 50 candidats pré-inscrits (codes promo valides)
- [ ] Comptes créés (3 centres + 5 admins + 10 auto-écoles + 1 super-admin)
- [ ] Conventions centres pilotes signées (3/3)
- [ ] Formation équipes terminée (J-7)
- [ ] Tests E2E Playwright passants (`e2e/pilot-full-flow.spec.ts`)
- [ ] Tests charge k6 validés (`load-tests/pilot-realistic.js` 100 VU)
- [ ] Webhooks Orange Money + MTN MoMo configurés (sandbox + prod)
- [ ] SMS Orange OAuth2 token valide (test envoi OK)
- [ ] Backup automatique planifié (cron 02h00 + 14h00)
- [ ] Support équipes briefées (WhatsApp + email + tel)
- [ ] Cellule de crise DNTT informée (joignabilité 24/7)
- [ ] Communiqué de presse final validé
- [ ] Spot radio + TV prêts pour diffusion

### 1.2 Go/No-Go J-1 18h00

**Réunion exceptionnelle** (salle DNTT + visio, 30 min)

Critères :
- 100% des pré-requis ci-dessus validés
- Météo Conakry/Kankan/Labé acceptable (pas de coupure réseau annoncée)
- Orange Money + MTN MoMo opérationnels (vérification sandbox)
- Aucune alerte Prometheus critique ouverte

Décision : **GO** / **GO conditionnel** (avec actions < 24h) / **NO-GO** (report J+7)

---

## 2. Procédure Jour J — Chronologie Détaillée

### 07h00 — Vérification matinale pré-ouverture

**Responsable** : MOE (Tech Lead)

| # | Action | Commande / Vérification | Durée |
|---|--------|-------------------------|-------|
| 1 | Vérification infrastructure | `docker compose -f docker-compose.production.yml ps` — tous services `Up (healthy)` | 5 min |
| 2 | Vérification PostgreSQL | `pg_isready -h localhost -p 5432` → "accepting connections" | 2 min |
| 3 | Vérification Redis | `redis-cli ping` → "PONG" | 1 min |
| 4 | Endpoint health | `curl https://coderoute.gov.gn/api/health` → 200 OK | 1 min |
| 5 | Endpoint metrics | `curl https://coderoute.gov.gn/api/metrics` → 200 + métriques | 1 min |
| 6 | Prometheus targets | Grafana → Status → Targets — tous "UP" | 3 min |
| 7 | Alertes actives | Grafana → Alerting — 0 alerte critique | 2 min |
| 8 | WAF logs | `docker logs waf-modsecurity --tail 50` — pas d'erreur démarrage | 2 min |
| 9 | Backup dernière nuit | Vérifier `/backups/$(date +%Y-%m-%d)-*.sql.gpg` existe (taille > 1 MB) | 2 min |
| 10 | Tests smoke rapides | `npx playwright test e2e/smoke.spec.ts` — tous passants | 5 min |

**Total** : ~25 minutes

**Si échec** : appliquer `docs/ops/OPS-RUNBOOK.md` §3.1 (AppDown) puis décider Go/No-Go reporté 08h30.

### 08h00 — Réunion Go/No-Go définitive

**Participants** : Directeur DNTT, MOA, MOE, RSSI, Chef projet, Représentants 3 centres

Ordre du jour (30 min) :
1. Revue checklist 07h00 (10 min)
2. Vérification météo + réseaux télécoms (5 min)
3. Décision Go/No-Go (10 min)
4. Si Go : activation finale + communication presse (5 min)

### 08h30 — Activation finale (si Go)

**Responsable** : MOE

| # | Action | Commande | Vérification |
|---|--------|----------|--------------|
| 1 | Activer géoblocage politique `diaspora` | Variable env `GEOBLOCK_POLICY=diaspora` + redémarrage app | Health check OK |
| 2 | Activer WAF mode `On` (optionnel si confiance) | `MODSEC_DEFAULT_PHASE=On` + reload Nginx | 0 erreur 403 légitime |
| 3 | Activer rate limiting mode `normal` | Variable env `RATE_LIMIT_MODE=normal` | Redis OK |
| 4 | Vérifier env prod | `cat /etc/coderoute/.env \| grep -E '(NODE_ENV\|DATABASE_URL\|REDIS_URL)'` | NODE_ENV=production |
| 5 | Activer 2FA sur tous comptes admin | Vérification DB `twofactor_secret` non null pour admins | 9 comptes |
| 6 | Vérifier webhook Orange/MTN | Test transaction 1 GNF en sandbox | Webhook reçu < 5s |
| 7 | Activer monitoring verbeux | `LOG_LEVEL=debug` temporaire (J à J+1) | Loki ingère logs |
| 8 | Notification Slack `#pilot-dntt` | "🟢 GO-LIVE en cours, ouverture 10h00" | Tous informés |

### 09h00 — Conférence de presse

**Participants** : Ministre des Transports, Directeur DNTT, MOA, presse nationale (~30 journalistes)

| Heure | Action | Responsable |
|-------|--------|-------------|
| 09h00 | Accueil journalistes | Communication DNTT |
| 09h30 | Discours Ministre (5 min) | Ministre |
| 09h40 | Présentation CodeRoute par Directeur DNTT (15 min) | Directeur |
| 10h00 | Démo live plateforme (10 min) | MOE |
| 10h15 | Témoignage candidat pilote pré-inscrit (5 min) | Candidat |
| 10h25 | Q&A presse (30 min) | Tous |
| 11h00 | Cocktail + interviews individuelles | Communication |

**Backup technique** : si démo live échoue, vidéo préenregistrée de 5 min disponible.

### 10h00 — Ouverture officielle des inscriptions

**Responsable** : MOE

| # | Action | Vérification |
|---|--------|--------------|
| 1 | Activer page d'accueil "Pilote ouvert" | `curl https://coderoute.gov.gn/` → bannière pilote visible |
| 2 | Email d'annonce aux 50 pré-inscrits | Sendinblue → "Sent" pour 50 destinataires |
| 3 | SMS convocation premier quiz | Orange SMS API → 50 SMS envoyés |
| 4 | Posts réseaux sociaux (Facebook, TikTok, Twitter) | 3 posts publiés |
| 5 | Spot TV 30s RTG | Diffusion 19h00 |
| 6 | Spot radio 30s (toutes radios) | Diffusion toutes les heures J à J+3 |
| 7 | Monitoring temps réel | Grafana dashboard ouvert sur écran salle ops |

### 11h00 — Première session formation

**Responsable** : MOE + Support

- Vérifier que les 50 pré-inscrits peuvent accéder à leur dashboard
- Premier quiz de révision disponible (série "Code de la route - bases")
- Support disponible WhatsApp + email + tel (8h-20h)
- Surveillance Prometheus accrue (scrap toutes les 30s au lieu de 15s → 10s)

### 12h00 — Point midi

**Réunion 15 min** (équipe ops)

- Statut inscriptions (objectif : 10-15 candidats connectés)
- Incidents éventuels
- Tendance métriques (latence, erreurs)
- Décision ajustements après-midi

### 14h00 — Surveillance active après-midi

| KPI | Seuil alerte | Action si franchi |
|-----|--------------|-------------------|
| Inscriptions cumul J | < 20 à 14h | Communication WhatsApp relance |
| Taux erreur 5xx | > 1% | Investiguer logs, rollback si besoin |
| Latence P95 | > 800ms | Optimisation requêtes DB |
| Échecs paiement | > 5% | Pause paiements, investiguer webhooks |
| Tickets support | > 10 ouverts | Renfort équipe support |
| Alertes fraude | > 3 | Investigation RSSI |

### 17h00 — Point fin de journée

**Réunion 30 min** (équipe complète)

Ordre du jour :
1. KPI jour J (inscriptions, paiements, quiz, incidents)
2. Ce qui a bien fonctionné (3 points)
3. Ce qui n'a pas fonctionné (3 points)
4. Actions correctives pour J+1
5. Décision ajustements planning

### 18h00 — Vérification soir

**Responsable** : MOE

- [ ] `docker compose ps` — tous services sains
- [ ] `pg_isready` + `redis-cli ping` — OK
- [ ] `/api/health` → 200
- [ ] Backup soir déclenché (cron 18h00)
- [ ] Alertes Prometheus : 0 critique
- [ ] WAF logs : 0 attaque critique détectée
- [ ] Logs audit : pas d'action suspecte
- [ ] Slack `#pilot-dntt` : récap journée posté

### 19h00 — Fermeture ops jour J

- [ ] Activation surveillance nocturne (alerting SMS pour P0)
- [ ] Garde d'astreinte MOE + RSSI (24/7)
- [ ] Backup vérifié (taille OK, checksum OK)
- [ ] Première extraction KPI J (test `pilot-kpi-extract.ts --week=1`)

---

## 3. Procédures d'Urgence Spécifiques J-J

### 3.1 Panne plateforme pendant conférence presse

**Déclencheur** : démo live échoue (page blanche, erreur 500)

1. MOE annonce "démo technique, bascule sur vidéo préenregistrée"
2. Communication DNTT prépare explication "problème réseau local"
3. Pendant ce temps, MOE applique runbook AppDown (`docs/ops/OPS-RUNBOOK.md` §3.1)
4. Si restauration < 10 min : reprise démo live
5. Si > 10 min : vidéo préenregistrée + report démo à J+1
6. Communication transparente presse : "incident technique mineur, plateforme opérationnelle pour les candidats"

### 3.2 Coupure Internet Conakry pendant J-J

**Déclencheur** : monitoring détecte perte connectivité > 30s

1. Vérification auprès opérateurs (Orange, MTN, Guinea Telecom)
2. Si coupure générale Conakry :
   - Bascule traffic vers Kankan DC (`docs/ops/OPS-RUNBOOK.md` §3.4)
   - Communication SMS candidats Conakry "Plateforme temporairement indisponible, reprise estimée {heure}"
   - Report examens Conakry-Kaloum prévus J+1
3. Si coupure locale datacenter :
   - Bascule DR Kankan automatique (RPO < 5 min, RTO < 30 min)
   - Notification RSSI + Directeur DNTT
4. Post-mortem sous 24h

### 3.3 Fraude examen détectée J-J

**Déclencheur** : alerte fraude (FraudAlert severity=high ou critical)

1. RSSI notifié immédiatement (< 1 min)
2. Examen suspendu (session figée)
3. Investigation : IP, navigateur, patterns réponse
4. Si fraude avérée : annulation examen, blocage compte candidat
5. Communication centre pilote concerné
6. Mise à jour registre fraude
7. Décision : notification AGPD ? (si données personnelles impliquées)

### 3.4 Incident RGPD pendant J-J

**Déclencheur** : fuite données, accès non autorisé, perte données

1. Cellule de crise activée (< 30 min) — voir `PLAN-COMMUNICATION.md` §5.2
2. Confinement immédiat
3. Notification AGPD sous 72h (`docs/audit-externe/modele-notification-agpd.md`)
4. Communication personnes concernées (`COMMUNICATIONS-PERSONNES-CONCERNEES.md`)
5. Registre violations mis à jour (`REGISTRE-VIOLATIONS.md`)
6. Post-mortem sous 5 jours

---

## 4. Outils & Ressources J-J

### 4.1 Canaux communication

| Canal | Usage J-J |
|-------|-----------|
| Slack `#pilot-dntt` | Équipe ops quotidienne |
| Slack `#pilot-alerts` | Alertes automatiques KPI |
| Slack `#securite-incident` | Incidents (urgence) |
| WhatsApp groupe centres | Support centres pilotes |
| Email `pilote-dntt@dntt.gouv.gn` | Communications officielles |
| Tel rouge RSSI | Urgences 24/7 |
| Visio Google Meet | Réunions ad hoc |

### 4.2 Liens utiles

| Ressource | URL |
|-----------|-----|
| Plateforme prod | https://coderoute.gov.gn |
| Grafana dashboard | https://grafana.coderoute.gov.gn |
| Prometheus | https://prometheus.coderoute.gov.gn |
| Alertmanager | https://alerts.coderoute.gov.gn |
| Loki logs | https://loki.coderoute.gov.gn |
| Nextcloud DNTT | https://nextcloud.dntt.gouv.gn |
| Status page | https://status.coderoute.gov.gn |

### 4.3 Documents de référence

| Document | Usage J-J |
|----------|-----------|
| `docs/ops/OPS-RUNBOOK.md` | Procédures incident |
| `docs/audit-externe/runbook-incident-agpd.md` | Incidents RGPD |
| `docs/pilote-dntt/PLAN-COMMUNICATION.md` | Communication crise |
| `docs/pilote-dntt/TABLEAU-DE-BORD-KPI.md` | Seuils KPI |
| `docs/gouvernance/COMITE-PILOTAGE-SECURITE.md` | Procédure urgence |

---

## 5. Équipe J-J

### 5.1 Présence obligatoire 07h00-19h00

| Rôle | Nom | Localisation | Astreinte nuit |
|------|-----|--------------|----------------|
| MOE (Tech Lead) | {à remplir} | Salle ops DNTT | ✅ |
| RSSI | {à remplir} | Salle ops DNTT | ✅ |
| Chef projet | {à remplir} | Salle ops DNTT | ✅ |
| MOA | {à remplir} | Salle ops DNTT | ❌ |
| Support L1 (2 agents) | {à remplir} | Salle support DNTT | 1 rotation |
| DevOps backup | {à remplir} | Télétravail | ✅ |
| Communication | {à remplir} | Salle presse | ❌ |
| Représentants 3 centres | {à remplir} | Centres pilotes | ❌ |

### 5.2 Escalade

| Niveau | Délai | Qui |
|--------|-------|-----|
| 1 | Immédiat | Support L1 |
| 2 | < 15 min | Chef projet |
| 3 | < 30 min | MOE + RSSI |
| 4 | < 1h | Directeur DNTT |
| 5 | < 2h | Ministre (si impact réputation) |

---

## 6. Compte-Rendu J-J (à rédiger J+1 09h00)

Template à remplir :

```markdown
# Compte-Rendu Jour J — {Date}

## KPI jour J
- Inscriptions : {n} / 50 cible
- Quiz complétés : {n}
- Paiements réussis : {n} (volume {GNF})
- Examens passés : {n}
- Incidents : {n} (gravité : {P0/P1/P2})
- Uptime : {%}
- Tickets support : {n}

## Faits marquants
- {événement 1}
- {événement 2}

## Points forts
- {force 1}
- {force 2}

## Points faibles
- {faiblesse 1}
- {faiblesse 2}

## Actions correctives J+1
| # | Action | Responsable | Délai |
|---|--------|-------------|-------|
| 1 | {action} | {qui} | {date} |

## Décision
- ✅ Poursuite pilote J+1 : OUI/NON
- Ajustements planning : {description}
```

---

## 7. Fin du Jour J — Validation Go-Live J+1

À 19h00, valider :

- [ ] Tous les KPI jour J dans les seuils (ou plan correctif défini)
- [ ] 0 incident P0 ouvert
- [ ] Backup du jour vérifié
- [ ] Équipe astreinte briefée pour la nuit
- [ ] Slack `#pilot-dntt` : "✅ Jour J clôturé, poursuite pilote J+1 confirmée"

Si un critère n'est pas rempli : tenir réunion exceptionnelle 19h30 pour décider Go/No-Go J+1.

---

**Version** : 1.0
**Propriétaire** : MOE CodeRoute
**Validation** : Directeur DNTT, MOA, RSSI
**Prochaine révision** : post-Jour J (J+7)
