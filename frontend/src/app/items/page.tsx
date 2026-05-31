import type { Metadata } from "next";
import { Suspense } from "react";
import { ItemsBrowse } from "./_components/ItemsBrowse";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Browse Items — skintrackr.io",
  description: "Search and filter all CS2 stickers, agents, patches, graffiti, music kits, collectibles, and keys. Live prices from Steam Market.",
};

// Mirrors ItemsBrowse's AppShell chrome (eyebrow/title/maxWidth) so the
// Suspense fallback and the loaded page share identical layout — no shift
// on hydrate. Previously this used a bespoke min-h-screen container that
// differed from the AppShell-wrapped real content.
function ItemsBrowseSkeleton() {
  return (
    <AppShell eyebrow="Catalog" title="Browse Items" description="Loading items…" maxWidth="7xl">
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
    </AppShell>
  );
}

export default function ItemsPage() {
  return (
    <Suspense fallback={<ItemsBrowseSkeleton />}>
      <ItemsBrowse />
    </Suspense>
  );
}
