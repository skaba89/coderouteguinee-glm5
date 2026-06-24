# AIPD — Analyse d'Impact sur la Protection des Données (simplifiée)

**Version :** 1.0 — Sprint 3
**Date :** 24 juin 2026
**Cadre légal :** Loi L/2022/018/AN du 20 juin 2022, article 23 (Analyse d'Impact relative à la Protection des Données)
**Traitement concerné :** Plateforme CodeRoute Guinée — examen du permis de conduire

---

## 1. Contexte et objectif de l'AIPD

L'article 23 de la Loi L/2022/018/AN fait obligation au responsable de traitement de réaliser une Analyse d'Impact relative à la Protection des Données (AIPD, ou DPIA en anglais) pour les traitements susceptibles d'engendrer un risque élevé pour les droits et libertés des personnes concernées. La plateforme CodeRoute Guinée, qui traite des données d'identité, de paiement et d'examen à grande échelle (potentiellement plusieurs centaines de milliers de candidats par an), entre dans ce cadre.

La présente AIPD est une version simplifiée et structurée selon les recommandations de l'Autorité Guinéenne de Protection des Données (AGPD). Elle sera complétée et étendue dans une version formelle avant le lancement du pilote DNTT, sur la base des retours d'expérience du centre pilote de Conakry.

### Équipe AIPD

- **Responsable :** Délégué à la Protection des Données (DPO) de la DNTT
- **Contributeurs :** Directeur technique DNTT, responsable sécurité, représentant du ministère des Transports
- **Relecteur :** Autorité Guinéenne de Protection des Données (saisine prévue Q3 2026)

---

## 2. Description du traitement

### 2.1 Identification du responsable

- **Nom :** Direction Nationale des Transports Terrestres (DNTT)
- **Représentant légal :** Directeur National des Transports Terrestres
- **DPO :** `dpo@transport.gov.gn`
- **Coordonnées :** BP 1234, Kaloum, Conakry, République de Guinée

### 2.2 Finalités du traitement

Le traitement a pour finalités :
1. **Permettre l'inscription en ligne** des candidats à l'examen du permis de conduire
2. **Faciliter le paiement** des frais d'examen via Mobile Money (Orange Money, MTN MoMo, Celcom)
3. **Organiser les sessions d'examen** dans les centres agréés (attribution des créneaux, convocation)
4. **Faire passer l'examen théorique** du code de la route (40 questions, 30 minutes)
5. **Délivrer le permis de conduire** aux candidats reçus (génération du document officiel)
6. **Prévenir la fraude** (détection d'impersonnation, doublons, triche)
7. **Produire des statistiques agrégées** anonymisées pour le pilotage de la politique publique

### 2.3 Données traitées

Voir [Politique de Confidentialité, section 2](./POLITIQUE-CONFIDENTIALITE.md#2-données-à-caractère-personnel-traitées) pour le détail exhaustif. Les principales catégories sont :

- Données d'identité (nom, prénom, NIN, date de naissance, photographie)
- Données de contact (téléphone, email)
- Données de compte (identifiant unique, mot de passe haché, 2FA)
- Données d'examen (sessions, réponses, scores, convocations)
- Données de paiement (ID transaction Mobile Money, montant, statut)
- Données techniques (IP, user-agent, audit log)

### 2.4 Personnes concernées

- **Candidats** à l'examen du permis de conduire (catégories A, B, C, D, E)
- **Auto-écoles agréées** (personnes morales, représentants légaux)
- **Centres d'examen agréés** (personnes morales, inspecteurs)
- **Agents de la DNTT** (administration, super-administration, inspecteurs)

### 2.5 Destinataires

Voir [Politique de Confidentialité, section 4](./POLITIQUE-CONFIDENTIALITE.md#4-destinataires-des-données) pour le détail. Destinataires principaux :
- Personnel habilité de la DNTT
- Centres d'examen et auto-écoles (accès limité à leurs candidats)
- Sous-traitants techniques (hébergeur ANSN, Orange, MTN, Celcom, Sentry optionnel)
- Autorités judiciaires et l'AGPD (sur réquisition)

---

## 3. Nécessité et proportionnalité

### 3.1 Nécessité

Le traitement est **nécessaire** à l'exécution de la mission de service public de la DNTT, qui a pour mission d'organiser l'examen du permis de conduire en République de Guinée (décret D/2018/__/PRG portant organisation de la DNTT). La digitalisation du processus répond à plusieurs impératifs :
- Réduire la fraude documentaire (papiers falsifiés)
- Améliorer l'accessibilité (réduction des files d'attente physiques)
- Produire des statistiques fiables pour le pilotage
- Faciliter les paiements (lutte contre la corruption monétaire)

### 3.2 Proportionnalité

Les données collectées sont strictement limitées à ce qui est nécessaire :

| Donnée | Nécessaire ? | Justification |
|---|---|---|
| NIN | Oui | Identification unique, requis par la loi |
| Nom/prénom | Oui | Convocation, permis |
| Date de naissance | Oui | Vérification majorité, permis |
| Photographie | Facultatif | Convocation visuelle (alternatives possibles) |
| Téléphone | Oui | Convocation SMS, 2FA |
| Email | Facultatif | Communication non urgente |
| Adresse postale | Non | Pas de nécessité opérationnelle |
| Catégorie de permis | Oui | Organisation des sessions par catégorie |
| Sexe | Non | Supprimé du formulaire (Sprint 1) |
| Situation matrimoniale | Non | Supprimé (Sprint 1) |
| Revenus | Non | Pas pertinent pour l'examen |

### 3.3 Mesures de minimisation

- **Anonymisation** des données de formation après l'examen (conservées à des fins statistiques uniquement)
- **Pseudonymisation** de l'audit log (identifiant interne, pas de NIN)
- **Accès minimal selon le rôle** (principe du moindre privilège)
- **Suppression automatique** des logs au-delà de 30 jours
- **Pas de profilage** ni de scoring automatisé à des fins commerciales

---

## 4. Identification des risques

L'analyse des risques s'appuie sur la matrice vraisemblance × gravité, où :
- **Vraisemblance** : 1 (très faible) à 4 (très élevée)
- **Gravité** : 1 (mineure) à 4 (critique)
- **Risque** = Vraisemblance × Gravité (échelle 1–16)
- **Seuil acceptable** : ≤ 6
- **Seuil inacceptable** : ≥ 9 (mesures renforcées obligatoires)

### 4.1 Matrice des risques

| ID | Risque | V | G | Score | Statut |
|---|---|---|---|---|---|
| R1 | Vol d'identité via fuite de la base de données | 2 | 4 | 8 | Maîtrisé (mesures renforcées) |
| R2 | Usurpation de compte candidat (credential stuffing) | 3 | 3 | 9 | Maîtrisé (rate limit + 2FA optionnel) |
| R3 | Fraude à l'examen (impersonnation physique) | 3 | 4 | 12 | À renforcer (vérification biométrique pilote) |
| R4 | Divulgation involontaire à un tiers (bug ACL) | 2 | 4 | 8 | Maîtrisé (tests e2e + audit code) |
| R5 | Attaque par déni de service (DoS) | 3 | 2 | 6 | Maîtrisé (rate limit Redis + CDN) |
| R6 | Faille XSS permettant le vol de session | 2 | 3 | 6 | Maîtrisé (CSP strict + httpOnly) |
| R7 | Faille CSRF sur action sensible | 1 | 4 | 4 | Maîtrisé (jetons HMAC + SameSite=Strict) |
| R8 | Injection SQL sur endpoint filtrant | 1 | 4 | 4 | Maîtrisé (Prisma parameterized queries) |
| R9 | Perte de données (backup corrompu) | 2 | 4 | 8 | Maîtrisé (backups chiffrés + test restore) |
| R10 | Compromission du serveur (RCE) | 2 | 4 | 8 | Maîtrisé (non-root Docker + audit deps) |
| R11 | Fuite de secret via GitHub (commit forcé) | 2 | 3 | 6 | Maîtrisé (pre-commit hooks + scans) |
| R12 | Vol de session via cookie non sécurisé | 1 | 4 | 4 | Maîtrisé (httpOnly + Secure + SameSite=Strict) |
| R13 | Logging involontaire de données sensibles | 2 | 2 | 4 | Maîtrisé (audit logs + reviews) |
| R14 | Transfert international non conforme (Sentry) | 1 | 3 | 3 | Maîtrisé (CCT + chiffrement) |
| R15 | Délai d'exercice des droits > 1 mois | 2 | 2 | 4 | Maîtrisé (automatisation endpoints) |

### 4.2 Risques inacceptables

**R3 — Fraude à l'examen par impersonnation physique (score 12)** est le seul risque inacceptable en l'état. Des mesures renforcées sont déployées :
- Vérification de la pièce d'identité à l'entrée de la salle
- Photographie sur place (comparaison avec photo d'inscription)
- Géolocalisation du candidat (anti-triche à distance)
- Plan pilote de reconnaissance biométrique (empreinte digitale) au centre de Conakry en 2027

---

## 5. Mesures de réduction des risques

### 5.1 Mesures techniques

| Risque couvert | Mesure | Mise en œuvre |
|---|---|---|
| R1, R9 | Chiffrement base de données (LUKS) | ✅ Sprint 1 |
| R1 | Backups chiffrés AES-256, rétention 30j | ✅ Sprint 1 |
| R1, R10 | Audit automatique des dépendances (`npm audit`) | ✅ Sprint 3 |
| R2 | Rate limiting Redis (10 req/min/IP sur /api/auth/login) | ✅ Sprint 1 |
| R2 | 2FA TOTP obligatoire pour comptes administration | ✅ Sprint 2 |
| R2 | Hachage argon2id (64 Mo mémoire, 4 itérations) | ✅ Sprint 1 |
| R3, R4 | Tests e2e RGPD + examen + webhook | ✅ Sprint 3 |
| R5 | Rate limiting Nginx (10 r/s burst 20 sur /api/) | ✅ Sprint 1 |
| R6 | CSP strict, headers HSTS, X-Frame-Options | ✅ Sprint 1 |
| R6 | Cookies httpOnly, Secure, SameSite=Strict | ✅ Sprint 1 |
| R7 | Jetons CSRF HMAC liés à la session | ✅ Sprint 1 |
| R8 | Prisma (requêtes paramétrées par défaut) | ✅ Sprint 1 |
| R10 | Docker non-root (uid 1001), tini PID 1 | ✅ Sprint 1 |
| R10 | Scan de secrets dans le code source | ✅ Sprint 3 |
| R11 | Pre-commit hooks + `.gitignore` strict | ✅ Sprint 1 |
| R14 | Sentry optionnel, chiffrement en transit | ✅ Sprint 2 |

### 5.2 Mesures organisationnelles

| Risque couvert | Mesure | Échéance |
|---|---|---|
| R3 | Formation inspecteurs à la détection d'impersonnation | Q3 2026 |
| R3 | Procédure d'incident fraude (signalement AGPD) | ✅ Sprint 3 |
| R4 | Habilitations minimales selon le rôle | ✅ Sprint 1 |
| R13 | Sensibilisation annuelle du personnel DNTT | Q4 2026 |
| R15 | Endpoint `/api/rgpd/export` (export JSON immédiat) | ✅ Sprint 3 |
| R15 | Endpoint `/api/rgpd/delete` (suppression sous 30j) | ✅ Sprint 3 |

### 5.3 Mesures spécifiques au risque R3 (fraude impersonnation)

Étant donné le score élevé de R3, les mesures renforcées suivantes sont mises en place **avant le lancement du pilote** :

1. **Vérification d'identité triple** à l'entrée de la salle d'examen :
   - Pièce d'identité officielle (CNI, passeport, permis international)
   - Numéro unique GN-CODE-AAAA-XXXXXX (généré par le Service)
   - Photographie sur place comparée à la photo d'inscription

2. **Géolocalisation** du candidat au moment de l'examen (anti-triche à distance) :
   - Le navigateur demande l'autorisation de géolocalisation
   - Les coordonnées GPS sont comparées au centre d'examen déclaré
   - Une alerte fraude est levée si la distance > 100 m

3. **Audit log append-only** : toute consultation d'un dossier candidat par un agent est tracée, et l'audit log est immuable (pas de suppression possible).

4. **Procédure d'incident** : en cas de fraude avérée, signalement à l'AGPD sous 72 heures (Art. 38 Loi L/2022/018/AN), sanctions disciplinaires et pénales.

5. **Plan pilote biométrie** : reconnaissance empreinte digitale au centre de Conakry, déploiement national en 2027 sur la base des retours d'expérience.

---

## 6. Plan de gestion des risques résiduels

Après mise en œuvre des mesures ci-dessus, les risques résiduels sont :

| ID | Risque | Score résiduel | Mesure complémentaire |
|---|---|---|---|
| R3 | Fraude impersonnation | 6 (V2×G3) | Pilote biométrie 2027 |
| R1 | Vol d'identité | 4 (V1×G4) | Audit externe annuel |
| R9 | Perte de données | 4 (V1×G4) | Test de restauration trimestriel |
| R10 | Compromission serveur | 4 (V1×G4) | Pen-test annuel tiers de confiance |

Aucun risque résiduel ne dépasse le seuil inacceptable (≥ 9). Le traitement peut donc être mis en œuvre, sous réserve du respect des mesures renforcées identifiées.

---

## 7. Droits des personnes concernées

L'exercice des droits (accès, rectification, effacement, opposition, portabilité) est détaillé dans la [Politique de Confidentialité, section 6](./POLITIQUE-CONFIDENTIALITE.md#6-vos-droits). Les mécanismes techniques suivants sont en place :

| Droit | Endpoint | Délai observé |
|---|---|---|
| Accès | `GET /api/rgpd/export` (candidat authentifié) | Immédiat (< 5s) |
| Rectification | `PATCH /api/users/me` | < 1 minute |
| Effacement | `POST /api/rgpd/delete` | < 30 jours (anonymisation) |
| Opposition | `POST /api/rgpd/oppose` | < 30 jours |
| Portabilité | `GET /api/rgpd/export?format=json` | Immédiat |

Les demandes par email ou courrier sont traitées par le DPO dans le délai légal d'un mois, prolongeable de deux mois en cas de complexité (avec information de l'intéressé dans le mois de la demande, conformément à l'article 32 de la Loi L/2022/018/AN).

---

## 8. Registre des violations

Conformément à l'article 38 de la Loi L/2022/018/AN, la DNTT tient un **registre des violations de données** consignant :
- La nature de la violation
- Les données concernées
- Le nombre de personnes affectées
- Les mesures prises
- La notification à l'AGPD (sous 72 heures)
- La notification aux personnes concernées (si risque élevé)

Ce registre est consultable par l'AGPD sur demande et fait l'objet d'un rapport annuel public.

---

## 9. Validation et suivi

### 9.1 Validation

La présente AIPD est validée par :
- Le Délégué à la Protection des Données (DPO) de la DNTT
- Le Directeur National des Transports Terrestres
- L'Autorité Guinéenne de Protection des Données (saisine prévue pour validation Q3 2026)

### 9.2 Révision

L'AIPD sera révisée dans les cas suivants :
- Modification substantielle du traitement (nouvelle finalité, nouveau destinataire)
- Incident de sécurité avéré
- Évolution de la réglementation guinéenne ou de l'UEMOA
- Au minimum tous les 2 ans

### 9.3 Indicateurs de suivi

| Indicateur | Cible | Périodicité |
|---|---|---|
| Nombre de demandes d'exercice de droits traitées dans les délais | 100 % | Mensuel |
| Nombre d'incidents de sécurité notifiés à l'AGPD | < 1/an | Trimestriel |
| Taux de fraude à l'examen détectée | < 0,5 % des sessions | Trimestriel |
| Couverture des tests automatisés | > 80 % | Continu |
| Durée moyenne de réponse à une demande RGPD | < 15 jours | Mensuel |

---

## 10. Annexe — Références réglementaires

- **Loi L/2022/018/AN** du 20 juin 2022 relative à la protection des données à caractère personnel en République de Guinée
- **Décret D/2023/__/PRG** portant application de la loi L/2022/018/AN
- **Loi L/2017/040/AN** du 22 décembre 2017 relative aux communications électroniques
- **Loi L/2016/053/AN** (Code pénal) — articles 313 et suivants (fausses déclarations)
- **Directive CEMAC n°18/2019** relative au commerce électronique
- **Règlement BCRG n°2024/__/** sur les services de paiement mobile
- **Règlement général RGPD (UE) 2016/679** — référence comparée pour les transferts internationaux (Sentry, sous-traitants UE)
- **Recommandations AGPD** sur les AIPD (guide méthodologique 2023)

---

## 11. Contact

Pour toute question relative à la présente AIPD :
- **DPO :** `dpo@transport.gov.gn`
- **AGPD :** `contact@agpd.gov.gn` — Immeuble Koloma, 2e étage, Kipé, Conakry
- **Site AGPD :** https://agpd.gov.gn
