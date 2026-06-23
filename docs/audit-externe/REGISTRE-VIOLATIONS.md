# CodeRoute Guinée — Registre des violations de données

Conformément à l'article 35 de la Loi L/2022/018/AN, ce registre recense l'ensemble des violations de données à caractère personnel constatées sur la plateforme CodeRoute Guinée. Il est tenu à jour par le DPO et présenté à l'AGPD sur demande.

## Modèle d'entrée

Chaque violation fait l'objet d'une entrée structurée :

```markdown
## Incident #<YYYY>-<NNN>

- **Date de détection** : <YYYY-MM-DD HH:MM> GMT
- **Date de prise de conscience** : <YYYY-MM-DD HH:MM> GMT
- **Date de notification AGPD** : <YYYY-MM-DD HH:MM> GMT (≤ 72h après prise de conscience, sinon justifier)
- **Date de communication aux personnes** : <YYYY-MM-DD HH:MM> GMT (ou "Non requise — risque faible")
- **Date de clôture** : <YYYY-MM-DD> (ou "En cours")
- **Type** : <SQLi | Phishing | Webhook falsifié | Backup perdu | Secret divulgué | Autre>
- **Gravité** : <Critique | Élevée | Moyenne | Faible>
- **Volume** : <nombre> personnes, <nombre> enregistrements, <types de PII>
- **Description synthétique** : <200 mots max>
- **Cause racine** : <analyse 200 mots>
- **Mesures prises** : <liste>
- **Leçons apprises** : <liste>
- **Statut** : <Clos | En cours>
- **Référence notification AGPD** : CRG-VIOL-<YYYY>-<NNN>
- **Lien vers notification complète** : ./notifications-agpd/<YYYY-MM-DD>-CRG-VIOL-<YYYY>-<NNN>.md
```

---

## Historique des incidents

> **Note** : Aucun incident réel à ce jour. La section ci-dessous sera remplie en cas d'incident réel. Les exercices de simulation (cf. `runbook-incident-agpd.md`) ne sont pas consignés ici mais dans `exercices-incident/`.

_Aucun incident enregistré._

---

## Exercices de simulation

Les exercices de simulation d'incident sont consignés séparément, dans `docs/audit-externe/exercices-incident/`. Ils ne constituent pas des violations réelles et ne sont donc pas notifiés à l'AGPD, mais leur registre est conservé pour preuve de diligence.

| Exercice | Date | Scénario | Durée | Résultat |
|---|---|---|---|---|
| _à planifier_ | _à compléter_ | A — SQLi | _à compléter_ | _à compléter_ |

---

## Statistiques annuelles

### 2026

| Indicateur | Valeur |
|---|---|
| Nombre total d'incidents | 0 |
| Incidents critiques | 0 |
| Incidents notifiés à l'AGPD | 0 |
| Délai moyen de notification AGPD | N/A |
| Délai moyen de communication aux personnes | N/A |
| Délai moyen de clôture | N/A |
| Exercices de simulation réalisés | 0 |

---

**Version** : 1.0 — Sprint 11
**Dernière mise à jour** : 2026-06-24
**DPO responsable** : _à compléter_
**Prochaine révision** : mensuelle ou après chaque incident
