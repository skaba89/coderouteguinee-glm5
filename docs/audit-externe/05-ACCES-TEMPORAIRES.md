# Procédure d'accès temporaires pour l'auditeur

Cette procédure décrit la création, la rotation et la révocation des accès accordés à l'auditeur externe pendant la durée de la mission. Elle s'applique à tous les types d'accès : code source, serveurs, base de données, secrets.

## 1. Principe du moindre privilège

Chaque accès accordé à l'auditeur doit respecter le principe du **moindre privilège** :

- Accès **uniquement** aux composants listés dans `02-PERIMETRE-TECHNIQUE.md`.
- Accès **en lecture seule** sauf nécessité démontrée d'écriture (ex. tests d'injection).
- Accès **temporaire**, expire automatiquement à la fin de la mission.
- Accès **traçable** : chaque action est loggée avec l'identité de l'auditeur.
- Accès **révocable** à tout moment par le RSSI.

## 2. Types d'accès

### 2.1 Accès au code source (GitHub)

**Nécessaire pour** : revue de code (tests boîte blanche).

**Procédure** :
1. Le RSSI crée un compte GitHub `auditeur-coderoute-2026` (compte dédié, pas de compte personnel).
2. Le compte est ajouté comme **collaborator** sur le dépôt `skaba89/coderouteguinee-glm5` avec rôle **Read** (pas Write, pas Admin).
3. Le compte est ajouté à l'équipe `auditeurs-2026` (pour traçabilité).
4. 2FA obligatoire sur le compte GitHub.
5. Le compte expire automatiquement à la fin de la mission (rotation manuelle si prolongation).

**Durée** : 45 jours calendaires.

### 2.2 Accès SSH aux serveurs

**Nécessaire pour** : inspection de configuration, lecture de logs, tests locaux.

**Procédure** :
1. L'auditeur fournit **une clé publique SSH Ed25519** (pas RSA 2048, pas ECDSA) générée localement.
2. Le RSSI ajoute la clé au fichier `/home/auditeur/.ssh/authorized_keys` sur :
   - `app-prod-1.conakry-dc.gn` (Next.js)
   - `app-prod-2.conakry-dc.gn` (Next.js, réplique)
   - `db-prod-1.conakry-dc.gn` (PostgreSQL primaire)
   - `db-prod-2.kankan-dc.gn` (PostgreSQL réplica)
   - `redis-prod-1.conakry-dc.gn` (Redis)
3. L'utilisateur `auditeur` est créé sur chaque serveur avec :
   - UID dédié (ex. `2001`).
   - Shell `/bin/bash` (pas `/bin/nologin`).
   - Groupe secondaire `audit-logs` (lecture `/var/log/`).
   - Pas de sudo (escalade via le RSSI si nécessaire).
4. Restriction `ForceCommand` dans `sshd_config` : uniquement `bash -l` (pas de tunneling SSH, pas de X11 forwarding).

**Durée** : 45 jours, révocation immédiate à la fin.

### 2.3 Accès à la base de données

**Nécessaire pour** : inspection de schéma, requêtes de validation (lecture seule).

**Procédure** :
1. Le DBA crée un utilisateur PostgreSQL `auditeur_ro` avec privilèges :
   ```sql
   CREATE ROLE auditeur_ro WITH LOGIN PASSWORD '<generated-by-rssi>' VALID UNTIL '2026-08-15';
   GRANT CONNECT ON DATABASE coderoute TO auditeur_ro;
   GRANT USAGE ON SCHEMA public TO auditeur_ro;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO auditeur_ro;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO auditeur_ro;
   REVOKE SELECT ON TABLE "Payment", "AuditLog" FROM auditeur_ro;  -- données sensibles
   ```
2. L'utilisateur est **en lecture seule** sauf sur `Payment` et `AuditLog` ( données trop sensibles — accès via le RSSI en pair-programming).
3. Connexion obligatoirement via **Tunnel SSH** (pas d'accès direct PostgreSQL au public).
4. Logs PostgreSQL activés pour `auditeur_ro` : `log_statement = 'all'` filtré sur `user = 'auditeur_ro'`.

**Durée** : 45 jours, expiration automatique.

### 2.4 Accès au cache Redis

**Nécessaire pour** : inspection des sessions et rate limits.

**Procédure** :
1. Le RSSI crée un utilisateur Redis ACL :
   ```redis
   ACL SETUSER auditeur on ><password> ~session:* ~ratelimit:* +info +get +scan +ttl +type -@write -@dangerous
   ```
2. Pas d'accès aux locks distribués (`lock:*`) ni à la file de notifications (`notif:*`).

**Durée** : 45 jours, révocation via `ACL DELUSER auditeur`.

### 2.5 Accès à l'application (comptes de test)

**Nécessaire pour** : tests fonctionnels d'authentification et d'autorisation.

**Procédure** :
1. Le RSSI crée 5 comptes dédiés dans l'environnement de **staging** (jamais en prod) :
   - `auditeur-candidat@staging.coderoute-gn.org` / mot de passe généré
   - `auditeur-autoecole@staging.coderoute-gn.org` / mot de passe généré
   - `auditeur-centre@staging.coderoute-gn.org` / mot de passe généré
   - `auditeur-admin@staging.coderoute-gn.org` / mot de passe généré
   - `auditeur-superadmin@staging.coderoute-gn.org` / mot de passe généré
2. Les comptes sont **marqués en base** avec `isAuditorAccount: true` (champ ajouté) → audit log spécifique.
3. Les mots de passe sont transmis hors-bande (signal ou appel vocal, jamais par email).
4. Les comptes sont désactivés à la fin de la mission (`deletedAt: now()`).

**Durée** : 45 jours.

### 2.6 Accès aux secrets (limité)

**Nécessaire pour** : vérifier la robustesse des secrets (longueur, entropie).

**Procédure** :
1. L'auditeur **n'a jamais accès aux valeurs des secrets** en production.
2. Le RSSI fournit à l'auditeur **un dump des longueurs et préfixes** des secrets :
   ```
   SESSION_SECRET: 64 chars, hex prefix 'a3f...'
   JWT_SECRET: 64 chars, hex prefix 'b7c...'
   WEBHOOK_ORANGE_MONEY_SECRET: 64 chars, hex prefix 'f1d...'
   ```
3. L'auditeur peut demander une **rotation** d'un secret suspecté faible (procédure ci-dessous).
4. En staging, l'auditeur a accès aux secrets via le RSSI (en pair-programming).

**Durée** : limitée à la consultation.

## 3. Rotation des secrets

### 3.1 Procédure standard

Si l'auditeur identifie un secret faible ou potentiellement compromis :

1. L'auditeur notifie le RSSI par **email chiffré PGP** dans l'heure.
2. Le RSSI valide la demande (ou refuse avec justification).
3. Le RSSI exécute `scripts/generate-secrets.sh` avec le paramètre `--rotate <secret_name>`.
4. Le nouveau secret est injecté dans le secret manager et déployé via `docker-compose.production.yml`.
5. Les services impactés sont redémarrés (rolling update, pas d'indisponibilité).
6. L'ancien secret est **conservé chiffré** pendant 30 jours (pour audit) puis détruit.

### 3.2 Procédure d'urgence (compromission avérée)

Si un secret est avéré compromis (ex. trouvé sur Pastebin, dans un commit public) :

1. **Rotation immédiate** par le RSSI, sans validation préalable.
2. **Notification AGPD** dans les 72 heures (procédure `docs/audit-externe/runbook-incident-agpd.md`).
3. **Audit rétroactif** des logs pour détecter une exploitation.
4. **Communication aux utilisateurs** si leurs données sont impactées.

## 4. Journalisation des actions de l'auditeur

Toutes les actions de l'auditeur doivent être journalisées dans `AuditLog` avec les champs suivants :

```typescript
{
  actor: 'auditeur-2026',
  action: 'db.select',
  target: 'User',
  timestamp: '2026-07-15T10:23:45Z',
  ipAddress: '<ip-auditeur>',
  userAgent: 'psql 16.3',
  metadata: { query: 'SELECT id, email FROM "User" LIMIT 10;' }
}
```

Le RSSI consulte ce journal **quotidiennement** pendant la mission et **hebdomadairement** pendant 30 jours après la fin.

## 5. Révocation des accès

### 5.1 Fin normale de mission

À la fin de la mission (J+45), le RSSI exécute le script `scripts/revoke-auditor-access.sh` qui :

- Supprime le compte GitHub `auditeur-coderoute-2026`.
- Supprime la clé SSH du fichier `authorized_keys` sur tous les serveurs.
- Désactive l'utilisateur PostgreSQL `auditeur_ro`.
- Supprime l'utilisateur Redis `auditeur`.
- Désactive les 5 comptes applicatifs de staging.
- Génère un rapport des actions effectuées par l'auditeur (depuis `AuditLog`).
- Archive le rapport dans `docs/audit-externe/audit-2026-actions.log` (chiffré).

### 5.2 Révocation anticipée

En cas de manquement aux règles d'engagement (cf. `01-CHARTE-AUDIT.md` section 4), le RSSI peut révoquer les accès immédiatement :

1. Notification par email au sponsor DNTT et à l'auditeur.
2. Exécution de `scripts/revoke-auditor-access.sh`.
3. Analyse des logs pour identifier d'éventuels dommages.
4. Décision de poursuite ou d'arrêt de la mission par le sponsor.

### 5.3 Cas de force majeure

En cas d'incident de sécurité pendant l'audit (intrusion réelle), tous les accès de l'auditeur sont **immédiatement révoqués** pour préserver les preuves et éviter toute contamination.

## 6. Engagement de confidentialité

L'auditeur signe le NDA (`06-CONFIDENTIALITE-CA-NDA.md`) **avant** tout accès. Le NDA survit 5 ans après la fin de la mission. Toute divulgation non autorisée engage la responsabilité civile et pénale de l'auditeur.

## 7. Checklist de fin de mission

Avant clôture de la mission, le RSSI vérifie :

- [ ] Compte GitHub supprimé.
- [ ] Clés SSH supprimées sur les 5 serveurs.
- [ ] Utilisateur PostgreSQL désactivé.
- [ ] Utilisateur Redis supprimé.
- [ ] Comptes applicatifs désactivés.
- [ ] Audit log filtré sur `actor = 'auditeur-2026'` généré et archivé.
- [ ] Rapport d'audit signé reçu.
- [ ] Plan de remédiation accepté par le sponsor.
- [ ] NDA rangé dans le coffre-fort numérique.
- [ ] Procès-verbal de clôture signé par les 3 parties (DNTT, auditeur, RSSI).
