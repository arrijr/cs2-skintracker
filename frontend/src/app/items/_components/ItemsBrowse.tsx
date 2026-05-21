"use client";
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMarketItems, type MarketItemCategory, type SortKey, type SortOrder } from '@/hooks/useMarketItems';
import { ItemCard } from './ItemCard';
import { CategoryFilter } from './CategoryFilter';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/ui/empty-state';

function parseCategory(v: string | null): MarketItemCategory | null {
  const valid: MarketItemCategory[] = ['sticker', 'agent', 'patch', 'graffiti', 'music_kit', 'collectible', 'key'];
  return v && (valid as string[]).includes(v) ? (v as MarketItemCategory) : null;
}

function parseSort(v: string | null): SortKey {
  return v === 'price' || v === 'volume' ? v : 'name';
}

function parseOrder(v: string | null): SortOrder {
  return v === 'desc' ? 'desc' : 'asc';
}

export function ItemsBrowse() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = parseCategory(searchParams.get('category'));
  const sort = parseSort(searchParams.get('sort'));
  const order = parseOrder(searchParams.get('order'));
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const initialQ = searchParams.get('q') ?? '';

  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { items, pagination, isLoading, error } = useMarketItems({
    category: category ?? undefined,
    q: debouncedQ || undefined,
    page,
    sort,
    order,
  });

  const updateUrl = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === '') params.delete(k);
      else params.set(k, v);
    }
    router.push(`/items${params.toString() ? '?' + params.toString() : ''}`);
  }, [router, searchParams]);

  // Sync debounced q to URL
  useEffect(() => {
    const currentQ = searchParams.get('q') ?? '';
    if (debouncedQ !== currentQ) {
      updateUrl({ q: debouncedQ || null, page: null });
    }
  }, [debouncedQ, searchParams, updateUrl]);

  return (
    <AppShell
      eyebrow="Catalog"
      title="Browse Items"
      description={`Stickers, agents, patches, music kits, and more — ${pagination?.total ?? '…'} items.`}
    >
      <div>
        <div className="space-y-4 mb-6">
          <CategoryFilter
            active={category}
            onChange={(next) => updateUrl({ category: next, page: null })}
          />

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 bg-slate-900/70 border-slate-700/30 text-white"
              />
            </div>
            <Select value={`${sort}:${order}`} onValueChange={(v) => {
              const [s, o] = v.split(':');
              updateUrl({ sort: s, order: o, page: null });
            }}>
              <SelectTrigger className="w-full md:w-48 bg-slate-900/70 border-slate-700/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="name:asc">Name A→Z</SelectItem>
                <SelectItem value="name:desc">Name Z→A</SelectItem>
                <SelectItem value="price:desc">Price high→low</SelectItem>
                <SelectItem value="price:asc">Price low→high</SelectItem>
                <SelectItem value="volume:desc">Volume high→low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 mb-4">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
            ))}
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <EmptyState
            icon={Search}
            title="No items match these filters"
            description="Try a different category, search term, or sort order."
            primaryCta={{ label: 'Reset filters', onClick: () => updateUrl({ category: null, q: null, sort: null, order: null, page: null }) }}
          />
        )}

        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => <ItemCard key={item.id} item={item} />)}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => updateUrl({ page: String(page - 1) })}
              className="border-slate-700/50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <span className="text-slate-400 text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= pagination.totalPages}
              onClick={() => updateUrl({ page: String(page + 1) })}
              className="border-slate-700/50"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
