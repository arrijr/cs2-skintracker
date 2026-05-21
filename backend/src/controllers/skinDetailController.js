import defaultPrisma from '../prisma/prismaClient.js';
import { aggregateMultiSourcePrice } from '../services/pricing/multiSourceAggregator.js';

// Cache filter presets in-memory for 1h. These are catalog metadata (wears +
// rarities) that change rarely. Frontend `useSearch` / `useSkins` /
// `SkinsPageContent` hit this on every render — query-per-request was the
// 4th most expensive endpoint in our access log.
let presetsCache = null;
let presetsCacheExpiresAt = 0;
const PRESETS_CACHE_MS = 60 * 60 * 1000;

export async function getSkinPresets(req, res, { prismaClient = defaultPrisma } = {}) {
  if (presetsCache && presetsCacheExpiresAt > Date.now()) {
    return res.json(presetsCache);
  }
  try {
    const [wears, rarities] = await Promise.all([
      prismaClient.skin.findMany({
        select: { wear: true },
        distinct: ['wear'],
        where: { wear: { not: null } },
      }),
      prismaClient.skin.findMany({
        select: { rarity: true },
        distinct: ['rarity'],
        where: { rarity: { not: null } },
      }),
    ]);
    const payload = {
      wears: [...new Set(wears.map(w => w.wear).filter(Boolean))].sort(),
      rarities: [...new Set(rarities.map(r => r.rarity).filter(Boolean))].sort(),
    };
    presetsCache = payload;
    presetsCacheExpiresAt = Date.now() + PRESETS_CACHE_MS;
    return res.json(payload);
  } catch (e) {
    console.error('[getSkinPresets]', e);
    return res.status(500).json({ error: 'Failed to load presets' });
  }
}

// 5-minute in-memory cache keyed by slug. Daily Inngest refresh writes the
// canonical record; this fallback covers ad-hoc lookups for skins that
// missed the batch.
const priceCache = new Map(); // slug → { value, expiresAt }
const PRICE_CACHE_MS = 5 * 60 * 1000;

export async function getSkinPrices(req, res, { prismaClient = defaultPrisma } = {}) {
  const { slug } = req.params;
  if (!slug) return res.status(400).json({ error: 'slug required' });

  const cached = priceCache.get(slug);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json(cached.value);
  }

  const skin = await prismaClient.skin.findUnique({
    where: { slug },
    select: { marketHashName: true, priceLatest: true, slug: true },
  });
  if (!skin) return res.status(404).json({ error: 'not found' });

  try {
    const result = await aggregateMultiSourcePrice(skin);
    priceCache.set(slug, { value: result, expiresAt: Date.now() + PRICE_CACHE_MS });
    return res.json(result);
  } catch (err) {
    return res.status(502).json({ error: 'aggregator failed', detail: err.message });
  }
}

export async function getSkinById(req, res, { prismaClient = defaultPrisma } = {}) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
  const skin = await prismaClient.skin.findUnique({
    where: { id },
    select: { id: true, slug: true, weaponSlug: true },
  });
  if (!skin) return res.status(404).json({ error: 'not found' });
  return res.json(skin);
}

export async function getSkinBySlug(req, res, { prismaClient = defaultPrisma } = {}) {
  const { slug } = req.params;
  if (!slug) return res.status(400).json({ error: 'slug required' });
  const skin = await prismaClient.skin.findUnique({
    where: { slug },
  });
  if (!skin) return res.status(404).json({ error: 'not found' });
  return res.json(skin);
}

export async function listSkinsByWeapon(req, res, { prismaClient = defaultPrisma } = {}) {
  const weapon = String(req.query.weapon || '');
  const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);
  if (!weapon) return res.status(400).json({ error: 'weapon query required' });
  const skins = await prismaClient.skin.findMany({
    where: { weaponSlug: weapon, slug: { not: null } },
    take: limit,
    orderBy: { sold7d: 'desc' },
  });
  return res.json(skins);
}

export async function getCaseBySlug(req, res, { prismaClient = defaultPrisma } = {}) {
  const { slug } = req.params;
  if (!slug) return res.status(400).json({ error: 'slug required' });
  // Case has no `slug` column — match case name with hyphens converted to
  // spaces (case-insensitive). e.g. "operation-bravo-case" → "Operation Bravo Case".
  const c = await prismaClient.case.findFirst({
    where: {
      name: { equals: slug.replace(/-/g, ' '), mode: 'insensitive' },
    },
    include: {
      caseSkins: { include: { skin: true } },
    },
  });
  if (!c) return res.status(404).json({ error: 'not found' });
  // Normalize response shape: rename caseSkins → drops for the frontend.
  const { caseSkins, ...rest } = c;
  return res.json({ ...rest, slug, drops: caseSkins });
}

export async function getSkinVariants(req, res, { prismaClient = defaultPrisma } = {}) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
  const base = await prismaClient.skin.findUnique({
    where: { id },
    select: { id: true, variantOf: true },
  });
  if (!base) return res.json([]);
  const rootId = base.variantOf ?? base.id;
  const variants = await prismaClient.skin.findMany({
    where: {
      OR: [{ id: rootId }, { variantOf: rootId }],
    },
    select: { wear: true, slug: true, priceLatest: true },
    orderBy: { id: 'asc' },
  });
  return res.json(variants);
}

export async function listSkinSlugs(req, res, { prismaClient = defaultPrisma } = {}) {
  const page = Math.max(parseInt(req.query.page, 10) || 0, 0);
  const pageSize = Math.min(parseInt(req.query.pageSize, 10) || 5000, 10000);
  // NOTE: Skin model has `priceUpdatedAt` but no generic `updatedAt`.
  // The sitemap reader expects `updatedAt` per the TS interface in
  // `frontend/src/lib/skins-server.ts`, so we alias here.
  const skins = await prismaClient.skin.findMany({
    where: { slug: { not: null } },
    select: { slug: true, weaponSlug: true, priceUpdatedAt: true },
    skip: page * pageSize,
    take: pageSize,
    orderBy: { id: 'asc' },
  });
  return res.json(skins.map((s) => ({
    slug: s.slug,
    weaponSlug: s.weaponSlug,
    updatedAt: s.priceUpdatedAt ?? new Date().toISOString(),
  })));
}
