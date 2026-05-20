import defaultPrisma from '../prisma/prismaClient.js';

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

export async function listSkinSlugs(req, res, { prismaClient = defaultPrisma } = {}) {
  const page = Math.max(parseInt(req.query.page, 10) || 0, 0);
  const pageSize = Math.min(parseInt(req.query.pageSize, 10) || 5000, 10000);
  const skins = await prismaClient.skin.findMany({
    where: { slug: { not: null } },
    select: { slug: true, weaponSlug: true, updatedAt: true },
    skip: page * pageSize,
    take: pageSize,
    orderBy: { id: 'asc' },
  });
  return res.json(skins);
}
