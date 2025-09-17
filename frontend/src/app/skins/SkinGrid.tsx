// frontend/src/app/skins/SkinGrid.tsx — [Frontend]
// {/* Reusable Skin Grid with Loading/Error/Empty States */}
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { SkinCard } from "./_components/SkinCard";
import { useSkins, type SkinsFilters } from "@/hooks/useSkins";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { apiUrl, fetchJson } from "@/lib/api";

interface SkinGridProps {
  filters?: SkinsFilters;
  onSkinClick?: (skinId: number) => void;
  onSkinAdd?: (skinId: number) => void;
  className?: string;
  showSkeleton?: boolean;
  skeletonCount?: number;
  enableInfiniteScroll?: boolean;
  onLoadMore?: () => void;
}

export default function SkinGrid({ 
  filters = {}, 
  onSkinClick,
  onSkinAdd,
  className = "",
  showSkeleton = true,
  skeletonCount = 12,
  enableInfiniteScroll = false,
  onLoadMore
}: SkinGridProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const observerRef = useRef<HTMLDivElement>(null);
  
  // Use the skins hook with provided filters
  const { 
    skins, 
    isLoading, 
    isEmpty, 
    hasError, 
    error,
    pagination 
  } = useSkins({ 
    filters,
    enabled: true 
  });

  // P3: Infinite Scroll Implementation
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && !isLoading && pagination?.hasMore && onLoadMore) {
      onLoadMore();
    }
  }, [isLoading, pagination?.hasMore, onLoadMore]);

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
      // Default behavior: navigate to skin detail
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
      // Default behavior: add to portfolio
      try {
        await fetchJson(apiUrl('/api/v1/portfolio'), {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            skinId,
            amount: 1,
            buyPrice: skins.find(s => s.id === skinId)?.priceAvg || 0,
            buyDate: new Date().toISOString().slice(0, 10),
          }),
        });
        
        console.log("Skin added to portfolio");
      } catch (error) {
        console.error("Error adding skin to portfolio:", error);
      }
    }
  };

  // P3: Enhanced Loading Skeleton
  const SkeletonCard = () => (
    <div className="overflow-hidden border rounded-lg bg-card">
      <div className="aspect-square relative bg-muted">
        <div className="h-full w-full bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
        {/* Rarity badge skeleton */}
        <div className="absolute top-2 left-2 h-5 w-16 bg-muted animate-pulse rounded" />
        {/* Special badges skeleton */}
        <div className="absolute top-2 right-2 flex gap-1">
          <div className="h-5 w-5 bg-muted animate-pulse rounded" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
        {/* Rarity & Wear badges skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 bg-muted animate-pulse rounded" />
          <div className="h-5 w-12 bg-muted animate-pulse rounded" />
        </div>
        {/* Price & Volume skeleton */}
        <div className="flex items-baseline justify-between">
          <div className="h-6 w-20 bg-muted animate-pulse rounded" />
          <div className="h-3 w-16 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  );

  // Error state
  if (hasError) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-red-400 text-lg mb-4">
          Error loading skins
        </div>
        <div className="text-gray-500 text-sm mb-6">
          {error?.message || "Something went wrong"}
        </div>
        <div className="flex gap-2 justify-center">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            Reload Page
          </button>
          <button 
            onClick={() => mutate()}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (isEmpty && !isLoading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-400 text-lg mb-4">
          No skins found
        </div>
        <div className="text-gray-500 text-sm">
          Try adjusting your filters or search terms
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 ${className}`}>
        {/* Loading skeletons */}
        {isLoading && showSkeleton && (
          <>
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} />
            ))}
          </>
        )}
        
        {/* Actual skin cards */}
        {!isLoading && skins.map((skin) => (
          <div key={skin.id} onClick={() => handleSkinClick(skin.id)}>
            <SkinCard 
              skin={skin} 
              onAdded={() => handleSkinAdd(skin.id)}
            />
          </div>
        ))}
      </div>

      {/* P3: Infinite Scroll Trigger */}
      {enableInfiniteScroll && pagination?.hasMore && (
        <div ref={observerRef} className="flex justify-center py-8">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Loading more skins...</span>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              Scroll down to load more
            </div>
          )}
        </div>
      )}

      {/* P3: Load More Button (fallback) */}
      {!enableInfiniteScroll && pagination?.hasMore && (
        <div className="flex justify-center py-8">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
