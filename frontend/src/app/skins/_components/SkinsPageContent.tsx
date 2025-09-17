// frontend/src/app/skins/_components/SkinsPageContent.tsx — [Frontend]
// {/* Main content component with useSearchParams and filters */}
"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Search, X } from "lucide-react";
import SkinGrid from "../SkinGrid";
import { apiUrl, fetchJson } from "@/lib/api";
import { saveFiltersToSession, loadFiltersFromSession, clearFiltersFromSession } from "@/lib/storage";

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

// P3: Advanced Filter Options
const WEAPON_TYPES = [
  "AK-47", "M4A1-S", "M4A4", "AWP", "AUG", "SG 553", "Galil AR", "FAMAS",
  "Glock-18", "USP-S", "P250", "Tec-9", "Five-SeveN", "CZ75-Auto", "Desert Eagle", "R8 Revolver",
  "P2000", "Dual Berettas", "P90", "PP-Bizon", "MP7", "MP9", "UMP-45", "MAC-10", "MP5-SD",
  "Nova", "XM1014", "Sawed-Off", "MAG-7", "M249", "Negev", "MAG-7", "Sawed-Off"
];

const COLLECTIONS = [
  "The Dust 2 Collection", "The Mirage Collection", "The Cache Collection", "The Cobblestone Collection",
  "The Overpass Collection", "The Train Collection", "The Inferno Collection", "The Nuke Collection",
  "The Vertigo Collection", "The Ancient Collection", "The Anubis Collection", "The Office Collection",
  "The Italy Collection", "The Militia Collection", "The Assault Collection", "The Office Collection",
  "The Militia Collection", "The Assault Collection", "The Office Collection", "The Militia Collection"
];

const FINISHES = [
  "Doppler", "Case Hardened", "Crimson Web", "Fade", "Slaughter", "Tiger Tooth", "Marble Fade",
  "Dragon Lore", "Howl", "Fire Serpent", "Vulcan", "Asiimov", "Redline", "Vulcan", "Asiimov",
  "Redline", "Vulcan", "Asiimov", "Redline", "Vulcan", "Asiimov", "Redline", "Vulcan", "Asiimov"
];

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
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(sp.get("q") || "");
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedWear, setSelectedWear] = useState<string[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<string[]>([]);
  const [stattrakEnabled, setStattrakEnabled] = useState(false);
  const [specialEnabled, setSpecialEnabled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("price_asc");

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

  // P3: Advanced Filter States
  const [weaponType, setWeaponType] = useState(sp.get("weaponType") ?? "");
  const [collection, setCollection] = useState(sp.get("collection") ?? "");
  const [finish, setFinish] = useState(sp.get("finish") ?? "");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [enableInfiniteScroll, setEnableInfiniteScroll] = useState(true);

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

  // P3: Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on "/" key
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const searchInput = document.getElementById("search");
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // Clear filters on Escape
      if (e.key === "Escape") {
        clearFilters();
      }
      
      // Quick sort shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            setSort("popularity_desc");
            break;
          case "2":
            e.preventDefault();
            setSort("price_asc");
            break;
          case "3":
            e.preventDefault();
            setSort("price_desc");
            break;
          case "4":
            e.preventDefault();
            setSort("newest");
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    if (weaponType) p.set("weaponType", weaponType);
    if (collection) p.set("collection", collection);
    if (finish) p.set("finish", finish);
    
    console.log("🔄 Updating URL with params:", p.toString());
    router.replace(`/skins?${p.toString()}`, { scroll: false });
  }, [q, min, max, rarity, wear, quality, stattrak, special, sort, category, weaponType, collection, finish, router]);

  // Filters Persistence
  useEffect(() => {
    saveFiltersToSession({
      q,
      min,
      max,
      rarity,
      wear,
      stattrak,
      special,
      sort,
      category,
      weaponType,
      collection,
      finish,
      page
    });
  }, [q, min, max, rarity, wear, stattrak, special, sort, category, weaponType, collection, finish, page]);



  // Initial load & when filters change → reset to page 1
  useEffect(() => { 
    console.log("🔄 Filters changed, resetting to page 1");
    setPage(1); 
  }, [q, min, max, rarity, wear, quality, stattrak, special, sort, category]);
  
  // Load preset values from backend
  useEffect(() => {
    async function loadPresetValues() {
      try {
        const data = await fetchJson<{wears: string[], rarities: string[]}>(apiUrl('/api/v1/skins/presets'));
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
      } catch (error) {
        console.error("Failed to load preset values:", error);
        // Set fallback values to prevent UI crashes
        setPresetValues({
          wears: ['fn', 'mw', 'ft', 'ww', 'bs'],
          rarities: ['Consumer Grade', 'Industrial Grade', 'Mil-Spec', 'Restricted', 'Classified', 'Covert']
        });
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
    setWeaponType("");
    setCollection("");
    setFinish("");
    clearFiltersFromSession();
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

  // P3: Export/Import Filter URLs
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

  const exportFilters = useCallback(() => {
    const filters = {
      q, min, max, rarity, wear, quality, stattrak, special, sort, category,
      weaponType, collection, finish
    };
    const dataStr = JSON.stringify(filters, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cs2-skin-filters.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [q, min, max, rarity, wear, quality, stattrak, special, sort, category, weaponType, collection, finish]);

  const importFilters = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const filters = JSON.parse(e.target?.result as string);
        if (filters.q !== undefined) setQ(filters.q);
        if (filters.min !== undefined) setMin(filters.min);
        if (filters.max !== undefined) setMax(filters.max);
        if (filters.rarity !== undefined) setRarity(filters.rarity);
        if (filters.wear !== undefined) setWear(filters.wear);
        if (filters.quality !== undefined) setQuality(filters.quality);
        if (filters.stattrak !== undefined) setStattrak(filters.stattrak);
        if (filters.special !== undefined) setSpecial(filters.special);
        if (filters.sort !== undefined) setSort(filters.sort);
        if (filters.category !== undefined) setCategory(filters.category);
        if (filters.weaponType !== undefined) setWeaponType(filters.weaponType);
        if (filters.collection !== undefined) setCollection(filters.collection);
        if (filters.finish !== undefined) setFinish(filters.finish);
        console.log("📥 Filters imported successfully");
      } catch (error) {
        console.error("💥 Failed to import filters:", error);
      }
    };
    reader.readAsText(file);
  }, []);

  // P3: Load More Handler
  const handleLoadMore = useCallback(() => {
    setPage(prev => prev + 1);
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Filters */}
          <div className="w-full lg:w-80 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enhanced Search with Debouncing */}
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="e.g. AK-47"
                      value={q}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10 focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      aria-label="Search skins"
                      aria-describedby="search-description"
                    />
                  </div>
                  {SKINS_FILTERS_ENHANCED && (
                    <p className="text-xs text-muted-foreground">
                      {q !== debouncedQ ? "Typing..." : "Ready"}
                    </p>
                  )}
                </div>

                {/* Price Range */}
                <div className="space-y-4">
                  <Label>Price Range</Label>
                  <div className="space-y-4">
                    <Slider
                      value={[min ? Number(min) : 0, max ? Number(max) : 5000]}
                      onValueChange={([minVal, maxVal]) => {
                        setMin(minVal.toString());
                        setMax(maxVal.toString());
                      }}
                      max={5000}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Min"
                        value={min}
                        onChange={(e) => handleMinPriceChange(e.target.value)}
                        className="w-20"
                      />
                      <Input
                        placeholder="Max"
                        value={max}
                        onChange={(e) => handleMaxPriceChange(e.target.value)}
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>

                {/* Wear */}
                <div className="space-y-3">
                  <Label>Wear</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "fn", name: "FN", fullName: "Factory New" },
                      { id: "mw", name: "MW", fullName: "Minimal Wear" },
                      { id: "ft", name: "FT", fullName: "Field-Tested" },
                      { id: "ww", name: "WW", fullName: "Well-Worn" },
                      { id: "bs", name: "BS", fullName: "Battle-Scarred" }
                    ].map((wearOption) => (
                      <Button
                        key={wearOption.id}
                        variant={wear === wearOption.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setWear(wear === wearOption.id ? "" : wearOption.id)}
                      >
                        {wearOption.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Rarity */}
                <div className="space-y-3">
                  <Label>Rarity</Label>
                  <div className="space-y-2">
                    {[
                      "Covert",
                      "Classified", 
                      "Restricted",
                      "Mil-Spec"
                    ].map((rarityOption) => (
                      <div key={rarityOption} className="flex items-center space-x-2">
                        <Checkbox
                          id={rarityOption}
                          checked={rarity === rarityOption}
                          onCheckedChange={(checked) => {
                            setRarity(checked ? rarityOption : "");
                          }}
                        />
                        <Label htmlFor={rarityOption} className="text-sm">
                          {rarityOption}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* StatTrak */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="stattrak">StatTrak™</Label>
                  <Switch
                    id="stattrak"
                    checked={stattrak}
                    onCheckedChange={setStattrak}
                  />
                </div>

                {/* Special */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="special">Special (Star)</Label>
                  <Switch
                    id="special"
                    checked={special}
                    onCheckedChange={setSpecial}
                  />
                </div>

                {/* P3: Advanced Filters Toggle */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="w-full justify-between"
                  >
                    Advanced Filters
                    <span className={`transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </Button>
                  
                  {showAdvancedFilters && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      {/* Weapon Type */}
                      <div className="space-y-2">
                        <Label htmlFor="weaponType">Weapon Type</Label>
                        <Select value={weaponType} onValueChange={setWeaponType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select weapon type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Weapons</SelectItem>
                            {WEAPON_TYPES.map((weapon) => (
                              <SelectItem key={weapon} value={weapon}>
                                {weapon}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Collection */}
                      <div className="space-y-2">
                        <Label htmlFor="collection">Collection</Label>
                        <Select value={collection} onValueChange={setCollection}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select collection" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Collections</SelectItem>
                            {COLLECTIONS.map((col) => (
                              <SelectItem key={col} value={col}>
                                {col}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Finish */}
                      <div className="space-y-2">
                        <Label htmlFor="finish">Finish</Label>
                        <Select value={finish} onValueChange={setFinish}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select finish" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Finishes</SelectItem>
                            {FINISHES.map((fin) => (
                              <SelectItem key={fin} value={fin}>
                                {fin}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* P3: Export/Import Filters */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button onClick={copyCurrentLink} variant="outline" size="sm" className="flex-1">
                      Copy Link
                    </Button>
                    <Button onClick={exportFilters} variant="outline" size="sm" className="flex-1">
                      Export
                    </Button>
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={importFilters}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" size="sm" className="w-full">
                      Import Filters
                    </Button>
                  </div>
                </div>

                {/* Clear Filters Button */}
                <Button onClick={clearFilters} variant="outline" className="w-full">
                  Clear All
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold">Browse Skins</h1>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2">
              {Object.entries(CS2_CATEGORIES).map(([key, cat]) => {
                const isActive = key === 'all' ? !category : category === key;
                return (
                  <Button
                    key={key}
                    variant={isActive ? "default" : "outline"}
                    onClick={() => updateCategory(key === 'all' ? undefined : key)}
                  >
                    {cat.name}
                  </Button>
                );
              })}
            </div>

            {/* P3: Filter Presets */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Label className="text-sm font-medium">Quick Filters:</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMin("");
                      setMax("5");
                      setSort("price_asc");
                      clearFilters();
                    }}
                  >
                    Under $5
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMin("");
                      setMax("25");
                      setSort("price_asc");
                      clearFilters();
                    }}
                  >
                    Under $25
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMin("100");
                      setMax("500");
                      setSort("price_desc");
                      clearFilters();
                    }}
                  >
                    $100-$500
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMin("500");
                      setMax("");
                      setSort("price_desc");
                      clearFilters();
                    }}
                  >
                    $500+
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMin("1000");
                      setMax("");
                      setSort("price_desc");
                      clearFilters();
                    }}
                  >
                    High Value
                  </Button>
                </div>
              </div>
            </div>

            {/* P3: Sort Presets */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Label className="text-sm font-medium">Quick Sort:</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={sort === "popularity_desc" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSort("popularity_desc")}
                  >
                    Most Popular
                  </Button>
                  <Button
                    variant={sort === "price_asc" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSort("price_asc")}
                  >
                    Cheapest
                  </Button>
                  <Button
                    variant={sort === "price_desc" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSort("price_desc")}
                  >
                    Most Expensive
                  </Button>
                  <Button
                    variant={sort === "wear_asc" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSort("wear_asc")}
                  >
                    Lowest Wear
                  </Button>
                  <Button
                    variant={sort === "wear_desc" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSort("wear_desc")}
                  >
                    Highest Wear
                  </Button>
                  <Button
                    variant={sort === "newest" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSort("newest")}
                  >
                    Newest
                  </Button>
                  <Button
                    variant={sort === "name_asc" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSort("name_asc")}
                  >
                    A→Z
                  </Button>
                  <Button
                    variant={sort === "name_desc" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSort("name_desc")}
                  >
                    Z→A
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(category || rarity || stattrak || weaponType || collection || finish) && (
              <div className="flex items-center gap-2 flex-wrap">
                {category && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {CS2_CATEGORIES[category as keyof typeof CS2_CATEGORIES]?.name}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setCategory(undefined)}
                    />
                  </Badge>
                )}
                {rarity && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {rarity}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setRarity("")}
                    />
                  </Badge>
                )}
                {stattrak && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    StatTrak™
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setStattrak(false)}
                    />
                  </Badge>
                )}
                {weaponType && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {weaponType}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setWeaponType("")}
                    />
                  </Badge>
                )}
                {collection && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {collection}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setCollection("")}
                    />
                  </Badge>
                )}
                {finish && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {finish}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFinish("")}
                    />
                  </Badge>
                )}
                <Button variant="link" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>
            )}

            {/* Results Count and Sort */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Browse CS2 skins with advanced filtering
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="sort">Sort by:</Label>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="name_asc">Name: A to Z</SelectItem>
                    <SelectItem value="name_desc">Name: Z to A</SelectItem>
                    <SelectItem value="popularity_desc">Most Popular</SelectItem>
                    <SelectItem value="wear_asc">Lowest Wear</SelectItem>
                    <SelectItem value="wear_desc">Highest Wear</SelectItem>
                  </SelectContent>
                </Select>
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
                weaponType,
                collection,
                finish,
                page,
                pageSize: PAGE_SIZE
              }}
              showSkeleton={true}
              skeletonCount={6}
              enableInfiniteScroll={enableInfiniteScroll}
              onLoadMore={handleLoadMore}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
