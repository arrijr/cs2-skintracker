// frontend/src/components/admin/AdminBlogFilters.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';

interface AdminBlogFiltersProps {
  currentCategory?: string;
  currentStatus?: string;
  currentSearch?: string;
}

const CATEGORIES = [
  'Market Analysis',
  'Investment Guides', 
  'Updates',
  'Case Statistics'
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Posts' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

export default function AdminBlogFilters({ 
  currentCategory, 
  currentStatus, 
  currentSearch 
}: AdminBlogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(currentSearch || '');
  const [category, setCategory] = useState(currentCategory || '');
  const [status, setStatus] = useState(currentStatus || '');

  const updateFilters = () => {
    const params = new URLSearchParams();
    
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (status) params.set('status', status);
    
    // Reset to page 1 when filtering
    params.set('page', '1');
    
    router.push(`/admin/blog?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setStatus('');
    router.push('/admin/blog');
  };

  const hasActiveFilters = search || category || status;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => e.key === 'Enter' && updateFilters()}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All posts" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={updateFilters}
            className="flex-1 bg-brand-celadon-600 hover:bg-brand-celadon-700"
          >
            Apply Filters
          </Button>
          
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="px-3"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Active filters:</p>
            <div className="flex flex-wrap gap-2">
              {search && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Search: "{search}"
                </span>
              )}
              {category && (
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                  Category: {category}
                </span>
              )}
              {status && (
                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                  Status: {STATUS_OPTIONS.find(s => s.value === status)?.label}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
