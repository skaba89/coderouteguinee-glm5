# CodeRoute Guinée — Kit d'audit externe

Ce répertoire contient **tous les livrables** qu'un auditeur sécurité tiers (ou un prestataire pentest) doit consulter avant et pendant son intervention sur la plateforme CodeRoute Guinée.

## Objectifs de l'audit externe

L'audit externe a quatre objectifs complémentaires, alignés sur la décision de mise en production ministérielle :

1. **Valider les contrôles de sécurité internes** que l'équipe a mis en place (Sprint 1 à Sprint 10) via une revue indépendante — la règle des « deux paires d'yeux » est particulièrement importante pour les composants sensibles (webhooks HMAC, sessions JWT, RGPD).
2. **Identifier les vulnérabilités résiduelles** que les outils automatisés (npm audit, Snyk, Trivy) ne détectent pas — notamment les failles logiques métier (ex. contournement du paiement pour réserver un examen).
3. **Délivrer une attestation** exigée par l'AGPD (Autorité guinéenne de protection des données) et par la DNTT avant lancement à l'échelle nationale.
4. **Constituer la preuve de diligence raisonnable** au sens de la Loi L/2022/018/AN, en cas de litige futur avec un candidat ou une auto-école.

## Calendrier indicatif

| Phase | Durée | Acteurs | Livrables |
|---|---|---|---|
| Cadrage | 0 - J-15 | Auditeur + DPO + Tech Lead | Charte d'audit, périmètre, planning |
| Revue documentaire | J-15 à J-7 | Auditeur seul | Notes de revue, premières questions |
| Tests boîte noire | J-7 à J+0 | Auditeur + Tech Lead (support) | Rapport OWASP préliminaire |
| Tests boîte blanche | J+0 à J+7 | Auditeur + accès code source | Rapport complet |
| Restitution | J+10 | Auditeur + Sponsor DNTT | Rapport final + présentation |
| Correctifs | J+10 à J+30 | Équipe interne | Plan de remédiation |
| Vérification | J+30 à J+45 | Auditeur | Attestation de levée des écarts |

## Contenu du kit

```
docs/audit-externe/
├── README.md                                  ← ce fichier (point d'entrée)
├── 01-CHARTE-AUDIT.md                         ← mission, périmètre, règles d'engagement
├── 02-PERIMETRE-TECHNIQUE.md                  ← inventaire des composants audités
├── 03-CONTROLES-INTERNES.md                   ← auto-évaluation 48/48 (référence)
├── 04-SCENARIOS-PENTEST.md                    ← cas de tests recommandés (OWASP ASVS L2)
├── 05-ACCES-TEMPORAIRES.md                    ← procédure de création/rotation/révocation
├── 06-CONFIDENTIALITE-CA-NDA.md               ← modèle d'accord de confidentialité
├── 07-RAPPORT-MODELE.md                       ← structure attendue du rapport d'audit
├── MANUEL-AUDITEUR.md                         ← (Sprint 13) guide pas-à-pas pour l'auditeur
├── PLAN-REMEDIATION.md                        ← (Sprint 13) template de suivi des constats
├── COMMUNICATIONS-PERSONNES-CONCERNEES.md     ← (Sprint 13) 10 templates FR + multilingues
├── runbook-incident-agpd.md                   ← procédure 72h article 33
├── modele-notification-agpd.md                ← modèle de notification AGPD
├── REGISTRE-VIOLATIONS.md                     ← registre article 35
└── annexes/
    ├── inventory-secrets.md                   ← cartographie des secrets (sans valeurs)
    ├── data-flow-diagram.txt                  ← DFD simplifié pour l'auditeur
    └── owasp-asvs-checklist.md                ← checklist ASVS Level 2 adaptée
```

## Critères d'acceptation de l'audit

L'audit est considéré **valide pour mise en production** si et seulement si :

1. **Zéro vulnérabilité critique** (CVSS ≥ 9.0) non remédiée à J+30.
2. **Toutes les vulnérabilités élevées** (CVSS 7.0-8.9) remédiées ou acceptées formellement par le sponsor DNTT avec contre-mesure compensatoire.
3. **90% des recommandations moyennes** (CVSS 4.0-6.9) planifiées dans le backlog avec échéance < 90 jours.
4. **Attestation signée** par l'auditeur (qualifié ANSSI équivalent / CISA / CISSP ou équivalent reconnu).
5. **Rapport déposé** dans le registre des traitements AGPD (article 35 RGPD-Guinée).

## Choix de l'auditeur

Le prestataire d'audit doit répondre **au minimum** aux critères suivants :

- **Indépendance** : aucune relation commerciale avec les fournisseurs des composants audités (pas Orange Money, pas MTN, pas Vercel, pas l'hébergeur Conakry DC).
- **Qualification** : certification ANSSI Évaluateur (France), CREST (UK), ou équivalent régional (AfricaCERT, ngnCERT).
- **Expérience secteur public** : au moins 3 missions d'audit dans des administrations publiques ou parapubliques africaines dans les 24 derniers mois.
- **Référence RGPD-Guinée** : connaissance de la Loi L/2022/018/AN et des lignes directrices AGPD (avantage significatif).
- **Assurance professionnelle** : assurance responsabilité civile professionnelle ≥ 500 000 000 GNF (≈ 50 000 EUR) couvrant les dommages liés à une négligence d'audit.

## Contact

| Rôle | Nom | Email | Téléphone |
|---|---|---|---|
| Sponsor DNTT | _à compléter_ | dntt@coderoute-gn.org | +224 ... |
| DPO interne | _à compléter_ | dpo@coderoute-gn.org | +224 ... |
| Tech Lead | _à compléter_ | tech@coderoute-gn.org | +224 ... |
| RSSI | _à compléter_ | rssi@coderoute-gn.org | +224 ... |
| Auditeur externe | _à compléter_ | _à compléter_ | _à compléter_ |

---

**Version** : 1.0 — Sprint 11
**Dernière mise à jour** : 2026-06-24
**Prochaine révision** : après audit J+45
