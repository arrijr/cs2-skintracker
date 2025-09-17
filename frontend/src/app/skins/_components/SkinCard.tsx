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

        <CardContent className="p-4 space-y-2">
          {/* Title */}
          <h3 className="text-sm font-semibold truncate">{safeName}</h3>
          
          {/* Rarity & Wear */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {skin.rarity && (
              <Badge className={getRarityColor(skin.rarity)}>{skin.rarity}</Badge>
            )}
            {skin.wear && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline">{skin.wear}</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getWearFullName(skin.wear)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Price & Volume */}
          <div className="flex items-baseline justify-between">
            <p className="text-lg font-bold text-primary">
              {price ? `$${price.toFixed(2)}` : "N/A"}
            </p>
            <p className="text-xs text-muted-foreground">
              {skin.offerVolume ? `${skin.offerVolume} offers` : "N/A offers"}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function getRarityColor(rarity: string | null | undefined): string {
  if (!rarity) return 'bg-gray-500 border-gray-500';
  
  const colors: Record<string, string> = {
    'Consumer Grade': 'bg-gray-500 border-gray-500',
    'Industrial Grade': 'bg-cyan-500 border-cyan-500',
    'Mil-Spec': 'bg-blue-500 border-blue-500',
    'Restricted': 'bg-purple-500 border-purple-500',
    'Classified': 'bg-pink-500 border-pink-500',
    'Covert': 'bg-red-500 border-red-500',
    'Contraband': 'bg-orange-500 border-orange-500',
  };
  
  return colors[rarity] || 'bg-gray-500 border-gray-500';
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