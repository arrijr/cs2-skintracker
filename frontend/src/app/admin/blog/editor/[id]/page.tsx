// frontend/src/app/admin/blog/editor/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogEditor from '@/components/admin/BlogEditor';
import { getBlogPostById } from '@/lib/blog';

// Next.js 15: params is async — must be awaited before access.
interface EditBlogPostPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditBlogPostPageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const post = await getBlogPostById(parseInt(id));
    return {
      title: `Edit: ${post.title} - Admin`,
      description: `Edit blog post: ${post.title}`,
    };
  } catch {
    return {
      title: 'Edit Blog Post - Admin',
      description: 'Edit blog post',
    };
  }
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  try {
    const { id } = await params;
    const post = await getBlogPostById(parseInt(id));
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-celadon-400">Edit Blog Post</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Editing: {post.title}
          </p>
        </div>
        
        <BlogEditor initialPost={post} />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
