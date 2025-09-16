// frontend/src/app/skins/_components/ModernSkinsPageContent.tsx — [Frontend]
// {/* Modern Skin Browse Page with shadcn/ui components */}
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
import { ModernSkinCard } from "./ModernSkinCard";
import { apiUrl, fetchJson } from "@/lib/api";

// Types
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

// CS2 Categories
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

// Wear levels
const WEAR_LEVELS = [
  { id: "FN", name: "Factory New", short: "FN" },
  { id: "MW", name: "Minimal Wear", short: "MW" },
  { id: "FT", name: "Field-Tested", short: "FT" },
  { id: "WW", name: "Well-Worn", short: "WW" },
  { id: "BS", name: "Battle-Scarred", short: "BS" }
];

// Rarity levels
const RARITY_LEVELS = [
  { id: "Covert", name: "Covert" },
  { id: "Classified", name: "Classified" },
  { id: "Restricted", name: "Restricted" },
  { id: "Mil-Spec", name: "Mil-Spec" }
];

const PAGE_SIZE = 24;

export function ModernSkinsPageContent() {
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
  
  // Data states
  const [skins, setSkins] = useState<Skin[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);

  // Load skins
  const loadSkins = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (priceRange[0] > 0) params.set("min", priceRange[0].toString());
      if (priceRange[1] < 5000) params.set("max", priceRange[1].toString());
      if (selectedWear.length > 0) params.set("wear", selectedWear.join(","));
      if (selectedRarity.length > 0) params.set("rarity", selectedRarity.join(","));
      if (stattrakEnabled) params.set("stattrak", "true");
      if (specialEnabled) params.set("special", "true");
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      params.set("sort", sortBy);
      params.set("page", page.toString());
      params.set("limit", PAGE_SIZE.toString());

      const data = await fetchJson(apiUrl(`/api/v1/skins?${params}`));
      setSkins(data.skins || []);
      setTotalResults(data.total || 0);
    } catch (error) {
      console.error("Failed to load skins:", error);
      setSkins([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, priceRange, selectedWear, selectedRarity, stattrakEnabled, specialEnabled, selectedCategory, sortBy, page]);

  // Load skins when filters change
  useEffect(() => {
    loadSkins();
  }, [loadSkins]);

  // Apply filters
  const applyFilters = () => {
    setPage(1);
    loadSkins();
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setPriceRange([0, 5000]);
    setSelectedWear([]);
    setSelectedRarity([]);
    setStattrakEnabled(false);
    setSpecialEnabled(false);
    setSelectedCategory("all");
    setSortBy("price_asc");
    setPage(1);
  };

  // Get active filters for display
  const activeFilters = useMemo(() => {
    const filters = [];
    if (selectedCategory !== "all") filters.push({ type: "category", value: CS2_CATEGORIES[selectedCategory as keyof typeof CS2_CATEGORIES]?.name });
    if (selectedRarity.length > 0) filters.push({ type: "rarity", value: selectedRarity.join(", ") });
    if (stattrakEnabled) filters.push({ type: "stattrak", value: "StatTrak™" });
    return filters;
  }, [selectedCategory, selectedRarity, stattrakEnabled]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <div className="w-80 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="e.g. AK-47"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-4">
                  <Label>Price Range</Label>
                  <div className="space-y-4">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={5000}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Min"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
                        className="w-20"
                      />
                      <Input
                        placeholder="Max"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 5000])}
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>

                {/* Wear */}
                <div className="space-y-3">
                  <Label>Wear</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEAR_LEVELS.map((wear) => (
                      <Button
                        key={wear.id}
                        variant={selectedWear.includes(wear.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (selectedWear.includes(wear.id)) {
                            setSelectedWear(selectedWear.filter(w => w !== wear.id));
                          } else {
                            setSelectedWear([...selectedWear, wear.id]);
                          }
                        }}
                      >
                        {wear.short}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Rarity */}
                <div className="space-y-3">
                  <Label>Rarity</Label>
                  <div className="space-y-2">
                    {RARITY_LEVELS.map((rarity) => (
                      <div key={rarity.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={rarity.id}
                          checked={selectedRarity.includes(rarity.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRarity([...selectedRarity, rarity.id]);
                            } else {
                              setSelectedRarity(selectedRarity.filter(r => r !== rarity.id));
                            }
                          }}
                        />
                        <Label htmlFor={rarity.id} className="text-sm">
                          {rarity.name}
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
                    checked={stattrakEnabled}
                    onCheckedChange={setStattrakEnabled}
                  />
                </div>

                {/* Special */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="special">Special (Star)</Label>
                  <Switch
                    id="special"
                    checked={specialEnabled}
                    onCheckedChange={setSpecialEnabled}
                  />
                </div>

                {/* Apply Filters Button */}
                <Button onClick={applyFilters} className="w-full">
                  Apply Filters
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
              {Object.entries(CS2_CATEGORIES).map(([key, category]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? "default" : "outline"}
                  onClick={() => setSelectedCategory(key)}
                >
                  {category.name}
                </Button>
              ))}
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {activeFilters.map((filter, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {filter.value}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        if (filter.type === "category") setSelectedCategory("all");
                        if (filter.type === "rarity") setSelectedRarity([]);
                        if (filter.type === "stattrak") setStattrakEnabled(false);
                      }}
                    />
                  </Badge>
                ))}
                <Button variant="link" size="sm" onClick={clearAllFilters}>
                  Clear all
                </Button>
              </div>
            )}

            {/* Results Count and Sort */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {totalResults.toLocaleString()} results
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="sort">Sort by:</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="name_asc">Name: A to Z</SelectItem>
                    <SelectItem value="name_desc">Name: Z to A</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="popularity_desc">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Skin Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {loading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-square bg-muted animate-pulse" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                      <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                      <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                skins.map((skin) => (
                  <ModernSkinCard key={skin.id} skin={skin} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
