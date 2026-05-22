// frontend/src/app/blog/page.tsx
import { Metadata } from 'next';
import { getBlogPosts } from '@/lib/blog';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogHero } from '@/components/blog/BlogHero';
import { BlogFilters } from '@/components/blog/BlogFilters';
import { Pagination } from '@/components/blog/Pagination';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://skintrackr.io';

export const metadata: Metadata = {
  title: 'CS2 Skin Tracker Blog - Market Analysis, Guides & Updates',
  description: 'Stay up-to-date with the latest CS2 skin market trends, investment guides, and game updates. Your go-to source for in-depth analysis.',
  keywords: ['CS2', 'Counter-Strike 2', 'Skins', 'Market Analysis', 'Investment Guides', 'Skin Trading', 'CS2 Market'],
  openGraph: {
    title: 'CS2 Skin Tracker Blog',
    description: 'Stay up-to-date with the latest CS2 skin market trends, investment guides, and game updates.',
    type: 'website',
    url: `${baseUrl}/blog`,
    siteName: 'CS2 Skin Tracker',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CS2 Skin Tracker Blog',
    description: 'Stay up-to-date with the latest CS2 skin market trends, investment guides, and game updates.',
    creator: '@CS2SkinTracker',
    site: '@CS2SkinTracker',
  },
  alternates: {
    canonical: `${baseUrl}/blog`,
    types: {
      'application/rss+xml': `${baseUrl}/blog/rss.xml`,
    },
  },
};

// Next.js 15: searchParams is async — must be awaited before access.
interface BlogPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    tag?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const sp = await searchParams;
  const page = parseInt(sp.page || '1');
  const category = sp.category;
  const tag = sp.tag;
  const search = sp.search;
  const sortBy = sp.sortBy || 'publishedAt';
  const sortOrder = sp.sortOrder || 'desc';

  try {
    const { posts, pagination } = await getBlogPosts({
      page,
      category,
      tag,
      search,
      sortBy,
      sortOrder,
    });

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <BlogHero />

          {/* Filters */}
          <BlogFilters 
            currentCategory={category}
            currentTag={tag}
            currentSearch={search}
          />

          {/* Posts Grid */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              {category ? `${category} Articles` : 'Latest Articles'}
            </h2>
            
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No blog posts found. Try adjusting your filters.
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Pagination 
              currentPage={pagination.page}
              totalPages={pagination.pages}
            />
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Error Loading Blog
          </h1>
          <p className="text-muted-foreground">
            Unable to load blog posts. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
