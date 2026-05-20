// frontend/src/app/blog/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogPost, incrementViewCount } from '@/lib/blog';
import { serializeMdx } from '@/lib/mdx';
import { MDXRemote } from 'next-mdx-remote';
import { BlogHero } from '@/components/blog/BlogHero';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { RelatedArticles } from '@/components/blog/RelatedArticles';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { BlogPostSchema } from '@/components/blog/BlogPostSchema';
import MDXComponents from '@/components/blog/MDXComponents';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const post = await getBlogPost(params.slug);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://skintrackr.io';
    
    return {
      title: `${post.title} | CS2 Skin Tracker Blog`,
      description: post.description || post.excerpt || post.title,
      keywords: [...post.tags, post.category, 'CS2', 'Counter-Strike 2', 'Skins', 'Market Analysis'],
      authors: [{ name: post.author?.displayName || post.author?.email || 'CS2 Skin Tracker' }],
      creator: post.author?.displayName || post.author?.email || 'CS2 Skin Tracker',
      publisher: 'CS2 Skin Tracker',
      openGraph: {
        title: post.title,
        description: post.description || post.excerpt || '',
        type: 'article',
        publishedTime: post.publishedAt || post.createdAt,
        modifiedTime: post.updatedAt,
        authors: [post.author?.displayName || post.author?.email || 'CS2 Skin Tracker'],
        tags: post.tags,
        url: `${baseUrl}/blog/${post.slug}`,
        siteName: 'CS2 Skin Tracker',
        locale: 'en_US',
        images: post.featuredImage ? [{
          url: post.featuredImage,
          width: 1200,
          height: 630,
          alt: post.title,
        }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.description || post.excerpt || '',
        creator: '@CS2SkinTracker',
        site: '@CS2SkinTracker',
        images: post.featuredImage ? [{
          url: post.featuredImage,
          alt: post.title,
        }] : [],
      },
      alternates: {
        canonical: `${baseUrl}/blog/${post.slug}`,
      },
    };
  } catch (error) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    const post = await getBlogPost(params.slug);
    
    // Increment view count (fire and forget)
    incrementViewCount(post.id).catch(console.error);
    
    // Serialize MDX content
    const mdxSource = await serializeMdx(post.content);

    return (
      <>
        {/* JSON-LD Schema */}
        <BlogPostSchema post={post} />
        
        <div className="min-h-screen bg-background">
          {/* Hero Section */}
          <BlogHero post={post} />
          
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-3">
                  <article className="prose prose-lg prose-slate dark:prose-invert max-w-none">
                    <MDXRemote {...mdxSource} components={MDXComponents} />
                  </article>
                  
                  {/* Share Buttons */}
                  <div className="mt-12 pt-8 border-t border-border">
                    <ShareButtons post={post} />
                  </div>
                  
                  {/* Related Articles */}
                  <div className="mt-12">
                    <RelatedArticles currentPost={post} />
                  </div>
                </div>
                
                {/* Sidebar */}
                <div className="lg:col-span-1">
                  <div className="sticky top-8">
                    <TableOfContents />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error('Error fetching blog post:', error);
    notFound();
  }
}
