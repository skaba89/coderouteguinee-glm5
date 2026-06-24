# Analyse des Coûts & Optimisation — CodeRoute Guinée

> **Document financier** détaillant les coûts d'infrastructure, de personnel et d'exploitation.
> Identifie les opportunités d'optimisation sans dégrader le service.
> Propriétaire : MOE + Directeur DNTT. Révision trimestrielle.

---

## 1. Coûts Infrastructure Pilote (8 semaines)

### 1.1 Datacenter Conakry (primaire)

| Poste | Coût mensuel (GNF) | Coût pilote 2 mois | Commentaire |
|-------|---------------------|---------------------|-------------|
| Hébergement rack | 1 500 000 | 3 000 000 | 1 rack + refroidissement |
| Bande passante (100 Mbps) | 800 000 | 1 600 000 | Orange Business |
| Électricité (EDG) | 400 000 | 800 000 | ~3 kW serveurs + clim |
| Onduleurs + groupe électrogène | — | 5 000 000 | Amortissement 5 ans |
| Sauvegardes offsite | 200 000 | 400 000 | Kankan DC réplication |
| **Sous-total Conakry** | **2 900 000** | **10 800 000** | |

### 1.2 Datacenter Kankan (DR)

| Poste | Coût mensuel (GNF) | Coût pilote 2 mois |
|-------|---------------------|---------------------|
| Hébergement rack | 1 200 000 | 2 400 000 |
| Bande passante (50 Mbps) | 500 000 | 1 000 000 |
| Électricité | 350 000 | 700 000 |
| **Sous-total Kankan** | **2 050 000** | **4 100 000** |

### 1.3 Services SaaS & licences

| Service | Coût mensuel (GNF) | Coût pilote 2 mois |
|---------|---------------------|---------------------|
| Cloudflare Pro | 150 000 | 300 000 |
| Sendinblue (emails) | 350 000 | 700 000 |
| Orange SMS API | 500 000 | 1 000 000 |
| GitHub Enterprise | 250 000 | 500 000 |
| Sentry (error tracking) | 120 000 | 240 000 |
| UptimeRobot | 50 000 | 100 000 |
| **Sous-total SaaS** | **1 420 000** | **2 840 000** |

### 1.4 Total infrastructure pilote

| Catégorie | Coût 2 mois |
|-----------|-------------|
| Conakry | 10 800 000 |
| Kankan | 4 100 000 |
| SaaS | 2 840 000 |
| **Total infrastructure pilote** | **17 740 000 GNF** |

---

## 2. Coûts Personnel Pilote

### 2.1 Équipe pilote (8 semaines)

| Rôle | Effectif | Salaire mensuel (GNF) | Coût 2 mois |
|------|----------|------------------------|-------------|
| Directeur projet | 1 | 25 000 000 | 50 000 000 |
| Chef projet | 1 | 15 000 000 | 30 000 000 |
| MOE (Tech Lead) | 1 | 18 000 000 | 36 000 000 |
| DevOps | 1 | 12 000 000 | 24 000 000 |
| Développeurs seniors | 2 | 10 000 000 | 40 000 000 |
| RSSI | 1 | 14 000 000 | 28 000 000 |
| Support L1 | 2 | 4 000 000 | 16 000 000 |
| Communication | 1 | 8 000 000 | 16 000 000 |
| **Sous-total salaires** | **10** | — | **240 000 000** |

### 2.2 Charges sociales (~30%)

| Poste | Coût 2 mois |
|-------|-------------|
| Charges patronales | 72 000 000 |
| Mutuelles + retraite complémentaire | 8 000 000 |
| **Sous-total charges** | **80 000 000** |

### 2.3 Formation & certification

| Poste | Coût |
|-------|------|
| Formation équipes (J-7) | 3 000 000 |
| Formation continue 2 mois | 1 500 000 |
| Certifications (Scrum, ITIL) | 2 000 000 |
| **Sous-total formation** | **6 500 000** |

### 2.4 Total personnel pilote

| Catégorie | Coût 2 mois |
|-----------|-------------|
| Salaires | 240 000 000 |
| Charges sociales | 80 000 000 |
| Formation | 6 500 000 |
| **Total personnel pilote** | **326 500 000 GNF** |

---

## 3. Coûts Audit Externe & Conformité

### 3.1 Audit externe (45 jours)

| Poste | Coût (GNF) |
|-------|------------|
| Honoraires cabinet (2 auditeurs × 45 jours) | 60 000 000 |
| Outils audit (Burp Pro, Nessus, etc.) | 8 000 000 |
| Déplacements auditeurs (Conakry × 2) | 4 000 000 |
| Hébergement auditeurs | 3 000 000 |
| **Sous-total audit** | **75 000 000** |

### 3.2 Conformité RGPD

| Poste | Coût (GNF) |
|-------|------------|
| Consultation juridique AGPD | 5 000 000 |
| Traductions officielles (4 langues) | 3 000 000 |
| Audit conformité interne | 2 000 000 |
| **Sous-total RGPD** | **10 000 000** |

### 3.3 Total audit & conformité

**85 000 000 GNF**

---

## 4. Coûts Communication Pilote

### 4.1 Production supports

| Poste | Coût (GNF) |
|-------|------------|
| Conception + design plaquettes | 2 000 000 |
| Impression affiches (4 langues) | 1 500 000 |
| Dépliants (10 000 unités) | 2 500 000 |
| Production spot radio (4 langues × 10s + 30s) | 3 000 000 |
| Production spot TV 30s | 5 000 000 |
| Vidéos témoignages (3 × 2 min) | 4 000 000 |
| **Sous-total production** | **18 000 000** |

### 4.2 Diffusion

| Poste | Coût (GNF) |
|-------|------------|
| Diffusion radio (RTG + 5 privées, 2 sem) | 8 000 000 |
| Diffusion TV (RTG, 2 sem) | 6 000 000 |
| Réseaux sociaux (Facebook Ads, TikTok) | 3 000 000 |
| Conférence presse lancement | 2 000 000 |
| Conférence presse bilan | 2 000 000 |
| **Sous-total diffusion** | **21 000 000** |

### 4.3 Total communication pilote

**39 000 000 GNF**

---

## 5. Synthèse Coûts Pilote (8 semaines)

| Catégorie | Coût (GNF) | % total |
|-----------|------------|---------|
| Infrastructure | 17 740 000 | 3.7% |
| Personnel | 326 500 000 | 68.3% |
| Audit & conformité | 85 000 000 | 17.8% |
| Communication | 39 000 000 | 8.2% |
| Imprévus (5%) | 23 412 000 | 4.9% |
| **Total pilote 8 semaines** | **491 652 000 GNF** | **100%** |

Soit ~491M GNF pour le pilote (≈ 50 000 EUR).

---

## 6. Recettes Pilote

### 6.1 Sources

| Source | Volume pilote | Prix unitaire (GNF) | Recette (GNF) |
|--------|---------------|----------------------|---------------|
| Examens code | 100 estimés | 35 000 | 3 500 000 |
| Examens conduite | 50 estimés | 50 000 | 2 500 000 |
| **Total recettes pilote** | | | **6 000 000 GNF** |

### 6.2 Bilan financier pilote

- Coûts : 491 652 000 GNF
- Recettes : 6 000 000 GNF
- **Net pilote** : -485 652 000 GNF (investissement)

Le pilote est volontairement déficitaire (objectif validation, pas rentabilité).

---

## 7. Projection Généralisation (6 mois)

### 7.1 Coûts infrastructure M6

| Poste | Coût mensuel M6 (GNF) | Coût 6 mois (GNF) |
|-------|------------------------|---------------------|
| Conakry (rack + 500 Mbps) | 4 200 000 | 25 200 000 |
| Kankan (rack + 200 Mbps) | 2 500 000 | 15 000 000 |
| Labé (nouveau DC, rack + 100 Mbps) | 1 800 000 | 10 800 000 |
| Cloudflare Enterprise | 500 000 | 3 000 000 |
| Sendinblue (volume × 10) | 1 500 000 | 9 000 000 |
| Orange SMS (volume × 10) | 2 500 000 | 15 000 000 |
| GitHub Enterprise | 250 000 | 1 500 000 |
| Sentry + monitoring | 250 000 | 1 500 000 |
| **Sous-total infra M6** | **13 500 000** | **81 000 000** |

### 7.2 Coûts personnel M6

| Rôle | Effectif M6 | Salaire mensuel (GNF) | Coût 6 mois avec charges (GNF) |
|------|-------------|------------------------|----------------------------------|
| Direction projet | 1 | 25 000 000 | 195 000 000 |
| Chef projet | 1 | 15 000 000 | 117 000 000 |
| MOE | 1 | 18 000 000 | 140 400 000 |
| DevOps | 2 | 12 000 000 | 187 200 000 |
| Développeurs | 4 | 10 000 000 | 312 000 000 |
| RSSI | 1 | 14 000 000 | 109 200 000 |
| Support L1 | 10 | 4 000 000 | 312 000 000 |
| Support L2 | 3 | 6 000 000 | 140 400 000 |
| Communication | 2 | 8 000 000 | 124 800 000 |
| Formation | 2 | 7 000 000 | 109 200 000 |
| **Total personnel M6** | **27** | — | **1 747 200 000** |

### 7.3 Recettes M6 mensuelles

| Source | Volume M6/mois | Prix unitaire | Recette mensuelle (GNF) |
|--------|-----------------|---------------|--------------------------|
| Examens code | 2 500 | 35 000 | 87 500 000 |
| Examens conduite | 1 500 | 50 000 | 75 000 000 |
| Commission auto-écoles | — | 5% | 8 125 000 |
| **Total recettes M6/mois** | | | **170 625 000 GNF** |

### 7.4 Bilan projection 6 mois

| Mois | Recettes (GNF) | Coûts (GNF) | Net (GNF) |
|------|-----------------|--------------|------------|
| M1 | 50 000 000 | 320 000 000 | -270 000 000 |
| M2 | 80 000 000 | 290 000 000 | -210 000 000 |
| M3 | 110 000 000 | 290 000 000 | -180 000 000 |
| M4 | 140 000 000 | 310 000 000 | -170 000 000 |
| M5 | 160 000 000 | 330 000 000 | -170 000 000 |
| M6 | 170 625 000 | 350 000 000 | -179 375 000 |
| **Total 6 mois** | **710 625 000** | **1 890 000 000** | **-1 179 375 000** |

### 7.5 Break-even

À recettes M6 (170M/mois) × 12 = 2.04Mrd/an
Coûts M6 annualisés : ~3.5Mrd/an (incluant investissements initiaux)
**Break-even opérationnel** : M12 (avec montée en charge progressive)
**Break-even investissement pilote** : M18 (récupération 1.7Mrd GNF)

---

## 8. Opportunités d'Optimisation

### 8.1 Optimisations infrastructure

| Optimisation | Économie mensuelle estimée | Effort | Risque |
|--------------|----------------------------|--------|--------|
| Migration Cloudflare Enterprise → Business | 350 000 GNF | Faible | Faible (sauf pic DDoS) |
| Reserved instances (engagement 1 an) | 1 200 000 GNF | Faible | Faible |
| Cache aggressive Cloudflare (assets statiques) | 200 000 GNF (bande passante) | Faible | Faible |
| Compression images (WebP) | 150 000 GNF (BP) | Faible | Aucun |
| Migration backups de Kankan → S3 Guinée | 100 000 GNF | Moyen | Faible |
| Auto-scaling (instances on-demand) | 800 000 GNF | Moyen | Moyen (latence) |
| **Total optimisation infra** | **2 800 000 GNF/mois** | | |

### 8.2 Optimisations opérationnelles

| Optimisation | Économie mensuelle | Effort | Risque |
|--------------|---------------------|--------|--------|
| Chatbot support N1 (réduction 30% tickets L1) | 1 200 000 GNF | Élevé | Faible |
| Self-service candidats (reprogrammation auto) | 600 000 GNF | Moyen | Faible |
| Automatisation reporting (KPI auto) | 400 000 GNF | Faible | Aucun |
| Formation pluridisciplinaire équipes | 300 000 GNF | Moyen | Aucun |
| Recrutement local régional (vs Conakry) | 2 000 000 GNF | Moyen | Faible |
| **Total optimisation ops** | **4 500 000 GNF/mois** | | |

### 8.3 Optimisations financières

| Optimisation | Économie | Effort | Risque |
|--------------|----------|--------|--------|
| Négociation volume Orange SMS | 25% facture | Faible | Aucun |
| Négociation volume Sendinblue | 20% facture | Faible | Aucun |
| Partenariats co-financement (Banque Mondiale, AFD) | 200M GNF | Élevé | Faible |
| Subventions innovation digitale État | 100M GNF | Élevé | Faible |
| **Total optimisation financière** | **~300M GNF ponctuel** | | |

### 8.4 Total optimisations possibles

- Mensuel récurrent : **7 300 000 GNF/mois** (infra + ops)
- Ponctuel : **~300M GNF** (subventions, partenariats)

### 8.5 Impact sur break-even

Avec optimisations :
- Économies annuelles : 87.6M GNF + 300M ponctuel = ~390M GNF
- Break-even opérationnel : **M10** (vs M12 sans optimisation)
- Break-even investissement pilote : **M15** (vs M18)

---

## 9. Modèle Économique Long Terme (M12+)

### 9.1 Sources revenus diversifiées

| Source | % CA M12 | % CA M24 | Commentaire |
|--------|----------|----------|-------------|
| Examens code + conduite | 85% | 70% | Cœur de métier |
| Commission auto-écoles | 5% | 8% | Partenariats |
| Formation continue permis | 5% | 10% | Nouveau service |
| API partenaires (assurances) | 0% | 5% | B2B |
| Publicité ciblée (auto-écoles) | 0% | 3% | Optionnel |
- International (UEMOA) | 0% | 4% | Expansion |

### 9.2 Économies d'échelle

| Indicateur | Pilote | M6 | M12 | M24 |
|------------|--------|----|----|-----|
| Coût/candidat (GNF) | 1 640 000 | 200 000 | 80 000 | 50 000 |
| Charge/personne (candidats/mois) | 50 | 110 | 250 | 500 |
| Marge brute | -8 000% | -10% | 35% | 55% |

### 9.3 Investissements R&D (10% CA M12+)

- Amélioration continue produit
- Exploration IA / VR / blockchain
- Veille concurrentielle sous-régionale
- Partenariats universitaires
- Hackathons trimestriels

---

## 10. Risques Financiers

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Adoption < cible | Moyenne | Élevé | Plan communication renforcé |
| Hausse coûts télécoms | Faible | Moyen | Contrats long terme |
| Panne majeure (perte revenu) | Faible | Élevé | PCA/PRA + assurance |
| Fraude organisée (perte revenu) | Faible | Moyen | Détection + sanctions |
| Changement réglementaire | Faible | Moyen | Veille + agilité |
| Dépendance subventions | Élevée | Critique | Diversification revenus |
| Inflation | Moyenne | Moyen | Révision tarifs annuelle |

---

## 11. Recommandations Stratégiques

### 11.1 Court terme (M0-M6)

1. **Sécuriser financement** : subventions Banque Mondiale, AFD (300M+ GNF)
2. **Négocier contrats volume** : Orange, MTN, Sendinblue (économie 2M+ GNF/mois)
3. **Recruter local** : équipes régionales (économie 2M+ GNF/mois)
4. **Optimiser infra** : reserved instances + cache aggressive (économie 2.5M+ GNF/mois)
5. **Investir chatbot** : réduction support L1 (ROI 6 mois)

### 11.2 Moyen terme (M6-M12)

1. **Diversifier revenus** : formation continue, API B2B
2. **Étendre sous-régional** : opportunités Mali, Sénégal
3. **Certifier ISO 27001** : argument commercial + réduction primes assurance
4. **Partenariats universités** : stage + recrutement + R&D
5. **Mobile app native** : +30% engagement candidats

### 11.3 Long terme (M12-M24)

1. **Internationalisation** : produit multilingual prêt pour UEMOA
2. **Marketplace auto-écoles** : commission supplémentaire
3. **Blockchain permis numérique** : innovation différenciante
4. **VR formation conduite** : produit premium
5. **IA tutoriel adaptatif** : amélioration NPS

---

## 12. Tableau de Bord Financier Mensuel

À générer le 1er lundi de chaque mois par le Chef projet :

| Indicateur | Mois précédent | Mois courant | Budget | Écart |
|------------|----------------|--------------|--------|-------|
| Recettes totales | {GNF} | {GNF} | {GNF} | {GNF} |
| Coûts infrastructure | | | | |
| Coûts personnel | | | | |
| Coûts communication | | | | |
| Coûts audit/conformité | | | | |
| **Net mensuel** | | | | |
| Cumul année | | | | |
| Coût/candidat | | | | |
- Charge/personne | | | | |

---

**Version** : 1.0
**Propriétaire** : MOE + Directeur DNTT
**Validation** : Directeur DNTT + Ministre des Transports
**Révision** : trimestrielle
