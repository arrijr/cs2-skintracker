// frontend/src/components/blog/BlogFilters.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';

const CATEGORIES = [
  'Market Analysis',
  'Investment Guides',
  'Updates',
  'Case Statistics'
];

interface BlogFiltersProps {
  currentCategory?: string;
  currentSearch?: string;
  currentTag?: string;
}

export function BlogFilters({ currentCategory, currentSearch, currentTag }: BlogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    // Reset to page 1 when filtering
    params.set('page', '1');
    
    router.push(`/blog?${params.toString()}`);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Filter className="w-5 h-5 mr-2" />
          Filter Articles
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select 
              value={currentCategory || ''} 
              onValueChange={(value) => updateFilters('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Sort By</label>
            <Select 
              defaultValue="latest" 
              onValueChange={(value) => updateFilters('sortBy', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {currentCategory || currentSearch || currentTag ? (
            <div className="flex items-end">
              <button
                onClick={() => router.push('/blog')}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-sm font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
