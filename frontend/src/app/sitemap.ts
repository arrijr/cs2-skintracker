// frontend/src/app/sitemap.ts
//
// Sitemap with paginated sub-maps for the 16k+ skin catalog.
// Next 15 routes each /sitemap/<n>.xml automatically when `generateSitemaps`
// is exported alongside `sitemap`.
//
// Static + blog routes live in the root sitemap (page 0).
// Skin routes split across pages 1..N (5000 per page).

import { MetadataRoute } from 'next';
import { getBlogPosts } from '@/lib/blog';
import { listSkinSlugsPaged } from '@/lib/skins-server';

const SITEMAP_PAGE_SIZE = 5000;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skintrackr.io';

export async function generateSitemaps(): Promise<{ id: number }[]> {
  // Conservative 4 skin pages (covers up to 20k skins).
  // Catalog at backfill time: 16,829 skins → 4 chunks of 5000.
  const totalSkinPages = 4;
  // id: 0 = static + blog; id: 1..N = skin chunks
  return Array.from({ length: totalSkinPages + 1 }, (_, i) => ({ id: i }));
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  // Page 0 = static + blog
  if (id === 0) {
    const { posts } = await getBlogPosts({ limit: 1000, isPublished: true });
    const blogEntries = posts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [
      { url: BASE_URL,                       lastModified: new Date(), changeFrequency: 'daily',  priority: 1.0 },
      { url: `${BASE_URL}/skins`,            lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
      { url: `${BASE_URL}/cases`,            lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
      { url: `${BASE_URL}/items`,            lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
      { url: `${BASE_URL}/pricing`,          lastModified: new Date(), changeFrequency: 'monthly',priority: 0.7 },
      { url: `${BASE_URL}/legal/privacy`,    lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
      { url: `${BASE_URL}/legal/terms`,      lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
      { url: `${BASE_URL}/legal/refund`,     lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
      { url: `${BASE_URL}/blog`,             lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
      ...blogEntries,
    ];
  }

  // Pages 1..N — skin slugs in pages of SITEMAP_PAGE_SIZE
  const slugs = await listSkinSlugsPaged(id - 1, SITEMAP_PAGE_SIZE);
  return slugs.map((s) => ({
    url: `${BASE_URL}/skins/${s.weaponSlug}/${s.slug}`,
    lastModified: new Date(s.updatedAt),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));
}
