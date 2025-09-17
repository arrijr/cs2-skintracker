// frontend/src/app/browse/components/SkinCard.tsx — [Frontend]
// {/* Modern Skin Card with Quick Actions and States */}
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, Plus, Check, Loader2, Star } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { apiUrl, fetchJson } from "@/lib/api";
import { toast } from "sonner";
import Image from "next/image";
import { Skin } from "@/hooks/useSkins";

interface SkinCardProps {
  skin: Skin;
}

// Rarity colors
const RARITY_COLORS = {
  "Covert": "bg-red-500",
  "Classified": "bg-pink-500", 
  "Restricted": "bg-purple-500",
  "Mil-Spec": "bg-blue-500",
  "Industrial Grade": "bg-cyan-500",
  "Consumer Grade": "bg-gray-500"
};

// Wear abbreviations
const WEAR_ABBREVIATIONS = {
  "Factory New": "FN",
  "Minimal Wear": "MW", 
  "Field-Tested": "FT",
  "Well-Worn": "WW",
  "Battle-Scarred": "BS"
};

export function SkinCard({ skin }: SkinCardProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  
  // Action states
  const [watchlistState, setWatchlistState] = useState<'default' | 'loading' | 'success' | 'error'>('default');
  const [portfolioState, setPortfolioState] = useState<'default' | 'loading' | 'success' | 'error'>('default');
  
  // Check if already in watchlist/portfolio (you'd need to implement this)
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isInPortfolio, setIsInPortfolio] = useState(false);

  // Format price
  const formatPrice = (price?: number | null) => {
    if (!price) return "N/A";
    return `$${price.toFixed(2)}`;
  };

  // Get rarity color
  const getRarityColor = (rarity?: string) => {
    if (!rarity) return "bg-gray-500";
    return RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || "bg-gray-500";
  };

  // Get wear abbreviation
  const getWearAbbr = (wear?: string) => {
    if (!wear) return "";
    return WEAR_ABBREVIATIONS[wear as keyof typeof WEAR_ABBREVIATIONS] || wear;
  };

  // Handle skin click
  const handleSkinClick = () => {
    router.push(`/skins/${skin.id}`);
  };

  // {/* Quick Actions: Watchlist & Portfolio */}
  const handleWatchlistAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (isInWatchlist) return;

    setWatchlistState('loading');
    
    try {
      const token = localStorage.getItem("token");
      await fetchJson(apiUrl('/api/v1/watchlist'), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          skinId: skin.id,
          targetPrice: skin.priceAvg || 0
        })
      });
      
      setWatchlistState('success');
      setIsInWatchlist(true);
      toast.success("Added to watchlist");
      
      // Reset to default after 2 seconds
      setTimeout(() => setWatchlistState('default'), 2000);
    } catch (error) {
      setWatchlistState('error');
      toast.error("Failed to add to watchlist");
      console.error("Watchlist error:", error);
    }
  };

  const handlePortfolioAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (isInPortfolio) return;

    setPortfolioState('loading');
    
    try {
      const token = localStorage.getItem("token");
      await fetchJson(apiUrl('/api/v1/portfolio'), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          skinId: skin.id,
          amount: 1,
          buyPrice: skin.priceAvg || 0,
          buyDate: new Date().toISOString().slice(0, 10)
        })
      });
      
      setPortfolioState('success');
      setIsInPortfolio(true);
      toast.success("Added to portfolio");
      
      // Reset to default after 2 seconds
      setTimeout(() => setPortfolioState('default'), 2000);
    } catch (error) {
      setPortfolioState('error');
      toast.error("Failed to add to portfolio");
      console.error("Portfolio error:", error);
    }
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={handleSkinClick}
    >
      {/* Image */}
      <div className="aspect-square relative bg-muted">
        {skin.imageUrl ? (
          <Image
            src={skin.imageUrl}
            alt={skin.name}
            fill
            className="object-cover"
            loading="lazy"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No Image</span>
          </div>
        )}
        
        {/* Rarity Badge */}
        {skin.rarity && (
          <Badge 
            className={`absolute top-2 left-2 ${getRarityColor(skin.rarity)} text-white`}
            variant="secondary"
          >
            {skin.rarity}
          </Badge>
        )}
        
        {/* Special Badges */}
        <div className="absolute top-2 right-2 flex gap-1">
          {skin.isStattrak && (
            <Badge variant="outline" className="bg-orange-500 text-white border-orange-500">
              ST
            </Badge>
          )}
          {skin.isStar && (
            <Badge variant="outline" className="bg-yellow-500 text-white border-yellow-500">
              <Star className="h-3 w-3" />
            </Badge>
          )}
        </div>

        {/* Quick Actions - Always Visible */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleWatchlistAdd}
                  disabled={watchlistState === 'loading' || isInWatchlist}
                  className="h-8 w-8 p-0"
                >
                  {watchlistState === 'loading' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isInWatchlist || watchlistState === 'success' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Heart className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handlePortfolioAdd}
                  disabled={portfolioState === 'loading' || isInPortfolio}
                  className="h-8 w-8 p-0"
                >
                  {portfolioState === 'loading' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isInPortfolio || portfolioState === 'success' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isInPortfolio ? "In Portfolio" : "Add to Portfolio"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4 space-y-2">
        {/* Name */}
        <h3 className="font-medium text-sm line-clamp-2 leading-tight">
          {skin.name}
        </h3>
        
        {/* Wear & Price */}
        <div className="flex items-center justify-between">
          {skin.wear && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs">
                    {getWearAbbr(skin.wear)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{skin.wear}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <span className="font-semibold text-sm text-green-600">
            {formatPrice(skin.priceAvg)}
          </span>
        </div>
        
        {/* Volume info */}
        {skin.sold24h && skin.sold24h > 0 && (
          <div className="text-xs text-muted-foreground">
            {skin.sold24h} sold (24h)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
