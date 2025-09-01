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