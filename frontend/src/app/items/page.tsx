import type { Metadata } from "next";
import { Suspense } from "react";
import { ItemsBrowse } from "./_components/ItemsBrowse";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Browse Items — skintrackr.io",
  description: "Search and filter all CS2 stickers, agents, patches, graffiti, music kits, collectibles, and keys. Live prices from Steam Market.",
};

function ItemsBrowseSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-white py-10">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <Skeleton className="h-9 w-48 mb-2 bg-slate-800" />
          <Skeleton className="h-5 w-96 bg-slate-800/60" />
        </div>
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 bg-slate-800/60 rounded-full" />
          ))}
        </div>
        <div className="flex gap-3 mb-6">
          <Skeleton className="h-10 flex-1 bg-slate-800/60" />
          <Skeleton className="h-10 w-48 bg-slate-800/60" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-56 bg-slate-800/40 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ItemsPage() {
  return (
    <Suspense fallback={<ItemsBrowseSkeleton />}>
      <ItemsBrowse />
    </Suspense>
  );
}
