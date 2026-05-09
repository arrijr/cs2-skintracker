# Frontend Seiten & Routen

**Framework**: Next.js 15.4.3 App Router  
**Auth**: Clerk (`useUser`, `useAuth`)

## Seiten

| Route | Datei | Auth | Beschreibung |
|-------|-------|------|-------------|
| `/` | `app/page.tsx` | öffentlich | Landing: Hero + Features + Pricing + Footer |
| `/dashboard` | `app/dashboard/page.tsx` | Clerk | Portfolio-Übersicht, KPIs, Chart, Market Pulse, Movers, Upgrade-CTA |
| `/skins` | `app/skins/page.tsx` | öffentlich | Skin-Browser mit Filter-Sidebar, Pagination |
| `/skins/[skinId]` | `app/skins/[skinId]/page.tsx` | öffentlich | Skin-Detail: Preise, Preishistorie-Chart, Varianten, Case-Info |
| `/portfolio` | `app/portfolio/page.tsx` | Clerk | Portfolio-Management: Tabelle, Charts, KPIs, Premium-Features |
| `/watchlist` | `app/watchlist/page.tsx` | Clerk | Watchlist mit Preisalarmen |
| `/cases` | `app/cases/page.tsx` | öffentlich | Case-Browser |
| `/cases/[id]` | `app/cases/[id]/page.tsx` | öffentlich | Case-Detail |
| `/admin` | `app/admin/page.tsx` | Admin-Rolle | Admin-Panel: Metriken, Job-Steuerung, Logs |
| `/admin/blog` | `app/admin/blog/page.tsx` | Admin-Rolle | Blog-Verwaltung |
| `/blog` | `app/blog/page.tsx` | öffentlich | Blog-Liste |
| `/blog/[slug]` | `app/blog/[slug]/page.tsx` | öffentlich | Blog-Post (MDX) |
| `/account` | `app/account/page.tsx` | Clerk | Account-Einstellungen |
| `/profile` | `app/profile/page.tsx` | Clerk | Benutzerprofil |
| `/sign-in` | Clerk-Komponente | öffentlich | Anmelden |
| `/sign-up` | Clerk-Komponente | öffentlich | Registrieren |

## Route Guards

Auth-Schutz erfolgt über Clerk Middleware (`middleware.ts`):
- Nicht-eingeloggte User auf `/dashboard`, `/portfolio`, `/watchlist` → Redirect zu `/sign-in`
- Nicht-Admin auf `/admin` → 403 oder Redirect

## isPremium-Check

```ts
// useUserRole.ts — liest aus Clerk publicMetadata
const isPremium = user.publicMetadata?.isPremium === true

// Clerk Dashboard → Users → Metadata → publicMetadata: { isPremium: true }
// NICHT aus der Datenbank!
```

## Subscription-Check (Backend-Endpunkte)

```ts
// useSubscription.ts — liest aus Backend-API
const { tier } = useSubscription()
// tier = 'free' | 'creator' | 'pro' (basierend auf User.isPremium in DB)
```

## API-ENV-Variable

```
NEXT_PUBLIC_API_URL=http://localhost:5000      # Für Sprint 2 Hooks
NEXT_PUBLIC_API_ORIGIN=http://localhost:5000   # Für Sprint 1 API-Layer
```

> ⚠️ Beide Variablen existieren — historisch gewachsen. Hooks nutzen `NEXT_PUBLIC_API_URL`.
