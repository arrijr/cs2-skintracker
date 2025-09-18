CS2 Skin Price Tracker
Modern web app to monitor and analyze CS2 skin prices with Watchlist, Price Alerts, Portfolio, and price
history.
- **Frontend:** Next.js (App Router, TypeScript), Tailwind
- **Backend:** Node.js, Express, Prisma (PostgreSQL), Cron jobs
- **Auth:** Clerk (OAuth + email/password)
- **App language:** English · **Currency:** $

Features (MVP)
- Authentication via Clerk (OAuth + email/password)
- Skin search (Steam Market hash names, autocomplete)
- Watchlist (free: up to 5 items)
- One price alert per user (email/push prepared)
- Skin detail with 30-day price chart (stored history)
- **Case System** - Display case information and related skins
- Portfolio overview (positions, P/L, history)
- Responsive UI (mobile & desktop)
Planned (Premium / upcoming):
- Larger watchlist & multiple alerts
- Year charts, portfolio comparison, export (CSV/Excel)
- Steam login & inventory import (later)
- Multi-market support (later)

Repo Structure
/frontend # Next.js app
/backend # Express API, Prisma, Cron
/docs # Architecture, API, data model, features, troubleshooting, ADRs

Quick Start

Backend
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
**Backend .env**
DATABASE_URL="postgresql://postgres:@localhost:5432/cs2skindb?schema=public"
CLERK_SECRET_KEY="your_clerk_secret_key"

# Clerk JWT verification (DEV)
CLERK_ISSUER=https://<your-dev-subdomain>.clerk.accounts.dev
CLERK_JWKS_URL=https://<your-dev-subdomain>.clerk.accounts.dev/.well-known/jwks.json
CLERK_AUDIENCE=cs2-skintracker-api-dev

Optional scheduler flags in staging:
RUN_SCHEDULER=false

Frontend
cd frontend
npm install
npm run dev
Access http://localhost:3000

**Frontend .env.local**
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
NEXT_PUBLIC_API_ORIGIN="http://localhost:5000"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL="/"

## Environments & API

### Frontend → Backend Routing

Alle API-Calls gehen **direkt** an Render (kein Next.js API-Proxy):

- DEV/Preview → `${NEXT_PUBLIC_API_ORIGIN_DEV}`
- PROD → `${NEXT_PUBLIC_API_ORIGIN_PROD}`

Konfiguration (Vercel Project → Settings → Environment Variables):

- `NEXT_PUBLIC_API_ORIGIN_DEV=https://cs2-skintracker-dev.onrender.com`
- `NEXT_PUBLIC_API_ORIGIN_PROD=https://cs2-skintracker.onrender.com`

Im Code **immer**:
```ts
import { apiUrl, fetchJson } from "@/lib/api";
await fetchJson(apiUrl("/api/v1/skins"));
```

## Case System

### Overview
The Case System displays case information and related skins on skin detail pages. It automatically detects which case a skin belongs to and shows all other skins from that case.

### Features
- **Case Section Component** - Shows case thumbnail, name, and "View Case" button
- **Case Detail Page** - Complete case information with all contained skins
- **Smart Case Mapping** - Automatically resolves cases for skins using pattern matching
- **Steam Integration** - Direct links to Steam market for cases

### Case Mapping Logic
1. **Direct Patterns:** "recoil" → "Recoil Case", "fever dream" → "Fever Case"
2. **Skin Finishes:** "case hardened" → "Operation Bravo Case", "fade" → "Operation Bravo Case"
3. **Generic Patterns:** Fallback matching for edge cases

### API Endpoints
- `GET /api/v1/cases/:caseId` - Get case metadata
- `GET /api/v1/cases/:caseId/skins` - List skins in case
- `GET /api/v1/skins/:skinId/case-info` - Resolve skin's case

### Components
- `CaseSection` (`/frontend/src/components/CaseSection.tsx`) - Case display on skin pages
- Case Detail Page (`/frontend/src/app/cases/[id]/page.tsx`) - Full case information

## UI/UX Components

### Enhanced Skin Detail Page
The skin detail page has been completely redesigned with modern shadcn components and improved user experience:

#### Visual Enhancements
- **Case Section Card** - Styled with gradient backgrounds, larger icons, and shadow effects
- **Price History Chart** - ToggleGroup for time range selection with tooltips
- **Market Stats Card** - 2x2 grid layout with colored icons and hover effects
- **Skin Variants Table** - shadcn Table with color-coded wear condition badges
- **Related Skins Grid** - Interactive cards with hover effects and Quick Actions
- **Breadcrumb Navigation** - Shows navigation path: Home > Skins > Case > Skin

#### Mobile Optimization
- **Responsive Design** - Desktop grid and mobile carousel for skin displays
- **Touch-Friendly** - Carousel navigation with Previous/Next buttons
- **Adaptive Layout** - Optimized spacing and sizing for mobile devices

#### Interactive Features
- **Quick Actions** - Watchlist and Portfolio buttons on hover
- **Hover Effects** - Scale animations and color transitions
- **Tooltips** - Contextual help for all interactive elements
- **Color-Coded Badges** - Visual distinction for wear conditions and rarities

#### Technical Implementation
- **shadcn/ui Components** - Card, Table, Badge, ToggleGroup, Tooltip, Carousel, Breadcrumb
- **Responsive Breakpoints** - Mobile-first design with md: and lg: breakpoints
- **Accessibility** - ARIA labels, keyboard navigation, screen reader support
- **Performance** - Optimized images, lazy loading, efficient state management

Niemals relative Pfade wie `fetch("/api/...")`, sonst landen Requests auf der Vercel-Domain und führen zu 502 Bad Gateway.

### FRONTEND (Vercel)
- **DEV Preview:**
  ```
  NEXT_PUBLIC_API_ORIGIN_DEV=https://cs2-skintracker-dev.onrender.com
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<dev publishable key>
  NEXT_PUBLIC_SITE_URL=<vercel-preview-url>
  ```
- **PROD:**
  ```
  NEXT_PUBLIC_API_ORIGIN_PROD=https://cs2-skintracker.onrender.com
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<prod publishable key>
  NEXT_PUBLIC_SITE_URL=https://cs2-skintracker.vercel.app
  ```

### BACKEND (Render)
- **DEV Service:**
  ```
  CLERK_ISSUER=https://leading-bug-60.clerk.accounts.dev
  CLERK_JWKS_URL=https://leading-bug-60.clerk.accounts.dev/.well-known/jwks.json
  CLERK_AUDIENCE=cs2-skintracker-api-dev
  DATABASE_URL=<dev db url>
  NODE_ENV=development
  ```
- **PROD Service:**
  ```
  CLERK_ISSUER=https://<PROD-Slug>.clerk.accounts.dev
  CLERK_JWKS_URL=https://<PROD-Slug>.clerk.accounts.dev/.well-known/jwks.json
  CLERK_AUDIENCE=cs2-skintracker-api
  DATABASE_URL=<prod db url>
  NODE_ENV=production
  ```

**Note:** 
- `CLERK_ISSUER` & `JWKS_URL` come directly from Clerk
- Ensure `aud` in Clerk JWT template matches `CLERK_AUDIENCE`
- `NODE_ENV` determines logging level (development = verbose, production = minimal)

API (short overview)
- Authentication handled by Clerk middleware
- GET /api/v1/users/profile → current user (Clerk token)
- GET /api/v1/skins / GET /api/v1/skins/search?query=...
- GET|POST|PATCH|DELETE /api/v1/watchlist[/:skinId]
- GET|POST|DELETE /api/v1/portfolio[/:id]
- GET /api/v1/portfolio/history
- GET /api/v1/health/clerk → Clerk JWT verification test (requires auth)
See /docs/API.md for complete contracts, errors and examples.

## API Conventions

### Frontend API Calls
- **All API calls** use `apiUrl('/api/v1/...')` from `@/lib/api`
- **No relative URLs** like `/api/v1/...` in frontend code
- **Environment-based**: `NEXT_PUBLIC_API_ORIGIN` determines backend URL
- **Error handling**: Use `fetchJson()` for structured error responses

### Adding New Endpoints
1. **Backend**: Add route with `optionalClerkAuth` middleware for public endpoints
2. **Frontend**: Use `apiUrl('/api/v1/endpoint')` and `fetchJson()` or `swrFetcher`
3. **Documentation**: Update `/docs/API.md` with request/response examples
4. **Error format**: Return `{ message: string, error?: string }` for consistency

Data Model (high level)
- **User**: id, email (unique), role (`user|admin`), isPremium (bool), createdAt
- **Authentication**: Handled by Clerk (OAuth + email/password)
- **Skin**: id, name, marketHashName (unique), imageUrl, priceHistory[]
- **Watchlist**: id, userId, skinId, priceAlert?
- **Portfolio**: id, userId, skinId, amount, buyPrice, buyDate
- **PriceHistory**: id, skinId, date, price
Details: /docs/DATA_MODEL.md.

Cron sanity checks (dev)
node backend/scripts/checkPriceHistory.js
node backend/scripts/checkPortfolioHistory.js

Documentation
- /docs/README.md – index
- /docs/ARCHITECTURE.md – architecture & diagrams
- /docs/API.md – endpoints, auth, request/response, errors
- /docs/DATA_MODEL.md – Prisma schema & relations
- /docs/DECISIONS.md – ADRs
- /docs/TROUBLESHOOTING.md – known issues & fixes
- /docs/features/ – feature docs (e.g. Filters)
- /docs/think/ – deep-dive notes (debug/analysis)

Contributing
- Conventional Commits (`feat:`, `fix:`, `docs:`…)
- On non-main branches set RUN_SCHEDULER=false.
- Never commit secrets. Add new env keys to README + /docs/API.md.