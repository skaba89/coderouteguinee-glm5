# CodeRoute Guinée — Manuel de l'auditeur externe

> **Document de référence** pour l'auditeur sécurité indépendant mandaté par la DNTT pour évaluer la conformité et la sécurité de la plateforme CodeRoute Guinée.
>
> Audience : auditeurs qualifiés AfricaCERT / ngnCERT / ANSSI / cabinet spécialisé agréé AGPD.
>
> Durée recommandée de l'audit : 45 jours ouvrés (6 semaines).

---

## Table des matières

1. [Préambule et NDA](#1-préambule-et-nda)
2. [Périmètre et objectifs](#2-périmètre-et-objectifs)
3. [Calendrier type d'audit (45 jours)](#3-calendrier-type-daudit-45-jours)
4. [Accès aux environnements](#4-accès-aux-environnements)
5. [Outils recommandés](#5-outils-recommandés)
6. [Phase 1 — Revue documentaire (jours 1-7)](#phase-1--revue-documentaire-jours-1-7)
7. [Phase 2 — Tests statiques (jours 8-15)](#phase-2--tests-statiques-jours-8-15)
8. [Phase 3 — Pentest (jours 16-30)](#phase-3--pentest-jours-16-30)
9. [Phase 4 — Tests configuration infra (jours 31-35)](#phase-4--tests-configuration-infra-jours-31-35)
10. [Phase 5 — Conformité RGPD (jours 36-40)](#phase-5--conformité-rgpd-jours-36-40)
11. [Phase 6 — Rédaction rapport (jours 41-45)](#phase-6--rédaction-rapport-jours-41-45)
12. [Format du rapport attendu](#format-du-rapport-attendu)
13. [Bonnes pratiques et règles de conduite](#bonnes-pratiques-et-règles-de-conduite)
14. [Contacts et escalation](#contacts-et-escalation)

---

## 1. Préambule et NDA

Avant le démarrage de l'audit, vous devez signer :

- **Accord de confidentialité (NDA)** — fourni par la DNTT, valable 5 ans après la fin de l'audit
- **Charte d'audit** — voir `docs/audit-externe/01-CHARTE-AUDIT.md`
- **Convention d'accès temporaire** — voir `docs/audit-externe/05-ACCES-TEMPORAIRES.md`

Vous vous engagez à :

- Ne pas extraire de données personnelles hors du périmètre strict de l'audit
- Ne pas tenter d'exploiter les vulnérabilités découvertes (démonstration = OK, exfiltration = NON)
- Ne pas perturber la disponibilité du service (pas de DoS, pas de fuzzing destructif)
- Signaler toute vulnérabilité critique immédiatement (< 4h) au RSSI
- Détruire tous les artifacts d'audit 30 jours après la remise du rapport

## 2. Périmètre et objectifs

### 2.1. Périmètre inclus

| Composant                 | Environnement | Type d'accès     |
|---------------------------|---------------|------------------|
| Application Next.js 14    | Staging       | Code source + live |
| API routes (REST)         | Staging       | Live             |
| Base PostgreSQL 16        | Staging       | Lecture seule    |
| Cache Redis 7             | Staging       | Lecture seule    |
| Reverse proxy Nginx       | Staging       | Config + logs    |
| WAF ModSecurity + CRS 3.3 | Staging       | Config + logs    |
| Stack monitoring (Prometheus/Grafana/Loki) | Staging | Lecture seule |
| CI/CD GitHub Actions      | GitHub        | Lecture + workflow runs |
| Conteneurs Docker         | Staging       | Read-only exec   |
| Sauvegardes chiffrées     | Vault         | Accès metadata   |

### 2.2. Périmètre exclu

- ❌ Production (Conakry DC + Kankan DR) — accès interdit
- ❌ Données réelles de candidats — staging utilise données anonymisées
- ❌ Infra cloud tiers (si utilisé) — hors périmètre
- ❌ Code source des dépendances npm (audit séparé)
- ❌ Réseau DNTT interne (LAN administratif)

### 2.3. Objectifs de l'audit

Cf. **OWASP ASVS Level 2** + exigences spécifiques RGPD-Guinée :

- Confidentialité des données personnelles (NIN, téléphone, biensémie)
- Intégrité du processus d'examen (anti-fraude)
- Disponibilité du service (résilience DC)
- Traçabilité (audit log immuable)
- Conformité Loi L/2022/018/AN (articles 28 à 40)

## 3. Calendrier type d'audit (45 jours)

| Phase | Jours | Activité                                   | Livrable partiel                  |
|-------|-------|--------------------------------------------|-----------------------------------|
| 1     | 1-7   | Revue documentaire                         | Plan d'audit détaillé             |
| 2     | 8-15  | Tests statiques (SAST, secrets, deps)      | Rapport intermédiaire #1          |
| 3     | 16-30 | Pentest dynamique (35 scénarios)           | Rapport intermédiaire #2          |
| 4     | 31-35 | Audit configuration infra                  | Rapport intermédiaire #3          |
| 5     | 36-40 | Conformité RGPD                            | Rapport intermédiaire #4          |
| 6     | 41-45 | Synthèse + rapport final                   | Rapport final signé               |

**Points de synchronisation obligatoires** :

- J+7 : revue de plan d'audit avec DPO et RSSI
- J+15 : point d'avancement hebdomadaire
- J+30 : pré-synthèse des vulnérabilités critiques
- J+45 : remise du rapport final + présentation au comité d'audit

## 4. Accès aux environnements

### 4.1. Staging

URL : `https://staging.coderoute.gov.gn`

VPN d'accès : OpenVPN, configuration fournie par la DNTT (cf. `05-ACCES-TEMPORAIRES.md`).

Identifiants fournis (valides 45 jours, révocables à tout moment) :

- Compte GitHub équipe (lecture dépôt)
- Compte admin staging (rôle `super-admin` sur l'app, restreint au périmètre)
- Accès SSH aux conteneurs (read-only)
- Token Grafana/Prometheus (lecture seule)
- Token Sentry (lecture seule)

### 4.2. Rotation et révocation

- Toutes les credentials sont **renouvelées** en début d'audit
- Tous les accès sont **journalisés** (audit log + syslog)
- À la fin de l'audit, exécutez `scripts/revoke-auditor-access.sh` (ou demandez au RSSI de le faire)
- Le RSSI peut révoquer les accès à tout moment en cas d'anomalie

### 4.3. Test depuis l'extérieur

Pour les tests de pénétration externe (depuis Internet), utiliser :

- IP source dédiée fournie par la DNTT (allowlistée dans le WAF en mode DetectionOnly)
- Sinon : tests bloqués par geoblock + WAF — prévenir le RSSI 24h avant

## 5. Outils recommandés

| Catégorie         | Outil recommandé                        | Alternative libre     |
|-------------------|-----------------------------------------|------------------------|
| SAST              | Semgrep + ESLint security plugin        | Bearer, CodeQL         |
| Dépendances       | `npm audit`, Snyk (essai gratuit)       | OWASP Dependency-Check |
| Secrets           | TruffleHog, gitleaks                    | detect-secrets         |
| DAST              | OWASP ZAP                               | Burp Suite Community   |
| Conteneurs        | Trivy, Grype                            | Clair                  |
| Infra             | kube-bench (si K8s), Lynis              | CIS-CAT                |
| Réseau            | Nmap, Masscan                           | —                      |
| Fuzzing           | ffuf, wfuzz                             | gobuster               |
| SSL/TLS           | testssl.sh, sslyze                      | —                      |
| Cookies/session   | Cookie Scanner, Burp                    | —                      |

**Interdits** : sqlmap en mode destructif, Metasploit exploitation modules, Hydra bruteforce sur production (staging OK avec rate limit désactivé).

## Phase 1 — Revue documentaire (jours 1-7)

### Objectifs
Comprendre l'architecture, les exigences réglementaires, les mesures déjà en place, et préparer un plan d'audit détaillé.

### Documents à consulter (par ordre de priorité)

1. `docs/AIPD.md` — Analyse d'Impact relative à la Protection des Données (PIA)
2. `docs/pilote-dntt/PLAN-LANCEMENT-PILOTE.md` — Contexte métier
3. `docs/audit-externe/02-PERIMETRE-TECHNIQUE.md` — Périmètre technique détaillé
4. `docs/audit-externe/04-SCENARIOS-PENTEST.md` — 35 scénarios de pentest
5. `docs/ops/OPS-RUNBOOK.md` — Procédures opérationnelles
6. `docs/ops/WAF-TUNING.md` — Configuration WAF
7. `README.md` — Vue d'ensemble du projet
8. `prisma/schema.prisma` — Modèle de données
9. `src/lib/rate-limit.ts` + `src/lib/rate-limit-dynamic.ts` — Rate limiting
10. `src/lib/geoblock.ts` — Geoblocking
11. `src/lib/rgpd.ts` — Logique RGPD
12. `src/middleware.ts` — Middleware global
13. `.github/workflows/ci.yml` — Pipeline CI

### Livrable Phase 1 : Plan d'audit détaillé

Document de 5-10 pages comprenant :

- Compréhension de l'architecture (schéma de votre main)
- Liste des 35 scénarios de pentest priorisés
- Stratégie de tests (outils, planning, ressources)
- Risques identifiés en revue documentaire (préliminaires)
- Éventuelles demandes de complément d'accès

**Revue avec DPO + RSSI en J+7.**

## Phase 2 — Tests statiques (jours 8-15)

### 2.1 SAST (Semgrep + ESLint)

```bash
# Cloner le dépôt
git clone https://github.com/skaba89/coderouteguinee-glm5.git
cd coderouteguinee-glm5

# Installer
npm ci

# Lancer Semgrep
npx semgrep --config=p/owasp-top-ten --config=p/typescript --config=p/nextjs --json --output=semgrep-results.json

# ESLint security
npx eslint --ext .ts,.tsx src/ --format=json --output-file=eslint-results.json
```

### 2.2 Secrets dans le code

```bash
npx trufflehog filesystem --directory=. --json --output=trufflehog-results.json
npx gitleaks detect --source=. --report-path=gitleaks-results.json
```

### 2.3 Dépendances vulnérables

```bash
npm audit --audit-level=moderate --json > npm-audit.json
npx osv-scanner --lockfile=package-lock.json --json > osv-results.json
npx @snyk/protect test --json > snyk-results.json || true
```

### 2.4 Conteneurs

```bash
docker pull coderoute-app:latest
trivy image --format=json --output=trivy-image.json coderoute-app:latest
```

### 2.5 Configuration IaC

```bash
# Dockerfile lint
hadolint Dockerfile --format=json > hadolint-results.json

# docker-compose check
npx docker-compose-config docker-compose.staging.yml > compose-config.json
```

### Livrable Phase 2

Rapport intermédiaire #1 (15-20 pages) :

- Synthèse des vulnérabilités SAST (CVSS, exploitabilité, recommandation)
- Liste des secrets détectés (à reporter immédiatement si critiques)
- Vulnérabilités dépendances (CVE + CVSS + fix disponible?)
- Hardening Dockerfile / Compose manquant

## Phase 3 — Pentest (jours 16-30)

### 3.1 Préparation

- Coordinatez avec le RSSI pour la fenêtre de tests
- Snapshot staging avant tests : `./scripts/backup-db.sh /tmp/pre-pentest.sql.gpg`
- WAF en mode `DetectionOnly` (vérifier dans `nginx/modsec/modsecurity.conf`)
- Geoblock : votre IP doit être dans `GEOBLOCK_ALLOWLIST_CIDR` (sinon : bloqué)

### 3.2 Scénarios

Suivez **strictement** les 35 scénarios de `docs/audit-externe/04-SCENARIOS-PENTEST.md` :

- 10 scénarios OWASP ASVS L2 — authentification
- 8 scénarios — contrôle d'accès
- 5 scénarios — injection (SQL, NoSQL, XSS, SSRF, command)
- 4 scénarios — logs et monitoring
- 4 scénarios — paiement et fraude
- 4 scénarios — fichier et upload

Pour chaque scénario :

1. Lire la description
2. Exécuter le test (manuellement ou scripté)
3. Capturer : requête, réponse, logs WAF, logs app, alertes Grafana
4. Noter le résultat (Pass / Fail / Partial)
5. Si Fail : CVSS + recommandation correctif

### 3.3 Outils à utiliser

```bash
# OWASP ZAP pour scanner les endpoints
zap-cli quick-scan -s xss,sqli -t https://staging.coderoute.gov.gn

# Burp Suite pour les tests manuels
# - Repeater pour les requêtes ciblées
# - Intruder pour le fuzzing (rate limit = 10 req/s max)

# ffuf pour la découverte de endpoints cachés
ffuf -w wordlists/api-endpoints.txt -u https://staging.coderoute.gov.gn/FUZZ -mc 200,401,403,500

# sqlmap (sur staging uniquement, jamais en prod)
sqlmap -u "https://staging.coderoute.gov.gn/api/courses?id=1" --batch --level=3 --risk=2 --flush-session
```

### 3.4 Limites à respecter

- **Pas de bruteforce dépassant 30 req/s** (risque de DoS staging)
- **Pas d'extraction de données au-delà de 100 lignes** (preuve = OK, exfiltration = NON)
- **Pas de modification de données persistantes** (utilisez un compte test dédié)
- **Pas de tests sur /api/payments/webhook** sans coordination préalable (risque de casser l'intégrité)

### Livrable Phase 3

Rapport intermédiaire #2 (25-35 pages) :

- Synthèse des 35 scénarios (tableau Pass/Fail/Partial)
- Détail des vulnérabilités trouvées (POC + reproduction)
- Captures d'écran / logs / payloads
- Recommandations correctives priorisées

## Phase 4 — Tests configuration infra (jours 31-35)

### 4.1 SSL/TLS

```bash
testssl.sh --severity HIGH --json-pretty https://staging.coderoute.gov.gn > ssl-results.json
sslyze --regular https://staging.coderoute.gov.gn > sslyze-results.txt
```

Vérifier :

- TLS 1.2 minimum, 1.3 préféré
- Pas de SSLv3, TLS 1.0, TLS 1.1
- Ciphers suites robustes (ECDHE, AES-GCM, ChaCha20-Poly1305)
- HSTS : `max-age=31536000; includeSubDomains; preload`
- Certificate Transparency (Expect-CT)
- OCSP stapling activé

### 4.2 Headers de sécurité

```bash
curl -sI https://staging.coderoute.gov.gn | grep -E 'X-|Content-Security|Strict|Referrer'
```

Vérifier la présence de :

- ✅ `Content-Security-Policy` (CSP) avec `frame-ancestors 'none'`
- ✅ `Strict-Transport-Security` (HSTS)
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Permissions-Policy` (camera, microphone, geolocation désactivés)

### 4.3 Configuration Nginx

```bash
# Récupérer la config
ssh ops@staging 'cat /etc/nginx/nginx.conf /etc/nginx/conf.d/*.conf' > nginx-config.txt

# Linter
gixy nginx-config.txt
```

### 4.4 Configuration PostgreSQL

```bash
# Vérifier le pg_hba.conf
ssh ops@staging 'cat /var/lib/postgresql/data/pg_hba.conf' > pg-hba.txt

# Vérifier les paramètres de sécurité
psql -c "SHOW password_encryption;"  # doit être scram-sha-256
psql -c "SHOW ssl;"                  # doit être on
psql -c "SHOW log_connections;"      # doit être on
```

### 4.5 Configuration Redis

```bash
redis-cli CONFIG GET requirepass     # doit être non vide
redis-cli CONFIG GET bind             # doit être 127.0.0.1 ou IP interne
redis-cli CONFIG GET protected-mode   # doit être yes
```

### 4.6 Docker daemon

```bash
# Vérifier le durcissement
docker info --format '{{json .SecurityOptions}}'
# Devrait inclure: name=seccomp,name=no-new-privileges
```

### Livrable Phase 4

Rapport intermédiaire #3 (15-20 pages) :

- Score SSL Labs (cible : A ou A+)
- Liste des headers manquants
- Vulnérabilités configuration PostgreSQL / Redis / Docker
- Recommandations hardening

## Phase 5 — Conformité RGPD (jours 36-40)

### 5.1 Vérifications réglementaires (articles 28-40 de la Loi L/2022/018/AN)

| Article | Exigence                                              | Preuve attendue                          |
|---------|-------------------------------------------------------|------------------------------------------|
| 28      | Registre des traitements                              | `docs/AIPD.md` + registre              |
| 29      | AIPD (PIA) pour traitements à risque                  | `docs/AIPD.md`                          |
| 30      | Information des personnes (mentions légales)          | `docs/MENTIONS-LEGALES.md`              |
| 31      | Recueil du consentement                               | Logs de consentement + cookie banner    |
| 32      | Droit d'accès, rectification, effacement              | Endpoint `/api/rgpd/export` + processus |
| 33      | Notification violation AGPD (72h)                     | Registre + runbook                      |
| 34      | Communication personnes (si risque élevé)             | Templates communication                 |
| 35      | Registre violations interne                           | `docs/audit-externe/REGISTRE-VIOLATIONS.md` |
| 36      | Code de conduite                                       | Chartes DNTT                            |
| 37      | Protection dès la conception (Privacy by Design)      | AIPD + revue code                       |
| 38      | Indemnisation                                          | Procédure d'indemnisation               |
| 39      | Sanctions administratives                              | Procédure interne                       |
| 40      | Transferts hors Guinée                                 | Inventaire des transferts               |

### 5.2 Tests fonctionnels RGPD

```bash
# Test droit d'accès (article 32)
# 1. Créer un compte candidat avec données fictives
# 2. Demander export via /api/rgpd/export
# 3. Vérifier : données complètes, format lisible, délai < 30 jours

# Test droit à l'effacement
# 1. Soumettre demande /api/rgpd/delete
# 2. Vérifier : user supprimé, audit log conservé (anonymisé), paiements conservés (obligation fiscale)

# Test anonymisation backup staging
./scripts/prepare-staging-twin.sh --refresh-data
# Vérifier que le backup staging est anonymisé :
psql -c "SELECT email FROM \"User\" LIMIT 5"
# Doit retourner anon@example.com pour tous
```

### 5.3 Vérification du registre des violations

```bash
cat docs/audit-externe/REGISTRE-VIOLATIONS.md
```

Vérifier :

- Toutes les violations (réelles + simulations) sont documentées
- Chaque entrée contient : date, description, données impactées, mesures, statut AGPD
- Conservation 5 ans prévue

### 5.4 Test du runbook incident AGPD

Exécuter l'exercice de simulation :

```bash
# Sur staging (jamais en prod)
STAGING_HOST=staging.coderoute.gov.gn npx tsx scripts/simulate-incident.ts A
```

Puis évaluer :

- L'équipe ops détecte-t-elle l'incident sans aide ?
- Le délai de notification AGPD (72h) est-il respecté ?
- Les templates de communication sont-ils correctement utilisés ?

### Livrable Phase 5

Rapport intermédiaire #4 (15-20 pages) :

- Conformité par article (tableau Pass/Fail/Partial)
- Tests fonctionnels RGPD (résultats)
- Recommandations correctives

## Phase 6 — Rédaction rapport (jours 41-45)

### Structure du rapport final

1. **Synthèse exécutive** (2 pages) — pour le sponsor DNTT
2. **Méthodologie** (2 pages)
3. **Synthèse des findings** (5 pages) — tableau de tous les vulnérabilités par sévérité
4. **Détails techniques** (50-80 pages) — un paragraphe détaillé par vulnérabilité
5. **Conformité réglementaire** (10 pages)
6. **Recommandations** (5 pages) — priorisées par criticité et effort
7. **Annexes** :
   - Captures d'écran
   - Logs
   - Payloads de test
   - Rapports outils (JSON)

### Format attendu

- PDF signé électroniquement
- Markdown source dans un dépôt privé partagé avec la DNTT
- Versionning : `rapport-audit-v1.0.pdf`, `rapport-audit-v1.1.pdf` (révisions)

### Sévérité (CVSS v3.1)

| Niveau    | CVSS     | Action attendue                  |
|-----------|----------|----------------------------------|
| Critique  | 9.0-10.0 | Correction immédiate (< 7 jours) |
| Élevée    | 7.0-8.9  | Correction sous 30 jours         |
| Moyenne   | 4.0-6.9  | Correction sous 90 jours         |
| Basse     | 0.1-3.9  | Correction sous 180 jours        |
| Info      | 0.0      | Suivi opportuniste               |

## Bonnes pratiques et règles de conduite

### ✅ À faire

- **Communiquer** : prévenir le RSSI avant tout test pouvant générer du bruit
- **Documenter** : chaque test = date, heure, IP, payload, résultat
- **Minimiser** : ne pas extraire plus de données que nécessaire à la preuve
- **Restaurer** : remettre le staging dans son état initial après chaque test destructif
- **Signaler** : vulnérabilité critique = email `rssi@coderoute.gov.gn` + appel téléphonique < 4h

### ❌ À ne pas faire

- Tester la production (jamais, sous aucun prétexte)
- Télécharger plus de 100 lignes de données utilisateur
- Modifier des données persistantes (utilisez un compte test dédié)
- Partager des accès avec des tiers non mandatés
- Publier les findings avant remise officielle du rapport
- Conserver des artifacts d'audit au-delà de 30 jours post-rapport

### En cas de découverte d'une vulnérabilité critique en production

(Si jamais vous identifiez par hasard une faille critique sur la prod, par exemple via l'analyse du code source ou de la configuration)

1. **Arrêter immédiatement** toute exploitation
2. **Contacter** le RSSI par téléphone : +224 622 XX XX 02
3. **Envoyer** un email chiffré PGP à `rssi@coderoute.gov.gn` avec :
   - Description de la vulnérabilité
   - Preuve de concept minimale
   - Risque estimé
4. **Ne pas** re-tester avant coordination avec le RSSI

## Contacts et escalation

| Rôle                  | Nom               | Email / Téléphone                  |
|-----------------------|-------------------|------------------------------------|
| Sponsor DNTT          | {à compléter}     | directeur@dntt.gov.gn              |
| DPO                   | {à compléter}     | dpo@coderoute.gov.gn               |
| RSSI                  | {à compléter}     | rssi@coderoute.gov.gn              |
| Tech Lead             | {à compléter}     | techlead@coderoute.gov.gn          |
| Ops on-call           | —                 | oncall@coderoute.gov.gn (24/7)     |
| AGPD (référent)       | {à compléter}     | contact@agpd.gov.gn                |
| Auditeur (vous)       | {à compléter}     | {votre email}                      |

### Niveaux d'escalation

| Niveau | Déclencheur                                | Délai   | Destinataire                |
|--------|--------------------------------------------|---------|-----------------------------|
| 1      | Question opérationnelle                    | 24h     | Tech Lead                   |
| 2      | Blocage technique (accès manquant)         | 4h      | RSSI                        |
| 3      | Vulnérabilité critique détectée            | 1h      | RSSI + Sponsor DNTT         |
| 4      | Incident de sécurité avéré sur la prod     | Immédiat | RSSI + Sponsor + AGPD      |

---

**Merci de votre engagement. Ce manuel est confidentiel et ne doit pas être partagé en dehors de l'équipe audit mandatée.**
