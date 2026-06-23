# CodeRoute Guinée — Modèle de notification AGPD (article 33)

Ce modèle est utilisé pour notifier l'AGPD en cas de violation de données à caractère personnel, conformément à l'article 33 de la Loi L/2022/018/AN.

## Comment utiliser ce modèle

1. Le DPO remplit toutes les sections marquées `<À COMPLÉTER>` dans les **72 heures** suivant la prise de conscience de la violation.
2. Le Sponsor DNTT valide le contenu (signature numérique).
3. Le DPO envoie la notification par email chiffré PGP à `notification@agpd.gov.gn` et par téléphone au +224 304 21 00 00.
4. Une copie est archivée dans `docs/audit-externe/notifications-agpd/<YYYY-MM-DD>-<reference>.md` (chiffrée).
5. Une entrée est ajoutée au `docs/audit-externe/REGISTRE-VIOLATIONS.md`.

## Délai légal

Le délai de 72 heures commence à la **prise de conscience** de la violation par l'organisme (pas à la violation elle-même). Si la notification dépasse 72h, le retard doit être justifié dans la section 9.

---

# NOTIFICATION DE VIOLATION DE DONNÉES À CARACTÈRE PERSONNEL

## Article 33 — Loi L/2022/018/AN

### Organisme notificateur

- **Nom** : Direction Nationale des Transports Terrestres (DNTT)
- **Adresse** : Conakry, République de Guinée
- **Représentant légal** : `<Nom du Directeur National>`
- **DPO / Contact** : `<dpo@coderoute-gn.org>` / +224 `<...>`
- **Numéro d'agrément AGPD** : `<À compléter si applicable>`

### Identification de la notification

- **Référence interne** : CRG-VIOL-`<YYYY>`-`<NNN>`
- **Date d'envoi de la présente notification** : `<YYYY-MM-DD HH:MM>` GMT
- **Canal d'envoi** : Email chiffré PGP + téléphone
- **Destinataire AGPD** : `notification@agpd.gov.gn`

---

## 1. Description de la violation

### 1.1 Nature de la violation

`<Description synthétique : 1 à 3 phrases. Ex. : « Extraction non autorisée de la table User de la base de données de production via une injection SQL sur l'endpoint /api/admin/users, permettant à un attaquant anonyme de récupérer les données personnelles de 10 000 candidats inscrits. »>`

### 1.2 Origine de la violation

`<Cocher la case pertinente>`
- [ ] Attaque externe malveillante (cyberattaque)
- [ ] Attaque interne malveillante (employé ou sous-traitant)
- [ ] Erreur humaine interne
- [ ] Défaillance technique (bug, panne)
- [ ] Défaillance organisationnelle (processus absent ou non respecté)
- [ ] Cause externe (fournisseur tiers compromis)
- [ ] Autre : `<préciser>`

### 1.3 Période de la violation

- **Date et heure estimées du début de la violation** : `<YYYY-MM-DD HH:MM>` GMT
- **Date et heure de la détection** : `<YYYY-MM-DD HH:MM>` GMT
- **Date et heure de la prise de conscience** : `<YYYY-MM-DD HH:MM>` GMT (cette date déclenche le délai de 72h)
- **Date et heure du confinement** : `<YYYY-MM-DD HH:MM>` GMT
- **Durée totale d'exposition** : `<X heures / jours>`

---

## 2. Données à caractère personnel concernées

### 2.1 Volume estimé

- **Nombre de personnes physiques concernées** : `<X>`
- **Nombre d'enregistrements concernés** : `<X>`
- **Pourcentage de la base utilisateurs totale** : `<X %>`

### 2.2 Catégories de personnes concernées

`<Cocher toutes les cases pertinentes>`
- [ ] Candidats à l'examen du permis de conduire
- [ ] Auto-écoles
- [ ] Centres agréés
- [ ] Agents DNTT (administration)
- [ ] Super-administrateurs
- [ ] Autre : `<préciser>`

### 2.3 Catégories de données compromises

`<Cocher toutes les cases pertinentes>`
- [ ] Identité (nom, prénom)
- [ ] Numéro d'identification national (NIN)
- [ ] Date de naissance
- [ ] Adresse postale
- [ ] Adresse email
- [ ] Numéro de téléphone
- [ ] Données financières (historique paiements, montant)
- [ ] Données biométriques (si applicable)
- [ ] Données d'authentification (hash de mot de passe, token)
- [ ] Résultats d'examen
- [ ] Adresse IP, journaux de connexion
- [ ] Autre : `<préciser>`

### 2.4 Données NON compromises (à clarifier)

`<Lister les données qui n'ont PAS été impactées, pour rassurer l'AGPD. Ex. : « Les numéros de carte bancaire ne sont jamais stockés (pas de stockage PCI DSS). Les mots de passe sont hachés avec argon2id et n'ont pas été dé-hachés à ce stade. Les PIN Orange Money / MTN MoMo ne transitent jamais par la plateforme. »>`

---

## 3. Conséquences potentielles pour les personnes concernées

### 3.1 Évaluation des risques

`<Cocher le niveau de risque pour chaque catégorie>`

| Catégorie de risque | Niveau | Justification |
|---|---|---|
| Usurpation d'identité | `<Faible / Moyen / Élevé / Critique>` | `<Ex. Élevé car NIN + nom + prénom + date de naissance exposés, permettant des démarches administratives frauduleuses.>` |
| Fraude financière | `<...>` | `<Ex. Faible car aucun PIN ni donnée bancaire exposée.>` |
| Hameçonnage ciblé | `<...>` | `<Ex. Élevé car email + téléphone + statut candidat exposés, permettant des campagnes de phishing personnalisées.>` |
| Atteinte à la réputation | `<...>` | `<Ex. Faible car les résultats d'examen n'ont pas été exposés.>` |
| Préjudice moral | `<...>` | `<Ex. Moyen car les personnes concernées peuvent s'inquiéter pour leurs données.>` |
| Discrimination | `<...>` | `<Ex. Faible car aucune donnée sensible (religion, ethnie, opinion politique) n'est collectée.>` |

### 3.2 Risque global

- **Niveau de risque global** : `<Faible / Moyen / Élevé / Critique>`
- **Justification** : `<1 paragraphe>`
- **Communication aux personnes concernées requise (article 34)** : `<Oui / Non>`

---

## 4. Mesures prises ou proposées

### 4.1 Mesures de confinement immédiates

`<Lister les actions déjà exécutées. Ex. :`
- Blocage des IP attaquantes via Nginx (T+Xh)
- Désactivation temporaire de la route /api/admin/users (T+Xh)
- Rotation du secret SESSION_SECRET (T+Xh)
- Restauration de la base depuis le backup de la veille (T+Xh)`>`

### 4.2 Mesures de remédiation à court terme (≤ 30 jours)

`<Lister les actions planifiées. Ex. :`
- Correction de la vulnérabilité SQLi sur /api/admin/users (audit + patch sous 7 jours)
- Audit complet des autres routes API par le RSSI (sous 14 jours)
- Renforcement du WAF Nginx (sous 7 jours)
- Mise à jour de la librairie Prisma (sous 7 jours)`>`

### 4.3 Mesures de remédiation à moyen terme (≤ 90 jours)

`<Lister les actions structurelles. Ex. :`
- Mise en place d'un IDS/IPS sur le réseau Conakry DC (sous 60 jours)
- Formation sensibilisation sécurité pour toute l'équipe (sous 30 jours)
- Audit externe complet (sous 90 jours)`>`

### 4.4 Communication aux personnes concernées

`<Si risque élevé, décrire la communication. Ex. : « Email envoyé le <date> à 10 000 candidats, contenant description de l'incident, données concernées, conseils (changement mot de passe, vigilance phishing), coordonnées du DPO. SMS envoyé en complément pour les candidats sans email valide. Annonce publique sur https://coderoute.gov.gn/incident-<ref>. »>`

---

## 5. Coordination avec d'autres autorités

`<Cocher toutes les cases pertinentes>`
- [ ] Notification à l'ANSSI (Agence Nationale de Sécurité des Systèmes d'Information) — `<si applicable>`
- [ ] Notification à la police judiciaire (commissariat central de Conakry) — `<si cyberattaque caractérisée>`
- [ ] Notification à Orange Guinée — `<si webhook Orange Money impliqué>`
- [ ] Notification à MTN Guinée — `<si webhook MTN MoMo impliqué>`
- [ ] Notification à l'hébergeur (Conakry DC) — `<si compromission infrastructure>`
- [ ] Autre : `<préciser>`

---

## 6. Mesures de suivi

### 6.1 Investigation en cours

`<Décrire les actions d'investigation en cours. Ex. : « Analyse des logs PostgreSQL pour identifier l'ensemble des requêtes malveillantes, en cours par le RSSI. Audit des accès admin pour vérifier s'il y a eu compromission de comptes. »>`

### 6.2 Mise à jour de la présente notification

Une notification de mise à jour sera envoyée à l'AGPD si :
- Le volume estimé de personnes concernées est révisé de plus de 10%.
- De nouvelles catégories de données compromises sont identifiées.
- Le risque global est réévalué (vers le haut ou vers le bas).
- Des mesures de remédiation supplémentaires sont prises.

### 6.3 Rapport de clôture

Un rapport de clôture sera envoyé à l'AGPD dans les **30 jours** suivant la présente notification, comprenant :
- Bilan de l'investigation.
- Liste exhaustive des mesures prises.
- Leçons apprises et plan de prévention.
- Mise à jour du registre des violations.

---

## 7. Coordonnées de contact

- **DPO** : `<Nom>` — `dpo@coderoute-gn.org` — +224 `<...>`
- **RSSI** : `<Nom>` — `rssi@coderoute-gn.org` — +224 `<...>`
- **Sponsor DNTT** : `<Nom>` — `dntt@coderoute-gn.org` — +224 `<...>`
- **Tech Lead** : `<Nom>` — `tech@coderoute-gn.org` — +224 `<...>`

Disponibilités : 7j/7, 24h/24 pendant la gestion de l'incident.

---

## 8. Validation

Cette notification est validée par :

- **DPO** : `<Nom>` — Date : `<YYYY-MM-DD>` — Signature : `<numérique PGP ou manuscrite>`
- **Sponsor DNTT** : `<Nom>` — Date : `<YYYY-MM-DD>` — Signature : `<numérique PGP ou manuscrite>`

---

## 9. Justification de retard éventuel (si notification > 72h)

`<Si la notification est envoyée plus de 72h après la prise de conscience, justifier le retard. Ex. : « Le délai de 72h a été dépassé de X heures en raison de <cause>. La notification a été envoyée dès que l'ensemble des éléments requis ont été collectés. »>`

`<Si notification dans les délais : « Notification envoyée dans le délai réglementaire de 72 heures après prise de conscience (cf. section 1.3). »>`

---

**Date de la notification** : `<YYYY-MM-DD>`
**Référence** : CRG-VIOL-`<YYYY>`-`<NNN>`
**Version** : 1.0 (initiale) / 1.1 (mise à jour) / 2.0 (clôture)
