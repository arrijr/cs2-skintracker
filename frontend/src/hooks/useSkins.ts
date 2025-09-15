"use client";

import { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { apiUrl, swrFetcher } from '@/lib/api';

// Types
export interface Skin {
  id: number;
  name: string;
  marketHashName: string;
  imageUrl: string;
  weaponType: string;
  wear: string;
  rarity: string;
  quality: string;
  isStattrak: boolean;
  isStar: boolean;
  priceAvg: number | null;
  priceMedian: number | null;
  offerVolume: number | null;
  sold24h: number | null;
}

export interface SkinsResponse {
  items: Skin[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SkinsFilters {
  q?: string;
  min?: number;
  max?: number;
  rarity?: string;
  wear?: string;
  quality?: string;
  stattrak?: boolean;
  special?: boolean;
  category?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface UseSkinsOptions {
  filters?: SkinsFilters;
  enabled?: boolean;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

// Default configuration
const DEFAULT_OPTIONS: Required<UseSkinsOptions> = {
  filters: {},
  enabled: true,
  timeout: 10000, // 10 seconds
  retryCount: 3,
  retryDelay: 1000, // 1 second
};

// SWR fetcher with timeout and error handling
const createFetcher = (timeout: number) => {
  return async (url: string): Promise<SkinsResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await swrFetcher<SkinsResponse>(url);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  };
};

// Build query string from filters
const buildQueryString = (filters: SkinsFilters): string => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return params.toString();
};

// Main hook
export function useSkins(options: UseSkinsOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const [retryCount, setRetryCount] = useState(0);

  // Build API URL
  const queryString = buildQueryString(config.filters);
  const fullApiUrl = apiUrl(`/api/v1/skins${queryString ? `?${queryString}` : ''}`);

  // Create fetcher with timeout
  const fetcher = useMemo(() => createFetcher(config.timeout), [config.timeout]);

  // SWR hook
  const { data, error, isLoading, isValidating, mutate } = useSWR<SkinsResponse>(
    config.enabled ? fullApiUrl : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 seconds
      errorRetryCount: config.retryCount,
      errorRetryInterval: config.retryDelay,
      onError: (error: Error) => {
        console.error('❌ [useSkins] SWR Error:', error);
        setRetryCount(prev => prev + 1);
      },
      onSuccess: () => {
        setRetryCount(0);
      },
    }
  );

  // Pagination helpers
  const pagination = useMemo(() => {
    if (!data) return null;

    const { page, pageSize, total } = data;
    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      currentPage: page,
      pageSize,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      startItem: (page - 1) * pageSize + 1,
      endItem: Math.min(page * pageSize, total),
    };
  }, [data]);

  // Filter helpers
  const updateFilters = useCallback((newFilters: Partial<SkinsFilters>) => {
    const updatedFilters = { ...config.filters, ...newFilters, page: 1 };
    // This will trigger a re-render with new filters
    // The actual filter update should be handled by the parent component
    return updatedFilters;
  }, [config.filters]);

  const resetFilters = useCallback(() => {
    return {
      q: undefined,
      min: undefined,
      max: undefined,
      rarity: undefined,
      wear: undefined,
      quality: undefined,
      stattrak: undefined,
      special: undefined,
      category: undefined,
      sort: 'name_asc',
      page: 1,
      pageSize: 24,
    };
  }, []);

  // Search helpers
  const search = useCallback((query: string) => {
    return updateFilters({ q: query, page: 1 });
  }, [updateFilters]);

  const clearSearch = useCallback(() => {
    return updateFilters({ q: undefined, page: 1 });
  }, [updateFilters]);

  // Sort helpers
  const sortBy = useCallback((sort: string) => {
    return updateFilters({ sort, page: 1 });
  }, [updateFilters]);

  // Category helpers
  const filterByCategory = useCallback((category: string) => {
    return updateFilters({ category, page: 1 });
  }, [updateFilters]);

  const clearCategory = useCallback(() => {
    return updateFilters({ category: undefined, page: 1 });
  }, [updateFilters]);

  // Price range helpers
  const setPriceRange = useCallback((min?: number, max?: number) => {
    return updateFilters({ min, max, page: 1 });
  }, [updateFilters]);

  const clearPriceRange = useCallback(() => {
    return updateFilters({ min: undefined, max: undefined, page: 1 });
  }, [updateFilters]);

  // Pagination helpers
  const goToPage = useCallback((page: number) => {
    return updateFilters({ page });
  }, [updateFilters]);

  const nextPage = useCallback(() => {
    if (pagination?.hasNextPage) {
      return goToPage(pagination.currentPage + 1);
    }
    return config.filters;
  }, [pagination, goToPage, config.filters]);

  const prevPage = useCallback(() => {
    if (pagination?.hasPrevPage) {
      return goToPage(pagination.currentPage - 1);
    }
    return config.filters;
  }, [pagination, goToPage, config.filters]);

  // Refresh data
  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  // Loading states
  const isInitialLoading = isLoading && !data;
  const isRefreshing = isValidating && data;
  const hasError = !!error;
  const isEmpty = !isLoading && data?.items.length === 0;

  // Error details
  const errorDetails = useMemo(() => {
    if (!error) return null;

    return {
      message: error.message,
      isTimeout: error.message.includes('timeout'),
      isNetworkError: error.message.includes('fetch'),
      retryCount,
      canRetry: retryCount < config.retryCount,
    };
  }, [error, retryCount, config.retryCount]);

  return {
    // Data
    skins: data?.items || [],
    total: data?.total || 0,
    pagination,
    
    // Loading states
    isLoading: isInitialLoading,
    isRefreshing,
    isValidating,
    isEmpty,
    hasError,
    
    // Error details
    error,
    errorDetails,
    
    // Actions
    refresh,
    mutate,
    
    // Filter actions
    updateFilters,
    resetFilters,
    search,
    clearSearch,
    sortBy,
    filterByCategory,
    clearCategory,
    setPriceRange,
    clearPriceRange,
    
    // Pagination actions
    goToPage,
    nextPage,
    prevPage,
    
    // Current filters
    currentFilters: config.filters,
    
    // Debug info
    debug: {
      apiUrl: fullApiUrl,
      retryCount,
      swrKey: config.enabled ? fullApiUrl : null,
    },
  };
}

// Preset hook for common use cases
export function useSkinsPresets() {
  const { data: wears } = useSWR<string[]>(apiUrl('/api/v1/skins/presets'), (url) => 
    swrFetcher<{wears: string[]}>(url).then(res => res.wears || [])
  );
  
  const { data: rarities } = useSWR<string[]>(apiUrl('/api/v1/skins/presets'), (url) => 
    swrFetcher<{rarities: string[]}>(url).then(res => res.rarities || [])
  );

  const { data: categories } = useSWR(apiUrl('/api/v1/skins/categories'), (url) => 
    swrFetcher<{categories: any}>(url).then(res => res.categories || {})
  );

  const { data: filters } = useSWR(apiUrl('/api/v1/skins/filters'), (url) => 
    swrFetcher(url)
  );

  return {
    wears: wears || [],
    rarities: rarities || [],
    categories: categories || {},
    filters: filters || {},
    isLoading: !wears || !rarities || !categories || !filters,
  };
}

// Search hook for autocomplete
export function useSkinsSearch(query: string, enabled: boolean = true) {
  const { data, error, isLoading } = useSWR<Skin[]>(
    enabled && query.length >= 2 ? apiUrl(`/api/v1/skins/search?query=${encodeURIComponent(query)}`) : null,
    (url) => swrFetcher<Skin[]>(url),
    {
      dedupingInterval: 1000,
      revalidateOnFocus: false,
    }
  );

  return {
    results: data || [],
    isLoading,
    error,
    hasResults: !isLoading && data && data.length > 0,
  };
}

export default useSkins;

