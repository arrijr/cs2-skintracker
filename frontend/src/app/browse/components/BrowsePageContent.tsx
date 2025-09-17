// frontend/src/app/browse/components/BrowsePageContent.tsx — [Frontend]
// {/* Main Browse Page with URL Sync, Filter Chips, and Pagination */}
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
import { Search, X, Loader2 } from "lucide-react";
import { SkinCard } from "./SkinCard";
import { apiUrl, fetchJson } from "@/lib/api";
import { useSkins, type SkinsFilters, type Skin } from "@/hooks/useSkins";

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

const PAGE_SIZE = 24;

export function BrowsePageContent() {
  const router = useRouter();
  const sp = useSearchParams();
  
  // URL-synced state
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [min, setMin] = useState(sp.get("priceMin") ?? "");
  const [max, setMax] = useState(sp.get("priceMax") ?? "");
  const [rarity, setRarity] = useState(sp.get("rarity") ?? "");
  const [wear, setWear] = useState(sp.get("wear") ?? "");
  const [stattrak, setStattrak] = useState(sp.get("st") === "true");
  const [special, setSpecial] = useState(sp.get("special") === "true");
  const [sort, setSort] = useState(sp.get("sort") ?? "price_asc");
  const [category, setCategory] = useState(sp.get("category") ?? undefined);
  const [page, setPage] = useState(1);

  // Debounced search
  const [debouncedQ, setDebouncedQ] = useState(q);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  // {/* Filters ↔ URL Sync */}
  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (min) params.set("priceMin", min);
    if (max) params.set("priceMax", max);
    if (rarity) params.set("rarity", rarity);
    if (wear) params.set("wear", wear);
    if (stattrak) params.set("st", "true");
    if (special) params.set("special", "true");
    if (sort) params.set("sort", sort);
    if (category) params.set("category", category);
    if (page > 1) params.set("page", page.toString());
    
    const newUrl = `/browse?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [q, min, max, rarity, wear, stattrak, special, sort, category, page, router]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [q, min, max, rarity, wear, stattrak, special, sort, category]);

  // Use skins hook with filters
  const { 
    skins, 
    isLoading, 
    isEmpty, 
    hasError, 
    error,
    pagination 
  } = useSkins({ 
    filters: {
      q: debouncedQ,
      min: min ? Number(min) : undefined,
      max: max ? Number(max) : undefined,
      rarity,
      wear,
      stattrak: stattrak || undefined,
      special: special || undefined,
      sort,
      category,
      page,
      pageSize: PAGE_SIZE
    },
    enabled: true 
  });

  // Clear all filters
  const clearFilters = () => {
    setQ("");
    setMin("");
    setMax("");
    setRarity("");
    setWear("");
    setStattrak(false);
    setSpecial(false);
    setSort("price_asc");
    setCategory(undefined);
    setPage(1);
  };

  // Remove specific filter
  const removeFilter = (filterType: string) => {
    switch (filterType) {
      case "search":
        setQ("");
        break;
      case "category":
        setCategory(undefined);
        break;
      case "rarity":
        setRarity("");
        break;
      case "wear":
        setWear("");
        break;
      case "stattrak":
        setStattrak(false);
        break;
      case "special":
        setSpecial(false);
        break;
      case "price":
        setMin("");
        setMax("");
        break;
    }
  };

  // {/* Active Filter Chips & Result Count */}
  const activeFilters = useMemo(() => {
    const filters = [];
    if (category) filters.push({ type: "category", value: CS2_CATEGORIES[category as keyof typeof CS2_CATEGORIES]?.name });
    if (rarity) filters.push({ type: "rarity", value: rarity });
    if (wear) filters.push({ type: "wear", value: wear });
    if (stattrak) filters.push({ type: "stattrak", value: "StatTrak™" });
    if (special) filters.push({ type: "special", value: "Special" });
    if (min || max) {
      const priceRange = `${min ? `$${min}` : "$0"}–${max ? `$${max}` : "$5000+"}`;
      filters.push({ type: "price", value: `Price: ${priceRange}` });
    }
    return filters;
  }, [category, rarity, wear, stattrak, special, min, max]);

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
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="pl-10"
                    />
                  </div>
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
                        onChange={(e) => setMin(e.target.value)}
                        className="w-20"
                      />
                      <Input
                        placeholder="Max"
                        value={max}
                        onChange={(e) => setMax(e.target.value)}
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
                    onClick={() => setCategory(key === 'all' ? undefined : key)}
                  >
                    {cat.name}
                  </Button>
                );
              })}
            </div>

            {/* Active Filters & Result Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                {activeFilters.length > 0 ? (
                  <>
                    {activeFilters.map((filter, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {filter.value}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeFilter(filter.type)}
                        />
                      </Badge>
                    ))}
                    <Button variant="link" size="sm" onClick={clearFilters}>
                      Clear all
                    </Button>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No filters applied
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {pagination?.total ? `${pagination.total.toLocaleString()} results` : "Loading..."}
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
            </div>

            {/* Skin Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {isLoading ? (
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
                  <SkinCard key={skin.id} skin={skin} />
                ))
              )}
            </div>

            {/* Load More Button */}
            {pagination && pagination.hasNextPage && (
              <div className="flex justify-center pt-8">
                <Button 
                  onClick={() => setPage(page + 1)}
                  disabled={isLoading}
                  className="w-48"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
