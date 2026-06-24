# CodeRoute Guinée — Templates de communication aux personnes concernées

> **Article 34 — Loi L/2022/018/AN (RGPD-Guinée)** : lorsque une violation de données présente un risque élevé pour les droits et libertés d'une personne physique, le responsable du traitement doit lui en informer **sans retard excessif**.

Ce dossier contient les templates officiels à utiliser selon le type d'incident. Tous les templates sont disponibles en **4 langues** (Français, Pular, Soussou, Malinké) et en **2 canaux** (email + SMS).

---

## Sommaire des templates

| #  | Type d'incident                                | Canal | Langue principale |
|----|------------------------------------------------|--------|-------------------|
| 1  | Fuite de données personnelles (PII)            | Email | FR                |
| 2  | Fuite de données personnelles (PII)            | SMS   | FR                |
| 3  | Vol de credentials / compte                    | Email | FR                |
| 4  | Fuite de données financières (paiement)        | Email | FR                |
| 5  | Rappel préventif (phishing ciblé sur la plateforme) | Email | FR |
| 6  | Notification initiale multilingue (Pular)      | SMS   | ff                |
| 7  | Notification initiale multilingue (Soussou)    | SMS   | sus               |
| 8  | Notification initiale multilingue (Malinké)    | SMS   | man               |
| 9  | Mise à jour post-incident (suivi)              | Email | FR                |
| 10 | Communication finale de clôture                | Email | FR                |

---

## Template 1 — Email : Fuite de données personnelles (FR)

**Objet** : [IMPORTANT] Incident de sécurité concernant vos données personnelles — CodeRoute Guinée

```
From: dpo@coderoute.gov.gn
To: {prenom.nom}@email.com
Reply-To: dpo@coderoute.gov.gn
X-Priority: 1
```

**Corps** :

---

Chère/Cher {prenom},

La Direction Nationale des Transports Terrestres (DNTT) et l'Agence Guinéenne de Protection des Données (AGPD) vous informent qu'un incident de sécurité s'est produit sur la plateforme CodeRoute Guinée, susceptible d'affecter vos données personnelles.

### Que s'est-il passé ?

Le {date_incident_jj_mm_aaaa} à {heure_gmt}, nous avons détecté {description_courte_incident}. L'incident a été qualifié le {date_qualification} et déclaré à l'AGPD le {date_notification_agpd} conformément à l'article 33 de la Loi L/2022/018/AN.

### Quelles données sont concernées ?

Les données suivantes, que vous avez fournies lors de votre inscription sur CodeRoute Guinée, ont pu être consultées par un tiers non autorisé :

- {liste_donnees_impactees}

**Aucune donnée financière** (numéro de carte bancaire, code Orange Money) n'est concernée par cet incident.

### Quelles mesures avons-nous prises ?

Dès la détection, nous avons :

1. Confiné l'incident et bloqué l'accès non autorisé
2. Déclaré l'incident à l'AGPD sous 72 heures (article 33)
3. Notifié la gendarmerie nationale pour enquête pénale
4. Renforcé les contrôles de sécurité (rotation des clés, double authentification obligatoire)
5. Mandaté un auditeur externe pour analyser l'incident

### Que devez-vous faire ?

Par mesure de précaution, nous vous recommandons de :

1. **Changer votre mot de passe** CodeRoute Guinée en vous connectant sur https://coderoute.gov.gn/auth/reset-password
2. **Vigilance phishing** : ne communiquez jamais vos codes Orange Money / MTN MoMo par email ou téléphone — la DNTT ne vous les demandera jamais
3. **Surveiller votre ligne téléphonique** : si vous recevez un appel suspect se présentant comme la DNTT, raccrochez et appelez le {numero_dntt_officiel}
4. **Signaler toute activité suspecte** à l'adresse dpo@coderoute.gov.gn

### Vos droits

Conformément à la Loi L/2022/018/AN, vous disposez des droits suivants :

- Droit d'accès à vos données
- Droit de rectification
- Droit à l'effacement (sous conditions)
- Droit d'introduire une réclamation auprès de l'AGPD

Pour exercer ces droits, contactez notre Délégué à la Protection des Données : **dpo@coderoute.gov.gn** ou par courrier à l'adresse suivante :

> DNTT — Cellule RGPD
> BP 002, Conakry, République de Guinée

### Pour toute question

Une cellule d'information est ouverte du lundi au vendredi, de 09h à 17h, au numéro suivant : **+224 {numero_cellule_info}**.

Nous vous prions de bien vouloir nous excuser pour la gêne occasionnée et vous assurons de notre engagement total à protéger vos données.

Veuillez agréer, Chère/Cher {prenom}, l'expression de nos salutations distinguées.

**{nom_dpo}**
Délégué à la Protection des Données
Direction Nationale des Transports Terrestres
Pour le compte de l'AGPD

---

## Template 2 — SMS : Fuite de données personnelles (FR)

```
CodeRoute Guinée: Incident sécurité détecté concernant vos données. Veuillez changer votre mot de passe sur coderoute.gov.gn et rester vigilant face au phishing. Info: +224 {numero_cellule_info}. La DNTT.
```

> ⚠️ **Longueur** : ≤ 160 caractères. Si dépassement, segmenter en 2 SMS.

## Template 3 — Email : Vol de credentials

**Objet** : [URGENT] Activité suspecte sur votre compte CodeRoute Guinée

**Corps** :

---

Chère/Cher {prenom},

Nous avons détecté une connexion à votre compte CodeRoute Guinée depuis une adresse IP inhabituelle le {date_heure_suspicion}.

### Détails de l'activité suspecte

- **Date / heure** : {date_heure_suspicion} (heure de Guinée)
- **Adresse IP** : {ip_suspecte}
- **Localisation estimée** : {localisation_ip}
- **Actions effectuées** : {liste_actions}

### Mesures immédiates prises

1. **Votre session a été révoquée** — vous devez vous reconnecter
2. **Votre mot de passe a été invalidé** — veuillez le réinitialiser : https://coderoute.gov.gn/auth/reset-password
3. **Si vous avez activé la double authentification (2FA)**, votre compte reste protégé — vérifiez vos notifications TOTP

### Étiez-vous à l'origine de cette connexion ?

- **OUI** : aucune action nécessaire — reconnectez-vous simplement avec votre nouveau mot de passe
- **NON** : contactez-nous immédiatement à securite@coderoute.gov.gn ou au +224 {numero_securite}

### Recommandations

- Activez la **double authentification (2FA)** si ce n'est pas déjà fait (paramètres > sécurité)
- **Ne réutilisez pas** ce mot de passe sur d'autres services
- Signalez tout email suspect se faisant passer pour CodeRoute Guinée

Cordialement,

**Équipe Sécurité CodeRoute Guinée**
securite@coderoute.gov.gn

---

## Template 4 — Email : Fuite de données financières

**Objet** : [URGENT] Incident de paiement sur votre compte CodeRoute Guinée

**Corps** :

---

Chère/Cher {prenom},

Nous avons identifié une activité anormale concernant des paiements enregistrés sur votre compte CodeRoute Guinée. Nous prenons cet incident très au sérieux et vous contactons pour vous informer des mesures immédiates.

### Nature de l'incident

Le {date_incident}, nous avons détecté {nombre_paiements_suspects} transaction(s) suspecte(s) associée(s) à votre compte :

- **Montant total concerné** : {montant_total} GNF
- **Fournisseur** : {orange|mtn|mixte}
- **Période** : {periode_incident}

### Mesures prises

1. Les transactions suspectes ont été **suspendues** et sont en cours de vérification
2. Les fonds correspondants seront **remboursés** sur votre compte Mobile Money sous **48h à 72h ouvrées**
3. Nous avons notifié Orange Money / MTN MoMo pour bloquer toute opération frauduleuse
4. Une enquête interne a été ouverte en coordination avec la gendarmerie économique

### Ce que vous devez faire

1. **Ne payez pas à nouveau** les examens concernés — vos places seront maintenues
2. **Vérifiez votre relevé Orange Money / MTN MoMo** des 7 derniers jours
3. **Signalez toute transaction non reconnue** à : paiements@coderoute.gov.gn
4. **Ne communiquez jamais votre code Mobile Money** à qui que ce soit, y compris un agent se présentant de CodeRoute Guinée

### Vos droits financiers

Conformément aux regulations de la Banque Centrale de la République de Guinée (BCRG) sur les services de paiement électronique, vous disposez d'un droit de réclamation sous 8 jours ouvrés.

Pour toute question, notre service client est joignable au **+224 {numero_service_client}** (du lundi au samedi, 08h-18h).

Cordialement,

**Service Paiements — CodeRoute Guinée**
paiements@coderoute.gov.gn

---

## Template 5 — Email : Alerte phishing préventive

**Objet** : [ALERTE] Tentative de phishing visant les usagers de CodeRoute Guinée

**Corps** :

---

Chère/Cher {prenom},

Plusieurs usagers de CodeRoute Guinée ont signalé recevoir des **emails frauduleux** se faisant passer pour notre service. Nous vous alertons pour vous permettre de les identifier.

### Comment reconnaître les emails frauduleux ?

- ❌ **Adresse expéditeur suspecte** : `dntt-guinee@gmail.com`, `coderoute.support@yahoo.com`
- ❌ **Demande de code Mobile Money** ou de mot de passe
- ❌ **Lien vers un site non officiel** : `coderoute-guinee.ml`, `dntt-permis.com`
- ❌ **Menace de suppression de compte** si vous n'agissez pas immédiatement
- ❌ **Promesse de place garantie** contre paiement « accéléré »

### CodeRoute Guinée ne vous demandera JAMAIS :

- Votre mot de passe
- Votre code Orange Money / MTN MoMo
- Votre NIN complet par email
- Un paiement hors plateforme officielle

### Que faire si vous recevez un email suspect ?

1. **Ne cliquez sur aucun lien**
2. **Ne répondez pas**
3. **Transférez-le** à : signal@coderoute.gov.gn
4. **Supprimez-le** après transfert

### Site officiel

L'unique site officiel de CodeRoute Guinée est : **https://coderoute.gov.gn**

Vérifiez toujours la barre d'adresse de votre navigateur avant de saisir vos identifiants.

Merci de votre vigilance.

**Direction Nationale des Transports Terrestres**

---

## Template 6 — SMS multilingue (Pular)

```
CodeRoute Guinée: Hoola kaŋ ngan e ɓamte maɗe tonnge. Wondude e etaade ceɗɗagol passwords maaɗa e coderoute.gov.gn. Laawol: +224 {numero_cellule_info}. DNTT.
```

> Traduction approximative : "CodeRoute Guinée : Vos données personnelles ont été compromises. Veuillez changer votre mot de passe sur coderoute.gov.gn. Info : +224 XXX. DNTT."
> Validation linguistique requise avant envoi (cf. §Procédure de validation ci-dessous).

## Template 7 — SMS multilingue (Soussou)

```
CodeRoute Guinée: I makhöönö fère fë i ngömökö. Yeme xi password ma a coderoute.gov.gn. Lamba: +224 {numero_cellule_info}. DNTT.
```

## Template 8 — SMS multilingue (Malinké)

```
CodeRoute Guinée: I kɛnɛma bɛ se ka fɛn dɔw lajɛ. I ka password labɛn coderoute.gov.gn. Telefono: +224 {numero_cellule_info}. DNTT.
```

## Template 9 — Email : Mise à jour post-incident

**Objet** : [SUIVI] Incident du {date_incident} — Mise à jour {n_maj}

**Corps** :

---

Chère/Cher {prenom},

Suite à notre premier courriel du {date_premiere_comm}, nous vous informons de l'évolution de l'incident survenu sur CodeRoute Guinée.

### État d'avancement (mise à jour n°{n_maj})

| Étape                              | Statut            | Date        |
|------------------------------------|-------------------|-------------|
| Détection                          | ✅ Terminée        | {date_det}  |
| Confinement                        | ✅ Terminée        | {date_conf} |
| Notification AGPD                  | ✅ Terminée        | {date_agpd} |
| Enquête interne                    | 🔄 En cours        | —           |
| Audit externe                      | 🔄 En cours        | —           |
| Renforcement sécurité              | 🔄 En cours        | —           |
| Clôture de l'incident              | ⏳ À venir         | {prev_clot} |

### Nouvelles informations depuis notre dernière communication

{resume_nouvelles_infos}

### Recommandations mises à jour

{recommandations_maj}

### Reste en vigueur

- Changez votre mot de passe si ce n'est pas déjà fait
- Restez vigilants face au phishing
- Contactez-nous pour toute question : dpo@coderoute.gov.gn

Nous vous tiendrons informé(e) de toute évolution significative dans un délai maximum de 15 jours.

Cordialement,

**{nom_dpo}** — DPO
DNTT / AGPD

---

## Template 10 — Email : Communication finale de clôture

**Objet** : [CLÔTURE] Incident du {date_incident} — Rapport final

**Corps** :

---

Chère/Cher {prenom},

Nous vous informons de la **clôture officielle** de l'incident de sécurité du {date_incident} qui avait affecté vos données.

### Synthèse de l'incident

- **Date de détection** : {date_det}
- **Date de clôture** : {date_clot}
- **Durée totale** : {duree_totale}
- **Cause racine identifiée** : {cause_racine}
- **Nombre de personnes concernées** : {n_personnes}
- **Données impactées** : {donnees_impactees}

### Actions correctives mises en œuvre

1. **Correctif technique** : {description_correctif}
2. **Renforcement organisationnel** : {mesures_orga}
3. **Formation** : {personnes_formees} agents formés à la sécurité
4. **Audit externe** : rapport final disponible sur demande
5. **Sanctions disciplinaires** : {sanctions} (le cas échéant)

### Indemnisation

Conformément à l'article 38 de la Loi L/2022/018/AN, une indemnisation peut être accordée aux personnes ayant subi un préjudice matériel ou moral. Pour en bénéficier, adressez votre demande à :

> DNTT — Service Indemnisations
> BP 002, Conakry, République de Guinée
> indemnisations@coderoute.gov.gn

### Vos droits

Vous conservez le droit d'introduire une réclamation auprès de l'AGPD pendant 3 ans à compter de la présente notification :

> Agence Guinéenne de Protection des Données
> BP 0021, Conakry, République de Guinée
> contact@agpd.gov.gn

### Engagement de la DNTT

La DNTT réitère son engagement à protéger les données personnelles de tous les usagers de CodeRoute Guinée. Les leçons tirées de cet incident ont été intégrées dans notre plan de sécurité 2026-2027.

Nous vous remercions de votre confiance et restons à votre disposition pour toute question.

Cordialement,

**{nom_directeur_dntt}**
Directeur National des Transports Terrestres

---

## Procédure de validation avant envoi

Avant l'envoi de tout template de communication, valider les points suivants :

### 1. Validation juridique (DPO)

- [ ] Description de l'incident vérifiée et factuelle
- [ ] Mention des droits RGPD conforme à la Loi L/2022/018/AN
- [ ] Mention du droit de réclamation auprès de l'AGPD présente
- [ ] Coordonnées du DPO à jour
- [ ] Délai de notification respecté (article 34 — sans retard excessif après l'AGPD)

### 2. Validation linguistique (4 langues)

- [ ] FR : relu par le service communication DNTT
- [ ] Pular (ff) : relu par un locuteur natif (cellule Pular DNTT)
- [ ] Soussou (sus) : relu par un locuteur natif
- [ ] Malinké (man) : relu par un locuteur natif

### 3. Validation technique (Ops)

- [ ] Lien `coderoute.gov.gn/auth/reset-password` fonctionnel
- [ ] Numéro de téléphone cellule info `+224 {numero_cellule_info}` redirigé et testé
- [ ] Email `dpo@coderoute.gov.gn` redirigé vers une mailbox monitorée
- [ ] Test d'envoi à un panel pilote (10 personnes internes) avant envoi massif

### 4. Validation opérationnelle (Sponsor DNTT)

- [ ] Volume de communications estimé et capacité email/SMS vérifiée
- [ ] Cellule info prête (effectif + horaires) pour absorber les appels
- [ ] Plan de communication média prêt (communiqué de presse si incident > 1000 personnes)
- [ ] Coordination gendarmerie / AGPD notifiée de la date d'envoi

## Délais d'envoi cibles

| Volume de personnes concernées | Délai après notification AGPD |
|-------------------------------|-------------------------------|
| ≤ 100                         | 24h                           |
| 100 - 1 000                   | 48h                           |
| 1 000 - 10 000                | 72h                           |
| > 10 000                      | 7 jours (avec plan média)     |

## Archivage

Tous les templates envoyés (avec la liste des destinataires, horodatage, contenu) doivent être archivés :

- **Durée** : 5 ans (article 35 — registre des violations)
- **Emplacement** : `/var/log/coderoute/communications-personnes/{incident_id}/`
- **Format** : PDF signé + JSON manifeste
- **Accès** : DPO + RSSI + auditeur AGPD uniquement

## Contacts internes (à jour)

| Rôle               | Email                         | Téléphone         |
|--------------------|-------------------------------|-------------------|
| DPO                | dpo@coderoute.gov.gn          | +224 622 XX XX 01 |
| RSSI               | rssi@coderoute.gov.gn         | +224 622 XX XX 02 |
| Sponsor DNTT       | directeur@dntt.gov.gn         | +224 622 XX XX 03 |
| Cellule info       | cellule.info@coderoute.gov.gn | +224 622 XX XX 04 |
| Service paiement   | paiements@coderoute.gov.gn    | +224 622 XX XX 05 |
| Service sécurité   | securite@coderoute.gov.gn     | +224 622 XX XX 06 |
| AGPD (externe)     | contact@agpd.gov.gn           | +224 622 XX XX 07 |
