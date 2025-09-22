// /frontend/src/app/portfolio/_components/EnhancedPortfolioGrid.tsx — [Frontend]
// {/* Enhanced Portfolio Grid following Design System */}
"use client";
import { useState, useEffect } from "react";
import { EnhancedPortfolioCard } from "./EnhancedPortfolioCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Grid, 
  List, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  TrendingUp,
  Calendar,
  Package,
  DollarSign,
  Frown,
  AlertTriangle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface EnhancedPortfolioGridProps {
  entries: Array<{
    id: number;
    amount: number;
    buyPrice: number;
    avgPrice: number;
    purchases: Array<{
      id: number;
      amount: number;
      buyPrice: number;
      buyDate: string;
    }>;
    skin: {
      id: number;
      name: string;
      imageUrl?: string | null;
      itemimage?: string | null;
      marketPrice?: number | null;
      weaponType?: string;
      rarity?: string;
      wear?: string;
      lastPriceUpdate?: string;
    };
  }>;
  onDataChange?: () => void;
  className?: string;
  showSkeleton?: boolean;
  skeletonCount?: number;
  enableFilters?: boolean;
  enableSorting?: boolean;
  enableSearch?: boolean;
  showStats?: boolean;
}

type SortOption = 'name' | 'value' | 'pl' | 'plPercent' | 'amount' | 'recent' | 'weapon' | 'rarity';
type ViewMode = 'grid' | 'list';

export function EnhancedPortfolioGrid({
  entries = [],
  onDataChange,
  className = "",
  showSkeleton = true,
  skeletonCount = 12,
  enableFilters = true,
  enableSorting = true,
  enableSearch = true,
  showStats = true
}: EnhancedPortfolioGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterRarity, setFilterRarity] = useState<string>('');
  const [filterWeapon, setFilterWeapon] = useState<string>('');
  const [filterWear, setFilterWear] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Persistent settings
  useEffect(() => {
    const savedViewMode = localStorage.getItem('portfolio-view-mode') as ViewMode;
    const savedSortBy = localStorage.getItem('portfolio-sort-by') as SortOption;
    const savedSortOrder = localStorage.getItem('portfolio-sort-order') as 'asc' | 'desc';
    
    if (savedViewMode) setViewMode(savedViewMode);
    if (savedSortBy) setSortBy(savedSortBy);
    if (savedSortOrder) setSortOrder(savedSortOrder);
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('portfolio-view-mode', mode);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    localStorage.setItem('portfolio-sort-by', newSort);
  };

  const handleSortOrderChange = (newOrder: 'asc' | 'desc') => {
    setSortOrder(newOrder);
    localStorage.setItem('portfolio-sort-order', newOrder);
  };

  // Filter and sort entries
  const filteredEntries = entries.filter(entry => {
    const { skin } = entry;
    
    // Search filter
    if (enableSearch && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (!skin.name.toLowerCase().includes(query) && 
          !skin.weaponType?.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Rarity filter
    if (filterRarity && skin.rarity !== filterRarity) {
      return false;
    }
    
    // Weapon filter
    if (filterWeapon && skin.weaponType !== filterWeapon) {
      return false;
    }
    
    // Wear filter
    if (filterWear && skin.wear !== filterWear) {
      return false;
    }
    
    return true;
  });

  // Sort entries
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const { skin: skinA } = a;
    const { skin: skinB } = b;
    
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = skinA.name.localeCompare(skinB.name);
        break;
      case 'value':
        const valueA = (skinA.marketPrice || 0) * a.amount;
        const valueB = (skinB.marketPrice || 0) * b.amount;
        comparison = valueA - valueB;
        break;
      case 'pl':
        const plA = ((skinA.marketPrice || 0) * a.amount) - (a.avgPrice * a.amount);
        const plB = ((skinB.marketPrice || 0) * b.amount) - (b.avgPrice * b.amount);
        comparison = plA - plB;
        break;
      case 'plPercent':
        const plPercentA = a.avgPrice > 0 ? (((skinA.marketPrice || 0) - a.avgPrice) / a.avgPrice) * 100 : 0;
        const plPercentB = b.avgPrice > 0 ? (((skinB.marketPrice || 0) - b.avgPrice) / b.avgPrice) * 100 : 0;
        comparison = plPercentA - plPercentB;
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'recent':
        const recentA = a.purchases.reduce((latest, p) => 
          new Date(p.buyDate) > new Date(latest.buyDate) ? p : latest
        );
        const recentB = b.purchases.reduce((latest, p) => 
          new Date(p.buyDate) > new Date(latest.buyDate) ? p : latest
        );
        comparison = new Date(recentA.buyDate).getTime() - new Date(recentB.buyDate).getTime();
        break;
      case 'weapon':
        comparison = (skinA.weaponType || '').localeCompare(skinB.weaponType || '');
        break;
      case 'rarity':
        const rarityOrder = ['Consumer Grade', 'Industrial Grade', 'Mil-Spec', 'Restricted', 'Classified', 'Covert'];
        const rarityIndexA = rarityOrder.indexOf(skinA.rarity || '');
        const rarityIndexB = rarityOrder.indexOf(skinB.rarity || '');
        comparison = rarityIndexA - rarityIndexB;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Calculate stats
  const stats = {
    totalValue: sortedEntries.reduce((sum, entry) => 
      sum + ((entry.skin.marketPrice || 0) * entry.amount), 0
    ),
    totalInvested: sortedEntries.reduce((sum, entry) => 
      sum + (entry.avgPrice * entry.amount), 0
    ),
    totalPL: 0,
    totalPLPercent: 0,
    totalItems: sortedEntries.reduce((sum, entry) => sum + entry.amount, 0),
    positivePL: sortedEntries.filter(entry => {
      const pl = ((entry.skin.marketPrice || 0) * entry.amount) - (entry.avgPrice * entry.amount);
      return pl > 0;
    }).length,
    negativePL: sortedEntries.filter(entry => {
      const pl = ((entry.skin.marketPrice || 0) * entry.amount) - (entry.avgPrice * entry.amount);
      return pl < 0;
    }).length
  };

  stats.totalPL = stats.totalValue - stats.totalInvested;
  stats.totalPLPercent = stats.totalInvested > 0 ? (stats.totalPL / stats.totalInvested) * 100 : 0;

  // Get unique values for filters
  const rarities = [...new Set(entries.map(e => e.skin.rarity).filter(Boolean))];
  const weapons = [...new Set(entries.map(e => e.skin.weaponType).filter(Boolean))];
  const wears = [...new Set(entries.map(e => e.skin.wear).filter(Boolean))];

  const clearFilters = () => {
    setSearchQuery('');
    setFilterRarity('');
    setFilterWeapon('');
    setFilterWear('');
  };

  const hasActiveFilters = searchQuery || filterRarity || filterWeapon || filterWear;

  if (showSkeleton && entries.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">Portfolio</h2>
            <p className="text-slate-400">Your skin collection</p>
          </div>
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <Card key={`skeleton-${i}`} className="overflow-hidden bg-slate-800/30 animate-pulse">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Card className="card-enhanced">
          <CardContent className="p-8">
            <Frown className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-xl font-semibold text-white mb-2">No Portfolio Items</h3>
            <p className="text-slate-400 mb-4">Start building your portfolio by adding skins to track.</p>
            <Button asChild className="btn-enhanced">
              <a href="/skins">Browse Skins</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gridClasses = viewMode === 'grid'
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
    : "grid grid-cols-1 gap-4";

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white">Portfolio</h2>
          <p className="text-slate-400">
            {sortedEntries.length} item{sortedEntries.length !== 1 ? 's' : ''} 
            {hasActiveFilters && ` (${filteredEntries.length} filtered)`}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-800/50 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              className="h-8 px-3"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-enhanced">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                ${stats.totalValue.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">Total Value</div>
            </CardContent>
          </Card>
          
          <Card className="card-enhanced">
            <CardContent className="p-4 text-center">
              <div className={cn(
                "text-2xl font-bold",
                stats.totalPL >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {stats.totalPL >= 0 ? '+' : ''}${stats.totalPL.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">P/L</div>
            </CardContent>
          </Card>
          
          <Card className="card-enhanced">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {stats.totalItems}
              </div>
              <div className="text-sm text-slate-400">Total Items</div>
            </CardContent>
          </Card>
          
          <Card className="card-enhanced">
            <CardContent className="p-4 text-center">
              <div className={cn(
                "text-2xl font-bold",
                stats.totalPLPercent >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {stats.totalPLPercent >= 0 ? '+' : ''}{stats.totalPLPercent.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-400">P/L %</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {enableFilters && (
        <Card className="card-enhanced">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              {enableSearch && (
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search portfolio..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-500"
                  />
                </div>
              )}
              
              {/* Sort */}
              {enableSorting && (
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={(value) => handleSortChange(value as SortOption)}>
                    <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      <SelectItem value="value">Value</SelectItem>
                      <SelectItem value="pl">P/L</SelectItem>
                      <SelectItem value="plPercent">P/L %</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="recent">Recent</SelectItem>
                      <SelectItem value="weapon">Weapon</SelectItem>
                      <SelectItem value="rarity">Rarity</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3"
                  >
                    {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>
              )}
              
              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="btn-enhanced"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 px-1.5 py-0.5 bg-brand-blue text-white text-xs rounded-full">
                    {[searchQuery, filterRarity, filterWeapon, filterWear].filter(Boolean).length}
                  </span>
                )}
              </Button>
              
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-slate-400 hover:text-white"
                >
                  Clear
                </Button>
              )}
            </div>
            
            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Rarity</label>
                    <Select value={filterRarity} onValueChange={setFilterRarity}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white">
                        <SelectValue placeholder="All rarities" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 text-white">
                        <SelectItem value="">All rarities</SelectItem>
                        {rarities.map(rarity => (
                          <SelectItem key={rarity} value={rarity}>{rarity}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Weapon</label>
                    <Select value={filterWeapon} onValueChange={setFilterWeapon}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white">
                        <SelectValue placeholder="All weapons" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 text-white">
                        <SelectItem value="">All weapons</SelectItem>
                        {weapons.map(weapon => (
                          <SelectItem key={weapon} value={weapon}>{weapon}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Wear</label>
                    <Select value={filterWear} onValueChange={setFilterWear}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white">
                        <SelectValue placeholder="All wears" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 text-white">
                        <SelectItem value="">All wears</SelectItem>
                        {wears.map(wear => (
                          <SelectItem key={wear} value={wear}>{wear}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grid */}
      <div className={gridClasses}>
        {sortedEntries.map((entry) => (
          <EnhancedPortfolioCard
            key={entry.id}
            entry={entry}
            onDataChange={onDataChange}
            viewMode={viewMode}
            showHoverEffects={true}
          />
        ))}
      </div>

      {/* Empty State */}
      {sortedEntries.length === 0 && hasActiveFilters && (
        <div className="text-center py-12">
          <Card className="card-enhanced">
            <CardContent className="p-8">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold text-white mb-2">No Results Found</h3>
              <p className="text-slate-400 mb-4">Try adjusting your filters or search query.</p>
              <Button onClick={clearFilters} variant="outline" className="btn-enhanced">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
