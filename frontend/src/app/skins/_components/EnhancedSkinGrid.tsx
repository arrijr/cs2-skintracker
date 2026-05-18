// /frontend/src/app/skins/_components/EnhancedSkinGrid.tsx — [Frontend]
// {/* Enhanced Skin Grid with view modes and visual effects */}
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { EnhancedSkinCard } from "./EnhancedSkinCard";
import { useInfiniteSkins, type SkinsFilters } from "@/hooks/useInfiniteSkins";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { apiUrl, fetchJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Grid3X3,
  List,
  Loader2,
  AlertCircle,
  RefreshCw,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { EmptyState as SharedEmptyState } from "@/components/ui/empty-state";
import { EmptyCrate } from "@/components/ui/empty-illustrations";

interface EnhancedSkinGridProps {
  filters?: SkinsFilters;
  onSkinClick?: (skinId: number) => void;
  onSkinAdd?: (skinId: number) => void;
  /** Called when total result count changes — page uses this for the header count. */
  onTotalChange?: (total: number | null) => void;
  className?: string;
  showSkeleton?: boolean;
  skeletonCount?: number;
  enableInfiniteScroll?: boolean;
  onLoadMore?: () => void;
  // Batch selection props
  batchMode?: boolean;
  selectedSkins?: Set<number>;
  onToggleSelection?: (skinId: number) => void;
}

type ViewMode = 'grid' | 'list';

export function EnhancedSkinGrid({
  filters = {},
  onSkinClick,
  onSkinAdd,
  onTotalChange,
  className = "",
  showSkeleton = true,
  skeletonCount = 12,
  enableInfiniteScroll = false,
  onLoadMore,
  batchMode = false,
  selectedSkins = new Set(),
  onToggleSelection,
}: EnhancedSkinGridProps) {
  const { user, isLoaded } = useUser();
  const auth = useAuth();
  const getToken = auth?.getToken;
  
  // Guard against undefined auth or getToken
  if (!auth) {
    console.warn('[EnhancedSkinGrid] useAuth returned undefined');
  }
  if (!getToken) {
    console.warn('[EnhancedSkinGrid] getToken is undefined');
  }
  const router = useRouter();
  const observerRef = useRef<HTMLDivElement>(null);
  
  // View mode state — sort + filters come from props (page is single source of truth).
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Track which skins are in the user's watchlist / portfolio.
  // Loaded once on mount, then optimistically toggled.
  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(new Set());
  const [portfolioIds, setPortfolioIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user || !getToken) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken({ template: "backend" });
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const [w, p] = await Promise.all([
          fetchJson(apiUrl("/api/v1/watchlist"), { headers }).catch(() => null),
          fetchJson(apiUrl("/api/v1/portfolio"), { headers }).catch(() => null),
        ]);
        if (cancelled) return;
        if (w) {
          const items = Array.isArray(w) ? w : (w.data ?? w.items ?? []);
          setWatchlistIds(new Set(items.map((it: any) => it.skinId ?? it.skin?.id).filter(Boolean)));
        }
        if (p) {
          const items = Array.isArray(p) ? p : (p.data ?? p.items ?? []);
          setPortfolioIds(new Set(items.map((it: any) => it.skinId ?? it.skin?.id).filter(Boolean)));
        }
      } catch {
        /* user lists are best-effort, ignore failures */
      }
    })();
    return () => { cancelled = true; };
  }, [user, getToken]);
  
  // Use the infinite skins hook — sort comes from filters prop now, not internal state.
  const {
    skins,
    isLoading,
    isLoadingMore,
    isEmpty,
    hasError,
    error,
    pagination,
    loadMore,
    total,
  } = useInfiniteSkins({ filters, enabled: true });

  // Bubble total up to parent
  useEffect(() => {
    onTotalChange?.(total ?? null);
  }, [total, onTotalChange]);

  // Infinite Scroll Implementation
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && !isLoading && !isLoadingMore && pagination?.hasMore) {
      loadMore();
    }
  }, [isLoading, isLoadingMore, pagination?.hasMore, loadMore]);

  useEffect(() => {
    if (!enableInfiniteScroll || !observerRef.current) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '100px'
    });

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [enableInfiniteScroll, handleObserver]);

  // Handle skin click
  const handleSkinClick = (skinId: number) => {
    if (onSkinClick) {
      onSkinClick(skinId);
    } else {
      router.push(`/skins/${skinId}`);
    }
  };

  // Handle skin add to portfolio
  const handleSkinAdd = async (skinId: number) => {
    if (!user) { 
      router.push("/sign-in"); 
      return; 
    }
    
    if (onSkinAdd) {
      onSkinAdd(skinId);
    } else {
      if (!getToken) {
        console.error('[EnhancedSkinGrid] Cannot add to portfolio: getToken is undefined');
        toast.error("Authentication error");
        return;
      }
      
      // Use current market price as the buy-price default. Backend rejects buyPrice <= 0,
      // and "I just bought this at market" is the most likely intent for a one-click add.
      // User can edit later in /portfolio bulk edit.
      const skin: any = (skins ?? []).find((s: any) => s?.id === skinId);
      const fallbackPrice =
        skin?.priceLatest ?? skin?.priceMedian ?? skin?.priceAvg ?? null;

      if (!fallbackPrice || fallbackPrice <= 0) {
        toast.error("This skin has no recent price — set buy price manually in Portfolio.");
        router.push(`/skins/${skinId}`);
        return;
      }

      // Optimistic add
      setPortfolioIds((prev) => {
        const next = new Set(prev);
        next.add(skinId);
        return next;
      });
      try {
        const token = await getToken({ template: "backend" });
        await fetchJson(apiUrl('/api/v1/portfolio'), {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            skinId,
            amount: 1,
            buyPrice: fallbackPrice,
            buyDate: new Date().toISOString().slice(0, 10),
          }),
        });
        toast.success(`Added to portfolio at €${fallbackPrice.toFixed(2)}`);
      } catch (error) {
        console.error("Failed to add skin to portfolio:", error);
        toast.error("Failed to add to portfolio");
        // Roll back
        setPortfolioIds((prev) => {
          const next = new Set(prev);
          next.delete(skinId);
          return next;
        });
      }
    }
  };

  // Handle watchlist toggle — adds if not present, removes if already there. Optimistic.
  const handleToggleWatchlist = async (skinId: number) => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    if (!getToken) {
      console.error('[EnhancedSkinGrid] Cannot toggle watchlist: getToken is undefined');
      toast.error("Authentication error");
      return;
    }

    const wasIn = watchlistIds.has(skinId);
    // Optimistic update
    setWatchlistIds((prev) => {
      const next = new Set(prev);
      if (wasIn) next.delete(skinId);
      else next.add(skinId);
      return next;
    });

    try {
      const token = await getToken({ template: "backend" });
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      if (wasIn) {
        await fetchJson(apiUrl(`/api/v1/watchlist/${skinId}`), { method: "DELETE", headers });
        toast.success("Removed from watchlist");
      } else {
        await fetchJson(apiUrl('/api/v1/watchlist'), {
          method: "POST",
          headers,
          body: JSON.stringify({ skinId }),
        });
        toast.success("Added to watchlist");
      }
    } catch (error) {
      console.error("watchlist toggle failed:", error);
      toast.error(wasIn ? "Failed to remove" : "Failed to add to watchlist");
      // Roll back optimistic update
      setWatchlistIds((prev) => {
        const next = new Set(prev);
        if (wasIn) next.add(skinId);
        else next.delete(skinId);
        return next;
      });
    }
  };

  // Skeleton component
  const SkinSkeleton = ({ viewMode }: { viewMode: ViewMode }) => {
    if (viewMode === 'list') {
      return (
        <div className="bg-slate-900/40 border border-slate-700/30 rounded-2xl p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-slate-800/60" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-slate-800/60 rounded" />
              <div className="h-3 w-1/2 bg-slate-800/60 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-5 w-16 bg-slate-800/60 rounded" />
              <div className="h-3 w-12 bg-slate-800/60 rounded" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-slate-900/40 border border-slate-700/30 rounded-2xl overflow-hidden animate-pulse">
        <div className="aspect-[5/4] w-full bg-slate-800/60" />
        <div className="p-3.5 space-y-2 border-t border-slate-700/30 bg-slate-900/60">
          <div className="h-4 w-1/3 bg-slate-800/60 rounded" />
          <div className="h-3 w-3/4 bg-slate-800/60 rounded" />
          <div className="h-5 w-20 bg-slate-800/60 rounded" />
        </div>
      </div>
    );
  };

  // Empty state — shared component with CS2 crate illustration
  const EmptyState = () => (
    <SharedEmptyState
      illustration={<EmptyCrate size={120} />}
      title="No skins match these filters"
      description="Try a wider price range, fewer filters, or a different search term."
      primaryCta={{ label: "Reset filters", onClick: () => window.location.reload() }}
    />
  );

  // Error state
  const ErrorState = () => (
    <Card className="border-red-500/50 bg-red-500/10">
      <CardContent className="p-12 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Error loading skins</h3>
            <p className="text-slate-400">
              {error?.message || "Something went wrong while loading the skins."}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("space-y-5", className)} data-testid="skin-grid">
      {/* View mode toggle — sort is owned by the page now */}
      <div className="flex items-center justify-end">
        <div className="inline-flex items-center gap-0.5 p-1 bg-slate-900/70 border border-slate-700/30 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            aria-pressed={viewMode === 'grid'}
            className={cn(
              "p-1.5 rounded transition-colors",
              viewMode === 'grid'
                ? "bg-slate-800/80 text-white"
                : "text-slate-500 hover:text-slate-300"
            )}
            aria-label="Grid view"
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
            className={cn(
              "p-1.5 rounded transition-colors",
              viewMode === 'list'
                ? "bg-slate-800/80 text-white"
                : "text-slate-500 hover:text-slate-300"
            )}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && showSkeleton && (
        <div className={cn(
          "grid gap-4",
          viewMode === 'grid' 
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" 
            : "grid-cols-1"
        )}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <SkinSkeleton key={i} viewMode={viewMode} />
          ))}
        </div>
      )}

      {/* Error state */}
      {hasError && <ErrorState />}

      {/* Empty state */}
      {isEmpty && !isLoading && <EmptyState />}

      {/* Skins grid */}
      {!isLoading && !hasError && !isEmpty && (
        <div className={cn(
          "grid gap-4",
          viewMode === 'grid' 
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" 
            : "grid-cols-1"
        )}>
          {(skins || []).filter(skin => skin && skin.id).map((skin) => (
            <EnhancedSkinCard
              key={skin.id}
              skin={skin}
              onSkinClick={handleSkinClick}
              onSkinAdd={handleSkinAdd}
              onToggleWatchlist={handleToggleWatchlist}
              isInWatchlist={watchlistIds.has(skin.id)}
              isInPortfolio={portfolioIds.has(skin.id)}
              viewMode={viewMode}
              showHoverEffects={true}
              className="animate-fade-in"
            />
          ))}
        </div>
      )}

      {/* Load more button */}
      {!enableInfiniteScroll && pagination?.hasMore && (
        <div className="flex justify-center">
          <Button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="px-8 py-2"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

      {/* Infinite scroll trigger */}
      {enableInfiniteScroll && (
        <div ref={observerRef} className="h-4" />
      )}

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading more skins...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedSkinGrid;
