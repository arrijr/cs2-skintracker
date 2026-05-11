# Plan: Steam Inventory Import (B1 — Connect Steam Account on top of Clerk)

## Context

CS2 Skin Tracker has 15,071 items in the catalog and daily price refresh wired, but the new-user funnel is broken: signing up gets you an empty portfolio that you have to fill manually one skin at a time. Realistic CS2 traders own 20–200+ skins — manual entry kills onboarding.

This plan adds **Steam OpenID 2.0 account linking** plus a one-click **Inventory Import** from a user's public Steam inventory. Clerk stays as the primary auth provider; Steam becomes an optional connected account, so existing users and the email/social login paths are unaffected. Once connected, the inventory items are mapped against our existing `Skin` / `Case` / `MarketItem` catalog, and the user gets a populated portfolio (with cost basis they can edit later or auto-fill from our `PriceHistory`).

**Why B1, not full Steam-only auth:** Clerk handles email alerts, role/admin logic, and Stripe customer linking. Replacing it would be a 5–7 day refactor with no immediate user benefit. Adding Steam as a connectable account is ~3 days and unlocks the same import value.

---

## Approach

### Steam OpenID 2.0 (no passport, no sessions)

Steam still uses OpenID 2.0 (not OIDC). Implementation is stateless:

1. `GET /api/v1/steam/connect/redirect` → builds Steam OpenID URL with our `return_to` and 302s the browser to Steam.
2. User logs in on Steam → Steam redirects back to `GET /api/v1/steam/connect/callback` with signed params in query string.
3. Backend re-posts those params to Steam with `openid.mode=check_authentication` to validate the signature.
4. On success, extract `claimed_id` (`https://steamcommunity.com/openid/id/{steamId64}`), write `User.steamId + steamConnectedAt`, redirect to frontend `/account?steam=connected`.

This avoids `passport`, `express-session`, and `passport-steam` entirely. ~80 LOC server-side. The user must be Clerk-authenticated when initiating; we encode their JWT in the `return_to` URL as a state param (signed with our own HMAC to prevent tampering) so the stateless callback knows which Clerk user to attach the steamId to.

### Inventory fetch + match

Endpoint `POST /api/v1/steam/inventory/preview`:
- Reads `req.userId` (DB int) + their `steamId`. 404 if no steamId.
- Fetches `https://steamcommunity.com/inventory/{steamId}/730/2?l=english&count=5000`.
- 5-minute in-memory cache per user (matches existing `steamService.js` pattern).
- Parses `assets[]` + `descriptions[]`, joins by `classid+instanceid`.
- Matches each item's `market_hash_name` against `Skin.marketHashName`, then `Case.name`, then `MarketItem.marketHashName`.
- Returns `{ matched: [...], skipped: [{name, count, reason}], totals }` — **no DB writes**.

Endpoint `POST /api/v1/steam/inventory/import` (called after user confirms):
- Same fetch+match, but writes `Portfolio` rows for the `Skin` matches.
- Body: `{ costBasisMode: 'empty' | 'current_market' | 'custom', custom?: [{ skinId, buyPrice, buyDate }] }`.
- For duplicates: import is **additive** — always creates a fresh row with `importedFromSteamAt = now()`. Re-sync is the only place that merges (see below).
- Skipped items: `Case` items go to `CasePortfolio` (out of scope for v1 — log only). `MarketItem` items (stickers/agents/keys) ignored for v1 (Portfolio model only holds skins).

Endpoint `POST /api/v1/steam/inventory/resync`:
- Re-fetches inventory.
- For Portfolio rows with `importedFromSteamAt != null`: compare current Steam quantity vs. sum of (matching `Portfolio.amount`). Add new rows for added items; flag missing items as `removedAt = now()` (not deleted — preserves history).

### Cost basis UX

Decided in brainstorm: **A + B combined.** Modal after preview offers three options:
- Leave empty
- Auto-fill all rows with current `Skin.priceLatest` (today's market price)
- Bulk-edit table

Bulk-edit table has an **"Auto-fill from history"** button: for each row that has a `buyDate`, query `PriceHistory` for a snapshot ≤ that date and ≥ that date − 7 days. If found, suggest `priceUsd` as the buy price; if not, leave empty with a "no data" hint.

---

## File Map

### Schema

`backend/prisma/schema.prisma` (lines 12–34, User model):

Add two fields:
```prisma
steamId          String?   @unique
steamConnectedAt DateTime?
```

`backend/prisma/schema.prisma` (lines 172–181, Portfolio model):

Add one field:
```prisma
importedFromSteamAt DateTime?
removedFromSteamAt  DateTime?
```

Migration file: `backend/prisma/migrations/<ts>_steam_account_link/migration.sql` — hand-written SQL using `ALTER TABLE` (per project convention, the existing migration drift means `prisma migrate dev` is not used; see `2026-05-10000002_market_item_and_snapshot/migration.sql` as a template).

### Backend (new files)

| File | Purpose | LOC est. |
|------|---------|---------|
| `backend/src/services/steam/steamOpenId.js` | Build OpenID URL, verify callback signature via `check_authentication` POST. Stateless. | ~120 |
| `backend/src/services/steam/steamInventoryClient.js` | Fetch + parse `/inventory/{steamId}/730/2`. Retry/timeout pattern copied from `backend/src/services/pricing/steamMarketClient.js`. 5-min in-memory cache per `steamId`. | ~140 |
| `backend/src/services/steam/inventoryMatcher.js` | Match parsed items against `Skin`/`Case`/`MarketItem` by `marketHashName` (Skin/MarketItem) and `name` (Case). Returns `{ matched, skipped }`. | ~80 |
| `backend/src/services/steam/portfolioImporter.js` | Take matched skin items + cost basis options, write `Portfolio` rows with `importedFromSteamAt`. | ~100 |
| `backend/src/controllers/steamController.js` | 6 handlers: connect/redirect, connect/callback, disconnect, inventory/preview, inventory/import, inventory/resync. | ~180 |
| `backend/src/routes/steamRoutes.js` | Route wiring. Connect endpoints public (use signed-state JWT for user identification); inventory endpoints behind `verifyClerkJwt`. | ~30 |
| `backend/src/__tests__/steam.test.js` | Unit tests: matcher (Skin/Case/MarketItem branches), portfolioImporter, OpenID URL builder (deterministic params). | ~150 |

### Backend (modified)

- `backend/src/app.js` — mount `/api/v1/steam` route.
- `backend/.env.example` — add `STEAM_OPENID_RETURN_BASE_URL` (e.g. `http://localhost:5000` or `https://api.skintrackr.com`) + `STEAM_OPENID_STATE_SECRET` (HMAC key for the state param).

### Frontend (new files)

| File | Purpose |
|------|---------|
| `frontend/src/app/account/page.tsx` | Replace the current redirect with a real settings page that shows email/clerkId + a Steam Connect section. |
| `frontend/src/app/account/_components/SteamConnectSection.tsx` | "Connect Steam Account" button → opens `/api/v1/steam/connect/redirect`. Once connected, shows steamId + Last sync + Import/Resync/Disconnect buttons. |
| `frontend/src/app/account/_components/ImportPreviewModal.tsx` | Dialog with: matched count, skipped count, 3 cost-basis radio options, "Continue to bulk edit" if chosen. |
| `frontend/src/app/account/_components/BulkEditCostBasis.tsx` | Editable table (skin + qty + buyPrice + buyDate) with "Auto-fill from history" button. |
| `frontend/src/hooks/useSteamConnection.ts` | SWR-like hook for `/api/v1/users/me/steam-status` + actions (`preview`, `importNow`, `disconnect`). |

### Frontend (modified)

- `frontend/src/app/components/ProfileDropdown.tsx` (or `AppHeader.tsx` if it lives there) — add a "Steam: connected / not connected" indicator.

### Reuse / patterns

- **HTTP retry + timeout:** `backend/src/services/pricing/steamMarketClient.js` (3-attempt loop, AbortSignal.timeout, 429 with Retry-After). Copy structure exactly into `steamInventoryClient.js`.
- **In-memory TTL cache:** `backend/src/services/steamService.js` does this for prices. Reuse the same simple `Map<key, {value, expiresAt}>` pattern with 5-minute TTL keyed on `steamId`.
- **JWT verification for state param:** `backend/src/middleware/verifyClerkJwt.js` uses `jsonwebtoken` already installed — same lib for HMAC-signing the `return_to` state.
- **Hand-written Prisma migration:** template from `backend/prisma/migrations/20260510000002_market_item_and_snapshot/migration.sql`.
- **Frontend modal + form patterns:** existing `frontend/src/app/portfolio/UpgradeModal.tsx` for shadcn Dialog; existing form fields in `/portfolio/*Add*` flows for buyPrice/buyDate inputs.

---

## Notable design choices

- **No `passport` / `express-session`** — stateless OpenID using a signed JWT state param. Saves a dependency and matches the existing stateless API style.
- **Portfolio rows are additive on import** — never merge with manual entries. Re-sync only touches rows it created (`importedFromSteamAt IS NOT NULL`). Manual rows are sacred.
- **Cases imported from Steam go to `CasePortfolio`?** — Out of scope for v1 (logged, skipped, shown in "skipped" count). The `CasePortfolio` model already exists, so this can be a Phase 2 add.
- **MarketItem categories (stickers/agents/keys) are not imported as portfolio entries** — there's no portfolio table for them yet. Phase 2.
- **Trade-locked items** — imported, but `Portfolio.amount` and a derived "trade-locked until" date are shown in UI. Schema doesn't need a new field; the trade-locked-until date comes from Steam descriptions live each render. No state stored.

---

## YAGNI (out of scope for v1)

- Auto-sync cron (manual Resync button only for now)
- CasePortfolio import (cases skipped + logged)
- MarketItem (sticker/agent/key) import — no portfolio table for these
- Sticker detection on imported skins
- Disconnecting Steam revoking historical imports — disconnect only clears `steamId`; portfolio rows stay
- Multiple connected Steam accounts per user

---

## Verification

End-to-end test, after deploy:

1. **OpenID connect flow** — log in as Clerk user, click "Connect Steam" → redirects to Steam → log in → returns to `/account?steam=connected`. Confirm `User.steamId` is populated via Supabase MCP:
   ```sql
   SELECT id, email, "steamId", "steamConnectedAt" FROM "User" WHERE id = <userId>
   ```

2. **Inventory preview** — `POST /api/v1/steam/inventory/preview` returns `{ matched: [...], skipped: [...] }`. For my own Steam account this should return >0 matched (test against my real CS2 inventory).

3. **Import with empty cost basis** — call `/api/v1/steam/inventory/import` with `costBasisMode: "empty"`. Verify via SQL:
   ```sql
   SELECT COUNT(*), MAX("importedFromSteamAt") FROM "Portfolio" WHERE "userId" = <userId> AND "importedFromSteamAt" IS NOT NULL
   ```

4. **Import with auto-fill from current market** — same as above but `costBasisMode: "current_market"`. Verify `Portfolio.buyPrice = Skin.priceLatest` for each row.

5. **Resync** — manually drop one row from a test Portfolio (`DELETE FROM "Portfolio" WHERE id = X`), call resync → row recreated. Add one row manually that's not in Steam → resync leaves it alone (manual rows untouched).

6. **Frontend smoke** — `/account` page shows Connect button when not connected, Steam ID + Import + Resync + Disconnect buttons when connected. Import modal shows preview counts. Bulk edit table is editable. "Auto-fill from history" button populates rows where `PriceHistory` has data.

7. **Disconnect** — clears `steamId`. Portfolio rows remain (per design choice).

Unit tests via `npm run test` should cover matcher branches, importer cost-basis modes, and OpenID URL/state HMAC roundtrip.

---

## Estimated effort

- Schema + migration: 0.5 day
- Steam OpenID service + controller + route: 1 day
- Inventory client + matcher + importer: 1 day
- Frontend account page + modals + bulk edit: 1.5 days
- Tests + manual verification: 0.5 day

**Total: ~4.5 days solo** (vs spec's 3–5 day estimate — aligned).
