// frontend/src/lib/mdx.ts
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote } from 'next-mdx-remote';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

export async function serializeMdx(content: string) {
  return await serialize(content, {
    mdxOptions: {
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: 'wrap' }],
        rehypeHighlight,
      ],
      remarkPlugins: [remarkGfm],
    },
  });
}

export { MDXRemote };

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  description?: string;
  content: string;
  excerpt?: string;
  category: string;
  tags: string[];
  authorId: number;
  author: {
    id: number;
    displayName?: string;
    email: string;
  };
  featuredImage?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
}

export interface BlogPostListResponse {
  posts: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
