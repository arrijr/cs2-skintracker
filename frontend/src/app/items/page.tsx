import type { Metadata } from "next";
import { Suspense } from "react";
import { ItemsBrowse } from "./_components/ItemsBrowse";

export const metadata: Metadata = {
  title: "Browse Items — skintrackr.com",
  description: "Search and filter all CS2 stickers, agents, patches, graffiti, music kits, collectibles, and keys. Live prices from Steam Market.",
};

export default function ItemsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white p-8">Loading…</div>}>
      <ItemsBrowse />
    </Suspense>
  );
}
