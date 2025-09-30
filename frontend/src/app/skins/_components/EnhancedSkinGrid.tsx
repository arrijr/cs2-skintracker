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
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Grid3X3, 
  List, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  Filter,
  SortAsc,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EnhancedSkinGridProps {
  filters?: SkinsFilters;
  onSkinClick?: (skinId: number) => void;
  onSkinAdd?: (skinId: number) => void;
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
  className = "",
  showSkeleton = true,
  skeletonCount = 12,
  enableInfiniteScroll = false,
  onLoadMore,
  batchMode = false,
  selectedSkins = new Set(),
  onToggleSelection
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
  
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('price_asc');
  
  // Use the infinite skins hook with provided filters
  const { 
    skins, 
    isLoading, 
    isLoadingMore,
    isEmpty, 
    hasError, 
    error,
    pagination,
    loadMore,
    total
  } = useInfiniteSkins({ 
    filters: {
      ...filters,
      sort: sortBy
    },
    enabled: true 
  });

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
      
      try {
        const token = await getToken({ template: "backend" });
        await fetchJson(apiUrl('/api/v1/portfolio'), {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            skinId,
            amount: 1,
            buyPrice: 0,
            buyDate: new Date().toISOString().slice(0, 10),
          }),
        });
        toast.success("Skin added to portfolio!");
      } catch (error) {
        console.error("Failed to add skin to portfolio:", error);
        toast.error("Failed to add skin to portfolio");
      }
    }
  };

  // Handle watchlist toggle
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
    
    try {
      const token = await getToken({ template: "backend" });
      await fetchJson(apiUrl('/api/v1/watchlist'), {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ skinId }),
      });
      toast.success("Added to watchlist!");
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
      toast.error("Failed to add to watchlist");
    }
  };

  // Skeleton component
  const SkinSkeleton = ({ viewMode }: { viewMode: ViewMode }) => {
    if (viewMode === 'list') {
      return (
        <Card className="border-slate-700/50 bg-slate-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-slate-700/50 bg-slate-800/30 overflow-hidden">
        <Skeleton className="aspect-square w-full" />
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-5 w-20" />
        </CardContent>
      </Card>
    );
  };

  // Empty state
  const EmptyState = () => (
    <Card className="border-slate-700/50 bg-slate-800/30">
      <CardContent className="p-12 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-700/50 flex items-center justify-center">
            <EyeOff className="h-8 w-8 text-slate-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">No skins found</h3>
            <p className="text-slate-400">
              Try adjusting your filters or search terms to find more skins.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
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
    <div className={cn("space-y-6", className)}>
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-white">
            Skins {total && `(${total})`}
          </h2>
          
          {/* View mode toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sort and filter controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-8"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-8 px-3 bg-slate-800 border border-slate-600 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
            <option value="name_desc">Name: Z to A</option>
            <option value="popularity_desc">Most Popular</option>
            <option value="change_24h_desc">24h Change ↓</option>
            <option value="change_24h_asc">24h Change ↑</option>
          </select>
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
