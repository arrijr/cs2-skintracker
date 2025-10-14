// frontend/src/components/admin/AdminBlogList.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2, Eye, EyeOff, Calendar, User, BarChart3 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { BlogPost } from '@/lib/blog';
import axios from 'axios';

interface AdminBlogListProps {
  searchParams: {
    page?: string;
    category?: string;
    status?: string;
    search?: string;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function AdminBlogList({ searchParams }: AdminBlogListProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, [searchParams]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchParams.page) params.append('page', searchParams.page);
      if (searchParams.category) params.append('category', searchParams.category);
      if (searchParams.search) params.append('search', searchParams.search);
      
      // For admin, we want to see both published and unpublished posts
      if (searchParams.status === 'published') {
        params.append('published', 'true');
      } else if (searchParams.status === 'draft') {
        params.append('published', 'false');
      }

      const response = await axios.get(`${API_BASE_URL}/blog/admin`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('clerk-session-token')}`,
        },
      });

      setPosts(response.data.data);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.page);
    } catch (err) {
      console.error('Error fetching admin blog posts:', err);
      setError('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/blog/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('clerk-session-token')}`,
        },
      });
      
      // Refresh the list
      fetchPosts();
    } catch (err) {
      console.error('Error deleting blog post:', err);
      alert('Failed to delete blog post');
    }
  };

  const handleTogglePublish = async (id: number, isPublished: boolean) => {
    try {
      await axios.patch(`${API_BASE_URL}/blog/${id}/publish`, 
        { isPublished: !isPublished },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('clerk-session-token')}`,
          },
        }
      );
      
      // Refresh the list
      fetchPosts();
    } catch (err) {
      console.error('Error toggling publish status:', err);
      alert('Failed to update publish status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No blog posts found.</p>
          <Link href="/admin/blog/editor">
            <Button className="mt-4 bg-brand-celadon-600 hover:bg-brand-celadon-700">
              Create your first post
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(post.createdAt)}
                  </div>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {post.author?.displayName || post.author?.email}
                  </div>
                  <div className="flex items-center">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    {post.viewCount} views
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={post.isPublished ? 'default' : 'secondary'}>
                  {post.isPublished ? 'Published' : 'Draft'}
                </Badge>
                <Badge variant="outline">{post.category}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {post.description || post.excerpt}
            </p>
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Link href={`/blog/${post.slug}`} target="_blank">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                </Link>
                <Link href={`/admin/blog/editor/${post.id}`}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTogglePublish(post.id, post.isPublished)}
                >
                  {post.isPublished ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-1" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-1" />
                      Publish
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(post.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-8">
          {[...Array(totalPages)].map((_, i) => (
            <Button
              key={i}
              variant={currentPage === i + 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
