# ADR-002: Image hosting and proxy strategy

**Status:** Accepted (Phase 1) · Phase 2 Deferred
**Date:** 2026-05-11
**Deciders:** Arthur (sole engineer)

## Context

CS2 skin images are served by Steam's CDN at four host variants (`community.akamai.steamstatic.com`, `community.cloudflare.steamstatic.com`, `cdn.cloudflare.steamstatic.com`, `economy.cloudflare.steamstatic.com`). Two recurring problems:

1. **TLS handshake failures on dev networks.** Corp / VPN / MITM-proxy networks (Arthur's home network among them) reject Steam CDN certs. Browser-side renders empty `<img>` with alt-text bleed.
2. **Bogus URLs in seed data.** Pre-bymykel seeding inserted ~56 placeholder URLs (`/economy/image/class/730/{slug}`) that Steam doesn't serve. Cleaned up post-hoc (`fix-bogus-image-urls.js`), but conceptually a single point of failure: we don't control the source.

Currently in production: 1,940+ skins point to live `community.akamai.steamstatic.com` URLs that work fine on most networks but rely on Steam being up + reachable.

Long-term concerns:
- **Cold-start latency:** Steam CDN edge caching is okay but inconsistent — some assets 800ms+ from Europe.
- **Resilience:** if Steam rate-limits per IP, our infrastructure could be throttled.
- **No control over image dimensions / format.** Steam serves up to ~512×384 PNG; we usually display at 200–300px. Wasted bandwidth + no `webp/avif` support.
- **Steam ToS:** hot-linking is technically allowed for CSGO catalog but discouraged at scale.

## Decision

**Two-phase approach: keep the dev-time proxy now (Phase 1, done). Defer the mirror decision until we hit one of three explicit triggers (Phase 2).**

### Phase 1 — IMPLEMENTED (current state)

- **`/api/steam-image?url=...`** Next.js route handler (`frontend/src/app/api/steam-image/route.ts`):
  - Whitelist of 7 Steam CDN hostnames
  - Dev-only `NODE_TLS_REJECT_UNAUTHORIZED=0` for MITM networks
  - Re-mimics browser `User-Agent` (Steam blocks default Node fetch UA)
  - 10s upstream timeout
  - Cache: `max-age=3600, s-maxage=86400, stale-while-revalidate=604800`
- **`steamImageSrc(url)`** helper (`frontend/src/lib/image-proxy.ts`):
  - Detects bogus `/class/730/` URLs → returns null → frontend shows weapon-code placeholder
  - Wraps real Steam URLs through proxy
  - Pass-through for non-Steam URLs
- **Card-level `onError` handler** falls back to placeholder if image still fails

### Phase 2 — DEFERRED (only triggered if needed)

Self-host images on Cloudflare R2 or Vercel Blob. Background job mirrors Steam URLs once, stores in our bucket, updates DB.

## Options Considered

### Option A: Status quo — hot-link Steam CDN (rejected for dev, accepted for production)

| Dimension | Assessment |
|-----------|------------|
| Cost | $0 |
| Complexity | None |
| Reliability | Medium (TLS issues on some networks) |
| Bandwidth control | None |
| Future-proof | Brittle — depends on Steam policy |

### Option B: Server-side proxy through our infra (CHOSEN for Phase 1)

| Dimension | Assessment |
|-----------|------------|
| Cost | Vercel edge bandwidth — negligible at our scale |
| Complexity | Low (one route handler) |
| Reliability | High (we control TLS + retries + cache) |
| Bandwidth control | Some — set Cache-Control, hide bad URLs |
| Future-proof | Yes — swap implementation without changing card components |

### Option C: Full mirror to R2 / Blob (DEFERRED to Phase 2)

| Dimension | Assessment |
|-----------|------------|
| Cost | ~500 MB initial storage + minimal bandwidth = <$1/month on R2 |
| Complexity | Medium — sync job, schema column for `mirroredUrl`, fallback logic |
| Reliability | Highest — independent of Steam |
| Bandwidth control | Full — resize, webp conversion, srcset |
| Future-proof | Yes |

## Trade-off Analysis

Phase 1 covers ~95% of the value at 5% of the cost. Adding a mirror right now is YAGNI: 1,996 skins × hot-link CDN works for the vast majority of users, and adding a mirror means another moving piece (sync job, drift handling).

Triggers that flip us to Phase 2:
1. **Steam-side blocking:** observed rate-limits or 403s from our Vercel IPs in production
2. **User growth >1k MAU** where dev-network workarounds aren't enough and Steam-edge latency becomes noticeable
3. **A pricing tier requires fast image delivery** (e.g. mobile app needs <500ms LCP)

## Consequences

- **Easier:** Steam CDN issues on corp networks just work now (proxy handles TLS bypass). Bogus URLs in DB don't show broken images. New image domains are an env-config change.
- **Harder:** Vercel function execution counts include image-proxy hits — small but worth monitoring on free tier.
- **Revisit when:** any Phase 2 trigger fires.

## Action Items

1. [x] Phase 1 implementation (route handler + helper)
2. [x] Card components updated to use `steamImageSrc()`
3. [ ] Add basic monitoring: Vercel logs filter for `/api/steam-image` 502 rate. If >1% per week → investigate.
4. [ ] Document mirror plan if Phase 2 triggers fire (don't implement until then).
