# Politique de Confidentialité — CodeRoute Guinée

**Version :** 1.0 — Sprint 3
**Date d'entrée en vigueur :** 24 juin 2026
**Cadre légal :** Loi L/2022/018/AN du 20 juin 2022 relative à la protection des données à caractère personnel en République de Guinée

---

## 1. Responsable du traitement

Le responsable du traitement des données personnelles collectées via le Service CodeRoute Guinée est la **Direction Nationale des Transports Terrestres (DNTT)**, représentée par son Directeur National.

### Coordonnées du responsable

- **Adresse postale :** DNTT, BP 1234, Kaloum, Conakry, République de Guinée
- **Email :** dpo@transport.gov.gn
- **Téléphone :** +224 620 00 00 00

### Délégué à la protection des données (DPO)

Conformément à l'article 27 de la Loi L/2022/018/AN, la DNTT a désigné un Délégué à la Protection des Données, joignable à l'adresse `dpo@transport.gov.gn`. Le DPO est rattaché hiérarchiquement au Directeur National et dispose d'une indépendance fonctionnelle garantie par l'article 28 de la loi précitée.

---

## 2. Données à caractère personnel traitées

Le Service traite les catégories de données suivantes :

### 2.1 Données d'identité (candidats)

- Nom, prénom(s), sexe
- Date et lieu de naissance
- Numéro d'identification nationale (NIN)
- Photographie d'identité (facultative, pour la convocation)
- Numéro de téléphone mobile
- Adresse email (facultative)
- Ville et région de résidence
- Catégorie de permis visée

### 2.2 Données de compte et d'authentification

- Identifiant unique `GN-CODE-AAAA-XXXXXX`
- Mot de passe (stocké sous forme de hachage argon2id, jamais en clair)
- Jetons de session (cookies httpOnly, Secure, SameSite=Strict)
- Secret 2FA TOTP (pour les comptes administration/centre-agree)
- Historique des connexions (date, adresse IP, user-agent)

### 2.3 Données d'examen

- Sessions d'examen passées (date, centre, score, langues)
- Réponses détaillées aux questions (à des fins statistiques et d'audit)
- Résultats d'examen (réussite/échec, score, nombre de tentatives)
- Convocations émises (PDF générés avec QR code de vérification)

### 2.4 Données de paiement

- Identifiant de transaction Mobile Money (Orange/MTN/Celcom)
- Montant, devise, statut de la transaction
- Numéro de téléphone utilisé pour le paiement
- **Ne sont PAS collectées :** coordonnées bancaires, numéros de carte, code CVV

### 2.5 Données techniques et de journalisation

- Adresse IP (conservée 30 jours)
- User-Agent et type d'appareil
- Horodatage et nature des actions effectuées (audit log append-only)
- Événements de sécurité (tentatives de connexion échouées, alertes fraude)

### 2.6 Données de formation (candidats)

- Cours consultés et progression
- Scores aux examens blancs d'entraînement
- Préférences linguistiques (français, Pular, Soussou, Malinké)

---

## 3. Finalités et bases légales

Conformément à l'article 9 de la Loi L/2022/018/AN, les traitements de données poursuivent les finalités suivantes :

| Finalité | Base légale | Données concernées | Durée de conservation |
|---|---|---|---|
| Inscription et gestion du compte candidat | Intérêt public (Art. 9.2.c) | Identité, compte, contact | 10 ans après dernière activité |
| Organisation et passation des examens | Intérêt public (Art. 9.2.c) | Examen, convocation, paiement | 10 ans (prescription du droit de recours) |
| Délivrance du permis de conduire | Intérêt public (Art. 9.2.c) | Identité, résultat d'examen | 10 ans (durée de validité du permis B) |
| Prévention et détection de la fraude | Intérêt public (Art. 9.2.c) | Journalisation, alertes fraude | 7 ans (prescription pénale) |
| Communication institutionnelle (SMS de convocation) | Obligation légale (Art. 9.2.b) | Téléphone, email | 3 ans puis archivage |
| Amélioration du Service et statistiques | Intérêt légitime (Art. 9.2.f) | Données agrégées anonymisées | Indéfinie (anonymisées) |
| Sécurité informatique (audit log) | Intérêt légitime (Art. 9.2.f) | IP, user-agent, horodatage | 30 jours (logs applicatifs) |

---

## 4. Destinataires des données

Les données personnelles sont accessibles aux destinataires suivants, dans la limite de leurs attributions :

### 4.1 Destinataires internes

- **Agents de la DNTT** habilités (administration, super-administration) : accès complet aux dossiers candidats
- **Centres d'examen agréés** : accès limité aux candidats inscrits dans leur centre
- **Auto-écoles agréées** : accès limité à leurs élèves inscrits
- **Inspecteurs du permis** : accès aux convocations et résultats des examens qu'ils supervisent

### 4.2 Destinataires externes (sous-traitants)

Conformément à l'article 30 de la Loi L/2022/018/AN, la DNTT recourt aux sous-traitants suivants :

| Sous-traitant | Traitement | Pays | Garanties |
|---|---|---|---|
| Data Center gouvernemental (ANSN) | Hébergement base de données | Guinée | Convention de sous-traitance, certificat de sécurité ANSSI équivalent |
| Orange Guinée | Envoi de SMS de convocation + paiement Orange Money | Guinée | Convention signée, agrément BCRG |
| MTN Guinée | Paiement MTN Mobile Money + webhooks HMAC | Guinée | Convention signée, agrément BCRG |
| Celcom Guinée | Paiement Celcom Money (optionnel) | Guinée | Convention signée |
| Sentry (optionnel) | Monitoring applicatif en production | France (UE) | Clauses contractuelles types (CCT), chiffrement bout-en-bout |

La liste exhaustive des sous-traitants et des conventions signées est consultable sur demande auprès du DPO. Aucune donnée n'est transférée hors de l'Union Économique et Monétaire Ouest Africaine (UEMOA) ou de la CEDEAO, à l'exception de Sentry qui est couvert par des Clauses Contractuelles Types approuvées par la Commission de l'UE.

### 4.3 Destinataires légaux

Les données peuvent être communiquées, sur réquisition légale, à :
- L'Autorité Judiciaire (procureur, juge d'instruction)
- L'Autorité Guinéenne de Protection des Données (AGPD)
- Les forces de défense et de sécurité, dans le cadre de leurs attributions légales

---

## 5. Durées de conservation

Conformément au principe de minimisation (Art. 7 Loi L/2022/018/AN) et à l'obligation de limitation de la conservation (Art. 9.3), les données sont conservées selon les durées suivantes, après lesquelles elles sont supprimées ou anonymisées :

| Catégorie | Durée de conservation | Sort en fin de durée |
|---|---|---|
| Compte candidat inactif | 10 ans après dernière connexion | Suppression définitive |
| Résultats d'examen | 10 ans (prescription du droit de recours) | Anonymisation statistique |
| Paiements Mobile Money | 10 ans (obligation comptable BCRG) | Suppression |
| Audit log (actions sensibles) | 7 ans (prescription pénale) | Suppression |
| Logs applicatifs (IP, user-agent) | 30 jours | Suppression automatique |
| Sessions (cookies JWT) | 8 heures d'inactivité | Expiration automatique |
| SMS de convocation | 3 ans | Suppression |
| Données de formation (progression) | Tant que le compte est actif | Suppression à la clôture |
| Backups chiffrés | 30 jours (rétention roulante) | Écrasement automatique |

---

## 6. Vos droits

Conformément aux articles 32 à 37 de la Loi L/2022/018/AN, vous disposez des droits suivants sur vos données personnelles :

### 6.1 Droit d'accès (Art. 32)

Vous pouvez obtenir la copie de toutes les données personnelles que la DNTT détient à votre sujet, ainsi que les informations sur les finalités, destinataires et durées de conservation. Pour exercer ce droit, adressez une demande à `dpo@transport.gov.gn` en justifiant de votre identité.

### 6.2 Droit de rectification (Art. 33)

Vous pouvez faire corriger toute information inexacte ou incomplète vous concernant. La rectification est effectuée dans un délai d'**un mois** (délai légal : 2 mois maximum en cas de complexité).

### 6.3 Droit à l'effacement (« droit à l'oubli ») (Art. 34)

Vous pouvez demander la suppression de vos données personnelles, sauf si la conservation est requise par une obligation légale (par exemple : conservation des résultats d'examen pendant 10 ans). La suppression des données d'identification est possible, les données d'examen étant alors anonymisées.

### 6.4 Droit à la limitation du traitement (Art. 35)

Vous pouvez demander la suspension temporaire du traitement de vos données (par exemple, le temps de vérifier l'exactitude d'une information contestée).

### 6.5 Droit d'opposition (Art. 36)

Vous pouvez vous opposer au traitement de vos données pour des raisons légitimes, à l'exception des traitements fondés sur l'intérêt public ou l'obligation légale.

### 6.6 Droit à la portabilité (Art. 37)

Vous pouvez recevoir vos données dans un format structuré et lisible par machine (JSON ou CSV), et les transmettre à un autre service si vous le souhaitez.

### 6.7 Modalités d'exercice

Pour exercer ces droits :
1. **Par email :** `dpo@transport.gov.gn` (joindre une copie d'une pièce d'identité)
2. **Par courrier :** DNTT — Délégué à la Protection des Données, BP 1234, Conakry
3. **Depuis le Service :** Menu « Mon compte » → « Mes données personnelles » → « Télécharger mes données » (export JSON immédiat)

La DNTT s'engage à répondre à toute demande dans un délai d'**un mois** (prolongé de deux mois en cas de complexité, avec information de l'intéressé dans le mois de la demande).

### 6.8 Recours auprès de l'AGPD

Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de l'**Autorité Guinéenne de Protection des Données (AGPD)** :
- **Adresse :** Immeuble Koloma, 2e étage, Kipé, Conakry
- **Email :** contact@agpd.gov.gn
- **Site :** https://agpd.gov.gn

---

## 7. Sécurité des données

Conformément à l'article 22 de la Loi L/2022/018/AN, la DNTT met en œuvre les mesures techniques et organisationnelles suivantes pour garantir la sécurité de vos données :

### 7.1 Mesures techniques

- **Chiffrement au repos** : base de données PostgreSQL chiffrée (LUKS), backups AES-256
- **Chiffrement en transit** : TLS 1.2 minimum (TLS 1.3 privilégié), certificats Let's Encrypt
- **Hachage des mots de passe** : argon2id (mémoire 64 Mo, parallélisme 3, itérations 4)
- **Authentification à deux facteurs** : TOTP RFC 6238 obligatoire pour les comptes administration et centre-agree
- **Protection CSRF** : jetons HMAC liés à la session, validés à chaque requête mutable
- **Protection CSRF** : jetons HMAC liés à la session, validés à chaque requête mutable
- **Rate limiting** : 10 tentatives de connexion par IP et par minute (Redis)
- **Audit log append-only** : journalisation des actions sensibles, immuable
- **Headers HTTP** : HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Cookies sécurisés** : `httpOnly`, `Secure`, `SameSite=Strict`, préfixe `__Host-` en production

### 7.2 Mesures organisationnelles

- **Habilitations** : accès minimal selon le rôle (principe du moindre privilège)
- **Journalisation des accès administrateurs** : toute consultation d'un dossier candidat est tracée
- **Procédure d'incident** : notification à l'AGPD sous 72 heures (Art. 38 Loi L/2022/018/AN)
- **Formation** : sensibilisation annuelle obligatoire du personnel DNTT aux droits RGPD
- **Audits** : audit sécurité interne annuel, audit externe tous les 3 ans

---

## 8. Cookies et traceurs

Le Service utilise un nombre minimal de cookies, détaillés dans la [Politique de Cookies](./POLITIQUE-COOKIES.md). Aucun cookie publicitaire ou de tracking tiers n'est déposé.

---

## 9. Notification de violation de données

Conformément à l'article 38 de la Loi L/2022/018/AN, en cas de violation de données susceptible d'engendrer un risque pour vos droits et libertés, la DNTT s'engage à :
1. Notifier l'AGPD dans les **72 heures** suivant la constatation
2. Informer les personnes concernées « sans délai excessif » si le risque est élevé
3. Documenter la violation (nature, ampleur, mesures prises) dans le registre des violations

---

## 10. Modifications de la présente politique

La présente politique peut être modifiée à tout moment pour refléter l'évolution du Service ou de la réglementation. La date de dernière mise à jour est indiquée en haut de page. En cas de modification substantielle affectant vos droits, une notification email est envoyée à tous les utilisateurs actifs au moins 30 jours avant l'entrée en vigueur.

---

## 11. Contact

Pour toute question relative à la protection de vos données personnelles :
- **Email :** dpo@transport.gov.gn
- **Courrier :** DNTT — Délégué à la Protection des Données, BP 1234, Conakry, République de Guinée
- **Téléphone :** +224 620 00 00 00 (du lundi au vendredi, 08h30–16h30 GMT)
