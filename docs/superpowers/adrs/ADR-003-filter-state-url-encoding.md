# ADR-003: Filter state URL encoding

**Status:** Accepted
**Date:** 2026-05-11
**Deciders:** Arthur (sole engineer)

## Context

The `/skins` browse page has 12 filter dimensions: search (`q`), price range (`min`/`max`), wear, rarity, quality, stattrak, special, sort, category, weaponType, collection, finish. Three need multi-select semantics: **wear, rarity, weaponType**.

Decisions needed:
1. How to encode multi-select values in the URL?
2. How does the backend parse them?

URLs are user-facing — they get bookmarked, shared in Discord, and emailed. The encoding choice locks in the public contract.

## Decision

**Comma-separated values in a single query param.** Example:

```
/skins?wear=fn,mw,ft&rarity=covert,classified&min=100&max=500
```

Backend parses with `.split(',')` and feeds into Prisma `{ in: [...] }`.

Frontend (`EnhancedFilterSidebar`) round-trips via `parseMulti()` / `serializeMulti()` helpers that operate on `Set<string>`.

## Options Considered

### Option A: Comma-separated (CHOSEN)

```
?wear=fn,mw,ft
```

| Dimension | Assessment |
|-----------|------------|
| URL length | Short — best for sharing |
| Browser handling | Native — `URLSearchParams.get('wear')` returns "fn,mw,ft" |
| Backend parsing | One-line `.split(',').filter(Boolean)` |
| Edge case: commas in values | Not applicable here (wear / rarity / weapons are slug-like) |
| Aesthetic | Reads naturally |

### Option B: Repeated params

```
?wear=fn&wear=mw&wear=ft
```

| Dimension | Assessment |
|-----------|------------|
| URL length | Longer (~2× for 3 values) |
| Browser handling | `URLSearchParams.getAll('wear')` returns array |
| Backend parsing | Express `req.query.wear` already an array |
| Edge case: commas | Safe even if value contains comma |
| Aesthetic | Verbose but more REST-y |

### Option C: JSON-encoded array

```
?wear=%5B%22fn%22%2C%22mw%22%5D
```

| Dimension | Assessment |
|-----------|------------|
| URL length | Longest, %-encoded madness |
| Browser handling | Manual parse |
| Aesthetic | Hostile to humans reading URLs |

Rejected immediately.

### Option D: Single param with pipe separator (`fn|mw|ft`)

Equivalent to A, slightly less standard. No real advantage.

## Trade-off Analysis

Option B (repeated params) is the "standard" REST convention, used by GitHub API and OpenAPI specs. Option A (comma-separated) is what Spotify, Stripe, and most consumer SaaS use because it's shorter and more readable.

For our case:
- **Skin values are never comma-containing** — collection names like "The 2018 Inferno Collection" are stored as ids, not free text
- **URL length matters** because Discord previews and bookmarks chop long URLs
- **Frontend already implemented** (Phase 2/3 of `/skins` rebuild) with comma-separated

Option B would require:
- Reworking `EnhancedFilterSidebar.parseMulti()` / `serializeMulti()` (~20 lines)
- Updating URL writers in `SkinsPageContent.tsx`
- Updating backend route to handle both array and string
- Migrating any existing user bookmarks

Cost > benefit. Stick with A.

## Consequences

- **Easier:** URL is short, backend parsing is trivial, all 12 filter dimensions share the same encoding pattern (single-valued ones just have no comma).
- **Harder:** if we ever add a filter dimension whose values can contain commas (e.g. free-text "skin description contains"), we'd need to URL-encode the comma or switch to Option B for that field only. Acceptable.
- **Revisit when:** we want a public REST API for filters (some external dev tools expect Option B). At that point, support both — accept comma-separated OR repeated for backwards compat.

## Action Items

1. [x] Implement comma-separated in `EnhancedFilterSidebar` (Phase 3 of /skins rebuild)
2. [x] Backend already supports it via `.split(',')` at `routes/skinRoutes.js`
3. [ ] Document the convention in API docs once we publish a public spec
4. [ ] Add a unit test for comma round-trip (`parseMulti(serializeMulti(set)) === set`)
