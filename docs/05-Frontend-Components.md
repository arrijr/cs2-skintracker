# Frontend Komponenten & Hooks

## Hooks

| Hook | Datei | Gibt zurück | Notizen |
|------|-------|-------------|---------|
| `usePortfolioData` | `hooks/usePortfolioData.ts` | `{portfolio, history, kpis, isLoading, error, mutate}` | SWR für /portfolio, /portfolio/history, /portfolio/kpis |
| `useAuthenticatedPortfolio` | `hooks/useAuthenticatedPortfolio.ts` | `{portfolio, kpis, history, …}` | SWR mit Clerk JWT ("backend" Template) |
| `useAuthenticatedWatchlist` | `hooks/useAuthenticatedWatchlist.ts` | `{watchlist, isLoading, error, mutate}` | SWR Watchlist |
| `useAuthenticatedApi` | `hooks/useAuthenticatedApi.ts` | `{authenticatedFetcher, apiUrl}` | Clerk-Token-Fetcher-Factory |
| `useSubscription` | `hooks/useSubscription.ts` | `{subscription, tier, isActive, canAccessResearch, checkout, cancel}` | `checkout(tier)` → Stripe.js redirectToCheckout |
| `useUserRole` | `hooks/useUserRole.ts` | `{role, isAdmin, isUser, isPremium, loading}` | Liest aus Clerk User-Objekt (publicMetadata) |
| `useSkins` | `hooks/useSkins.ts` | `{skins, pagination, isLoading, error, updateFilters, goToPage}` | SWR mit 10s Timeout, 3 Retries |
| `useSkinsPresets` | `hooks/useSkins.ts` | `{wears, rarities, categories, filters}` | Filter-Dropdown-Werte |
| `useSkinsSearch` | `hooks/useSkins.ts` | `{results, isLoading, hasResults}` | Autocomplete ab 2 Zeichen |
| `use-toast` | `hooks/use-toast.ts` | Toast-State | |

**State Management**: Kein globaler Store (kein Redux/Zustand). Lokaler React State + SWR Cache. `ErrorContext` für globales Error-Banner.

---

## Wichtige Komponenten

### Layout & Global
- `app/layout.tsx` — Root Layout: ClerkProvider, ErrorProvider, AppHeader, Toaster
- `app/components/AppHeader.tsx` — Navigationsleiste
- `components/ErrorBanner.tsx` — Globales Error-Display
- `components/ErrorBoundary.tsx` — React Error Boundary
- `components/RequireRole.tsx` — Rollen-Gate Wrapper

### Landing (`components/landing/`)
- `HeroSection.tsx` — Hero mit CTA
- `FeaturesSection.tsx` — Feature-Highlights
- `PricingSection.tsx` — Tier-Preiskarten (free/creator/pro)
- `Footer.tsx` — Footer

### Charts (`components/charts/`)
- `SkinPriceHistoryChart.tsx` — Chart.js Preis-Linienchart
- `PortfolioValueChart.tsx` — Portfolio-Wert über Zeit
- `CasePriceChart.tsx` — Case-Preishistorie
- `CaseSupplyChart.tsx` — Case-Supply über Zeit

### Portfolio (`app/portfolio/`)
- `PortfolioDashboard.tsx` — Haupt-KPI-Dashboard (Sprint 2)
- `UpgradeModal.tsx` — Stripe Checkout UI (Sprint 2)
- `ResearchPanel.tsx` — Pro-Tier Research (Sprint 2)
- `PortfolioTable.tsx` — Portfolio-Tabelle
- `WatchlistTable.tsx` — Watchlist im Portfolio
- `PremiumFeatureFlag.tsx` — Feature-Gating Wrapper

### Dashboard (`app/dashboard/components/`)
- `MarketPulse.tsx` — Echtzeit-Marktindikatoren (Premium-gated)
- `MarketEvents.tsx` — CS2-Marktereignisse
- `EnhancedMovers.tsx` — Top Gewinner/Verlierer
- `PortfolioPieChart.tsx` — Portfolio-Aufschlüsselung

### Skins (`app/skins/_components/`)
- `SkinsPageContent.tsx` — Hauptinhalt mit URL-Sync-Filtern
- `EnhancedFilterSidebar.tsx` — Filter-Panel
- `EnhancedSkinCard.tsx` / `ModernSkinCard.tsx` — Karten-Varianten
- `EnhancedSkinGrid.tsx` — Grid-Layout

### UI Primitives (`components/ui/`)
30+ shadcn/Radix Komponenten: alert, badge, button, card, dialog, dropdown-menu, input, select, skeleton, table, tabs, toast, tooltip, etc.

---

## API Layer (`src/lib/`)

| Datei | Beschreibung |
|-------|-------------|
| `api.ts` | `apiOrigin()`, `apiUrl()`, `fetchJson()`, `swrFetcher`, Named API-Funktionen |
| `num.ts` | `formatUSD()`, `safeToFixed()` |
| `strings.ts` | `safeLower()` etc. |
| `blog.ts` | Blog-API-Funktionen |
| `storage.ts` | localStorage Helpers |
| `utils.ts` | `cn()` (clsx + tailwind-merge) |

---

## Rollen-System

```ts
// utils/roles.ts
const isPremium = user.publicMetadata?.isPremium === true
                || user.unsafeMetadata?.isPremium === true

const isAdmin = user.publicMetadata?.role === 'admin'
              || ADMIN_EMAILS.includes(email)  // Fallback-Whitelist
```

**Admin-Whitelist** (lokal): `admin@example.com`, `test@test.de`, `arthur@example.com`
