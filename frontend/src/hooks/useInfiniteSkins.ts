// frontend/src/hooks/useInfiniteSkins.ts — [Frontend]
// {/* Infinite scroll hook for skins with proper pagination */}
"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  
  // Use ref to track if we should reset
  const shouldResetRef = useRef(false);
  const previousFiltersRef = useRef<string>('');
  
  // Create a stable filter key for comparison
  const filterKey = useMemo(() => {
    if (!config.filters) return '';
    return JSON.stringify({
      q: config.filters.q,
      min: config.filters.min,
      max: config.filters.max,
      rarity: config.filters.rarity,
      wear: config.filters.wear,
      quality: config.filters.quality,
      stattrak: config.filters.stattrak,
      special: config.filters.special,
      category: config.filters.category,
      weaponType: config.filters.weaponType,
      collection: config.filters.collection,
      finish: config.filters.finish,
      sort: config.filters.sort,
    });
  }, [config.filters]);
  
  // Check if filters changed
  useEffect(() => {
    if (previousFiltersRef.current !== filterKey) {
      shouldResetRef.current = true;
      previousFiltersRef.current = filterKey;
    }
  }, [filterKey]);
  
  // Get key function for SWR Infinite
  const getKey = useCallback((pageIndex: number, previousPageData: SkinsResponse | null) => {
    // If we've reached the end, return null
    if (previousPageData && !previousPageData.hasNextPage) {
      return null;
    }

    // Build URL for this page
    const queryString = buildQueryString(config.filters, pageIndex + 1);
    const url = config.enabled ? apiUrl(`/api/v1/skins?${queryString}`) : null;
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
    if (shouldResetRef.current && size > 1) {
      shouldResetRef.current = false;
      setSize(1);
    }
  }, [size, setSize]);

  // Flatten all loaded pages into a single array, deduplicating by id.
  // (Backend sometimes returns same skin across pages — e.g. duplicate marketHashName entries.)
  const allSkins = useMemo(() => {
    if (!data) return [];
    const flat = data.flatMap(page => page.items);
    const seen = new Set<number>();
    const out = [];
    for (const s of flat) {
      if (s && s.id != null && !seen.has(s.id)) {
        seen.add(s.id);
        out.push(s);
      }
    }
    return out;
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
    if (!isLoading && !isValidating && pagination?.hasMore) {
      setSize(prev => prev + 1);
    }
  }, [isLoading, isValidating, pagination?.hasMore, setSize]);

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
      filterKey,
    },
  };
}

export default useInfiniteSkins;