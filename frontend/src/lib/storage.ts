// frontend/src/lib/storage.ts — [Frontend]
// {/* Session Storage utilities for filter persistence */}
"use client";

export interface FilterState {
  q?: string;
  min?: string;
  max?: string;
  rarity?: string;
  wear?: string;
  stattrak?: boolean;
  special?: boolean;
  sort?: string;
  category?: string;
  page?: number;
}

const STORAGE_KEY = 'cs2-skins-filters';

export const saveFiltersToSession = (filters: FilterState) => {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.warn('Failed to save filters to session storage:', error);
  }
};

export const loadFiltersFromSession = (): FilterState | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to load filters from session storage:', error);
    return null;
  }
};

export const clearFiltersFromSession = () => {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear filters from session storage:', error);
  }
};

export const hasStoredFilters = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored !== null && stored !== '{}';
  } catch (error) {
    return false;
  }
};
