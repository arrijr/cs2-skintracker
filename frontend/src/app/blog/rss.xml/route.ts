// frontend/src/app/blog/rss.xml/route.ts
import { getBlogPosts } from '@/lib/blog';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cs2-skintracker.com';
  
  // Fetch all published blog posts
  const { posts } = await getBlogPosts({ limit: 100, isPublished: true });

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>CS2 Skin Tracker Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Stay up-to-date with the latest CS2 skin market trends, investment guides, and game updates.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml"/>
    ${posts
      .map(
        (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.description || post.excerpt || ''}]]></description>
      <pubDate>${new Date(post.publishedAt || post.createdAt).toUTCString()}</pubDate>
      <category>${post.category}</category>
      ${post.tags.map((tag) => `<category>${tag}</category>`).join('\n      ')}
      ${post.featuredImage ? `<enclosure url="${post.featuredImage}" type="image/jpeg"/>` : ''}
      <content:encoded><![CDATA[${post.content}]]></content:encoded>
    </item>`
      )
      .join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
    },
  });
}

