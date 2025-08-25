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

// Standard CS2 categories like skinbid.com
const CS2_CATEGORIES = {
  all: { name: "All", color: "bg-gray-600" },
  knives: { name: "Knives", color: "bg-red-500" },
  gloves: { name: "Gloves", color: "bg-orange-500" },
  pistols: { name: "Pistols", color: "bg-yellow-500" },
  smgs: { name: "SMGs", color: "bg-green-500" },
  rifles: { name: "Rifles", color: "bg-blue-500" },
  shotguns: { name: "Shotguns", color: "bg-purple-500" },
  machineGuns: { name: "Machine Guns", color: "bg-pink-500" },
  stickers: { name: "Stickers", color: "bg-indigo-500" },
  agents: { name: "Agents", color: "bg-teal-500" },
  cases: { name: "Cases", color: "bg-gray-500" },
  charms: { name: "Charms", color: "bg-amber-500" }
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
  const [quality, setQuality] = useState(sp.get("quality") ?? "");
  const [stattrak, setStattrak] = useState(sp.get("stattrak") === "true");
  const [special, setSpecial] = useState(sp.get("special") === "true");
  const [sort, setSort] = useState(sp.get("sort") ?? "name_asc");
  const [category, setCategory] = useState(sp.get("category") ?? undefined);

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
    if (quality) p.set("quality", quality);
    if (stattrak) p.set("stattrak", "true");
    if (special) p.set("special", "true");
    if (sort) p.set("sort", sort);
    if (category) p.set("category", category);
    
    console.log("🔄 Updating URL with params:", p.toString());
    router.replace(`/skins?${p.toString()}`, { scroll: false });
  }, [q, min, max, rarity, wear, quality, stattrak, special, sort, category, router]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (min) p.set("min", min);
    if (max) p.set("max", max);
    if (rarity) p.set("rarity", rarity);
    if (wear) p.set("wear", wear);
    if (quality) p.set("quality", quality);
    if (stattrak) p.set("stattrak", "true");
    if (special) p.set("special", "true");
    if (sort) p.set("sort", sort);
    if (category) p.set("category", category);
    p.set("page", String(page));
    p.set("pageSize", String(PAGE_SIZE));
    
    const result = p.toString();
    console.log("🔄 Generated queryString:", result);
    return result;
  }, [q, min, max, rarity, wear, quality, stattrak, special, sort, category, page]);

  async function load() {
    console.log("🚀 load() called with queryString:", queryString);
    console.log("🚀 Current filters:", { q, min, max, rarity, wear, quality, stattrak, special, sort, category });
    
    setLoading(true);
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/skins?${queryString}`;
      console.log("🚀 Calling API:", apiUrl);
      
      const res = await fetch(apiUrl);
      const data = await res.json();
      
      console.log("🚀 API Response:", data);
      console.log("🚀 Items count:", data.items?.length || 0);
      
      setItems(prev => page === 1 ? data.items : [...prev, ...data.items]);
      setTotal(data.total);
    } catch (error) {
      console.error("💥 Error loading skins:", error);
    } finally {
      setLoading(false);
    }
  }

  // Initial load & when filters change → reset to page 1 and load
  useEffect(() => { 
    console.log("🔄 Filters changed, resetting to page 1");
    setPage(1); 
  }, [q, min, max, rarity, wear, quality, stattrak, special, sort, category]);
  
  useEffect(() => { 
    console.log("🔄 queryString changed, calling load()");
    load(); 
  }, [queryString]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !loading && items.length < total) {
        console.log("🔄 Loading next page:", page + 1);
        setPage(p => p + 1);
      }
    }, { rootMargin: "200px" });
    
    io.observe(el);
    return () => io.disconnect();
  }, [items.length, total, loading, page]);

  function updateCategory(newCategory: string | undefined) {
    console.log("🔄 updateCategory called with:", newCategory);
    console.log("🔄 Current category state:", category);
    
    if (newCategory === 'all') {
      console.log("🔄 Setting category to undefined (All)");
      setCategory(undefined);
    } else if (category === newCategory) {
      // Toggle off if same category clicked
      console.log("🔄 Toggling off category:", newCategory);
      setCategory(undefined);
    } else {
      console.log("🔄 Setting new category:", newCategory);
      setCategory(newCategory);
    }
    
    console.log("🔄 Category state after update:", category);
  }

  function clearFilters() {
    console.log("🔄 Clearing all filters");
    setQ("");
    setMin("");
    setMax("");
    setRarity("");
    setWear("");
    setQuality("");
    setStattrak(false);
    setSpecial(false);
    setSort("name_asc");
    setCategory(undefined);
  }

  // Filter change handlers with validation
  const handleMinPriceChange = (value: string) => {
    const numValue = value === "" ? "" : Number(value);
    if (numValue === "" || (typeof numValue === "number" && numValue >= 0)) {
      setMin(value);
    }
  };

  const handleMaxPriceChange = (value: string) => {
    const numValue = value === "" ? "" : Number(value);
    if (numValue === "" || (typeof numValue === "number" && numValue >= 0)) {
      setMax(value);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">CS2 Skins Browse</h1>
        
        {/* Weapon Category Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(CS2_CATEGORIES).map(([key, cat]) => {
              const isActive = key === 'all' ? !category : category === key;
              
              return (
                <button
                  key={key}
                  onClick={() => updateCategory(key === 'all' ? undefined : key)}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
                    isActive 
                      ? `${cat.color} text-white shadow-lg transform scale-105` 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Sort Bar */}
        <div className="mb-6">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setSort("popularity_desc")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sort === "popularity_desc" 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Beliebteste
            </button>
            <button
              onClick={() => setSort("price_asc")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sort === "price_asc" 
                  ? "bg-green-600 text-white" 
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Günstigste
            </button>
            <button
              onClick={() => setSort("price_desc")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sort === "price_desc" 
                  ? "bg-red-600 text-white" 
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Teuerste
            </button>
            <button
              onClick={() => setSort("wear_asc")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sort === "wear_asc" 
                  ? "bg-purple-600 text-white" 
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Niedrigste Abnutzung
            </button>
            <button
              onClick={() => setSort("wear_desc")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sort === "wear_desc" 
                  ? "bg-orange-600 text-white" 
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Höchste Abnutzung
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Left Sidebar - Filters */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-gray-800 rounded-xl p-6 sticky top-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-400 hover:text-blue-300 underline"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium mb-2">Search</label>
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search skins..."
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">Price Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={min}
                      onChange={(e) => handleMinPriceChange(e.target.value)}
                      placeholder="Min"
                      className="flex-1 px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={max}
                      onChange={(e) => handleMaxPriceChange(e.target.value)}
                      placeholder="Max"
                      className="flex-1 px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Wear */}
                <div>
                  <label className="block text-sm font-medium mb-2">Wear</label>
                  <select
                    value={wear}
                    onChange={(e) => setWear(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">All Wear</option>
                    <option value="fn">Factory New</option>
                    <option value="mw">Minimal Wear</option>
                    <option value="ft">Field-Tested</option>
                    <option value="ww">Well-Worn</option>
                    <option value="bs">Battle-Scarred</option>
                  </select>
                </div>

                {/* Rarity */}
                <div>
                  <label className="block text-sm font-medium mb-2">Rarity</label>
                  <select
                    value={rarity}
                    onChange={(e) => setRarity(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">All Rarities</option>
                    <option value="Consumer Grade">Consumer Grade</option>
                    <option value="Industrial Grade">Industrial Grade</option>
                    <option value="Mil-Spec">Mil-Spec</option>
                    <option value="Restricted">Restricted</option>
                    <option value="Classified">Classified</option>
                    <option value="Covert">Covert</option>
                    <option value="Contraband">Contraband</option>
                  </select>
                </div>

                {/* Quality */}
                <div>
                  <label className="block text-sm font-medium mb-2">Quality</label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">All Qualities</option>
                    <option value="Normal">Normal</option>
                    <option value="StatTrak">StatTrak</option>
                    <option value="Souvenir">Souvenir</option>
                  </select>
                </div>

                {/* Boolean Filters */}
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={stattrak}
                      onChange={(e) => setStattrak(e.target.checked)}
                      className="mr-2 rounded"
                    />
                    StatTrak
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={special}
                      onChange={(e) => setSpecial(e.target.checked)}
                      className="mr-2 rounded"
                    />
                    Special (Star)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Results */}
          <div className="flex-1">
            {/* Results Info */}
            <div className="mb-6">
              <p className="text-gray-400 text-center">
                Showing {items.length} of {total} skins
              </p>
            </div>

            {/* Skin Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
      </div>
    </div>
  );
}
