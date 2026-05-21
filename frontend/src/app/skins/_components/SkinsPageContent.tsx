// frontend/src/app/skins/_components/SkinsPageContent.tsx — [Frontend]
// {/* Main content component with useSearchParams and filters */}
"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Share2, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { EnhancedSkinGrid } from "./EnhancedSkinGrid";
import { EnhancedFilterSidebar } from "./EnhancedFilterSidebar";
import { apiUrl, fetchJson } from "@/lib/api";
import { saveFiltersToSession, clearFiltersFromSession } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@clerk/nextjs";

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
  // Price fields from our realistic price generation
  priceLatest?: number;
  priceMedian?: number;
  priceAvg?: number;
  priceSafe?: number;
  priceMin?: number;
  priceMax?: number;
  priceMedian24h?: number;
  priceMedian7d?: number;
  priceMedian30d?: number;
  priceMedian90d?: number;
  priceAvg24h?: number;
  priceAvg7d?: number;
  priceAvg30d?: number;
  priceAvg90d?: number;
  // Market data
  soldToday?: number;
  sold24h?: number;
  sold7d?: number;
  sold30d?: number;
  sold90d?: number;
  soldTotal?: number;
  hoursToSold?: number;
  offerVolume?: number;
  buyOrderVolume?: number;
  priceUpdatedAt?: string;
};

// Standard CS2 categories like skinbid.com - Updated with new palette
// Skin-only categories. Backend `itemType` IN clause uses these values directly.
// "machine_guns" matches the backfill in scripts/backfill-weapon-types.js + weaponClassifier.js.
const CS2_CATEGORIES = {
  all:          { name: "All" },
  knives:       { name: "Knives" },
  gloves:       { name: "Gloves" },
  pistols:      { name: "Pistols" },
  smgs:         { name: "SMGs" },
  rifles:       { name: "Rifles" },
  shotguns:     { name: "Shotguns" },
  machine_guns: { name: "Machine Guns" },
};

// Non-skin tabs that should redirect to the relevant catalog page.
// We still render them as tabs so the user has one mental model for "browse CS2 catalog".
const EXTERNAL_TABS = [
  { name: "Stickers", href: "/items?category=sticker" },
  { name: "Agents",   href: "/items?category=agent"   },
  { name: "Patches",  href: "/items?category=patch"   },
  { name: "Cases",    href: "/cases"                  },
] as const;

const PAGE_SIZE = 24;

export function SkinsPageContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const { getToken } = useAuth();
  
  // Filter states
  // (Removed: 8 unused state vars that were set but never read. — cleanup pass)

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

  // Enhanced features state
  const [debouncedQ, setDebouncedQ] = useState(q);

  // Total result count comes from EnhancedSkinGrid via callback (it owns the data hook now).
  const [total, setTotal] = useState<number | null>(null);

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

  // {/* Debounced search & apply behavior */}
  // Check if filters have changed (for mobile sticky apply)
  const [hasFilterChanges, setHasFilterChanges] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Track filter changes for mobile sticky apply
  useEffect(() => {
    const hasChanges = !!(q || min || max || rarity || wear || stattrak || special || weaponType || collection || finish || category);
    setHasFilterChanges(hasChanges);
  }, [q, min, max, rarity, wear, stattrak, special, weaponType, collection, finish, category]);

  // {/* Scroll restoration & back-to-top */}
  // P2: Scroll restoration and back-to-top functionality
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Save scroll position on navigation
  useEffect(() => {
    const saveScrollPosition = () => {
      sessionStorage.setItem('skins-scroll-position', window.scrollY.toString());
    };

    window.addEventListener('beforeunload', saveScrollPosition);
    return () => window.removeEventListener('beforeunload', saveScrollPosition);
  }, []);

  // Restore scroll position on mount
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('skins-scroll-position');
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition));
      sessionStorage.removeItem('skins-scroll-position');
    }
  }, []);

  // Show/hide back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > window.innerHeight);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // {/* Filter presets */}
  // P3: Filter presets functionality
  const [savedPresets, setSavedPresets] = useState<Record<string, any>>({});
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [presetName, setPresetName] = useState('');

  // {/* Batch selection & actions */}
  // P3: Batch actions functionality
  const [selectedSkins, setSelectedSkins] = useState<Set<number>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  // Load saved presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('skins-filter-presets');
    if (saved) {
      try {
        setSavedPresets(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved presets:', error);
      }
    }
  }, []);

  // Save current filters as preset
  const saveCurrentPreset = () => {
    if (!presetName.trim()) return;

    const currentFilters = {
      q, min, max, rarity, wear, quality, stattrak, special, 
      category, weaponType, collection, finish, sort
    };

    const newPresets = {
      ...savedPresets,
      [presetName]: {
        ...currentFilters,
        savedAt: new Date().toISOString(),
        name: presetName
      }
    };

    setSavedPresets(newPresets);
    localStorage.setItem('skins-filter-presets', JSON.stringify(newPresets));
    setPresetName('');
    setShowPresetDialog(false);
    toast.success(`Preset "${presetName}" saved!`);
  };

  // Apply saved preset
  const applyPreset = (presetKey: string) => {
    const preset = savedPresets[presetKey];
    if (!preset) return;

    setQ(preset.q || '');
    setMin(preset.min || '');
    setMax(preset.max || '');
    setRarity(preset.rarity || '');
    setWear(preset.wear || '');
    setQuality(preset.quality || '');
    setStattrak(preset.stattrak || false);
    setSpecial(preset.special || false);
    setCategory(preset.category || undefined);
    setWeaponType(preset.weaponType || '');
    setCollection(preset.collection || '');
    setFinish(preset.finish || '');
    setSort(preset.sort || 'name_asc');
    // Page is automatically reset by useInfiniteSkins hook

    toast.success(`Applied preset "${preset.name}"`);
  };

  // Delete preset
  const deletePreset = (presetKey: string) => {
    const newPresets = { ...savedPresets };
    delete newPresets[presetKey];
    setSavedPresets(newPresets);
    localStorage.setItem('skins-filter-presets', JSON.stringify(newPresets));
    toast.success('Preset deleted');
  };

  // Share current filters as URL
  const shareCurrentFilters = () => {
    const searchParams = new URLSearchParams();
    
    if (q) searchParams.set('q', q);
    if (min) searchParams.set('priceMin', min);
    if (max) searchParams.set('priceMax', max);
    if (rarity) searchParams.set('rarity', rarity);
    if (wear) searchParams.set('wear', wear);
    if (quality) searchParams.set('quality', quality);
    if (stattrak) searchParams.set('st', 'true');
    if (special) searchParams.set('special', 'true');
    if (category) searchParams.set('category', category);
    if (weaponType) searchParams.set('weaponType', weaponType);
    if (collection) searchParams.set('collection', collection);
    if (finish) searchParams.set('finish', finish);
    if (sort) searchParams.set('sort', sort);

    const shareUrl = `${window.location.origin}${window.location.pathname}?${searchParams.toString()}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Filter URL copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Filter URL copied to clipboard!');
    });
  };

  // Batch action functions
  const toggleSkinSelection = (skinId: number) => {
    const newSelection = new Set(selectedSkins);
    if (newSelection.has(skinId)) {
      newSelection.delete(skinId);
    } else {
      newSelection.add(skinId);
    }
    setSelectedSkins(newSelection);
  };

  const selectAllSkins = () => {
    // This would need to be implemented with the actual skin data
    // For now, we'll show a placeholder
    toast.info('Select all functionality requires skin data access');
  };

  const clearSelection = () => {
    setSelectedSkins(new Set());
  };

  const addSelectedToWatchlist = async () => {
    if (selectedSkins.size === 0) return;

    setBatchLoading(true);
    try {
      const token = await getToken({ template: "backend" });
      const promises = Array.from(selectedSkins).map(skinId =>
        fetchJson(apiUrl('/api/v1/watchlist'), {
          method: "POST",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ skinId }),
        })
      );
      
      await Promise.all(promises);
      toast.success(`${selectedSkins.size} skins added to watchlist!`);
      clearSelection();
    } catch (error) {
      toast.error('Failed to add skins to watchlist');
      console.error('Batch watchlist error:', error);
    } finally {
      setBatchLoading(false);
    }
  };

  const addSelectedToPortfolio = async () => {
    if (selectedSkins.size === 0) return;

    setBatchLoading(true);
    try {
      const token = await getToken({ template: "backend" });
      // Fetch each skin to get current price (batch endpoint not available yet)
      const promises = Array.from(selectedSkins).map(async (skinId) => {
        const skinRes = await fetchJson<any>(apiUrl(`/api/v1/skins/${skinId}`));
        const skin = skinRes?.success ? skinRes.data : skinRes;
        const buyPrice = skin?.priceMedian ?? skin?.priceLatest ?? null;
        if (buyPrice == null || buyPrice <= 0) {
          throw new Error(`Skin ${skinId} has no price data`);
        }
        return fetchJson(apiUrl('/api/v1/portfolio'), {
          method: "POST",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            skinId,
            amount: 1,
            buyPrice,
            buyDate: new Date().toISOString(),
          }),
        });
      });

      await Promise.all(promises);
      toast.success(`${selectedSkins.size} skins added to portfolio!`);
      clearSelection();
    } catch (error) {
      toast.error('Failed to add skins to portfolio');
      console.error('Batch portfolio error:', error);
    } finally {
      setBatchLoading(false);
    }
  };

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
    // Page is automatically reset by useInfiniteSkins hook when filters change
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
      finish
    });
  }, [q, min, max, rarity, wear, stattrak, special, sort, category, weaponType, collection, finish]);



  // (Pagination reset on filter change is now handled internally by useInfiniteSkins via SWRInfinite key change.)
  
  // Load preset values from backend
  useEffect(() => {
    async function loadPresetValues() {
      try {
        const data = await fetchJson<{wears: string[], rarities: string[]}>(apiUrl('/api/v1/skins/presets'));
        setPresetValues(data);
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
    if (newCategory === 'all') {
      setCategory(undefined);
    } else if (category === newCategory) {
      // Toggle off if same category clicked
      setCategory(undefined);
    } else {
      setCategory(newCategory);
    }
  }

  function clearFilters() {
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

  // P3: Export/Import Filter URLs
  const copyCurrentLink = useCallback(async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
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
      } catch (error) {
        console.error("💥 Failed to import filters:", error);
      }
    };
    reader.readAsText(file);
  }, []);

  // P3: Load More Handler - now handled by useInfiniteSkins hook

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
    <AppShell
      eyebrow="Catalog"
      title="Skins"
      description="Browse, filter, and add CS2 skins to your watchlist or portfolio."
      maxWidth="7xl"
    >
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Enhanced Filters */}
          <div className="w-full lg:w-80">
            <EnhancedFilterSidebar
              filters={{
                q,
                min,
                max,
                rarity,
                wear,
                quality,
                stattrak,
                special,
                sort,
                category,
                weaponType,
                collection,
                finish,
              }}
              onFilterChange={(key, value) => {
                switch (key) {
                  case 'q': setQ(value); break;
                  case 'min': setMin(value); break;
                  case 'max': setMax(value); break;
                  case 'rarity': setRarity(value); break;
                  case 'wear': setWear(value); break;
                  case 'quality': setQuality(value); break;
                  case 'stattrak': setStattrak(value); break;
                  case 'special': setSpecial(value); break;
                  case 'sort': setSort(value); break;
                  case 'category': setCategory(value); break;
                  case 'weaponType': setWeaponType(value); break;
                  case 'collection': setCollection(value); break;
                  case 'finish': setFinish(value); break;
                }
              }}
              onClearFilters={clearFilters}
              onSavePreset={() => setShowPresetDialog(true)}
              onShareFilters={shareCurrentFilters}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-5">
            {/* Active filter chips & result count */}
            <div className="space-y-4">
              {/* Result Count — mono tabular numbers */}
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-semibold text-white tabular-nums">
                  {total != null ? total.toLocaleString("en-GB") : "—"}
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  results
                </span>
              </div>
              
              {/* Active Filter Chips */}
              {(q || min || max || rarity || wear || stattrak || special || weaponType || collection || finish || category) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
                  
                  {q && (
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-1 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    >
                      Search: "{q}"
                      <button
                        className="h-3 w-3 cursor-pointer hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
                        onClick={() => setQ("")}
                        aria-label={`Remove search filter: ${q}`}
                        tabIndex={0}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {category && (
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-1 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    >
                      {CS2_CATEGORIES[category as keyof typeof CS2_CATEGORIES]?.name}
                      <button
                        className="h-3 w-3 cursor-pointer hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
                        onClick={() => setCategory(undefined)}
                        aria-label={`Remove category filter: ${CS2_CATEGORIES[category as keyof typeof CS2_CATEGORIES]?.name}`}
                        tabIndex={0}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {rarity && (
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-1 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    >
                      {rarity}
                      <button
                        className="h-3 w-3 cursor-pointer hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
                        onClick={() => setRarity("")}
                        aria-label={`Remove rarity filter: ${rarity}`}
                        tabIndex={0}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {wear && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    >
                      Wear: {wear.split(',').map(w => w.trim().toUpperCase()).filter(Boolean).join(' + ')}
                      <button
                        className="h-3 w-3 cursor-pointer hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
                        onClick={() => setWear("")}
                        aria-label={`Remove wear filter: ${wear}`}
                        tabIndex={0}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {stattrak && (
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-1 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    >
                      StatTrak™
                      <button
                        className="h-3 w-3 cursor-pointer hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
                        onClick={() => setStattrak(false)}
                        aria-label="Remove StatTrak filter"
                        tabIndex={0}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {special && (
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-1 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    >
                      Special
                      <button
                        className="h-3 w-3 cursor-pointer hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
                        onClick={() => setSpecial(false)}
                        aria-label="Remove special filter"
                        tabIndex={0}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {(min || max) && (
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-1 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    >
                      ${min || "0"} - ${max || "∞"}
                      <button
                        className="h-3 w-3 cursor-pointer hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
                        onClick={() => {
                          setMin("");
                          setMax("");
                        }}
                        aria-label={`Remove price filter: $${min || "0"} - $${max || "∞"}`}
                        tabIndex={0}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {weaponType && (
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-1 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    >
                      {weaponType}
                      <button
                        className="h-3 w-3 cursor-pointer hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
                        onClick={() => setWeaponType("")}
                        aria-label={`Remove weapon type filter: ${weaponType}`}
                        tabIndex={0}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {collection && (
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-1 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    >
                      {collection}
                      <button
                        className="h-3 w-3 cursor-pointer hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
                        onClick={() => setCollection("")}
                        aria-label={`Remove collection filter: ${collection}`}
                        tabIndex={0}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {finish && (
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-1 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    >
                      {finish}
                      <button
                        className="h-3 w-3 cursor-pointer hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
                        onClick={() => setFinish("")}
                        aria-label={`Remove finish filter: ${finish}`}
                        tabIndex={0}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={clearFilters}
                    className="text-destructive hover:text-destructive"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>

            {/* Category Tabs — skin sub-categories live here; non-skin tabs link out */}
            <div className="flex gap-2 flex-wrap items-center">
              {Object.entries(CS2_CATEGORIES).map(([key, cat]) => {
                const isActive = key === 'all' ? !category : category === key;
                return (
                  <button
                    key={key}
                    onClick={() => updateCategory(key === 'all' ? undefined : key)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_8px_20px_-8px_rgba(168,85,247,0.55)]"
                        : "bg-slate-900/70 border border-slate-700/30 text-slate-300 hover:text-white hover:border-slate-600/60"
                    )}
                  >
                    {cat.name}
                  </button>
                );
              })}
              {/* Visual divider between skin-internal categories and external catalog links */}
              <span className="h-6 w-px bg-slate-700/40 mx-1" aria-hidden="true" />
              {EXTERNAL_TABS.map((tab) => (
                <a
                  key={tab.href}
                  href={tab.href}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-900/40 border border-dashed border-slate-700/40 text-slate-400 hover:text-white hover:border-slate-600/60 transition-all inline-flex items-center gap-1.5"
                >
                  {tab.name}
                  <span className="text-[10px] text-slate-600" aria-hidden="true">↗</span>
                </a>
              ))}
            </div>

            {/* Price-based Quick Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Quick filters
              </span>
              <div className="flex gap-2 flex-wrap">
                {([
                  { label: "Under €5", lo: "", hi: "5", srt: "price_asc" },
                  { label: "Under €25", lo: "", hi: "25", srt: "price_asc" },
                  { label: "€100–€500", lo: "100", hi: "500", srt: "price_desc" },
                  { label: "€500+", lo: "500", hi: "", srt: "price_desc" },
                  { label: "High value (€1000+)", lo: "1000", hi: "", srt: "price_desc" },
                ] as const).map((q) => {
                  const active = min === q.lo && max === q.hi;
                  return (
                    <button
                      key={q.label}
                      onClick={() => {
                        if (active) {
                          setMin("");
                          setMax("");
                        } else {
                          setMin(q.lo);
                          setMax(q.hi);
                          setSort(q.srt);
                        }
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                        active
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_8px_20px_-8px_rgba(168,85,247,0.55)]"
                          : "bg-slate-900/70 border border-slate-700/30 text-slate-300 hover:text-white hover:border-slate-600/60"
                      )}
                    >
                      {q.label}
                    </button>
                  );
                })}
              </div>
            </div>



            {/* Results Count and Sort */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Browse CS2 skins with advanced filtering
              </div>

              {/* Mobile Sticky Apply Button */}
              {isMobile && hasFilterChanges && (
                <Button 
                  onClick={() => setHasFilterChanges(false)}
                  className="fixed bottom-4 right-4 z-50 shadow-lg"
                >
                  Apply Filters
                </Button>
              )}
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
                    {/* P1: Additional sort options */}
                    <SelectItem value="change_24h_desc">24h Change ↓</SelectItem>
                    <SelectItem value="change_24h_asc">24h Change ↑</SelectItem>
                    <SelectItem value="change_7d_desc">7d Change ↓</SelectItem>
                    <SelectItem value="change_7d_asc">7d Change ↑</SelectItem>
                    <SelectItem value="offers_desc">Most Offers</SelectItem>
                    <SelectItem value="offers_asc">Least Offers</SelectItem>
                    <SelectItem value="volume_24h_desc">24h Volume ↓</SelectItem>
                    <SelectItem value="volume_24h_asc">24h Volume ↑</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Enhanced Skin Grid with Better Empty State */}
            <EnhancedSkinGrid
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
              }}
              showSkeleton={true}
              skeletonCount={10}
              enableInfiniteScroll={enableInfiniteScroll}
              onTotalChange={setTotal}
              batchMode={batchMode}
              selectedSkins={selectedSkins}
              onToggleSelection={toggleSkinSelection}
            />

            {/* P2: Back to Top Button */}
            {showBackToTop && (
              <Button
                onClick={scrollToTop}
                className="fixed bottom-6 right-6 z-50 shadow-lg rounded-full h-12 w-12 p-0"
                aria-label="Back to top"
              >
                ↑
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
