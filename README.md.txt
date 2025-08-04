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