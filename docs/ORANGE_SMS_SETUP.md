# Orange SMS OAuth2 — Guide d'intégration (Phase 29)

Ce document explique comment configurer et utiliser l'intégration **réelle** de l'API Orange SMS Guinée dans CodeRoute Guinée.

## Aperçu

L'intégration utilise le flux **OAuth2 client_credentials** d'Orange pour obtenir un jeton d'accès, puis l'endpoint **SMS Messaging** pour envoyer des SMS aux numéros guinéens (`+224 6XX XX XX XX`).

```
┌──────────────┐      1. POST /oauth/v3/token       ┌──────────────────┐
│              │ ──────────────────────────────────►│                  │
│  CodeRoute   │      Basic auth (client_id:secret) │  api.orange.com  │
│  Next.js app │◄────────────────────────────────── │                  │
│              │      2. access_token (Bearer 60min)│                  │
│              │                                    │                  │
│              │      3. POST /smsmessaging/v1/...  │                  │
│              │ ──────────────────────────────────►│                  │
│              │      Bearer <token>                │                  │
│              │◄────────────────────────────────── │                  │
│              │      4. message ID + delivery info │                  │
└──────────────┘                                    └──────────────────┘
```

## Prérequis

1. **Compte Orange Developer** — https://developer.orange.com
2. Une application avec l'API **SMS Guinée** activée
3. Les credentials suivants depuis votre dashboard Orange :
   - `client_id`
   - `client_secret`
   - `sender address` (le numéro provisionné par Orange, p.ex. `tel:+224628000000`)

## Configuration

### 1. Renseigner les variables d'environnement

Copiez `.env.example` vers `.env` et remplissez la section Orange SMS :

```bash
# .env
SMS_PROVIDER="orange"

ORANGE_SMS_CLIENT_ID="votre-client-id-de-orange"
ORANGE_SMS_CLIENT_SECRET="votre-client-secret-de-orange"
ORANGE_SMS_SENDER_ADDRESS="tel:+224628000000"
ORANGE_SMS_API_BASE="https://api.orange.com"
```

> ⚠️ **Important** : `SMS_PROVIDER=orange` est obligatoire pour que le service de notifications route les SMS vers l'API Orange. Sans cette variable, le service reste en mode `console` (logs serveur uniquement).

### 2. Redémarrer le serveur

```bash
npm run dev
```

### 3. Vérifier la configuration

Ouvrez **Espace Admin → Notifications → "Orange SMS — OAuth2" panel**.

Vous devriez voir :
- Badge vert **"Configuré"**
- Les 4 variables d'environnement cochées
- Votre sender address et un aperçu masqué du client ID

Si vous voyez le badge **"Console (dev)"**, c'est qu'au moins une variable manque.

## Tester l'envoi

1. Dans le panneau Orange SMS, saisissez un numéro de téléphone guinéen (formats acceptés : `628123456`, `0628123456`, `+224628123456`, `224 628 12 34 56`)
2. Cliquez sur **"Envoyer un SMS de test"**
3. Vous recevez :
   - Le **message ID** retourné par Orange
   - Le **quota restant** (header `X-Cdr-Remaining-Quota`)
   - Le **temps de réponse** en ms
   - Le numéro normalisé au format E.164 (`tel:+224628123456`)

## Endpoints API

### `GET /api/admin/notifications/orange-sms`

Retourne le statut de configuration. Réservé à `super-admin` et `administration`.

```json
{
  "configured": true,
  "provider": "orange",
  "apiBase": "https://api.orange.com",
  "senderAddress": "tel:+224628000000",
  "clientIdMasked": "votr••••-id",
  "help": "Orange SMS OAuth2 est configuré…",
  "envVars": {
    "ORANGE_SMS_CLIENT_ID": true,
    "ORANGE_SMS_CLIENT_SECRET": true,
    "ORANGE_SMS_SENDER_ADDRESS": true,
    "ORANGE_SMS_API_BASE": true
  }
}
```

### `POST /api/admin/notifications/orange-sms`

Envoie un SMS de test. Body : `{ "phone": "+224628123456" }`.

```json
{
  "success": true,
  "provider": "orange",
  "messageId": "abc123def456",
  "remainingQuota": 4500,
  "normalizedPhone": "tel:+224628123456",
  "diagnostic": {
    "elapsedMs": 842,
    "configured": true,
    "timestamp": "2026-06-22T08:15:30.000Z"
  },
  "message": "SMS Orange envoyé à tel:+224628123456. ID: abc123def456"
}
```

## Comment ça marche en interne

### Module `src/lib/orange-sms.ts`

| Fonction | Rôle |
|---|---|
| `getOrangeSmsConfig()` | Lit les variables d'env, retourne `null` si incomplet |
| `getOrangeAccessToken()` | OAuth2 client_credentials + cache en mémoire (60 min - 60s de marge) |
| `normalizeGuineaPhone()` | Valide et normalise vers `tel:+224XXXXXXXXX` |
| `sendOrangeSms(to, text)` | Pipeline complet : config → token → POST → parse réponse |
| `sendTestOrangeSms(to)` | Wrappe `sendOrangeSms` avec diagnostic (durée, timestamp) |
| `isOrangeSmsConfigured()` | Sert au badge UI "Configuré / Console" |

### Intégration avec le service notifications

`src/lib/notifications.ts` route vers `sendOrangeSms()` quand `SMS_PROVIDER=orange`. Tous les templates existants (welcome, password_reset, exam_reminder, payment_confirmation, booking_confirmed, fraud_alert, account_activated, account_deactivated) passent maintenant automatiquement par Orange en production.

### Gestion des erreurs

| Cas | Comportement |
|---|---|
| Variables d'env manquantes | Bascule en mode `console` (SMS loggué sur stdout) |
| Token OAuth2 expiré | Renouvellement automatique transparent |
| Numéro invalide | Erreur 400 avec message clair |
| `deliveryStatus = DeliveryImpossible` | Retourne `success: false` avec adresse fautive |
| HTTP 4xx/5xx d'Orange | Parse le `code`/`message` d'erreur et le retourne |
| Message > 1530 caractères | Rejeté côté client avant tout appel API |

## Tests unitaires

```bash
npx jest src/lib/__tests__/orange-sms.test.ts
```

Couvre 29 cas :
- Normalisation des numéros (6 formats acceptés, 5 rejetés)
- Détection de configuration (4 scénarios)
- Flux OAuth2 (succès, cache, 401, token_type invalide)
- Envoi SMS (succès, console fallback, message vide/trop long, numéro invalide, delivery impossible, 400 API)
- Diagnostic du test admin

## Limitations connues

1. **Cache du token en mémoire** — Limité à un seul process Node. En production multi-instance (PM2 cluster, k8s), chaque instance gère son propre cache. Cela peut générer quelques appels OAuth2 supplémentaires, mais reste acceptable.
2. **Pas de webhooks de statut** — Orange propose des webhooks pour les accusés de livraison différés. Non implémenté dans cette phase.
3. **Quota non persisté** — La valeur `remainingQuota` n'est pas stockée en base ; à afficher dans une future phase via un panneau admin.

## Dépannage

### `configured: false` malgré les variables présentes

Vérifiez :
- Que `.env` ne contient pas d'espaces autour du `=`
- Que le serveur a été redémarré (`Ctrl+C` puis `npm run dev`)
- Qu'aucune variable n'est surchargée dans `next.config.js`

### `Orange OAuth2 token error (401)`

- Vérifiez `ORANGE_SMS_CLIENT_ID` et `ORANGE_SMS_CLIENT_SECRET`
- Vérifiez que l'app Orange Developer a l'API SMS Guinée activée

### `SVC0001: Invalid sender address`

- Le `ORANGE_SMS_SENDER_ADDRESS` doit correspondre exactement au numéro provisionné par Orange
- Format : `tel:+224XXXXXXXXX` (avec `tel:` préfixe)

### SMS envoyé mais non reçu

- Vérifiez le `deliveryStatus` dans la réponse — `Delivered` = OK, `DeliveryImpossible` = numéro inexistant
- Orange peut prendre 5-30s pour livrer en heure de pointe
