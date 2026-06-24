# Charte d'audit — CodeRoute Guinée

## 1. Objet

La présente charte définit le cadre de l'audit externe de sécurité et de conformité de la plateforme CodeRoute Guinée, réalisée dans le cadre du Sprint 11 du projet de modernisation de l'examen du permis de conduire en République de Guinée.

Cet audit s'inscrit dans la trajectoire de mise en production progressive pilotée par la Direction Nationale des Transports Terrestres (DNTT) et l'Agence Guinéenne de Protection des Données (AGPD).

## 2. Références réglementaires

L'audit se réfère aux textes suivants :

- **Loi L/2022/018/AN** du 17 juin 2022 relative à la protection des données à caractère personnel en République de Guinée.
- **Décret D/2023/.../PRG** portant application de la loi précitée (décret d'application à jour à la date d'audit).
- **Lignes directrices AGPD** sur les analyses d'impact relatives à la protection des données (AIPD).
- **ISO/IEC 27001:2022** — Systèmes de management de la sécurité de l'information.
- **ISO/IEC 27002:2022** — Mesures de sécurité et bonnes pratiques.
- **OWASP ASVS 4.0.3** — Application Security Verification Standard (niveau 2 : Standard Verification).
- **OWASP Top 10:2021** — Top 10 des vulnérabilités applicatives web.
- **OWASP API Top 10:2023** — Top 10 des vulnérabilités d'API.
- **NIST SP 800-63B** — Digital Identity Guidelines (authentification).
- **PCI DSS v4.0** (informationnel — pas de stockage carte, mais flux paiements Mobile Money).

## 3. Périmètre d'audit

### 3.1 Inclus

Le périmètre d'audit couvre l'ensemble des composants de la plateforme CodeRoute Guinée en production, à savoir :

- **Application web** Next.js 14 (frontend React + API routes) accessible à `https://coderoute.gov.gn`.
- **API REST** exposée par les routes Next.js sous `/api/*`.
- **Base de données PostgreSQL 16** hébergée à Conakry DC.
- **Cache Redis 7** pour les sessions, rate limiting et files de notifications.
- **Reverse proxy Nginx** et edge Caddy (TLS).
- **Webhooks Mobile Money** reçus depuis Orange Money et MTN MoMo.
- **Service SMS Orange** pour les notifications OTP et convocations.
- **Service SMTP** pour les emails administratifs et RGPD.
- **Backups chiffrés** (daily + weekly) stockés hors-site (Kankan DC).
- **Pipeline CI/CD** GitHub Actions (build, test, scan SCA, build Docker, push registry).
- **Documentation** : AIPD, registre des traitements, politique de confidentialité, mentions légales, runbook ops.

### 3.2 Exclu

Sont explicitement exclus du périmètre d'audit :

- **Postes de travail** des agents DNTT (audit organisé séparément par la DSI DNTT).
- **Téléphones mobiles** des candidats (hors périmètre — l'app ne stocke rien localement sauf cache PWA non sensible).
- **Réseau interne Conakry DC** (audit infra sous la responsabilité de l'hébergeur).
- **Comptes Orange Money / MTN MoMo** côté opérateur (audit propre à chaque opérateur).
- **Éditeur de code** et outils de développement utilisés par l'équipe interne.

### 3.3 Environnement d'audit

L'audit doit porter sur **un environnement jumeau de production** (staging), distinct de la production réelle pour éviter toute perturbation du service. Le staging doit avoir :

- La même version du code que la production (commit SHA en cours).
- Les mêmes secrets **générés de manière indépendante** (jamais réutiliser les secrets prod sur staging).
- Un jeu de données réaliste (~100 candidats, ~10 auto-écoles, ~5 centres, ~50 paiements) sans données personnelles réelles.
- La même configuration réseau (firewall, TLS, headers CSP).

## 4. Règles d'engagement

### 4.1 Créneaux autorisés

- **Tests boîte noire (invasifs)** : créneaux **20h00 - 06h00 GMT**, du lundi au vendredi, hors jours fériés guinéens.
- **Tests boîte blanche (revue code, configuration)** : en continu, hors des créneaux de pointe métier (09h00-12h00 et 15h00-17h00 GMT).
- **Tests de charge** : créneaux **22h00 - 05h00 GMT** uniquement, pour éviter tout impact sur le trafic réel.

### 4.2 Règles de conduite

L'auditeur s'engage à :

- **Ne pas** tenter d'exploiter les vulnérabilités au-delà de la démonstration de faisabilité (pas de dump de base, pas d'exfiltration de données personnelles réelles, pas de modification de données).
- **Ne pas** perturber la disponibilité du service (pas de DoS volumétrique au-delà de 50 req/s sur 60s).
- **Ne pas** divulguer les vulnérabilités发现的 hors du canal sécurisé défini (canal Slack dédié `#audit-2026` ou boîte chiffrée PGP).
- **Ne pas** utiliser de données personnelles réelles dans les rapports (anonymisation systématique, screenshots floutés).
- **Signaler toute vulnérabilité critique dans les 4 heures** suivant sa découverte, par téléphone au RSSI et par email chiffré.

### 4.3 Règles d'arrêt

L'audit doit être **immédiatement suspendu** si :

- Une vulnérabilité critique permettant l'exfiltration de données personnelles est découverte et exploitée.
- Le service de production est impacté (erreur 5xx sur >5% des requêtes).
- Un incident de sécurité suspect est détecté (intrusion réelle, attaque en cours).
- L'AGPD demande la suspension dans le cadre d'une enquête.

La décision de reprise est prise conjointement par le Sponsor DNTT, le DPO et le RSSI.

## 5. Méthodologie

L'audit suit la méthodologie **OWASP WSTG v4.2** (Web Security Testing Guide) pour la partie application, et **OWASP MASVS v2.0** pour la partie PWA/mobile. Les étapes sont :

1. **Reconnaissance passive** : OSINT sur le domaine, certificats TLS, sous-domaines, historique DNS.
2. **Cartographie applicative** : crawl de l'application, identification des endpoints, des paramètres, des rôles utilisateurs.
3. **Analyse de configuration** : headers HTTP, CSP, HSTS, cookies, TLS, CORS.
4. **Tests d'authentification** : politique de mots de passe, lockout, 2FA, gestion de session JWT, logout, invalidation.
5. **Tests d'autorisation** : escalade verticale (candidat → admin), escalade horizontale (candidat A accède aux données de candidat B), IDOR sur `/api/bookings/[id]`, `/api/users/me`.
6. **Tests d'entrée** : injection SQL (Prisma paramétré normalement), XSS (réflex, stocké, DOM), SSRF, XXE, désérialisation.
7. **Tests de logique métier** : contournement de paiement, double réservation, manipulation du tarif, fraud aux résultats.
8. **Tests API** : rate limiting, CSRF, validation des entrées, gestion d'erreurs (fuite d'information).
9. **Tests de fichiers** : upload (PWA icons, audio), téléchargement (convocations PDF).
10. **Tests de cryptographie** : JWT signing, webhook HMAC, argon2id, CSRF tokens.
11. **Tests RGPD** : export des données, droit à l'effacement, droit d'opposition, registre des traitements.
12. **Tests d'infrastructure** : Docker, Nginx, Redis, PostgreSQL (config, patch, durcissement).

## 6. Livrables attendus

L'auditeur doit livrer les éléments suivants :

1. **Rapport d'audit** au format `07-RAPPORT-MODELE.md`, en français, signé numériquement (PGP ou eIDAS).
2. **Présentation de restitution** (15-20 slides) pour le comité de pilotage DNTT.
3. **Liste des vulnérabilités** au format CSV (id, titre, sévérité CVSS, description, preuve de concept, recommandation, statut).
4. **Synthèse exécutive** (1 page maximum) pour le ministre des Transports.
5. **Attestation de conformité** (ou de non-conformité) signée, conforme au modèle AGPD.
6. **Annexes techniques** : captures d'écran, logs d'exploitation, payloads de test.

## 7. Confidentialité

L'ensemble des livrables et des échanges pendant l'audit est **strictement confidentiel**. L'auditeur signe un accord de confidentialité (NDA) conforme au modèle `06-CONFIDENTIALITE-CA-NDA.md` avant tout accès. Le NDA survit 5 ans après la fin de l'audit.

## 8. Propriété intellectuelle

Les rapports et constats produits par l'auditeur sont **propriété conjointe de la DNTT et de l'auditeur**. La DNTT peut les diffuser librement en interne et auprès de l'AGPD. L'auditeur conserve le droit de citer la mission dans son portfolio de manière anonymisée (sans données personnelles ni architecture détaillée).

## 9. Responsabilité

L'auditeur est responsable des dommages directs causés par ses tests (ex. corruption de données en staging). Il n'est pas responsable des vulnérabilités résiduelles découvertes après la fin de l'audit — l'audit est une photographie à un instant T, pas une garantie pérenne.

La responsabilité de l'auditeur est plafonnée au montant de son assurance professionnelle (≥ 500 000 000 GNF).

## 10. Durée

La mission d'audit court sur **45 jours calendaires** à compter de la date de démarrage effective (signature du NDA + accès activés).

## 11. Acceptation

L'acceptation de la présente charte par l'auditeur vaut engagement contractuel. Elle doit être signée par :

- Pour la DNTT : le Directeur National des Transports Terrestres.
- Pour l'auditeur : le responsable de mission.
- Pour la RSSI interne : le Responsable de la Sécurité des Systèmes d'Information.

---

**Lieu** : Conakry, République de Guinée
**Date** : __ / __ / 2026
**Signatures** (précédées de la mention manuscrite « lu et approuvé ») :

___________________________   ___________________________   ___________________________
DNTT (Sponsor)                 Auditeur (Mission)            RSSI interne
