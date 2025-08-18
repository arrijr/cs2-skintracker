// /frontend/src/app/skins/page.tsx  (Frontend)
// {/* Skins – browse via Search */}
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import SkinSearchBar from "../components/SkinSearchBar";
import { searchSkins } from "@/lib/api";

// {/* Minimal Skin type */}
type Skin = {
  id: number;
  name: string;
  itemimage?: string;
  itemImage?: string;
  image_url?: string;
  imageUrl?: string;
};

export default function SkinsPage() {
  const [query, setQuery] = useState<string>("");
  const [skins, setSkins] = useState<Skin[]>([]);
  const [loading, setLoading] = useState(false);

  // {/* Load results whenever query changes */}
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!query || query.trim().length < 2) {
        setSkins([]);
        return;
      }
      setLoading(true);
      try {
        const res = await searchSkins(query);
        if (!cancelled) setSkins(Array.isArray(res) ? res : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const t = setTimeout(run, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  return (
    <div className="min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">CS2 Skins – Browse & Discover</h1>

      {/* Search Input (returns name via mapSelected) */}
      <div className="max-w-3xl mx-auto mb-4">
        <SkinSearchBar mapSelected={(s:any) => s.name} onSelect={(name) => setQuery(String(name))} />
      </div>

      {loading && <div className="py-10 text-center text-zinc-400">Searching…</div>}
      {!loading && skins.length === 0 && query.length >= 2 && (
        <div className="py-10 text-center text-zinc-400">No results for “{query}”.</div>
      )}

      {/* Results Grid */} 
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 py-4">
        {skins.map((skin) => {
          const img = skin.itemimage || skin.itemImage || skin.image_url || skin.imageUrl || "/images/placeholder-skin.png";
          return (
            <Link
              href={`/skins/${skin.id}`}
              key={skin.id}
              className="bg-neutral-900 rounded-xl hover:bg-neutral-800 transition flex flex-col items-center p-3"
            >
              <img src={img} alt={skin.name} className="mb-2 w-24 h-24 object-contain rounded" />
              <div className="font-semibold text-center">{skin.name}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
