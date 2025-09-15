// frontend/src/app/skins/SkinGrid.tsx — [Frontend]
// {/* Reusable Skin Grid with Loading/Error/Empty States */}
"use client";
import { useState } from "react";
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
}

export default function SkinGrid({ 
  filters = {}, 
  onSkinClick,
  onSkinAdd,
  className = "",
  showSkeleton = true,
  skeletonCount = 12
}: SkinGridProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
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

  // Loading skeleton
  const SkeletonCard = () => (
    <div className="h-48 rounded-2xl bg-gray-800 animate-pulse" />
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
  );
}
