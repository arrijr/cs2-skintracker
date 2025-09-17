// frontend/src/hooks/useInfiniteSkins.ts — [Frontend]
// {/* Infinite scroll hook for skins with proper pagination */}
"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import useSWRInfinite from 'swr/infinite';
import { apiUrl, swrFetcher } from '@/lib/api';
import { Skin, SkinsFilters } from './useSkins';

export interface SkinsResponse {
  items: Skin[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UseInfiniteSkinsOptions {
  filters?: SkinsFilters;
  enabled?: boolean;
  pageSize?: number;
}

// Default configuration
const DEFAULT_OPTIONS: Required<UseInfiniteSkinsOptions> = {
  filters: {},
  enabled: true,
  pageSize: 24,
};

// Build query string from filters (excluding page)
const buildQueryString = (filters: SkinsFilters, page: number): string => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && key !== 'page') {
      params.append(key, String(value));
    }
  });

  // Always add page
  params.append('page', String(page));
  params.append('pageSize', String(DEFAULT_OPTIONS.pageSize));

  return params.toString();
};

// SWR fetcher
const fetcher = (url: string): Promise<SkinsResponse> => {
  return swrFetcher<SkinsResponse>(url);
};

// Main hook
export function useInfiniteSkins(options: UseInfiniteSkinsOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Get key function for SWR Infinite
  const getKey = useCallback((pageIndex: number, previousPageData: SkinsResponse | null) => {
    console.log('🔑 [useInfiniteSkins] getKey called', {
      pageIndex,
      hasPreviousData: !!previousPageData,
      hasNextPage: previousPageData?.hasNextPage,
      enabled: config.enabled
    });

    // If we've reached the end, return null
    if (previousPageData && !previousPageData.hasNextPage) {
      console.log('🛑 [useInfiniteSkins] Reached end, returning null');
      return null;
    }

    // Build URL for this page
    const queryString = buildQueryString(config.filters, pageIndex + 1);
    const url = config.enabled ? apiUrl(`/api/v1/skins?${queryString}`) : null;
    console.log('🌐 [useInfiniteSkins] Generated URL:', url);
    return url;
  }, [config.filters, config.enabled, config.pageSize]);

  // SWR Infinite hook
  const {
    data,
    error,
    isLoading,
    isValidating,
    size,
    setSize,
    mutate
  } = useSWRInfinite<SkinsResponse>(
    getKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    }
  );

  // Reset to first page when filters change
  useEffect(() => {
    if (size > 1) {
      setSize(1);
    }
  }, [config.filters, setSize, size]);

  // Flatten all loaded pages into a single array
  const allSkins = useMemo(() => {
    if (!data) return [];
    return data.flatMap(page => page.items);
  }, [data]);

  // Get pagination info from the first page
  const pagination = useMemo(() => {
    if (!data || data.length === 0) return null;

    const firstPage = data[0];
    const { page, pageSize, total, totalPages, hasNextPage, hasPrevPage } = firstPage;

    return {
      currentPage: page,
      pageSize,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      hasMore: hasNextPage,
      startItem: (page - 1) * pageSize + 1,
      endItem: Math.min(page * pageSize, total),
      loadedPages: data.length,
    };
  }, [data]);

  // Load more function
  const loadMore = useCallback(() => {
    console.log('🔄 [useInfiniteSkins] loadMore called', {
      isLoading,
      isValidating,
      hasMore: pagination?.hasMore,
      currentSize: size,
      totalSkins: allSkins.length
    });
    
    if (!isLoading && !isValidating && pagination?.hasMore) {
      console.log('✅ [useInfiniteSkins] Loading more pages...');
      setSize(prev => prev + 1);
    } else {
      console.log('❌ [useInfiniteSkins] Cannot load more:', {
        isLoading,
        isValidating,
        hasMore: pagination?.hasMore
      });
    }
  }, [isLoading, isValidating, pagination?.hasMore, setSize, size, allSkins.length]);

  // Reset function
  const reset = useCallback(() => {
    setSize(1);
    mutate();
  }, [setSize, mutate]);

  // Loading states
  const isInitialLoading = isLoading && !data;
  const isLoadingMore = isValidating && data && data.length > 0;
  const hasError = !!error;
  const isEmpty = !isLoading && data && allSkins.length === 0;

  return {
    // Data
    skins: allSkins,
    total: pagination?.total || 0,
    pagination,
    
    // Loading states
    isLoading: isInitialLoading,
    isLoadingMore,
    isValidating,
    isEmpty,
    hasError,
    
    // Error
    error,
    
    // Actions
    loadMore,
    reset,
    mutate,
    
    // Debug info
    debug: {
      loadedPages: data?.length || 0,
      totalSkins: allSkins.length,
      hasMore: pagination?.hasMore || false,
    },
  };
}

export default useInfiniteSkins;
