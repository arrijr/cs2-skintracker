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

Optional scheduler flags in staging:
RUN_SCHEDULER=false

Frontend
cd frontend
npm install
npm run dev
Access http://localhost:3000

**Frontend .env.local**
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
NEXT_PUBLIC_API_URL="http://localhost:5000"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL="/"

API (short overview)
- Authentication handled by Clerk middleware
- GET /api/v1/users/profile → current user (Clerk token)
- GET /api/v1/skins / GET /api/v1/skins/search?query=...
- GET|POST|PATCH|DELETE /api/v1/watchlist[/:skinId]
- GET|POST|DELETE /api/v1/portfolio[/:id]
- GET /api/v1/portfolio/history
See /docs/API.md for complete contracts, errors and examples.

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