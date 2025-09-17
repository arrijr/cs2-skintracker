// frontend/src/app/browse/page.tsx — [Frontend]
// {/* Modern Browse Page with Filter Chips, URL Sync, and Pagination */}
"use client";
import { Suspense } from "react";
import { BrowsePageContent } from "./components/BrowsePageContent";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function BrowsePage() {
  return (
    <Suspense fallback={<BrowsePageSkeleton />}>
      <BrowsePageContent />
    </Suspense>
  );
}

function BrowsePageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Left Sidebar Skeleton */}
          <div className="w-80 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-16" />
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-16" />
                  ))}
                </div>
                <Skeleton className="h-6 w-20" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-24" />
                  ))}
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content Skeleton */}
          <div className="flex-1 space-y-6">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-16" />
              ))}
            </div>
            <Skeleton className="h-4 w-24" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-square relative">
                    <Skeleton className="h-full w-full" />
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-8" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
