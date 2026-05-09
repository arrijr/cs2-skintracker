# Umgebungsvariablen & Keys

> ⚠️ Keys niemals in Code committen. Nur in .env (gitignored) und Vercel Dashboard.

## Backend (`backend/.env`)

| Variable | Lokal | Production | Beschreibung |
|----------|-------|-----------|-------------|
| `DATABASE_URL` | postgresql://... | Vercel Env | PostgreSQL Connection |
| `NODE_ENV` | development | production | Umgebung |
| `PORT` | 5000 | — | Server-Port |
| `CLERK_SECRET_KEY` | `sk_test_...` | `sk_live_...` | Clerk Backend-Key |
| `CLERK_JWKS_URL` | (leer = Mock) | Clerk JWKS URL | JWT-Verifikation |
| `CLERK_ISSUER` | (leer = Mock) | Clerk Issuer | JWT-Issuer |
| `CLERK_AUDIENCE` | (leer = Mock) | API Audience | JWT-Audience |
| `STRIPE_SECRET_KEY` | `sk_test_51TTkHg...` | `sk_live_...` | Stripe Secret |
| `STRIPE_PRICE_PRO_ID` | `price_1TTkJIAf...` | live price ID | Pro Plan Price ID |
| `STRIPE_PRICE_CREATOR_ID` | (nicht gesetzt) | live price ID | Creator Plan Price ID |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | `whsec_...` | Stripe Webhook Signatur |
| `FRONTEND_URL` | `http://localhost:3000` | `https://skintrackr.com` | Redirect URLs |
| `ALLOWED_ORIGINS` | localhost:3000 | Vercel-URLs | CORS Whitelist |

### Dev-Only (vor GA entfernen!)
| Variable | Beschreibung |
|----------|-------------|
| `DEV_TEST_TOKEN` | Bypass für Pro-Tier Testing |
| `DEV_FREE_TOKEN` | Bypass für Free-Tier Testing |

---

## Frontend (`frontend/.env.local`)

| Variable | Wert lokal | Beschreibung |
|----------|-----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_bGVhZGluZ...` | Clerk Frontend-Key |
| `CLERK_SECRET_KEY` | `sk_test_qo2zdv...` | Clerk Backend (SSR) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | API für Sprint 2 Hooks |
| `NEXT_PUBLIC_API_ORIGIN` | `http://localhost:5000` | API für Sprint 1 Layer |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_51TTkHg...` | Stripe Frontend-Key |
| `NEXT_PUBLIC_ENVIRONMENT` | development | Umgebungs-Flag |

---

## Clerk Konfiguration

**Test-Modus** (lokal):
- Domain: `leading-bug-60.clerk.accounts.dev`
- Keys: `pk_test_bGVhZGluZy1idWctNjAu...` / `sk_test_qo2zdv...`

**Production** (nach Domain-Setup):
- Clerk Dashboard → Production Instance erstellen
- Neue Live-Keys generieren
- In Vercel als ENV vars setzen

**isPremium setzen** (für Tests):
- Clerk Dashboard → Users → User auswählen → Metadata Tab
- `publicMetadata`: `{ "isPremium": true }`

---

## Stripe Konfiguration

**Test-Modus**:
- Secret Key: `sk_test_51TTkHgAfapl1SDUr...`
- Publishable Key: `pk_test_51TTkHgAfapl1SDUr9Lx...`
- Pro Price ID: `price_1TTkJIAfapl1SDUrKg1Nb06O` (19.99€/Monat)

**Stripe CLI für lokale Webhooks**:
```bash
stripe listen --forward-to localhost:5000/api/v1/subscriptions/webhook
```

**Test-Karte**:
- Nummer: `4242 4242 4242 4242`
- Ablauf: `12/34`
- CVC: `123`

---

## Vercel Production

- Backend URL: `https://backend-three-theta-44.vercel.app`
- CLERK_SECRET_KEY: ✅ gesetzt
- STRIPE_SECRET_KEY: ✅ gesetzt
- ALLOWED_ORIGINS: ✅ gesetzt
- Stripe Webhook: ✅ registriert (`whsec_...`)

**Deployment**: `git push main` → Vercel auto-deploy
