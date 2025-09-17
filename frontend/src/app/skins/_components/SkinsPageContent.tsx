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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, X, Save, Share2, Trash2, Clock, CheckSquare, Square, Plus, Heart, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import SkinGrid from "../SkinGrid";
import { apiUrl, fetchJson } from "@/lib/api";
import { saveFiltersToSession, loadFiltersFromSession, clearFiltersFromSession } from "@/lib/storage";
import { useInfiniteSkins } from "@/hooks/useInfiniteSkins";

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

  // Data state - page is now handled by useInfiniteSkins hook

  // Enhanced features state
  const [debouncedQ, setDebouncedQ] = useState(q);

  // Get skins data with infinite scroll
  const { 
    skins, 
    total, 
    pagination, 
    error, 
    isLoading, 
    isLoadingMore,
    isEmpty,
    hasError
  } = useInfiniteSkins({
    filters: {
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
    },
    enabled: true
  });

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
      const promises = Array.from(selectedSkins).map(skinId =>
        fetchJson(apiUrl('/api/v1/watchlist'), {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${localStorage.getItem("token")}` 
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
      const promises = Array.from(selectedSkins).map(skinId =>
        fetchJson(apiUrl('/api/v1/portfolio'), {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${localStorage.getItem("token")}` 
          },
          body: JSON.stringify({
            skinId,
            amount: 1,
            buyPrice: 0, // Would need actual price data
            buyDate: new Date().toISOString().slice(0, 10),
          }),
        })
      );
      
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
      finish
    });
  }, [q, min, max, rarity, wear, stattrak, special, sort, category, weaponType, collection, finish]);



  // Initial load & when filters change → reset to page 1
  useEffect(() => { 
    console.log("🔄 Filters changed, page will be automatically reset by useInfiniteSkins hook");
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
    
    // Page is automatically reset by useInfiniteSkins hook when filters change
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
                  <div className="flex items-center gap-1">
                    <Label>Wear</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            <strong>Wear</strong> indicates the condition of the skin. 
                            <br />• <strong>Factory New (FN)</strong>: Perfect condition
                            <br />• <strong>Minimal Wear (MW)</strong>: Slight scratches
                            <br />• <strong>Field-Tested (FT)</strong>: Visible wear
                            <br />• <strong>Well-Worn (WW)</strong>: Heavy wear
                            <br />• <strong>Battle-Scarred (BS)</strong>: Maximum wear
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
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
                  <div className="flex items-center gap-1">
                    <Label>Rarity</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            <strong>Rarity</strong> determines how rare and valuable a skin is.
                            <br />• <strong>Covert</strong>: Red - Extremely rare, highest value
                            <br />• <strong>Classified</strong>: Pink - Very rare, high value
                            <br />• <strong>Restricted</strong>: Purple - Rare, medium-high value
                            <br />• <strong>Mil-Spec</strong>: Blue - Uncommon, medium value
                            <br />• <strong>Industrial</strong>: Light blue - Common, low value
                            <br />• <strong>Consumer</strong>: Gray - Most common, lowest value
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
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
                  <div className="flex items-center gap-1">
                    <Label htmlFor="stattrak">StatTrak™</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            <strong>StatTrak™</strong> skins track your kills with that weapon.
                            <br />• Shows kill counter on the weapon
                            <br />• More expensive than regular skins
                            <br />• Orange StatTrak™ logo on the skin
                            <br />• Counter resets when traded/sold
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Switch
                    id="stattrak"
                    checked={stattrak}
                    onCheckedChange={setStattrak}
                  />
                </div>

                {/* Special */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="special">Special (Star)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            <strong>Special (Star)</strong> items are unique collectibles.
                            <br />• <strong>Knives</strong>: ★ Karambit, ★ Butterfly, etc.
                            <br />• <strong>Gloves</strong>: Special hand coverings
                            <br />• <strong>Music Kits</strong>: Custom round music
                            <br />• <strong>Stickers</strong>: Team/player stickers
                            <br />• Usually very expensive and rare
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Switch
                    id="special"
                    checked={special}
                    onCheckedChange={setSpecial}
                  />
                </div>

                {/* Souvenir */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="souvenir">Souvenir</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            <strong>Souvenir</strong> items are special tournament drops.
                            <br />• Dropped during professional CS2 matches
                            <br />• Have unique tournament stickers
                            <br />• Usually more expensive than regular skins
                            <br />• Limited availability and collectible value
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Switch
                    id="souvenir"
                    checked={q.includes("Souvenir")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setQ(q ? `${q} Souvenir` : "Souvenir");
                      } else {
                        setQ(q.replace(/\bSouvenir\b/g, "").trim());
                      }
                    }}
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

            {/* Active filter chips & result count */}
            <div className="space-y-4">
              {/* Result Count */}
              <div className="text-sm text-muted-foreground">
                {total ? `${total} results` : "Loading..."}
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
                      {wear.toUpperCase()}
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

            {/* Price-based Quick Filters */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Label className="text-sm font-medium">Quick Filters:</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Smart toggle: if already set to this range, clear it
                      if (min === "" && max === "5") {
                        setMin("");
                        setMax("");
                      } else {
                        setMin("");
                        setMax("5");
                        setSort("price_asc");
                      }
                    }}
                    className={min === "" && max === "5" ? "bg-primary text-primary-foreground" : ""}
                  >
                    Under $5
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (min === "" && max === "25") {
                        setMin("");
                        setMax("");
                      } else {
                        setMin("");
                        setMax("25");
                        setSort("price_asc");
                      }
                    }}
                    className={min === "" && max === "25" ? "bg-primary text-primary-foreground" : ""}
                  >
                    Under $25
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (min === "100" && max === "500") {
                        setMin("");
                        setMax("");
                      } else {
                        setMin("100");
                        setMax("500");
                        setSort("price_desc");
                      }
                    }}
                    className={min === "100" && max === "500" ? "bg-primary text-primary-foreground" : ""}
                  >
                    $100-$500
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (min === "500" && max === "") {
                        setMin("");
                        setMax("");
                      } else {
                        setMin("500");
                        setMax("");
                        setSort("price_desc");
                      }
                    }}
                    className={min === "500" && max === "" ? "bg-primary text-primary-foreground" : ""}
                  >
                    $500+
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (min === "1000" && max === "") {
                        setMin("");
                        setMax("");
                      } else {
                        setMin("1000");
                        setMax("");
                        setSort("price_desc");
                      }
                    }}
                    className={min === "1000" && max === "" ? "bg-primary text-primary-foreground" : ""}
                  >
                    High Value ($1000+)
                  </Button>
                </div>
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
              }}
              showSkeleton={true}
              skeletonCount={6}
              enableInfiniteScroll={enableInfiniteScroll}
              // P3: Batch selection props
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
    </div>
  );
}
