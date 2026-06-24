# Politique de Cookies — CodeRoute Guinée

**Version :** 1.0 — Sprint 3
**Date d'entrée en vigueur :** 24 juin 2026
**Cadre légal :** Loi L/2022/018/AN du 20 juin 2022, articles 9 et 22 ; Directive CEMAC n°18/2019 relative au commerce électronique

---

## 1. Préambule

La présente politique de cookies décrit les traceurs et témoins de connexion (« cookies ») déposés sur votre terminal lors de votre navigation sur le Service CodeRoute Guinée. Elle complète notre [Politique de Confidentialité](./POLITIQUE-CONFIDENTIALITE.md) et nos [Mentions Légales](./MENTIONS-LEGALES.md).

Conformément aux recommandations de l'Autorité Guinéenne de Protection des Données (AGPD) et aux bonnes pratiques internationales, la DNTT privilégie une approche **minimale** : seuls les cookies strictement nécessaires au fonctionnement du Service sont déposés, sans recourir à des traceurs publicitaires ou de mesure d'audience tierce.

---

## 2. Qu'est-ce qu'un cookie ?

Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette, smartphone) lors de la visite d'un site web. Il permet au site de mémoriser des informations sur votre visite (préférences, identifiant de session, panier, etc.). Les cookies ne contiennent pas de virus et ne permettent pas, à eux seuls, de vous identifier nominativement.

### Différents types de cookies

| Type | Description | Consentement requis |
|---|---|---|
| Cookies essentiels | Strictement nécessaires au fonctionnement du Service | Non (Art. 9.2.a Loi L/2022/018/AN) |
| Cookies fonctionnels | Améliorent l'expérience utilisateur (langue, thème) | Non (par défaut) ; retrait possible |
| Cookies de mesure d'audience | Statistiques de fréquentation anonymes | Oui, sauf si anonymisés |
| Cookies publicitaires | Ciblage publicitaire | Oui (non utilisés sur ce Service) |
| Cookies tiers | Déposés par des services externes (réseaux sociaux, vidéos) | Oui (non utilisés sur ce Service) |

---

## 3. Cookies déposés par le Service CodeRoute Guinée

### 3.1 Cookies essentiels (sans consentement)

Ces cookies sont strictement nécessaires à la fourniture du Service demandé. Sans eux, l'authentification, la sécurité et le bon fonctionnement ne seraient pas assurés.

| Nom | Type | Durée | Finalité |
|---|---|---|---|
| `__Host-session` (production) / `session` (dev) | HTTP, httpOnly, Secure, SameSite=Strict | 8 heures d'inactivité | Jeton JWT d'authentification (art. 9.2.a) |
| `__Host-csrf` (production) / `csrf` (dev) | HTTP, httpOnly, Secure, SameSite=Strict | 8 heures | Jeton anti-CSRF (art. 9.2.a) |
| `2fa_verified` | HTTP, httpOnly, Secure | 30 minutes | Marqueur de vérification 2FA réussie (administration uniquement) |

### 3.2 Cookies fonctionnels (retrait possible)

Ces cookies améliorent l'expérience utilisateur mais ne sont pas indispensables au fonctionnement. Ils peuvent être désactivés sans dégrader le Service.

| Nom | Type | Durée | Finalité |
|---|---|---|---|
| `locale` | HTTP | 1 an | Mémorise la langue choisie (fr, ff, sus, man) |
| `theme` | HTTP | 1 an | Mémorise le thème d'affichage (clair/sombre) |
| `pwa-install-dismissed` | HTTP | 30 jours | Mémorise le refus d'installation PWA |

### 3.3 Cookies de mesure d'audience

Le Service **ne dépose aucun cookie de mesure d'audience tiers** (pas de Google Analytics, pas de Facebook Pixel, pas de Matomo). Les statistiques de fréquentation internes sont calculées à partir des logs serveur anonymisés, sans cookie dédié.

### 3.4 Cookies publicitaires et tiers

Le Service **ne dépose aucun cookie publicitaire ni cookie tiers**. Aucune régie publicitaire, aucun réseau social, aucun service de vidéo externe n'est intégré.

---

## 4. Gestion de vos préférences

### 4.1 Configuration de votre navigateur

Vous pouvez à tout moment configurer votre navigateur pour accepter, refuser ou supprimer les cookies. Les liens vers les pages d'aide des navigateurs les plus courants :

- **Chrome / Edge / Brave** : `chrome://settings/cookies`
- **Firefox** : `about:preferences#privacy`
- **Safari (macOS/iOS)** : Réglages → Safari → Confidentialité
- **Samsung Internet** : Paramètres → Confidentialité → Cookies

### 4.2 Bannière de consentement

Conformément à la recommandation de l'AGPD, le Service n'affiche **pas de bannière de consentement cookies**, car il ne dépose que des cookies essentiels (qui ne requièrent pas de consentement en vertu de l'article 9.2.a de la Loi L/2022/018/AN) et des cookies fonctionnels optionnels (dont le retrait est possible via les réglages du navigateur).

Si, à l'avenir, le Service venait à déposer des cookies non essentiels (mesure d'audience, intégration tierce), une bannière de consentement conforme aux recommandations de l'AGPD serait mise en place, avec :
- Une option « Tout refuser » aussi visible que « Tout accepter »
- Une granularité par catégorie de cookie
- Un retrait possible du consentement à tout moment
- Une conservation du consentement pendant 13 mois maximum

### 4.3 Effets du retrait des cookies essentiels

Si vous refusez les cookies essentiels (notamment le cookie de session), le Service ne pourra plus vous authentifier et les fonctionnalités suivantes seront indisponibles :
- Connexion à votre compte
- Inscription à un examen
- Paiement en ligne
- Suivi de votre dossier

Vous pourrez toutefois consulter les pages publiques (accueil, mentions légales, politique de confidentialité, FAQ).

---

## 5. Stockage local et autres traceurs

### 5.1 LocalStorage et SessionStorage

Le Service utilise le stockage local du navigateur (`localStorage` et `sessionStorage`) pour :
- Mettre en cache les questions d'examen déjà téléchargées (réduction de la consommation data)
- Mémoriser la progression en cours d'examen (reprise en cas de coupure réseau)
- Stocker le manifeste PWA pour le mode hors ligne

Ces données ne sont **pas des cookies** au sens réglementaire, mais constituent des traceurs au sens large. Elles ne contiennent aucune donnée personnelle identifiante (uniquement l'identifiant de session, déjà présent dans le cookie).

### 5.2 Service Worker (PWA)

Le Service enregistre un Service Worker (`/sw.js`) permettant le fonctionnement hors ligne ( Progressive Web App). Ce Service Worker :
- Met en cache les ressources statiques (HTML, CSS, JS, images)
- Ne transmet aucune donnée personnelle à un serveur tiers
- Peut être désactivé en supprimant le cache du navigateur

### 5.3 Empreinte numérique (« fingerprinting »)

Le Service **ne pratique pas le fingerprinting** (technique consistant à collecter des caractéristiques techniques de votre terminal pour vous suivre sans cookie). Seul le `User-Agent` est collecté dans les logs serveur à des fins de sécurité (détection d'anomalies), et conservé 30 jours seulement.

---

## 6. Cookies tiers éventuels

### 6.1 Paiement Mobile Money

Lorsque vous accédez à la plateforme de paiement Orange Money, MTN Mobile Money ou Celcom Money, vous êtes redirigé vers le site de l'opérateur qui peut déposer ses propres cookies. Ces cookies sont régis par la politique de cookies de l'opérateur, que nous vous invitons à consulter :
- [Politique cookies Orange Money Guinée](https://www.orange-guinee.com/cookies)
- [Politique cookies MTN Mobile Money Guinée](https://www.mtn.gn/confidentialite)
- [Politique cookies Celcom Money](https://www.celcom.gn/privacy)

La DNTT n'a pas de contrôle sur ces cookies tiers et décline toute responsabilité à leur égard.

### 6.2 Monitoring Sentry (optionnel)

En production, si le DSN Sentry est configuré, le SDK Sentry peut déposer un cookie de suivi d'erreur. Ce cookie :
- Est strictement limité à la détection des erreurs techniques
- Ne collecte aucune donnée personnelle nominative
- Peut être désactivé en bloquant le domaine `sentry.io` dans votre navigateur

---

## 7. Durée de conservation

| Catégorie | Durée maximale |
|---|---|
| Cookies de session | 8 heures d'inactivité |
| Cookie CSRF | 8 heures |
| Cookie 2FA | 30 minutes |
| Cookie de langue | 1 an |
| Cookie de thème | 1 an |
| Cache PWA | 30 jours |
| Logs serveur (incluant User-Agent) | 30 jours |

À l'expiration de ces durées, les cookies sont automatiquement supprimés par votre navigateur, et les données serveur sont écrasées ou anonymisées.

---

## 8. Sécurité des cookies

Tous les cookies déposés par le Service respectent les bonnes pratiques de sécurité :

- **`httpOnly`** : inaccessible au JavaScript, protège contre les attaques XSS
- **`Secure`** : transmis uniquement sur HTTPS (TLS 1.2+)
- **`SameSite=Strict`** : protège contre les attaques CSRF
- **Préfixe `__Host-`** (en production) : garantit l'origine du cookie
- **Pas d'attribut `Domain`** : le cookie n'est envoyé qu'au domaine émetteur

---

## 9. Modifications de la politique de cookies

La DNTT se réserve le droit de modifier la présente politique à tout moment. Toute modification substantielle (ajout d'un cookie non essentiel, intégration d'un tiers) fera l'objet d'une notification préalable de 30 jours et de l'affichage d'une bannière de consentement le cas échéant.

---

## 10. Contact

Pour toute question relative à l'usage des cookies par le Service CodeRoute Guinée :
- **Email :** dpo@transport.gov.gn
- **Courrier :** DNTT — Délégué à la Protection des Données, BP 1234, Conakry, République de Guinée
