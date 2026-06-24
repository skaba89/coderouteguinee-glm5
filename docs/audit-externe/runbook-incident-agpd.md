# CodeRoute Guinée — Runbook de simulation d'incident AGPD

## Objectif

Ce runbook décrit l'**exercice de simulation d'incident de violation de données** à réaliser avant la mise en production de CodeRoute Guinée. L'objectif est de tester la capacité de l'équipe à :

1. **Détecter** une violation de données dans un délai compatible avec la notification AGPD de 72 heures.
2. **Évaluer** la gravité de l'incident selon la grille AGPD.
3. **Notifier** l'AGPD dans le délai réglementaire (72 h après prise de conscience).
4. **Communiquer** aux personnes concernées si l'incident présente un risque élevé pour leurs droits et libertés.
5. **Documenter** l'incident dans le registre des violations (obligation article 33 RGPD-Guinée).
6. **Restaurer** le service en sécurité et appliquer les leçons apprises.

## Cadre réglementaire

- **Article 33** de la Loi L/2022/018/AN : notification à l'AGPD dans les **72 heures** après prise de conscience.
- **Article 34** : communication aux personnes concernées si **risque élevé** pour leurs droits et libertés.
- **Article 35** : registre interne des violations (à conserver 5 ans).
- Lignes directrices AGPD sur la notification (à jour à la date de l'exercice).

## Calendrier de l'exercice

L'exercice se déroule sur **une journée complète** (8 heures) selon le calendrier suivant :

| Heure | Phase | Acteurs | Durée |
|---|---|---|---|
| T+0h00 | Déclenchement (injection de l'incident) | RSSI + animateur | 30 min |
| T+0h30 | Détection et qualification | Ops + RSSI | 1h |
| T+1h30 | Cellule de crise activée | Sponsor DNTT + RSSI + DPO + Tech Lead | 30 min |
| T+2h00 | Confinement et investigation | Ops + RSSI + Tech Lead | 2h |
| T+4h00 | Rédaction de la notification AGPD | DPO | 1h |
| T+5h00 | Notification AGPD (simulée) | DPO + Sponsor | 30 min |
| T+5h30 | Communication aux personnes concernées | DPO + Sponsor | 1h |
| T+6h30 | Restauration du service | Ops + Tech Lead | 1h |
| T+7h30 | Post-mortem et registre des violations | Tous | 30 min |
| T+8h00 | Débriefing et leçons apprises | Tous + animateur | 30 min |

## Scénarios d'incident

L'animateur choisit **un** scénario parmi les 5 ci-dessous, sans le révéler à l'équipe ops. Le scénario est injecté à T+0h00.

### Scénario A — Fuite de base de données via injection SQL

**Déclenchement** : l'animateur exécute sur le staging une requête `sqlmap` qui réussit à extraire la table `User` (sans vraiment — c'est une simulation).

**Symptômes observables** :
- Pics anormaux de requêtes PostgreSQL (visible Grafana).
- Requêtes inhabituelles dans les logs PostgreSQL (ex. `UNION SELECT`).
- Erreurs 500 sur certaines routes API.
- Alerte Sentry : exceptions SQL.

**Données impactées (simulées)** : 10 000 enregistrements `User` (NIN, nom, prénom, email, téléphone, date de naissance).

**Gravité** : **Élevée** — PII de 10 000 candidats, risque d'usurpation d'identité.

### Scénario B — Vol de credentials admin via phishing

**Déclenchement** : l'animateur envoie un email de phishing simulé à l'admin `admin@coderoute-gn.org`. Le "voleur" utilise les credentials pour accéder à `/api/admin/users` et télécharge la liste.

**Symptômes observables** :
- Connexion admin depuis une IP inhabituelle (visible audit log).
- Téléchargement massif via `/api/admin/users` (visible audit log).
- Alerte rate-limiting (peut être déclenchée).

**Données impactées (simulées)** : liste de 10 000 utilisateurs (email, téléphone, rôle).

**Gravité** : **Critique** — accès admin complet, toutes les PII potentiellement exfiltrées.

### Scénario C — Webhook Mobile Money falsifié

**Déclenchement** : l'animateur envoie 1000 webhooks falsifiés à `/api/payments/webhook` avec une signature HMAC valide (secret supposé divulgué). 100 paiements sont marqués "confirmés" sans contrepartie financière.

**Symptômes observables** :
- Hausse anormale des paiements confirmés (visible Grafana).
- Incohérence entre les paiements confirmés et les relevés Orange Money / MTN MoMo.
- Alertes fraude déclenchées.

**Données impactées** : intégrité financière (100 faux paiements), pas de PII directement.

**Gravité** : **Moyenne** — pas de PII, mais impact financier et confiance utilisateur.

### Scénario D — Perte de backups chiffrés

**Déclenchement** : l'animateur simule la perte de 3 backups quotidiens consécutifs (ex. disque dur de transport perdu entre Conakry et Kankan).

**Symptômes observables** :
- Alerte backup manquant (script `scripts/backup-cron.sh`).
- Vérification échouée : `restore-test` ne peut pas restaurer les 3 derniers jours.

**Données impactées** : pas de fuite, mais perte de capacité de restauration (RPO dégradé à 4 jours au lieu de 1).

**Gravité** : **Faible à Moyenne** — pas de fuite, mais dégradation de la résilience. **Notification AGPD non requise** si la clé de chiffrement n'est pas compromise (à valider par le DPO).

### Scénario E — Fuite de secret via commit GitHub

**Déclenchement** : l'animateur commite (sur une branche de test) un fichier `.env` contenant un `WEBHOOK_ORANGE_MONEY_SECRET` valide. Le commit est visible publiquement 1 heure avant détection.

**Symptômes observables** :
- Alerte GitHub Secret Scanning (activé sur le dépôt).
- Le secret apparaît dans l'historique git (consultable via `git log -p`).

**Données impactées** : secret de vérification HMAC divulgué → possibilité de forger des webhooks.

**Gravité** : **Élevée** — risque de fraude massive aux paiements. Notification AGPD requise (le secret peut permettre l'accès à des données financières).

## Déroulé de l'exercice

### Phase 1 — Déclenchement (T+0h00 à T+0h30)

L'animateur exécute le scénario choisi (sans révéler à l'équipe ops). L'équipe ops doit détecter l'anomalie via :

- Alertes Grafana (Prometheus alerts).
- Alertes Sentry.
- Alertes email/SMS (rate limit, fraude, backup manquant).
- Surveillance manuelle (dashboard ops).

L'équipe ops **déclenche l'alerte** en envoyant un message au canal Slack `#incident-response` avec le template :

```
🚨 INCIDENT DÉTECTÉ
Type: <SQLi | Phishing | Webhook falsifié | Backup perdu | Secret divulgué>
Sévérité estimée: <Critique | Élevée | Moyenne | Faible>
Heure de détection: <YYYY-MM-DD HH:MM:SS GMT>
Détecté par: <nom>
Symptômes: <liste>
Action immédiate: <ex. mise en maintenance, isolation serveur>
```

L'animateur valide que le message est envoyé dans les 30 minutes.

### Phase 2 — Détection et qualification (T+0h30 à T+1h30)

L'équipe ops affine l'analyse :

1. **Confirmer** qu'il s'agit bien d'un incident de sécurité (pas d'un faux positif).
2. **Identifier** les systèmes impactés (base de données, API, paiements, backups).
3. **Estimer** le volume de données impactées (nombre d'enregistrements, types de PII).
4. **Estimer** la fenêtre temporelle (quand l'incident a-t-il commencé ? quand a-t-il été détecté ?).
5. **Qualifier** la gravité selon la grille AGPD (cf. section ci-dessous).

L'animateur fournit des "indices" si l'équipe est bloquée (ex. "vérifiez les logs PostgreSQL entre 09h00 et 10h00").

#### Grille de gravité AGPD

| Critère | Faible (1) | Moyen (2) | Élevé (3) | Critique (4) |
|---|---|---|---|---|
| Volume | < 100 PII | 100 - 1 000 | 1 001 - 10 000 | > 10 000 |
| Type de PII | Email seul | Email + nom | + NIN ou téléphone | + données financières |
| Risque pour les personnes | Gêne mineure | Risque d'arnaque | Risque d'usurpation | Risque vital ou financier grave |
| Réversibilité | Effaçable | Effaçable avec effort | Difficile à effacer | Irréversible |

La **gravité finale** est la somme des critères. Une somme ≥ 8 déclenche la communication aux personnes concernées (article 34).

### Phase 3 — Cellule de crise (T+1h30 à T+2h00)

La cellule de crise est activée. Composition :

- **Sponsor DNTT** : autorise les décisions majeures (mise en maintenance, communication publique).
- **RSSI** : pilote la réponse technique.
- **DPO** : pilote la conformité RGPD et la notification AGPD.
- **Tech Lead** : exécute les actions techniques.
- **Ops** : exécute les actions d'infrastructure.
- **Animateur** : observe, ne participe pas.

La cellule se réunit en visioconférence (Jitsi ou Google Meet, lien pré-partagé). L'animateur chronomètre.

Décisions à prendre dans les 30 minutes :

1. **Confinement immédiat** : faut-il isoler des serveurs, bloquer des IP, désactiver des routes API ?
2. **Préservation des preuves** : quels logs/ dumps conserver pour investigation ?
3. **Communication interne** : qui informe l'équipe élargie, les auto-écoles, les centres ?
4. **Notification AGPD** : faut-il notifier ? Dans quel délai ?
5. **Communication aux personnes** : faut-il communiquer aux candidats impactés ?

### Phase 4 — Confinement et investigation (T+2h00 à T+4h00)

Le Tech Lead et Ops exécutent les actions de confinement :

- **Scénario A (SQLi)** : bloquer l'IP attaquante via Nginx, désactiver la route vulnérable ( retour 503), appliquer un correctif (ex. validation stricte des entrées).
- **Scénario B (Phishing)** : révoquer le mot de passe admin, forcer 2FA, bloquer l'IP, auditer les actions de l'attaquant.
- **Scénario C (Webhook)** : bloquer l'IP source, révoquer `WEBHOOK_ORANGE_MONEY_SECRET`, le faire tourner, restaurer les paiements falsifiés en `pending`.
- **Scénario D (Backup)** : relancer les backups, vérifier l'intégrité des backups restants, renforcer le transport physique.
- **Scénario E (Secret)** : faire tourner le secret immédiatement, purger l'historique git (`git filter-branch` ou BFG), alerter GitHub Secret Scanning.

Le RSSI documente chaque action dans `AuditLog` avec `actor: 'incident-response'`.

### Phase 5 — Rédaction notification AGPD (T+4h00 à T+5h00)

Le DPO rédige la notification AGPD (cf. modèle `docs/audit-externe/modele-notification-agpd.md`).

La notification doit contenir :

1. **Description** de la violation (nature, origine, période).
2. **Volume** de données concernées (nombre de personnes, types de PII).
3. **Conséquences** potentielles pour les personnes.
4. **Mesures** prises ou proposées (confinement, remédiation, communication).
5. **Coordonnées** du DPO (`dpo@coderoute-gn.org`, +224 ...).
6. **Délai de notification** : 72 h après prise de conscience (cf. article 33).

### Phase 6 — Notification AGPD (T+5h00 à T+5h30)

Le DPO envoie la notification à `notification@agpd.gov.gn` (email chiffré PGP si possible) et au contact téléphonique AGPD (à jour sur `https://agpd.gov.gn/contact`).

Le Sponsor DNTT cosigne la notification (validation politique).

Pour l'exercice, la notification est **simulée** (envoi à `dpo@coderoute-gn.org` avec copie animateur).

### Phase 7 — Communication aux personnes (T+5h30 à T+6h30)

Si la gravité est **Élevée ou Critique** (somme ≥ 8 sur la grille), le DPO rédige une communication aux personnes impactées :

- **Canal** : email (si email disponible) + SMS (si téléphone disponible) + annonce publique sur `https://coderoute.gov.gn/incident-2026-XX`.
- **Contenu** : description de l'incident, données concernées, risques potentiels, mesures prises, conseils (ex. changer mot de passe, vigilance phishing), coordonnées DPO.

Pour l'exercice, la communication est **simulée** (envoi à une liste interne de test).

### Phase 8 — Restauration du service (T+6h30 à T+7h30)

Le Tech Lead et Ops restaurent le service en sécurité :

- Vérification que l'incident est contenu.
- Application des correctifs définitifs (pas seulement confinement).
- Tests de non-régression (Jest + Playwright).
- Levée progressive de la maintenance.
- Surveillance renforcée pendant 48 h (alertes abaissées).

### Phase 9 — Post-mortem et registre (T+7h30 à T+8h00)

Le DPO complète le **registre des violations** (`docs/REGISTRE-VIOLATIONS.md`) avec :

```markdown
## Incident #2026-001

- **Date de détection** : 2026-XX-XX HH:MM GMT
- **Date de prise de conscience** : 2026-XX-XX HH:MM GMT
- **Date de notification AGPD** : 2026-XX-XX HH:MM GMT (≤ 72h après prise de conscience)
- **Date de communication aux personnes** : 2026-XX-XX HH:MM GMT
- **Type** : <SQLi | Phishing | ...>
- **Gravité** : <Critique | Élevée | Moyenne | Faible>
- **Volume** : <nombre> enregistrements, <types de PII>
- **Description** : <résumé 200 mots>
- **Cause racine** : <analyse 200 mots>
- **Mesures prises** : <liste>
- **Leçons apprises** : <liste>
- **Statut** : <Clos | En cours>
```

### Phase 10 — Débriefing (T+8h00 à T+8h30)

L'animateur anime le débriefing avec toutes les parties. Questions :

1. **Détection** : le délai de détection (T+0h00 → T+0h30) est-il acceptable ? Comment l'améliorer ?
2. **Qualification** : la grille de gravité est-elle claire ? Y a-t-il eu hésitation ?
3. **Cellule de crise** : les rôles étaient-ils clairs ? Les décisions ont-elles été prises rapidement ?
4. **Confinement** : les actions techniques étaient-elles adaptées ? Y a-t-il eu des erreurs ?
5. **Notification AGPD** : le délai de rédaction (1h) est-il réaliste en conditions réelles ?
6. **Communication** : la communication aux personnes était-elle claire et rassurante ?
7. **Restauration** : le délai de restauration (1h) est-il acceptable ?
8. **Registre** : le registre est-il complet et exploitable ?

L'animateur rédige un **rapport d'exercice** dans `docs/audit-externe/exercice-incident-2026-XX-rapport.md` avec les recommandations d'amélioration.

## Critères de succès de l'exercice

L'exercice est considéré **réussi** si :

1. **Détection** ≤ 30 minutes après déclenchement.
2. **Cellule de crise activée** ≤ 1h30 après déclenchement.
3. **Confinement** effectif ≤ 4h après déclenchement.
4. **Notification AGPD** (simulée) envoyée ≤ 5h30 après déclenchement (et ≤ 72h après prise de conscience — automatique vu le délai de l'exercice).
5. **Communication aux personnes** (simulée) envoyée ≤ 6h30 après déclenchement.
6. **Restauration** ≤ 7h30 après déclenchement.
7. **Registre** complété ≤ 8h après déclenchement.
8. **0 perte de données réelle** (l'incident est simulé, mais si l'équipe corrompt accidentellement le staging, c'est un échec).

## Pré-requis techniques

Avant l'exercice, vérifier que :

- [ ] L'environnement de **staging** est opérationnel et séparé de la prod.
- [ ] Les alertes Grafana, Sentry et rate-limiting sont actives.
- [ ] Le canal Slack `#incident-response` existe et tous les acteurs sont membres.
- [ ] Le template de notification AGPD est prêt (`docs/audit-externe/modele-notification-agpd.md`).
- [ ] Le template de communication aux personnes est prêt.
- [ ] Le registre des violations est créé (`docs/REGISTRE-VIOLATIONS.md`).
- [ ] Les contacts AGPD sont à jour (email + téléphone).
- [ ] Les contacts DPO, RSSI, Sponsor DNTT sont à jour.
- [ ] L'animateur a accès aux outils pour "injecter" le scénario (sans casser le staging).
- [ ] Un snapshot VM est pris avant l'exercice (pour restauration rapide).

## Annexes

### Annexe 1 — Template de notification AGPD

Voir `docs/audit-externe/modele-notification-agpd.md`.

### Annexe 2 — Template de communication aux personnes

Voir `docs/audit-externe/modele-communication-personnes.md`.

### Annexe 3 — Contacts d'urgence

| Rôle | Nom | Téléphone | Email |
|---|---|---|---|
| Sponsor DNTT | _à compléter_ | +224 ... | dntt@coderoute-gn.org |
| DPO | _à compléter_ | +224 ... | dpo@coderoute-gn.org |
| RSSI | _à compléter_ | +224 ... | rssi@coderoute-gn.org |
| Tech Lead | _à compléter_ | +224 ... | tech@coderoute-gn.org |
| Ops Conakry DC | _à compléter_ | +224 ... | ops-conakry@coderoute-gn.org |
| Ops Kankan DC | _à compléter_ | +224 ... | ops-kankan@coderoute-gn.org |
| AGPD Guinée | — | +224 304 21 00 00 | notification@agpd.gov.gn |
| Animateur exercice | _à compléter_ | +224 ... | _à compléter_ |

### Annexe 4 — Script d'injection de scénario (à usage de l'animateur uniquement)

Le script `scripts/simulate-incident.ts` (à créer par l'équipe avant l'exercice) permet d'injecter chaque scénario de manière contrôlée :

```bash
# Scénario A — SQLi
tsx scripts/simulate-incident.ts --scenario=A

# Scénario B — Phishing admin
tsx scripts/simulate-incident.ts --scenario=B

# Scénario C — Webhook falsifié
tsx scripts/simulate-incident.ts --scenario=C

# Scénario D — Backup perdu
tsx scripts/simulate-incident.ts --scenario=D

# Scénario E — Secret divulgué
tsx scripts/simulate-incident.ts --scenario=E
```

Chaque scénario écrit un log dans `docs/audit-externe/exercice-2026-XX-injection.log` pour l'animateur.

## Fréquence de l'exercice

Cet exercice doit être réalisé :

- **Avant la mise en production** (obligatoire).
- **Tous les 6 mois** en exploitation (recommandé AGPD).
- **Après tout incident réel** (pour valider les leçons apprises).
- **À l'arrivée d'un nouveau DPO ou RSSI** (intégration).

---

**Version** : 1.0 — Sprint 11
**Dernière mise à jour** : 2026-06-24
**Prochaine révision** : après le 1er exercice réel
