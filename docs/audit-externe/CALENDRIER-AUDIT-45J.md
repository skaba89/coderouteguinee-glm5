# Calendrier Opérationnel Audit Externe — 45 Jours

> **Planning détaillé jour par jour** de l'audit externe CodeRoute Guinée.
> Période : du **Jour A** (kick-off auditeur) au **Jour A+45** (remise rapport final).
> Ce calendrier s'exécute en parallèle du pilote DNTT (S1 à S6 du pilote).

---

## Vue d'Ensemble

| Phase | Jours | Objet | Livrable |
|-------|-------|-------|----------|
| Phase 0 — Préparation | A-7 à A-1 | Périmètre, accès, NDA | Convention audit signée |
| Phase 1 — Cadrage | A à A+5 | Revue documentaire | Rapport cadrage |
| Phase 2 — SAST & configuration | A+6 à A+12 | Code review, config scan | Liste vulnérabilités P0-P4 |
| Phase 3 — Pentest | A+13 à A+25 | Tests intrusif 35 scénarios | Rapport pentest |
| Phase 4 — Conformité RGPD | A+26 à A+32 | Articles 28-40 Loi L/2022/018/AN | Rapport conformité |
| Phase 5 — Synthèse & rapport | A+33 to A+42 | Rédaction rapport final | Rapport final provisoire |
| Phase 6 — Restitution & clôture | A+43 to A+45 | Présentation, Q&A, accès révoqués | Rapport final signé |

---

## Phase 0 — Préparation (A-7 à A-1)

### A-7 : Validation convention audit

- [ ] Convention audit signée (voir `docs/audit-externe/01-CHARTE-AUDIT.md`)
- [ ] NDA signé par les 2 auditeurs
- [ ] Charte éthique validée
- [ ] Périmètre validé (`docs/audit-externe/02-PERIMETRE-TECHNIQUE.md`)
- [ ] Calendrier validé par MOA + MOE + RSSI

### A-5 : Préparation accès

- [ ] Création comptes auditeurs sur staging (voir `docs/audit-externe/05-ACCES-TEMPORAIRES.md`)
- [ ] Génération clés SSH éphémères (validité 45 jours)
- [ ] Configuration 2FA TOTP pour comptes auditeurs
- [ ] Configuration IP allowlist (bureau auditeur + VPN)
- [ ] Test accès : `ssh auditeur@staging.coderoute.gov.gn`
- [ ] Test accès PostgreSQL (read-only)

### A-3 : Préparation environnement

- [ ] Staging jumeau prod démarré (`scripts/prepare-staging-twin.sh`)
- [ ] Données anonymisées RGPD (option refresh)
- [ ] Snapshot VM staging (point de restauration)
- [ ] Activation audit log verbeux (pour preuves)
- [ ] Configuration export logs vers Nextcloud auditeur

### A-1 : Briefing démarrage

- Réunion kick-off (10h00, visioconférence)
- Participants : auditeurs, MOA, MOE, RSSI, chef projet DNTT
- Ordre du jour :
  - Rappel périmètre et exclusions
  - Calendrier détaillé
  - Canaux communication (Slack dédié, email, visio hebdo)
  - Procédure escalation (4 niveaux, voir manuel auditeur §9)
  - Rappel règles de conduite (charte éthique)
- Livrable : PV de réunion signé

---

## Phase 1 — Cadrage (A à A+5)

### Jour A — Démarrage officiel

| Heure | Action |
|-------|--------|
| 09h00 | Cadrage : revue architecture, schéma DB, schéma réseau |
| 11h00 | Revue politique de sécurité |
| 14h00 | Revue registre traitements RGPD |
| 16h00 | Revue AIPD (DPIA) |

### A+1 à A+3 : Revue documentaire

L'auditeur parcourt l'ensemble de la documentation :
- `docs/AIPD.md` — analyse d'impact RGPD
- `docs/POLITIQUE-CONFIDENTIALITE.md`
- `docs/MENTIONS-LEGALES.md`
- `docs/ops/OPS-RUNBOOK.md`
- `docs/audit-externe/REGISTRE-VIOLATIONS.md`
- Schémas Prisma (`prisma/schema.prisma`)
- Configuration Nginx (`nginx/`)
- Docker compose (`docker-compose.*.yml`)
- CI/CD (`.github/workflows/`)
- Tests (`jest.config.ts`, `playwright.config.ts`, `load-tests/`)

### A+4 à A+5 : Rapport de cadrage

- Restitution au MOE + RSSI (réunion 14h00 jour A+5)
- Validation périmètre ajusté (ajouts/retraits)
- Liste des premiers constats (forces / faiblesses documentaires)
- Ajustement planning Phase 2 si nécessaire

**Livrable** : `rapport-cadrage-v1.pdf` (10-15 pages)

---

## Phase 2 — SAST & Configuration (A+6 to A+12)

### A+6 à A+8 : Analyse statique code

Outils recommandés (voir manuel auditeur §5) :
- **Semgrep** : scan vulnérabilités patterns
- **npm audit** : dépendances vulnérables
- **CodeQL** : déjà intégré CI, relecture des findings
- **ESLint security plugin** : déjà configuré
- **Trivy** : scan images Docker

Périmètre scan :
- `src/` (ensemble du code TypeScript)
- `prisma/` (migrations et schéma)
- `scripts/` (scripts ops)
- `nginx/` (configuration reverse proxy)
- `.github/workflows/` (CI/CD)
- `docker-compose*.yml`

### A+9 à A+10 : Revue configuration

- Hardening PostgreSQL (`db/postgres.conf`)
- Configuration Redis (`redis.conf`)
- Configuration Nginx (TLS, headers, WAF)
- Variables d'environnement (audit `.env.example`, jamais le `.env` réel)
- Rotation des secrets (politique trimestrielle)
- Gestion des backups (chiffrement GPG, fréquence, test restore)

### A+11 à A+12 : Rapport Phase 2

- Liste vulnérabilités identifiées (CVSS + sévérité P0-P4)
- Restitution MOE (réunion 14h00 jour A+12)
- Démo PoC pour les P0/P1 (preuve de concept)

**Livrable** : `rapport-sast-config-v1.pdf` (20-30 pages)

---

## Phase 3 — Pentest (A+13 to A+25)

### A+13 à A+20 : Tests intrusifs (35 scénarios)

Voir détail dans `docs/audit-externe/04-SCENARIOS-PENTEST.md`.

Catégories de scénarios :

| # | Catégorie | Scénarios | Jours |
|---|-----------|-----------|-------|
| 1 | Authentification | 6 (brute force, credential stuffing, JWT, session, 2FA bypass, reset password) | A+13 |
| 2 | Autorisation | 5 (IDOR, privilege escalation, horizontal, vertical, multi-tenant) | A+14 |
| 3 | Injection | 5 (SQLi, NoSQLi, XSS, command, LDAP) | A+15 |
| 4 | Logique métier | 6 (fraude examen, double paiement, contournement quota, manipulation prix, replay webhook, race condition) | A+16 |
| 5 | Fichiers | 4 (upload malveillant, path traversal, SSRF, XXE) | A+17 |
| 6 | API | 4 (rate limit, GraphQL, mass assignment, versioning) | A+18 |
| 7 | Infrastructure | 5 (TLS, headers, WAF bypass, Redis exposure, DB exposure) | A+20 |

### A+21 à A+22 : Tests charge & déni de service

- Test charge k6 (pic 500 VU) — surveillance saturation
- Slowloris test (connexions lentes)
- Test déni applicatif (requêtes coûteuses)
- Vérification cache Redis (storm cache)

### A+23 à A+25 : Rapport pentest

- Synthèse 35 scénarios (tableau avec statut : vulnérable / non vulnérable / non applicable)
- Détail par vulnérabilité trouvée :
  - Description technique
  - CVSS score + vecteur
  - PoC (commandes / scripts)
  - Impact business
  - Recommandation correction
- Restitution MOE (réunion 14h00 jour A+25)
- Démo PoC pour P0/P1 (présentation RSSI + MOA)

**Livrable** : `rapport-pentest-v1.pdf` (40-60 pages)

---

## Phase 4 — Conformité RGPD (A+26 to A+32)

### A+26 à A+28 : Revue conformité Loi L/2022/018/AN

Articles prioritaires :

| Article | Objet | Vérification |
|---------|-------|--------------|
| 5 | Licéité du traitement | Base légale pour chaque traitement |
| 6 | Consentement | Mécanisme recueil + retrait |
| 7 | Conditions du consentement | Preuve, granularité |
| 9 | Traitements particuliers | Données sensibles (biométrie?) |
| 13-15 | Information des personnes | Mentions légales, politique confidentialité |
| 16-18 | Droits des personnes | Accès, rectification, effacement, opposition |
| 19 | Notification violation | Délai 72h, registre, contenu notification |
| 20-22 | Étude d'impact | AIPD complète |
| 23 | Registre des traitements | Exhaustivité, mise à jour |
| 28 | Sous-traitants | Contrats Orange/MTN/MaxMind |
| 32-34 | Sécurité | Mesures techniques et organisationnelles |
| 35-37 | Transferts hors Guinée | Pays destinataires, garanties |
| 40-43 | Sanctions | Connaissance des risques |

### A+29 à A+30 : Vérification pratique

- Test demande d'accès aux données (workflow complet)
- Test demande effacement (vérification suppression effective)
- Test demande rectification
- Vérification registre violations à jour
- Vérification mentions légales accessibles (4 langues)
- Vérification consentement cookies (bandeau + opt-in)
- Test procédure notification violation (simulation scénario)

### A+31 à A+32 : Rapport conformité RGPD

- Tableau de conformité article par article (conforme / partiel / non conforme)
- Liste des écarts avec plan de remédiation
- Recommandations bonnes pratiques (au-delà du strict légal)
- Restitution MOA + RSSI (réunion 14h00 jour A+32)

**Livrable** : `rapport-conformite-rgpd-v1.pdf` (20-30 pages)

---

## Phase 5 — Synthèse & Rédaction (A+33 to A+42)

### A+33 à A+38 : Rédaction rapport final

Structure du rapport final (voir manuel auditeur §7) :

1. **Synthèse exécutive** (3-5 pages) — destinée direction
2. **Périmètre & méthodologie** (5 pages)
3. **Constats détaillés** (50-80 pages) :
   - Par domaine : authentification, autorisation, injection, logique métier, infrastructure, RGPD
   - Format standardisé : description / PoC / impact / CVSS / recommandation / référence OWASP
4. **Plan de remédiation priorisé** (10 pages) :
   - P0 (critique, 48h) — liste exhaustive
   - P1 (élevé, 7 jours) — liste exhaustive
   - P2 (modéré, 30 jours) — synthèse
   - P3 (faible, 90 jours) — synthèse
   - P4 (information) — synthèse
5. **Bilan positif** (5 pages) — points forts identifiés
6. **Annexes** :
   - Outils utilisés
   - Liste exhaustive scénarios testés
   - Captures d'écran PoC
   - Référentiels (OWASP Top 10, CIS Benchmarks, Loi L/2022/018/AN)

### A+39 à A+40 : Revue interne cabinet

- Relecture par pair (second auditeur du cabinet)
- Vérification cohérence CVSS
- Validation recommandations (faisabilité technique)
- Mise en forme PDF

### A+41 à A+42 : Rapport provisoire

- Transmission rapport provisoire au MOA (jour A+42, 12h00)
- Délai MOA pour retours : 3 jours ouvrés

**Livrable** : `rapport-audit-provisoire-v1.pdf` (80-130 pages)

---

## Phase 6 — Restitution & Clôture (A+43 to A+45)

### A+43 : Présentation officielle

- Réunion 10h00 (salle DNTT Conakry + visio)
- Participants : Directeur DNTT, MOA, MOE, RSSI, auditeurs, chef projet
- Présentation PowerPoint (45 min) :
  - Synthèse exécutive
  - Top 10 vulnérabilités
  - Plan remédiation priorisé
  - Recommandations stratégiques
  - Q&A (45 min)
- Compte rendu rédigé par RSSI

### A+44 : Traitement retours MOA

- Intégration retours MOA sur rapport provisoire
- Finalisation rapport final (signature par auditeur principal)
- Transmission version finale signée (PDF + sources)

### A+45 : Clôture & révocation accès

- [ ] Validation réception rapport final par MOA
- [ ] Exécution `scripts/revoke-auditor-access.sh` :
  - Suppression comptes SSH
  - Suppression comptes application
  - Rotation clés (post-audit)
  - Blocage IP auditeur
  - Vérification audit log (toutes actions auditeur tracées)
- [ ] Archivage :
  - Rapport final : Nextcloud DNTT (accès restreint, 5 ans)
  - Logs audit : Prometheus + Loki (90 jours)
  - Échanges emails : boîte archives `audit-externe@dntt.gouv.gn`
- [ ] Mise à jour `docs/audit-externe/REGISTRE-VIOLATIONS.md` si constats RGPD
- [ ] Création tickets GitHub pour chaque vulnérabilité (voir `PLAN-REMEDIATION.md`)
- [ ] Réunion de clôture (16h00) : mercis, feedback mutuel, next steps

**Livrable final** : `rapport-audit-final-signe.pdf`

---

## Suivi Hebdomadaire Audit

### Réunion sync hebdo (jeudi 10h00, 30 min)

Ordre du jour type :
1. Avancement phase en cours (%)
2. Constats importants de la semaine
3. Blocages éventuels (accès, données, support)
4. Ajustement planning si nécessaire
5. Communication à direction (si constat critique)

### Indicateurs suivi

Le script `scripts/audit-weekly-tracking.sh` génère chaque jeudi 09h00 :

```markdown
## Suivi Audit — Semaine {N} / 6

- Phase en cours : Phase {X} — {nom}
- Avancement global : {%}%
- Jours restants : {J} / 45
- Constats cumulés : {total} (P0: {n}, P1: {n}, P2: {n}, P3: {n}, P4: {n})
- Constats cette semaine : {n}
- Vulnérabilités déjà remédiées par MOE : {n} / {total}
- Blocages : {liste ou néant}
- Prochaine étape : {description}
```

---

## Critères de Qualité Audit

Le rapport final est jugé conforme aux standards si :

- [ ] Couverture exhaustive du périmètre validé en Phase 1
- [ ] Au moins 35 scénarios de pentest documentés
- [ ] CVSS calculé pour chaque vulnérabilité (vecteur complet)
- [ ] PoC reproductible pour chaque P0/P1
- [ ] Recommandations actionnables (pas de "améliorer la sécurité" générique)
- [ ] Références OWASP / CIS / Loi L/2022/018/AN systématiques
- [ ] Plan de remédiation priorisé et chiffré (effort estimé)
- [ ] Bilan positif documenté (forces identifiées)
- [ ] Relecture par pair interne cabinet
- [ ] Format PDF accessible (version 1.7, tags accessibilité)

---

## Gestion des Constats P0 en Cours d'Audit

Si un constat P0 (critique, CVSS ≥ 9.0) est découvert pendant l'audit :

1. **Notification immédiate** (< 2h) à RSSI + MOE + MOA
2. **Réunion exceptionnelle** sous 4h
3. **Décision** : correction immédiate ou arrêt temporaire service
4. **Correction MOE** sous 48h maximum
5. **Re-test auditeur** après correction
6. **Communication DNTT** si impact candidats (transparence)
7. **Mise à jour registre violations** si RGPD impliqué
8. **Notification AGPD** sous 72h si violation données personnelles

---

## Archivage Post-Audit

| Document | Support | Durée | Responsable |
|----------|---------|-------|-------------|
| Rapport final signé | Nextcloud DNTT | 5 ans | RSSI |
| Rapports intermédiaires (cadrage, SAST, pentest, RGPD) | Nextcloud DNTT | 5 ans | RSSI |
| PV de réunions (kick-off, sync hebdo, restitution) | Nextcloud DNTT | 5 ans | Chef projet |
| Logs accès auditeurs | Loki | 90 jours | MOE |
| Tickets remédiation | GitHub | Permanent | MOE |
| Communications emails | Boîte archives | 5 ans | RSSI |

---

## Coûts & Budget Audit

| Poste | Estimation (GNF) | Commentaire |
|-------|-------------------|-------------|
| Honoraires cabinet (45 jours) | à chiffrer | Selon convention |
| Déplacements auditeurs | à chiffrer | 2 visites Conakry |
| Hébergement staging | inclus | Infra existante |
| Outils audit (licences) | à chiffrer | Burp Suite Pro, etc. |
| Remédiation post-audit | à chiffrer | Selon findings |

---

**Version** : 1.0
**Dernière mise à jour** : pré-audit
**Propriétaire** : RSSI DNTT CodeRoute
**Validation** : MOA, MOE, cabinet d'audit
