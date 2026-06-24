# WAF ModSecurity — Procédure de Tuning (Sprint 13)

## Objectif

Cette procédure guide l'équipe ops à passer du mode `DetectionOnly` au mode `On` (blocking) en 7 jours, sans casser l'expérience utilisateur légitime.

## Pré-requis

- WAF déployé en staging (cf. `docker-compose.waf.yml`)
- Accès au dashboard Grafana « WAF Events »
- Liste des endpoints métier critiques (login, paiement, examen, upload)

## Jour 1-3 : Observation passive

1. **Démarrer le WAF en `DetectionOnly`** (déjà la valeur par défaut)
   ```bash
   docker compose -f docker-compose.waf.yml up -d
   ```

2. **Lancer le trafic de test** :
   - Tests Playwright E2E (11 scénarios)
   - Tests de charge k6 (4 scénarios booking/payment/webhook/admin)
   - Tests manuels (candidats, auto-écoles, administrateurs)

3. **Surveiller les logs ModSecurity** :
   ```bash
   tail -f /var/log/nginx/modsec_audit.log | jq '.transaction.request.uri, .transaction.messages[].message'
   ```

4. **Collecter les règles déclenchées** dans `docs/audit-externe/waf-tuning-journal.md` :
   ```markdown
   | Date       | Règle CRS  | Endpoint           | Légitime? | Action       |
   |------------|------------|--------------------|-----------|--------------|
   | 2026-06-24 | 942430     | /api/courses/search| OUI       | RemoveById   |
   | 2026-06-24 | 920300     | /api/bookings      | OUI       | RemoveById   |
   ```

## Jour 4-5 : Tuning des faux positifs

1. Pour chaque règle déclenchée à tort :
   - **Cas 1** : règle inutile globalement → ajout `SecRuleRemoveById` dans `custom-rules.conf`
   - **Cas 2** : règle utile mais pattern légitime → exclusion ciblée via `ctl:ruleRemoveById` sur endpoint spécifique
   - **Cas 3** : règle mal tunée → ajuster `PARANOIA` ou `ANOMALY_INBOUND`

2. **Recharger le WAF sans redémarrage** :
   ```bash
   docker exec coderoute-waf nginx -s reload
   ```

3. **Re-vérifier le trafic** : les faux positifs doivent disparaître des logs.

## Jour 6 : Test de régression attaquant

1. Lancer les 35 scénarios de pentest du dossier `docs/audit-externe/04-SCENARIOS-PENTEST.md`.

2. **Vérifier que toutes les attaques sont toujours détectées** :
   - SQLi sur `/api/auth/login` → règle 942100+ déclenchée
   - XSS dans les champs cours → règle 941100+ déclenchée
   - Path traversal sur `/api/uploads` → règle 990500 (custom) déclenchée
   - Outils d'attaque (sqlmap) → règle 990400 (custom) déclenchée

3. Si une attaque n'est plus détectée après tuning → réviser l'exclusion.

## Jour 7 : Activation du mode blocking

1. **Éditer** `nginx/modsec/modsecurity.conf` :
   ```
   SecRuleEngine On
   ```

2. **Déployer en staging d'abord** :
   ```bash
   docker compose -f docker-compose.waf.yml restart waf
   ```

3. **Surveillance renforcée 24h** :
   - Dashboard Grafana « WAF Events » → vérifier pic de 403 légitimes
   - Alertmanager → aucune alerte « WAF blocking legitimate traffic » ne doit remonter
   - Tester manuellement les 5 parcours critiques (inscription, paiement, examen, upload, admin)

4. **Si tout est vert → déployer en production** :
   ```bash
   # Conakry DC
   ssh ops@conakry-dc 'cd /opt/coderoute && docker compose -f docker-compose.waf.yml pull && docker compose -f docker-compose.waf.yml up -d'
   ```

## Métriques de succès

| Métrique                          | Cible             | Source                |
|-----------------------------------|-------------------|------------------------|
| Faux positifs (req légitimes bloquées) | < 0.1%       | ModSecurity audit log |
| Attaques détectées                | ≥ 95% des scénarios | Tests pentest        |
| Latence ajoutée par WAF           | < 20ms p99        | Prometheus `nginx_request_duration_seconds` |
| Disponibilité endpoint critique   | ≥ 99.9%           | Blackbox exporter     |

## Rollback d'urgence

Si le WAF bloque trop de trafic légitime en production :

```bash
# 1. Passer en DetectionOnly immédiatement
docker exec coderoute-waf sed -i 's/SecRuleEngine On/SecRuleEngine DetectionOnly/' /etc/nginx/modsec/modsecurity.conf
docker exec coderoute-waf nginx -s reload

# 2. Identifier les règles fautives dans Grafana → WAF Events panel

# 3. Ajouter les exclusions nécessaires dans custom-rules.conf

# 4. Re-basculer en mode On après validation
```

## Post-déploiement

- **Réviser le journal WAF hebdomadairement** (lundi 09h, runbook OPS-RUNBOOK.md §vérif matinale)
- **Mettre à jour OWASP CRS** trimestriellement (cf. `crs-setup.conf` pour le pinning de version)
- **Rotation des logs** : `logrotate` configuré pour `/var/log/nginx/modsec*` (cf. `nginx/waf/logrotate.conf`)
