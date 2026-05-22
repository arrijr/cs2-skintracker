// frontend/src/app/admin/blog/page.tsx
import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import AdminBlogList from '@/components/admin/AdminBlogList';
import AdminBlogFilters from '@/components/admin/AdminBlogFilters';

export const metadata: Metadata = {
  title: 'Blog Admin - CS2 Skin Tracker',
  description: 'Manage blog posts and content',
};

// Next.js 15: searchParams is async — must be awaited before access.
interface AdminBlogPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function AdminBlogPage({ searchParams }: AdminBlogPageProps) {
  const sp = await searchParams;
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-celadon-400">Blog Admin</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your blog posts and content
          </p>
        </div>
        <Link href="/admin/blog/editor">
          <Button className="bg-brand-celadon-600 hover:bg-brand-celadon-700">
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <AdminBlogFilters
            currentCategory={sp.category}
            currentStatus={sp.status}
            currentSearch={sp.search}
          />
        </div>

        <div className="lg:col-span-3">
          <Suspense fallback={<div>Loading blog posts...</div>}>
            <AdminBlogList searchParams={sp} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
