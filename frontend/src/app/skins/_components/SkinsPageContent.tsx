// frontend/src/app/skins/_components/SkinsPageContent.tsx — [Frontend]
// {/* Main content component with useSearchParams and filters */}
"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SkinGrid from "../SkinGrid";

// Feature flag for enhanced filters
const SKINS_FILTERS_ENHANCED = process.env.NEXT_PUBLIC_SKINS_FILTERS_ENHANCED === 'true';

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

// Filter presets for enhanced UX
const FILTER_PRESETS = [
  { name: "Under $10", params: { min: "", max: "10" } },
  { name: "Under $50", params: { min: "", max: "50" } },
  { name: "High Liquidity", params: { sort: "popularity_desc" } },
  { name: "Newest", params: { sort: "newest" } },
  { name: "Clear All", params: {} }
];

// Enhanced filter presets based on user requirements
interface PresetParams {
  min?: string;
  max?: string;
  sort?: string;
  wear?: string;
  rarity?: string;
  stattrak?: string;
  special?: string;
  q?: string;
}

interface Preset {
  name: string;
  params: PresetParams;
}

const ENHANCED_FILTER_PRESETS: Record<string, Preset[]> = {
  // Budget Presets
  budget: [
    { name: "Under $5", params: { max: "5", sort: "price_asc" } },
    { name: "Under $10", params: { max: "10", sort: "price_asc" } },
    { name: "$10–$50", params: { min: "10", max: "50", sort: "price_asc" } },
    { name: "$50–$100", params: { min: "50", max: "100" } },
    { name: "$100–$500", params: { min: "100", max: "500" } },
    { name: "$500+", params: { min: "500", sort: "price_desc" } }
  ],
  
  // Wear Presets (will be populated from DB)
  wear: [],
  
  // Rarity Presets (will be populated from DB)
  rarity: [],
  
  // StatTrak & Star
  special: [
    { name: "StatTrak only", params: { stattrak: "true" } },
    { name: "Non-StatTrak", params: { stattrak: "false" } },
    { name: "★ Star items", params: { special: "true" } }
  ],
  
  // Category Presets via Search
  category: [
    { name: "Knives", params: { q: "★" } },
    { name: "Gloves", params: { q: "Gloves" } },
    { name: "Stickers", params: { q: "Sticker |" } },
    { name: "Souvenir", params: { q: "Souvenir " } },
    { name: "AK-47", params: { q: "AK-47" } },
    { name: "M4A1-S", params: { q: "M4A1-S" } },
    { name: "AWP", params: { q: "AWP" } }
  ],
  
  // Finish/Theme Presets
  finish: [
    { name: "Doppler", params: { q: "Doppler" } },
    { name: "Case Hardened", params: { q: "Case Hardened" } },
    { name: "Crimson Web", params: { q: "Crimson Web" } },
    { name: "Gold Stickers", params: { q: "(Gold)" } }
  ],
  
  // Combined Presets
  combined: [
    { name: "Budget Play Skins", params: { max: "10", wear: "Field-Tested", sort: "price_asc" } },
    { name: "Covert FN", params: { rarity: "Covert", wear: "Factory New", sort: "price_desc" } },
    { name: "★ Premium Knives", params: { special: "true", min: "200", sort: "price_desc" } },
    { name: "Souvenir FN", params: { q: "Souvenir ", wear: "Factory New", sort: "price_desc" } },
    { name: "Stickers <$5", params: { q: "Sticker |", max: "5", sort: "price_asc" } }
  ],
  
  // Sort Presets
  sort: [
    { name: "Price ↑", params: { sort: "price_asc" } },
    { name: "Price ↓", params: { sort: "price_desc" } },
    { name: "Newest", params: { sort: "newest" } },
    { name: "A→Z", params: { sort: "name_asc" } },
    { name: "Z→A", params: { sort: "name_desc" } }
  ]
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
  const [page, setPage] = useState(1);

  // Enhanced features state
  const [debouncedQ, setDebouncedQ] = useState(q);

  // Preset values from backend
  const [presetValues, setPresetValues] = useState<{
    wears: string[];
    rarities: string[];
  }>({ wears: [], rarities: [] });

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
    }, SKINS_FILTERS_ENHANCED ? 300 : 0);

    return () => clearTimeout(timer);
  }, [q, SKINS_FILTERS_ENHANCED]);

  // Enhanced search input handler
  const handleSearchChange = useCallback((value: string) => {
    setQ(value);
    // Reset page when search changes
    setPage(1);
  }, []);

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



  // Initial load & when filters change → reset to page 1
  useEffect(() => { 
    console.log("🔄 Filters changed, resetting to page 1");
    setPage(1); 
  }, [q, min, max, rarity, wear, quality, stattrak, special, sort, category]);
  
  // Load preset values from backend
  useEffect(() => {
    async function loadPresetValues() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/skins/presets`);
        if (res.ok) {
          const data = await res.json();
          setPresetValues(data);
          
          // Populate wear and rarity presets with DB values
          ENHANCED_FILTER_PRESETS.wear = data.wears.map((wear: string) => ({
            name: wear,
            params: { wear }
          }));
          
          ENHANCED_FILTER_PRESETS.rarity = data.rarities.map((rarity: string) => ({
            name: rarity,
            params: { rarity }
          }));
        }
      } catch (error) {
        console.error("Failed to load preset values:", error);
      }
    }
    
    loadPresetValues();
  }, []);

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

  // Enhanced filter preset handler
  const applyFilterPreset = useCallback((preset: any) => {
    console.log("🔄 Applying filter preset:", preset.name);
    
    if (preset.name === "Clear All") {
      clearFilters();
      return;
    }
    
    // Apply preset parameters
    if (preset.params.min !== undefined) setMin(preset.params.min);
    if (preset.params.max !== undefined) setMax(preset.params.max);
    if (preset.params.sort !== undefined) setSort(preset.params.sort);
    if (preset.params.wear !== undefined) setWear(preset.params.wear);
    if (preset.params.rarity !== undefined) setRarity(preset.params.rarity);
    if (preset.params.stattrak !== undefined) setStattrak(preset.params.stattrak === "true");
    if (preset.params.special !== undefined) setSpecial(preset.params.special === "true");
    if (preset.params.q !== undefined) setQ(preset.params.q);
    
    // Reset to page 1 when applying presets
    setPage(1);
  }, []);

  // Copy current URL to clipboard
  const copyCurrentLink = useCallback(async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      console.log("🔗 Link copied to clipboard:", currentUrl);
      // Could add a toast notification here
    } catch (error) {
      console.error("💥 Failed to copy link:", error);
    }
  }, []);

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
              Most Popular
            </button>
            <button
              onClick={() => setSort("price_asc")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sort === "price_asc" 
                  ? "bg-green-600 text-white" 
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Cheapest
            </button>
            <button
              onClick={() => setSort("price_desc")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sort === "price_desc" 
                  ? "bg-red-600 text-white" 
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Most Expensive
            </button>
            <button
              onClick={() => setSort("wear_asc")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sort === "wear_asc" 
                  ? "bg-purple-600 text-white" 
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Lowest Wear
            </button>
            <button
              onClick={() => setSort("wear_desc")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sort === "wear_desc" 
                  ? "bg-orange-600 text-white" 
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Highest Wear
            </button>
          </div>
        </div>

        {/* Enhanced Filter Presets (Feature Flag) */}
        {SKINS_FILTERS_ENHANCED && (
          <div className="mb-6 space-y-4">
            {/* Budget Presets */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2 text-center">Budget</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {ENHANCED_FILTER_PRESETS.budget.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyFilterPreset(preset)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Wear Presets */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2 text-center">Wear</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {ENHANCED_FILTER_PRESETS.wear.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyFilterPreset(preset)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Rarity Presets */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2 text-center">Rarity</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {ENHANCED_FILTER_PRESETS.rarity.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyFilterPreset(preset)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Special Presets */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2 text-center">Special</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {ENHANCED_FILTER_PRESETS.special.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyFilterPreset(preset)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Presets */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2 text-center">Categories</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {ENHANCED_FILTER_PRESETS.category.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyFilterPreset(preset)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Finish Presets */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2 text-center">Finishes</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {ENHANCED_FILTER_PRESETS.finish.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyFilterPreset(preset)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Combined Presets */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2 text-center">Combined</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {ENHANCED_FILTER_PRESETS.combined.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyFilterPreset(preset)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Presets */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2 text-center">Sort</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {ENHANCED_FILTER_PRESETS.sort.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyFilterPreset(preset)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-8">
          {/* Left Sidebar - Filters */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-gray-800 rounded-xl p-6 sticky top-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Filters</h3>
                <div className="flex gap-2">
                  {SKINS_FILTERS_ENHANCED && (
                    <button
                      onClick={copyCurrentLink}
                      className="text-sm text-blue-400 hover:text-blue-300 underline"
                      title="Copy current filter URL"
                    >
                      Copy Link
                    </button>
                  )}
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Enhanced Search with Debouncing */}
                <div>
                  <label className="block text-sm font-medium mb-2">Search</label>
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search skins..."
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                  {SKINS_FILTERS_ENHANCED && (
                    <p className="text-xs text-gray-500 mt-1">
                      {q !== debouncedQ ? "Typing..." : "Ready"}
                    </p>
                  )}
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
            {/* Enhanced Results Info */}
            <div className="mb-6">
              <div className="text-center space-y-2">
                <p className="text-gray-400">
                  Browse CS2 skins with advanced filtering
                </p>
                {SKINS_FILTERS_ENHANCED && (
                  <div className="text-xs text-gray-600">
                    Enhanced filters enabled
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Skin Grid with Better Empty State */}
            <SkinGrid 
              filters={{
                q: debouncedQ,
                min: min ? Number(min) : undefined,
                max: max ? Number(max) : undefined,
                rarity,
                wear,
                quality,
                stattrak: stattrak || undefined,
                special: special || undefined,
                sort,
                category,
                page,
                pageSize: PAGE_SIZE
              }}
              showSkeleton={true}
              skeletonCount={6}
            />

          </div>
        </div>
      </div>
    </div>
  );
}
