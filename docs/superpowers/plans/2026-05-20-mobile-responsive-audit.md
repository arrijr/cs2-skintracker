# Mobile Responsive Audit — 2026-05-20

Audit done by reading TSX + layout classes only (no browser). Focus on 320–430px viewports — overflow, touch targets, illegible text, modal safety.

## Routes Checked
- [🔴 -> ✅] `/` (landing) — Hero h1 was `text-5xl` on phones (very tight). Smart Alerts header badge row could clip on 320px.
- [🔴 -> ✅] `/dashboard` — PortfolioHero used inline `fontSize: 76px` for the value + a side-by-side range toggle in `flex justify-between`. Guaranteed overflow on 320–375px viewports.
- [🟡] `/portfolio` — KPI strip, tabs, summary cards are all responsive. `PortfolioDashboard.tsx` table is already wrapped in `overflow-x-auto`.
- [🔴 -> ✅] `/portfolio` (PortfolioTable rows) — Row stats (`flex gap-6` with 4 children) packed next to a 48px image + name. Row would overflow on narrow viewports.
- [✅] `/items` — Grid is `grid-cols-2 ...`, filter chips use `flex-wrap`, search+sort stacks via `flex-col md:flex-row`.
- [🔴 -> ✅] `/items/[id]` — Price tag was `text-[3.5rem]` (56px). Long `marketHashName` `<code>` had no `break-all`. Card padding `p-7` everywhere.
- [✅] `/alerts` — AlertCard already uses `flex-wrap` + truncation; CreateAlertModal sized `max-w-md` + scroll. (Fixed via Dialog change below.)
- [✅] `/profile` — TabsList is `overflow-x-auto`, triggers `min-h-[40px]`. Tabs cleanly responsive after the 2026-05-18 redesign.
- [✅] `/account` — Steam connect hero stacks cleanly; secondary dl grid is `grid-cols-1 sm:grid-cols-2`.
- [✅] `/onboarding` — All three steps already use `flex-col sm:flex-row` for CTAs, hide decorative icons under `hidden sm:flex`, and the wrapper has `max-w-2xl`. Mobile-first by design.
- [✅] `AppHeader` / `ProfileDropdown` — Hamburger Sheet kicks in below `md`, profile avatar is `h-10 w-10`, search collapses to a 36px icon button (acceptable for a secondary action).

## Critical Fixes Applied

- `frontend/src/components/ui/dialog.tsx:41` — DialogContent had `w-full max-w-lg` with zero horizontal safe area. Replaced with `w-[calc(100vw-2rem)] max-w-lg` so every modal (CreateAlert, UpgradeModal, BillingTab cancel dialog, ImportPreviewModal, etc.) keeps 1rem of breathing room on phones. One-line fix, covers every Dialog consumer.
- `frontend/src/app/dashboard/components/PortfolioHero.tsx:119–207` — Stacked the header row (`flex-col lg:flex-row`), shrank padding (`p-5 sm:p-8`), replaced the inline 76/44/36px font sizes with responsive classes (`text-[44px] sm:text-[60px] md:text-[76px]` and matching scale on the currency/decimal spans). Range toggle now `max-w-full overflow-x-auto self-start lg:self-auto` so the 6-button row scrolls horizontally instead of pushing the chart off-screen. Delta chip gained `flex-wrap` and `text-[15px] sm:text-[17px]`.
- `frontend/src/app/items/[id]/page.tsx:99,153,169,210–215` — Price `text-[3.5rem]` → `text-4xl sm:text-5xl md:text-[3.5rem]`, baseline row `flex-wrap`, both Cards `p-5 sm:p-7`, marketHashName paragraph + `<code>` got `break-words`/`break-all`.
- `frontend/src/app/portfolio/PortfolioTable.tsx:269,327` — Row header now `flex-wrap sm:flex-nowrap gap-3`; the stats block is `flex flex-wrap gap-3 sm:gap-6 w-full sm:w-auto justify-end` so Avg Buy / Market / perf% / chevron wrap below the title on phones instead of overflowing.
- `frontend/src/components/landing/HeroSection.tsx:24,35` — Hero h1 dropped one tier on mobile (`text-4xl sm:text-5xl md:text-7xl`), subhead matched (`text-lg sm:text-xl md:text-2xl`).
- `frontend/src/components/landing/FeaturesSection.tsx:67` — Smart Alerts header badge row → `flex-wrap` so the icon + 2 badges don't clip on 320px.

## Nice-to-Have (Deferred)

- `frontend/src/components/ui/button.tsx` — `size="sm"` resolves to `h-9` (36px). Category filter chips and a couple icon buttons fall just under the 40px touch-target guideline. Not a layout break, just ergonomic.
- `frontend/src/app/alerts/CreateAlertModal.tsx:308–334` — Current-price (3xl) + €40-wide target Input live in the same `flex items-end justify-between`. Fits 360px+ but tight on 320px. Modal scrolls vertically so not a blocker.
- `frontend/src/app/dashboard/components/PortfolioHero.tsx:212–215` — Y-axis labels are pinned at `w-[70px]`. Could shrink to `w-[56px]` on phones to give the chart more room.
- `frontend/src/app/components/AppHeader.tsx:90` — Search icon button is `w-9 h-9` (36px). Consider `w-10 h-10` to match the avatar.
- `frontend/src/app/dashboard/components/AllocationDonut.tsx` etc. — Not opened this pass; if they have legends in `flex` rows, worth a check during the next polish loop.
- `frontend/src/app/portfolio/PortfolioDashboard.tsx` headings are still hardcoded German (`Gesamtwert`, `Positionen`, …). Not a mobile bug but inconsistent with the rest of the redesigned UI.

## Verified Clean

- `/onboarding` (step 1 / 2 / 3) — already mobile-first
- `/profile` shell + TabsList
- `/account` Steam connect hero + profile section
- `/items` browse grid + filter + pagination
- `/alerts` list + AlertCard
- `AppHeader` mobile menu (Sheet) + ProfileDropdown trigger

## Notes

- Touched 6 files, all Tailwind-only edits. No new components, no new dependencies, no copy changes.
- Dialog fix is the highest-leverage change — every modal in the app inherits it.
- Did not run a build or dev server per the task brief.
