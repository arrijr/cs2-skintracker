// frontend/src/components/blog/RelatedArticles.tsx
import { getBlogPosts } from '@/lib/blog';
import { BlogCard } from './BlogCard';
import { BlogPost } from '@/lib/mdx';

interface RelatedArticlesProps {
  currentPost: BlogPost;
}

export async function RelatedArticles({ currentPost }: RelatedArticlesProps) {
  try {
    // Get related articles based on category and tags
    const { posts } = await getBlogPosts({
      category: currentPost.category,
      limit: 3,
    });

    // Filter out current post and get up to 3 related posts
    const relatedPosts = posts
      .filter(post => post.id !== currentPost.id)
      .slice(0, 3);

    if (relatedPosts.length === 0) {
      return null;
    }

    return (
      <div>
        <h3 className="text-2xl font-semibold text-foreground mb-6">
          Related Articles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatedPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching related articles:', error);
    return null;
  }
}
