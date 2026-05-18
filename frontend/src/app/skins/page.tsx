// frontend/src/app/skins/page.tsx — [Frontend]
"use client";
import { Suspense } from "react";
import { SkinsPageContent } from "./_components/SkinsPageContent";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AppShell } from "@/components/layout/AppShell";

export default function SkinsPage() {
  return (
    <Suspense fallback={<SkinsPageSkeleton />}>
      <SkinsPageContent />
    </Suspense>
  );
}

function SkinsPageSkeleton() {
  return (
    <AppShell eyebrow="Catalog" title="Skins" description="Loading…" maxWidth="7xl">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-80">
          <Card className="bg-slate-900/70 border-slate-700/30">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-10 w-full bg-slate-800" />
              <Skeleton className="h-6 w-20 bg-slate-800" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full bg-slate-800/60" />
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-16 bg-slate-800/60" />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-64 bg-slate-800/40 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
