// /frontend/src/app/skins/_components/EnhancedFilterSidebar.tsx — [Frontend]
// {/* Enhanced Filter Sidebar with modern visual effects */}
"use client";
import { useState, useEffect } from "react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Search, 
  X, 
  Save, 
  Share2, 
  Trash2, 
  Clock, 
  CheckSquare, 
  Square, 
  Plus, 
  Heart, 
  HelpCircle,
  Filter,
  Zap,
  Star,
  TrendingUp,
  DollarSign,
  Shield,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedFilterSidebarProps {
  filters: {
    q: string;
    min: string;
    max: string;
    rarity: string;
    wear: string;
    quality: string;
    stattrak: boolean;
    special: boolean;
    sort: string;
    category?: string;
    weaponType: string;
    collection: string;
    finish: string;
  };
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
  onSavePreset?: () => void;
  onShareFilters?: () => void;
  className?: string;
}

const WEAR_OPTIONS = [
  { id: "fn", name: "FN", fullName: "Factory New", color: "text-green-400 bg-green-400/10 border-green-400/30" },
  { id: "mw", name: "MW", fullName: "Minimal Wear", color: "text-lime-400 bg-lime-400/10 border-lime-400/30" },
  { id: "ft", name: "FT", fullName: "Field-Tested", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  { id: "ww", name: "WW", fullName: "Well-Worn", color: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
  { id: "bs", name: "BS", fullName: "Battle-Scarred", color: "text-red-400 bg-red-400/10 border-red-400/30" }
];

const RARITY_OPTIONS = [
  { name: "Covert", color: "text-red-400 bg-red-400/10 border-red-400/30" },
  { name: "Classified", color: "text-pink-400 bg-pink-400/10 border-pink-400/30" },
  { name: "Restricted", color: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
  { name: "Mil-Spec", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" }
];

const QUICK_FILTERS = [
  { name: "Under $5", min: "", max: "5", sort: "price_asc", icon: DollarSign, color: "text-green-400" },
  { name: "Under $25", min: "", max: "25", sort: "price_asc", icon: DollarSign, color: "text-green-400" },
  { name: "$100-$500", min: "100", max: "500", sort: "price_desc", icon: TrendingUp, color: "text-blue-400" },
  { name: "High Value", min: "500", max: "", sort: "price_desc", icon: Star, color: "text-yellow-400" },
  { name: "StatTrak™", stattrak: true, icon: Shield, color: "text-orange-400" },
  { name: "Special Items", special: true, icon: Sparkles, color: "text-purple-400" }
];

export function EnhancedFilterSidebar({
  filters,
  onFilterChange,
  onClearFilters,
  onSavePreset,
  onShareFilters,
  className = ""
}: EnhancedFilterSidebarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(new Set());

  // Apply quick filter
  const applyQuickFilter = (filter: any) => {
    if (filter.min !== undefined) onFilterChange('min', filter.min);
    if (filter.max !== undefined) onFilterChange('max', filter.max);
    if (filter.sort) onFilterChange('sort', filter.sort);
    if (filter.stattrak !== undefined) onFilterChange('stattrak', filter.stattrak);
    if (filter.special !== undefined) onFilterChange('special', filter.special);
    
    // Update active state
    const filterKey = filter.name;
    setActiveQuickFilters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filterKey)) {
        newSet.delete(filterKey);
        // Clear the filter
        if (filter.min !== undefined) onFilterChange('min', '');
        if (filter.max !== undefined) onFilterChange('max', '');
        if (filter.stattrak !== undefined) onFilterChange('stattrak', false);
        if (filter.special !== undefined) onFilterChange('special', false);
      } else {
        newSet.add(filterKey);
      }
      return newSet;
    });
  };

  // Check if quick filter is active
  const isQuickFilterActive = (filter: any) => {
    if (filter.min !== undefined && filters.min !== filter.min) return false;
    if (filter.max !== undefined && filters.max !== filter.max) return false;
    if (filter.stattrak !== undefined && filters.stattrak !== filter.stattrak) return false;
    if (filter.special !== undefined && filters.special !== filter.special) return false;
    return true;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search */}
      <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Search className="h-5 w-5 text-brand-blue" />
            Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search skins..."
              value={filters.q}
              onChange={(e) => onFilterChange('q', e.target.value)}
              className="pl-10 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-blue/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Filters */}
      <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-brand-orange" />
            Quick Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {QUICK_FILTERS.map((filter) => {
              const Icon = filter.icon;
              const isActive = isQuickFilterActive(filter);
              
              return (
                <Button
                  key={filter.name}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyQuickFilter(filter)}
                  className={cn(
                    "h-8 text-xs justify-start",
                    isActive 
                      ? "bg-brand-blue text-white" 
                      : "border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
                  )}
                >
                  <Icon className={cn("h-3 w-3 mr-1", filter.color)} />
                  {filter.name}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-brand-green" />
            Price Range
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Slider
              value={[Number(filters.min) || 0, Number(filters.max) || 5000]}
              onValueChange={([minVal, maxVal]) => {
                onFilterChange('min', minVal.toString());
                onFilterChange('max', maxVal.toString());
              }}
              max={5000}
              step={10}
              className="w-full"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs text-slate-400">Min</Label>
                <Input
                  placeholder="0"
                  value={filters.min}
                  onChange={(e) => onFilterChange('min', e.target.value)}
                  className="bg-slate-700/50 border-slate-600/50 text-white"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-slate-400">Max</Label>
                <Input
                  placeholder="5000"
                  value={filters.max}
                  onChange={(e) => onFilterChange('max', e.target.value)}
                  className="bg-slate-700/50 border-slate-600/50 text-white"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wear */}
      <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-purple" />
            Wear
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    <strong>Wear</strong> indicates the condition of the skin.
                    <br />• <strong>FN</strong>: Perfect condition
                    <br />• <strong>MW</strong>: Slight scratches
                    <br />• <strong>FT</strong>: Visible wear
                    <br />• <strong>WW</strong>: Heavy wear
                    <br />• <strong>BS</strong>: Maximum wear
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {WEAR_OPTIONS.map((wear) => (
              <Button
                key={wear.id}
                variant={filters.wear === wear.id ? "default" : "outline"}
                size="sm"
                onClick={() => onFilterChange('wear', filters.wear === wear.id ? '' : wear.id)}
                className={cn(
                  "h-8 text-xs justify-start",
                  filters.wear === wear.id 
                    ? "bg-brand-blue text-white" 
                    : "border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full mr-2", wear.color.split(' ')[0])} />
                {wear.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rarity */}
      <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-brand-yellow" />
            Rarity
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    <strong>Rarity</strong> determines how rare and valuable a skin is.
                    <br />• <strong>Covert</strong>: Extremely rare, highest value
                    <br />• <strong>Classified</strong>: Very rare, high value
                    <br />• <strong>Restricted</strong>: Rare, medium-high value
                    <br />• <strong>Mil-Spec</strong>: Uncommon, medium value
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {RARITY_OPTIONS.map((rarity) => (
              <div key={rarity.name} className="flex items-center space-x-3">
                <Checkbox
                  id={rarity.name}
                  checked={filters.rarity === rarity.name}
                  onCheckedChange={(checked) => {
                    onFilterChange('rarity', checked ? rarity.name : '');
                  }}
                  className="border-slate-600 data-[state=checked]:bg-brand-blue data-[state=checked]:border-brand-blue"
                />
                <Label 
                  htmlFor={rarity.name} 
                  className={cn(
                    "text-sm cursor-pointer flex items-center gap-2",
                    rarity.color
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full", rarity.color.split(' ')[0])} />
                  {rarity.name}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Special Properties */}
      <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-purple" />
            Special Properties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="stattrak" className="text-sm text-slate-300">
                StatTrak™
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      <strong>StatTrak™</strong> skins track your kills with that weapon.
                      <br />• Shows kill counter on the weapon
                      <br />• More expensive than regular skins
                      <br />• Orange StatTrak™ logo on the skin
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              id="stattrak"
              checked={filters.stattrak}
              onCheckedChange={(checked) => onFilterChange('stattrak', checked)}
              className="data-[state=checked]:bg-brand-orange"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="special" className="text-sm text-slate-300">
                Special Items
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      <strong>Special Items</strong> are unique collectibles.
                      <br />• <strong>Knives</strong>: ★ Karambit, ★ Butterfly, etc.
                      <br />• <strong>Gloves</strong>: Special hand coverings
                      <br />• Usually very expensive and rare
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              id="special"
              checked={filters.special}
              onCheckedChange={(checked) => onFilterChange('special', checked)}
              className="data-[state=checked]:bg-brand-purple"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        <CardContent className="p-4 space-y-3">
          <Button 
            onClick={onClearFilters} 
            variant="outline" 
            className="w-full border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All Filters
          </Button>
          
          {onSavePreset && (
            <Button 
              onClick={onSavePreset} 
              variant="outline" 
              className="w-full border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Preset
            </Button>
          )}
          
          {onShareFilters && (
            <Button 
              onClick={onShareFilters} 
              variant="outline" 
              className="w-full border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Filters
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
