// frontend/src/app/skins/_components/SkinCard.tsx — [Frontend]
// {/* Modern skin card with quick actions and enhanced UX */}
"use client";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, Plus, Check, Loader2, Star } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { apiUrl, fetchJson } from "@/lib/api";
import { toast } from "sonner";
import { useState, useEffect } from "react";

type Skin = {
  id: number;
  name: string;
  marketHashName: string;
  imageUrl?: string;
  weaponType?: string;
  wear?: string | null;
  rarity?: string | null;
  quality?: string;
  isStattrak?: boolean;
  isStar?: boolean;
  priceAvg?: number | null;
  priceMedian?: number | null;
  offerVolume?: number | null;
  sold24h?: number | null;
  // P2: Additional fields for enhanced card info
  priceChange24h?: number | null;
  priceChange7d?: number | null;
  lastUpdated?: string | null;
  price7dAvg?: number | null;
};

export function SkinCard({ skin, onAdded }: { skin: Skin; onAdded?: () => void }) {
  const { user, isLoaded } = useUser();
  const [watchlistState, setWatchlistState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [portfolioState, setPortfolioState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isInPortfolio, setIsInPortfolio] = useState(false);

  // {/* Quick Actions: state & dedupe */}
  // Check if skin is already in watchlist/portfolio on mount
  useEffect(() => {
    const checkExistingEntries = async () => {
      if (!user) return;
      
      try {
        // Check watchlist
        const watchlistResponse = await fetchJson(apiUrl('/api/v1/watchlist'), {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        const isInWatchlist = watchlistResponse.some((item: any) => item.skinId === skin.id);
        setIsInWatchlist(isInWatchlist);
        
        // Check portfolio
        const portfolioResponse = await fetchJson(apiUrl('/api/v1/portfolio'), {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        const isInPortfolio = portfolioResponse.some((item: any) => item.skinId === skin.id);
        setIsInPortfolio(isInPortfolio);
      } catch (error) {
        console.error("Error checking existing entries:", error);
      }
    };

    checkExistingEntries();
  }, [user, skin.id]);

  const handleWatchlistAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please sign in to add to watchlist");
      return;
    }

    // Prevent double-add
    if (isInWatchlist || watchlistState === 'loading') {
      return;
    }
    
    setWatchlistState('loading');
    try {
      await fetchJson(apiUrl('/api/v1/watchlist'), {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ skinId: skin.id }),
      });
      
      setIsInWatchlist(true);
      setWatchlistState('success');
      toast.success(`${skin.name} added to watchlist!`);
      onAdded?.();
    } catch (error) {
      setWatchlistState('error');
      toast.error(`Failed to add ${skin.name} to watchlist`);
      console.error("Watchlist error:", error);
    }
  };

  const handlePortfolioAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please sign in to add to portfolio");
      return;
    }

    // Prevent double-add
    if (isInPortfolio || portfolioState === 'loading') {
      return;
    }
    
    setPortfolioState('loading');
    try {
      await fetchJson(apiUrl('/api/v1/portfolio'), {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({
          skinId: skin.id,
          amount: 1,
          buyPrice: skin.priceAvg || 0,
          buyDate: new Date().toISOString().slice(0, 10),
        }),
      });
      
      setIsInPortfolio(true);
      setPortfolioState('success');
      toast.success(`${skin.name} added to portfolio!`);
      onAdded?.();
    } catch (error) {
      setPortfolioState('error');
      toast.error(`Failed to add ${skin.name} to portfolio`);
      console.error("Portfolio error:", error);
    }
  };

  const price = skin.priceAvg || skin.priceMedian;
  const rarityColor = getRarityColor(skin.rarity);
  
  // Safe string handling
  const safeName = skin.name || 'Unknown Skin';
  const safeRarity = skin.rarity || '';
  const safeWear = skin.wear || '';

  // {/* Card info: wear/rarity/offers/change */}
  // Helper functions for enhanced card information
  const getWearShortForm = (wear: string | null | undefined): string => {
    if (!wear) return '';
    const wearMap: Record<string, string> = {
      'Factory New': 'FN',
      'Minimal Wear': 'MW', 
      'Field-Tested': 'FT',
      'Well-Worn': 'WW',
      'Battle-Scarred': 'BS'
    };
    return wearMap[wear] || wear;
  };

  const getTimeAgo = (lastUpdated: string | null | undefined): string => {
    if (!lastUpdated) return '';
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getPriceChangeBadge = (change24h: number | null | undefined, change7d: number | null | undefined) => {
    const change = change24h || change7d;
    if (!change || change === 0) return null;
    
    const isPositive = change > 0;
    const color = isPositive ? 'text-green-500' : 'text-red-500';
    const symbol = isPositive ? '+' : '';
    const period = change24h ? '24h' : '7d';
    
    return (
      <Badge variant="outline" className={`text-xs ${color} border-current`}>
        {symbol}{change.toFixed(1)}% vs {period} avg
      </Badge>
    );
  };

  return (
    <Link href={`/skins/${skin.id}`} className="block">
      <Card 
        className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            window.location.href = `/skins/${skin.id}`;
          }
        }}
        aria-label={`View details for ${skin.name}`}
      >
        {/* Image */}
        <div className="aspect-square relative bg-muted">
                  {skin.imageUrl ? (
                    <Image
                      src={skin.imageUrl}
                      alt={skin.name}
                      fill
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                      // P2: Performance optimizations
                      priority={false}
                      quality={85}
                      unoptimized={false}
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">No Image</span>
                    </div>
                  )}
        
        {/* Rarity Badge */}
        {skin.rarity && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  className={`absolute top-2 left-2 ${getRarityColor(skin.rarity)} text-white border-2 shadow-lg`}
                  variant="secondary"
                >
                  {skin.rarity}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{skin.rarity} Rarity</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Special Badges */}
        <div className="absolute top-2 right-2 flex gap-1">
          {skin.isStattrak && (
            <Badge variant="outline" className="bg-orange-500 text-white border-orange-500">
              ST
            </Badge>
          )}
          {skin.isStar && (
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          )}
        </div>

        {/* Quick Actions - Always Visible */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={isInWatchlist ? "default" : "secondary"}
                  onClick={handleWatchlistAdd}
                  disabled={watchlistState === 'loading' || isInWatchlist}
                  className="h-8 w-8 p-0 focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label={isInWatchlist ? "Added to watchlist" : "Add to watchlist"}
                  aria-pressed={isInWatchlist}
                >
                  {watchlistState === 'loading' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isInWatchlist ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Heart className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={isInPortfolio ? "default" : "secondary"}
                  onClick={handlePortfolioAdd}
                  disabled={portfolioState === 'loading' || isInPortfolio}
                  className="h-8 w-8 p-0 focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label={isInPortfolio ? "Added to portfolio" : "Add to portfolio"}
                  aria-pressed={isInPortfolio}
                >
                  {portfolioState === 'loading' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isInPortfolio ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isInPortfolio ? "Remove from portfolio" : "Add to portfolio"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Title */}
          <h3 className="text-sm font-semibold truncate">{safeName}</h3>
          
          {/* P2: Enhanced Rarity & Wear with better structure */}
          <div className="flex items-center gap-2 text-xs">
            {skin.rarity && (
              <Badge className={`${getRarityColor(skin.rarity)} text-white border-0`}>
                {skin.rarity}
              </Badge>
            )}
            {skin.wear && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-muted-foreground">
                      {getWearShortForm(skin.wear)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{getWearFullName(skin.wear)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* P2: Price with change indicator */}
          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <p className="text-lg font-bold text-primary">
                {price ? `$${price.toFixed(2)}` : "N/A"}
              </p>
              {getPriceChangeBadge(skin.priceChange24h, skin.priceChange7d)}
            </div>
            
            {/* P2: Secondary info - offers and last updated */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {skin.offerVolume ? `${skin.offerVolume} offers` : "No offers"}
              </span>
              {skin.lastUpdated && (
                <span className="text-xs">
                  Updated {getTimeAgo(skin.lastUpdated)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function getRarityColor(rarity: string | null | undefined): string {
  if (!rarity) return 'bg-gray-600 border-gray-600';
  
  const colors: Record<string, string> = {
    'Consumer Grade': 'bg-gray-500 border-gray-500',
    'Industrial Grade': 'bg-cyan-600 border-cyan-600',
    'Mil-Spec': 'bg-blue-600 border-blue-600',
    'Restricted': 'bg-purple-600 border-purple-600',
    'Classified': 'bg-pink-600 border-pink-600',
    'Covert': 'bg-red-600 border-red-600',
    'Contraband': 'bg-orange-600 border-orange-600',
  };
  
  return colors[rarity] || 'bg-gray-600 border-gray-600';
}

function getWearFullName(wear: string): string {
  const wearMap: Record<string, string> = {
    'FN': 'Factory New',
    'MW': 'Minimal Wear',
    'FT': 'Field-Tested',
    'WW': 'Well-Worn',
    'BS': 'Battle-Scarred',
  };
  
  return wearMap[wear] || wear;
}