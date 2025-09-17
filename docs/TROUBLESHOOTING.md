Wrong Host for API Requests (404)
---------------------------------

Symptom
* Skin-Detail ruft `/api/v1/skins/:id/...` auf und bekommt 404 vom Vercel-Host.

Cause
* Frontend verwendet fälschlich die eigene Domain statt Render-Backend.

Fix
* Setze `NEXT_PUBLIC_API_URL` auf den **Render-Host**.
* Verwende überall den zentralen Helper `apiFetch(path)` (keine direkten `fetch`-Aufrufe mit Hard-URLs).
* Prüfe in der Console, dass Requests an `https://<render>.onrender.com` gehen.

Prevention
* Lint-/Code-Review-Regel: kein direkter `fetch` mit kompletter URL; nur `apiFetch`.
* Docs: Base-URL in `/docs/API.md` klar beschrieben.

TypeError: Cannot read properties of undefined (reading 'toFixed')
-----------------------------------------------------------------

Symptom
- Skin-Detailseite crasht im Rendern.

Cause
- Ein Preisfeld (z. B. priceLatest, currentPrice) ist undefined/null/string.

Fix
- Nie `.toFixed` direkt aufrufen; stattdessen `formatUSD()` / `safeToFixed()`.
- Alle Preisfelder mit `numberOrNull()` normalisieren, Beispielfunktionen in `src/lib/num.ts`.

Prevention
- Code-Review-Regel: keine direkten `.toFixed` im UI.
- Doku: API-Felder können `null`/`string` sein (siehe `/docs/API.md`).

Skin Detail Page Shows "No variants available" / "No related skins found"
-----------------------------------------------------------------------

Symptom
* Skin detail page displays empty state messages instead of actual data
* Variants, related skins, and case information not loading

Cause
* Database queries in variants/related endpoints too restrictive
* Only matching exact `itemName` instead of using flexible matching
* Missing `priceLatest` field in API responses

Fix
* Update variants query to use OR conditions: `itemName` OR similar name patterns
* Update related skins query with same flexible matching logic
* Add `priceLatest` field to all skin API responses
* Test queries with actual database data before deploying

Prevention
* Always test database queries with sample data before implementing
* Use flexible matching patterns (weaponType + name patterns) instead of exact matches
* Include all required fields in API responses
* Document API response format changes in `/docs/API.md`

Price Alerts Not Working
------------------------

Symptom
* Price alert button shows error when clicked
* "Failed to set price alert" toast message appears

Cause
* Frontend using wrong API endpoint (`/api/v1/alerts` instead of `/api/v1/watchlist`)
* Missing or incorrect request body format

Fix
* Update frontend to use `/api/v1/watchlist` endpoint
* Use correct request body: `{ skinId: number, priceAlert: number }`
* Ensure JWT token is properly included in Authorization header

Prevention
* Always check existing API endpoints before implementing new functionality
* Use consistent naming conventions for API routes
* Document all API endpoints and their usage in `/docs/API.md`