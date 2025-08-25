// frontend/src/app/skins/_components/SkinsPageContent.tsx — [Frontend]
// {/* Main content component with useSearchParams and filters */}
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SkinCard } from "./SkinCard";

// {/* Types */}
type Skin = {
  id: number;
  name: string;
  marketHashName: string;
  imageUrl?: string;
  weaponType?: string;
  wear?: string;
  rarity?: string;
  quality?: string;
  isStattrak?: boolean;
  isStar?: boolean;
  priceAvg?: number;
  priceMedian?: number;
  offerVolume?: number;
  sold24h?: number;
};

const PAGE_SIZE = 24;

export function SkinsPageContent() {
  const router = useRouter();
  const sp = useSearchParams();

  // URL-synced state
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [min, setMin] = useState(sp.get("min") ?? "");
  const [max, setMax] = useState(sp.get("max") ?? "");
  const [rarity, setRarity] = useState(sp.get("rarity") ?? "");
  const [wear, setWear] = useState(sp.get("wear") ?? "");
  const [stattrak, setStattrak] = useState(sp.get("stattrak") === "true");
  const [special, setSpecial] = useState(sp.get("special") === "true");
  const [sort, setSort] = useState(sp.get("sort") ?? "name_asc");

  // Data state
  const [items, setItems] = useState<Skin[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Write state -> URL (replace, no scroll)
  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (min) p.set("min", min);
    if (max) p.set("max", max);
    if (rarity) p.set("rarity", rarity);
    if (wear) p.set("wear", wear);
    if (stattrak) p.set("stattrak", "true");
    if (special) p.set("special", "true");
    if (sort) p.set("sort", sort);
    router.replace(`/skins?${p.toString()}`, { scroll: false });
  }, [q, min, max, rarity, wear, stattrak, special, sort, router]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (min) p.set("min", min);
    if (max) p.set("max", max);
    if (rarity) p.set("rarity", rarity);
    if (wear) p.set("wear", wear);
    if (stattrak) p.set("stattrak", "true");
    if (special) p.set("special", "true");
    if (sort) p.set("sort", sort);
    p.set("page", String(page));
    p.set("pageSize", String(PAGE_SIZE));
    return p.toString();
  }, [q, min, max, rarity, wear, stattrak, special, sort, page]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/skins?${queryString}`);
      const data = await res.json();
      setItems(prev => page === 1 ? data.items : [...prev, ...data.items]);
      setTotal(data.total);
    } catch (error) {
      console.error("Failed to load skins:", error);
    } finally {
      setLoading(false);
    }
  }

  // Initial load & when filters change → reset to page 1 and load
  useEffect(() => { setPage(1); }, [q, min, max, rarity, wear, stattrak, special, sort]);
  useEffect(() => { load(); }, [queryString]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !loading && items.length < total) {
        setPage(p => p + 1);
      }
    }, { rootMargin: "200px" });
    
    io.observe(el);
    return () => io.disconnect();
  }, [items.length, total, loading]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">CS2 Skins Browse</h1>
        
        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search skins..."
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium mb-2">Min Price</label>
              <input
                type="number"
                value={min}
                onChange={(e) => setMin(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Price</label>
              <input
                type="number"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                placeholder="1000"
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="price_asc">Price Low-High</option>
                <option value="price_desc">Price High-Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          {/* Boolean Filters */}
          <div className="flex flex-wrap gap-4 mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={stattrak}
                onChange={(e) => setStattrak(e.target.checked)}
                className="mr-2"
              />
              StatTrak
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={special}
                onChange={(e) => setSpecial(e.target.checked)}
                className="mr-2"
              />
              Special (Star)
            </label>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-400">
            Showing {items.length} of {total} skins
          </p>
        </div>

        {/* Skin Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map(skin => (
            <SkinCard key={skin.id} skin={skin} onAdded={() => {}} />
          ))}
          
          {/* Skeleton Loaders */}
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="h-48 rounded-2xl bg-gray-800 animate-pulse" />
          ))}
        </div>

        {/* Infinite Scroll Sentinel */}
        <div ref={sentinelRef} className="h-4" />
      </div>
    </div>
  );
}
