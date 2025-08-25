// frontend/src/app/skins/page.tsx — [Frontend]
// {/* URL-sync for filters & sort on Skins Browse */}
"use client";
import { Suspense } from "react";
import { SkinsPageContent } from "./_components/SkinsPageContent";

export default function SkinsPage() {
  return (
    <Suspense fallback={<SkinsPageSkeleton />}>
      <SkinsPageContent />
    </Suspense>
  );
}

function SkinsPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="h-8 bg-gray-800 rounded mb-8 animate-pulse" />
        
        {/* Filters Skeleton */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-gray-700 rounded mb-2 animate-pulse" />
                <div className="h-10 bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Results Skeleton */}
        <div className="h-4 bg-gray-800 rounded mb-8 animate-pulse" />
        
        {/* Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}