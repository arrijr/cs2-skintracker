// frontend/src/app/admin/blog/editor/page.tsx
import { Metadata } from 'next';
import BlogEditor from '@/components/admin/BlogEditor';

export const metadata: Metadata = {
  title: 'Create Blog Post - Admin',
  description: 'Create a new blog post',
};

export default function CreateBlogPostPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-celadon-400">Create New Blog Post</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Write and publish your blog post
        </p>
      </div>
      
      <BlogEditor />
    </div>
  );
}
