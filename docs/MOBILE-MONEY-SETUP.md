# ============================================================
# CodeRoute Guinée — Mobile Money Provider Configuration
# Real API integration guide for production deployment
# ============================================================

## ─── Orange Money API ──────────────────────────────────────

### 1. Inscription
- URL: https://developer.orange.com
- Créer un compte développeur
- Souscrire à l'API "Orange Money Web Payment"
- Obtenir: `client_id`, `client_secret`

### 2. Variables d'environnement requises
```
ORANGE_MONEY_API_URL=https://api.orange.com/om/equity/v1
ORANGE_MONEY_API_KEY=your_oauth_access_token
ORANGE_MONEY_CLIENT_ID=your_client_id
ORANGE_MONEY_CLIENT_SECRET=your_client_secret
ORANGE_MONEY_MERCHANT_NUMBER=your_merchant_number
ORANGE_MONEY_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Endpoints utilisés
- POST /transactions — Initier un paiement
- GET /transactions/{id} — Vérifier le statut
- POST /webhooks — Recevoir les notifications (URL: /api/payments/webhook)

### 4. USSD pour confirmation client
- #144# — Menu principal Orange Money
- #144*1# — Paiement marchand

---

## ─── MTN Mobile Money (MoMo) API ──────────────────────────

### 1. Inscription
- URL: https://momodeveloper.mtn.com
- Créer un compte sur le portail développeur MTN
- Souscrire à "Collection API" pour la Guinée
- Obtenir: `subscription_key`, `user_id`, `api_key`

### 2. Variables d'environnement requises
```
MTN_MONEY_API_URL=https://ericssonbasicapi2.azure-api.net/collection/v1_2
MTN_MONEY_API_KEY=your_bearer_token
MTN_MONEY_SUBSCRIPTION_KEY=your_subscription_key
MTN_MONEY_USER_ID=your_user_id
MTN_MONEY_API_USER_SECRET=your_secret
MTN_MONEY_ENVIRONMENT=sandbox|production
MTN_MONEY_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Endpoints utilisés
- POST /requesttopay — Demander un paiement
- GET /requesttopay/{referenceId} — Vérifier le statut
- POST /v1_2/webhooks — Notifications (URL: /api/payments/webhook)

### 4. USSD pour confirmation client
- *156# — Menu principal MTN MoMo
- *156*1# — Paiement marchand

---

## ─── Celcom Money API ─────────────────────────────────────

### 1. Inscription
- URL: https://www.celcom.com/gn/business
- Contacter l'équipe commerciale Celcom Guinée
- Signer un contrat marchand
- Obtenir: `merchant_id`, `api_key`

### 2. Variables d'environnement requises
```
CELCOM_MONEY_API_URL=https://api.celcom-gn.com/payment/v1
CELCOM_MONEY_API_KEY=your_api_key
CELCOM_MONEY_MERCHANT_ID=your_merchant_id
CELCOM_MONEY_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Endpoints utilisés
- POST /transactions/initiate — Initier un paiement
- GET /transactions/{reference} — Vérifier le statut
- POST /webhooks — Notifications (URL: /api/payments/webhook)

### 4. USSD pour confirmation client
- *400# — Menu principal Celcom Money
- *400*1# — Paiement marchand

---

## ─── Webhook Configuration ────────────────────────────────

L'endpoint webhook est: `https://your-domain.com/api/payments/webhook`

Pour chaque provider, configurez l'URL webhook dans leur portail développeur.
Le webhook vérifie la signature HMAC-SHA256 pour sécuriser les notifications.

Headers attendus:
- `x-provider`: orange_money | mtn_money | celcom_money
- `x-signature`: signature HMAC-SHA256 du body avec le secret du provider

---

## ─── Mode Sandbox vs Production ───────────────────────────

### Sandbox (développement)
- Aucune variable d'environnement requise
- Les paiements sont simulés (95% de succès)
- Auto-confirmation après 30 secondes
- Logs détaillés dans la console

### Production
- Toutes les variables d'environnement doivent être configurées
- Les vraies API sont appelées
- Webhooks requis pour confirmation temps réel
- Audits complets dans la base de données
