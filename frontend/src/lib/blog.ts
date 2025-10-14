// frontend/src/lib/blog.ts
import { BlogPost, BlogPostListResponse } from './mdx';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function getBlogPosts(params?: {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<BlogPostListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.category) searchParams.set('category', params.category);
  if (params?.tag) searchParams.set('tag', params.tag);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const response = await fetch(`${API_BASE_URL}/api/v1/blog?${searchParams}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch blog posts');
  }
  
  return response.json();
}

export async function getBlogPost(slug: string): Promise<BlogPost> {
  const response = await fetch(`${API_BASE_URL}/api/v1/blog/${slug}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Blog post not found');
    }
    throw new Error('Failed to fetch blog post');
  }
  
  return response.json();
}

export async function getBlogPostById(id: number, token?: string): Promise<BlogPost> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/blog/admin/${id}`, {
    headers,
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Blog post not found');
    }
    throw new Error('Failed to fetch blog post');
  }
  
  return response.json();
}

export async function incrementViewCount(postId: number): Promise<void> {
  await fetch(`${API_BASE_URL}/api/v1/blog/${postId}/view`, {
    method: 'POST',
  });
}

// Admin functions (require authentication)
export async function createBlogPost(data: {
  title: string;
  description?: string;
  content: string;
  excerpt?: string;
  category: string;
  tags?: string[];
  featuredImage?: string;
  isPublished?: boolean;
}, token: string): Promise<BlogPost> {
  const response = await fetch(`${API_BASE_URL}/api/v1/blog`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create blog post');
  }
  
  return response.json();
}

export async function updateBlogPost(id: number, data: {
  title?: string;
  description?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  featuredImage?: string;
  isPublished?: boolean;
}, token: string): Promise<BlogPost> {
  const response = await fetch(`${API_BASE_URL}/api/v1/blog/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update blog post');
  }
  
  return response.json();
}

export async function deleteBlogPost(id: number, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/blog/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete blog post');
  }
}

export async function publishBlogPost(id: number, isPublished: boolean, token: string): Promise<BlogPost> {
  const response = await fetch(`${API_BASE_URL}/api/v1/blog/${id}/publish`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ isPublished }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update blog post publish status');
  }
  
  return response.json();
}

export async function getAllBlogPosts(params?: {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  search?: string;
  isPublished?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}, token?: string): Promise<BlogPostListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.category) searchParams.set('category', params.category);
  if (params?.tag) searchParams.set('tag', params.tag);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.isPublished !== undefined) searchParams.set('isPublished', params.isPublished.toString());
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/blog/admin/all?${searchParams}`, {
    headers,
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch admin blog posts');
  }
  
  return response.json();
}
