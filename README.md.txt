# CS2 Skin Price Tracker

**Moderne Web-App zur Überwachung, Analyse und Verwaltung von CS2-Skin-Preisen – mit Watchlist, Preisalarm, Portfolio und (bald) Steam-Login.**

---

## 🚀 Projektziel

Tracke und analysiere CS2-Skin-Preise am Steam Marketplace, verwalte deine persönliche Watchlist, setze Preisalarme und baue dir ein eigenes Portfolio.  
Premium-Features und Steam-Login sind vorbereitet und werden bald ergänzt.

---

## ✨ Features (MVP)

- **Registrierung/Login (E-Mail & Passwort)**
- **Skin-Suche (mit Steam Market Hash Names, Autocomplete)**
- **Watchlist** für bis zu 5 Skins (pro Free-User)
- **Ein Preis-Alarm pro User**
- **Skin-Detailansicht mit 30-Tage-Preischart** (selbst gespeicherte Historie)
- **Portfolio-Übersicht:** Eigene Käufe, Wertentwicklung, Tabelle
- **Benachrichtigungen (E-Mail, z. B. via Nodemailer)**
- **Profilseite (Gesamtwert, kein Einblick ins Inventar anderer)**
- **Responsive Design (mobil & Desktop)**
- **Tech-Stack:** Next.js (Frontend), Node.js/Express (Backend), PostgreSQL (DB), Prisma ORM

---

## 🛣️ Roadmap

1. **MVP**  
   - User-Auth (E-Mail), Watchlist, Portfolio, Preisalarm, Preis-Historie speichern
2. **Premium-Features vorbereiten**
3. **Steam-Login & Inventar-Import**
   - Nutzer können sich via Steam anmelden (OpenID)
   - Inventar-Tracking ab Login-Zeitpunkt
   - Wertentwicklung des Inventars wird automatisch gespeichert und angezeigt
4. **Weitere Marktplätze, Export-Funktionen, Vergleich, Jahres-Charts, ...**

---

## 📦 Projektstruktur

```bash
/backend
  /src
    /controllers      # Feature-Logik (user, skin, watchlist, portfolio, ...)
    /services         # Steam-API, Preisabfrage, E-Mail, ...
    /models           # Prisma-Models
    /routes           # Express-Router
    /middleware       # Auth, Error-Handling
    /utils            # Hilfsfunktionen
    /config           # Settings & Konstanten
    app.js
    server.js
  /prisma
    schema.prisma
    migrations/
  .env
  package.json

/frontend
  (Next.js App, eigene Struktur)
⚙️ Setup & Installation
Backend vorbereiten:

bash
Kopieren
Bearbeiten
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
Frontend vorbereiten:

bash
Kopieren
Bearbeiten
cd frontend
npm install
npm run dev
Umgebungsvariablen (.env im backend):

env
Kopieren
Bearbeiten
DATABASE_URL="postgresql://postgres:DEIN_PASSWORT@localhost:5432/cs2skindb?schema=public"
JWT_SECRET="dein_geheimes_jwt_secret"
(Optional für die Datenbank)

PostgreSQL & Prisma müssen laufen

Datenbank ggf. mit pgAdmin/psql erstellen

📊 Datenmodell (Prisma)
prisma
Kopieren
Bearbeiten
model User {
  id           Int        @id @default(autoincrement())
  email        String     @unique
  passwordHash String
  isPremium    Boolean    @default(false)
  createdAt    DateTime   @default(now())
  watchlist    Watchlist[]
  portfolio    Portfolio[]
}

model Skin {
  id             Int            @id @default(autoincrement())
  name           String
  marketHashName String         @unique
  imageUrl       String?
  priceHistory   PriceHistory[]
  watchlist      Watchlist[]
  portfolio      Portfolio[]
}

model Watchlist {
  id         Int     @id @default(autoincrement())
  user       User    @relation(fields: [userId], references: [id])
  userId     Int
  skin       Skin    @relation(fields: [skinId], references: [id])
  skinId     Int
  priceAlert Float?
}

model Portfolio {
  id       Int      @id @default(autoincrement())
  user     User     @relation(fields: [userId], references: [id])
  userId   Int
  skin     Skin     @relation(fields: [skinId], references: [id])
  skinId   Int
  amount   Int
  buyPrice Float
  buyDate  DateTime
}

model PriceHistory {
  id      Int      @id @default(autoincrement())
  skin    Skin     @relation(fields: [skinId], references: [id])
  skinId  Int
  date    DateTime
  price   Float
}

## 🔍 Cron Sanity Checks

**Price History (last 10):**
```bash
cd backend
node scripts/checkPriceHistory.js
```

**Portfolio History (today):**
```bash
cd backend
node scripts/checkPortfolioHistory.js
```

**Health endpoint (local / prod):**
```bash
GET /api/v1/health/cron-status
```

Returns last write timestamps for PriceHistory and PortfolioHistory.
🔑 Authentifizierung & Erweiterbarkeit
Aktuell: JWT-basierte Auth (E-Mail + Passwort, sicher gehasht)

Geplant: Steam OpenID-Login (OAuth), um Inventar automatisch zu importieren und zu tracken (Wertentwicklung ab Login)

Modular aufgebaut: Neue Auth-Strategien sind einfach erweiterbar (z. B. Social-Logins oder weitere APIs)

Nutzer können beide Methoden kombinieren:
→ Manuelles Portfolio UND automatischer Inventar-Import möglich

📡 Datenquellen
Steam Community Market API

Preise: https://steamcommunity.com/market/priceoverview/

Nur Einzelabfragen! Bulk-Abfragen vermeiden (API-Limit!)

Preise werden regelmäßig gespeichert, um eine Historie zu ermöglichen

Keine Speicherung von Steam-Logindaten, keine Verbindung zum echten Steam-Inventar im MVP!

🛡️ Sicherheit & Datenschutz
Keine Speicherung von Steam-Logindaten

Sicheres Passwort-Hashing

Sensible Userdaten geschützt, Authentifizierung per JWT

DSGVO-Konformität & Privacy by Design

Spätere Erweiterungen (Steam-Login) werden nur via OpenID/OAuth angeboten

📝 Geplante Features
Steam-Login (OpenID, Inventar-Import)

Portfolio-Tracking ab Import-Tag

Premium-Features:

50 Skins auf Watchlist

20 Preisalarme

Portfolio-Vergleich, Jahres-Chart, Export, Werbefreiheit, ...

Marktplatzvergleich (weitere Anbieter)

Export als CSV/Excel

Responsive, modernes UI (Next.js + Tailwind)

Admin-Bereich für Datenpflege

👨‍💻 Entwicklung / Hinweise für Developer
Modulare Struktur: Controllers, Services, Routes, Middleware, Models

API-Versionierung: /api/v1/... – Neue Versionen können jederzeit ergänzt werden

Limits/Konstanten: Zentrale Verwaltung über /src/config

Feature-Flags: Premium-Funktionen sind vorbereitet, aber können gezielt aktiviert werden

Code-Style: Sauber, verständlich, kommentiert (siehe Beispiele im Projekt)

---

## Skin Filtering System Documentation

### Overview
The skin filtering system provides comprehensive filtering and sorting capabilities for CS2 skins, similar to SkinBid.com. It includes category-based filtering, price ranges, wear levels, rarity, quality, and special attributes.

### Backend API: `/api/v1/skins`

#### Query Parameters
- `q` - Search query (searches name, marketHashName, itemName)
- `min` / `max` - Price range (USD)
- `rarity` - Skin rarity (Consumer Grade, Industrial Grade, Mil-Spec, etc.)
- `wear` - Wear level (fn, mw, ft, ww, bs)
- `quality` - Quality type (Normal, StatTrak, Souvenir)
- `stattrak` - StatTrak filter (true/false)
- `special` - Special/Star items filter (true/false)
- `category` - Weapon category (see below)
- `sort` - Sorting option (see below)
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 24, max: 60)

#### Category System
The category system uses a three-tier approach to ensure accurate filtering:

1. **Pattern Matching** (Most Specific) - Exact name patterns
2. **Weapon Type Matching** (Medium Specific) - weaponType field
3. **Name Matching** (Least Specific) - Name contains with exclusions

**Available Categories:**
- `knives` - ★ items, bayonets, karambits, etc.
- `gloves` - Hand wraps, moto, specialist, sport, driver, bloodhound
- `pistols` - Glock, USP, P250, Desert Eagle, Tec-9, CZ75, Revolver, Dual, R8, P2000, Five-SeveN
- `smgs` - MP5, MP7, UMP, P90, MAC-10, PP-Bizon, MP9
- `rifles` - AK, M4, AWP, AUG, SG, FAMAS, Galil, SCAR, G3SG1, SSG 08
- `shotguns` - Nova, XM1014, MAG-7, Sawed-Off
- `machineGuns` - M249, Negev
- `stickers` - Stickers, decals, tournament items
- `agents` - Character models, SWAT, FBI, SAS, etc.
- `cases` - Cases, containers, packages, capsules
- `charms` - Keychains, pins

#### Sorting Options
- `name_asc` / `name_desc` - Alphabetical
- `price_asc` / `price_desc` - Price (nulls last)
- `newest` - Most recent additions
- `popularity_desc` - Most popular (sold24h + offerVolume)
- `wear_asc` / `wear_desc` - Wear level (fn → bs or bs → fn)

#### Response Format
```json
{
  "items": [...],
  "total": 1234,
  "page": 1,
  "pageSize": 24
}
```

### Frontend Implementation

#### URL Synchronization
All filters are automatically synchronized with the URL using `useSearchParams` and `useRouter`. This enables:
- Bookmarkable filtered views
- Shareable filtered URLs
- Browser back/forward navigation

#### Infinite Scroll
- Uses `IntersectionObserver` for performance
- Loads 24 skins per page
- Automatically loads next page when scrolling
- Skeleton loaders during loading

#### Filter Components
- **Left Sidebar** - All filter controls
- **Category Tabs** - Quick weapon type selection
- **Quick Sort Bar** - Popular sorting options
- **Search Input** - Real-time text search
- **Price Range** - Min/max price inputs
- **Dropdowns** - Wear, rarity, quality selection
- **Checkboxes** - StatTrak, special items

### Troubleshooting Guide

#### Common Issues

1. **CORS Errors**
   - Ensure `ALLOW_VERCEL_PREVIEWS=true` in backend
   - Check `ALLOWED_ORIGINS` includes your domain
   - Verify backend CORS configuration

2. **Category Filter Not Working**
   - Check browser console for API errors
   - Verify category parameter is sent in URL
   - Check backend logs for filter construction

3. **Sorting Issues**
   - Ensure sort parameter is valid
   - Check for null values in sort fields
   - Verify Prisma orderBy syntax

4. **Filters Not Updating**
   - Check React state updates
   - Verify useEffect dependencies
   - Check URL parameter updates

#### Debug Logging
The system includes extensive debug logging:
- `🔄` - State changes and filter updates
- `🚀` - API calls and responses
- `💥` - Errors and failures

#### Performance Considerations
- Database indexes on `rarity`, `wear`, `priceAvg`
- Price history indexes on `skinId`, `date`
- Pagination limits (max 60 items per request)
- Infinite scroll with intersection observer

### Development Notes

#### Backend Changes
- **Never modify** `backend/scripts/updateSkinPrices.js`
- **Never modify** `backend/src/cron/index.js`
- **Never modify** `backend/src/services/portfolioHistoryService.js`
- **Never modify** `prisma/schema.prisma`

#### Frontend Changes
- Use `Suspense` for `useSearchParams`
- Implement proper error boundaries
- Use TypeScript for all components
- Follow existing naming conventions

#### Testing
- Test all category combinations
- Verify filter persistence across page reloads
- Check infinite scroll performance
- Test edge cases (empty results, large datasets)

---

### Commit Messages (Conventional)
- `feat(frontend): add comprehensive skin filtering system`
- `fix(backend): improve category filtering accuracy`
- `docs(readme): add skin filtering system documentation`
- `perf(backend): add database indexes for filtering`

**Wichtig:** In Nicht-Main-Branches `RUN_SCHEDULER=false` setzen, damit Cron nicht doppelt läuft. Frontend `NEXT_PUBLIC_API_URL` bleibt über ENV konfiguriert.