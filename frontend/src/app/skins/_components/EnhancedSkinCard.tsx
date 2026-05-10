// /frontend/src/app/skins/_components/EnhancedSkinCard.tsx — [Frontend]
// {/* Enhanced Skin Card with modern visual effects */}
"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Eye,
  ExternalLink,
  DollarSign,
  BarChart3
} from "lucide-react";
import { formatUSD, safeToFixed } from "@/lib/num";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface EnhancedSkinCardProps {
  skin: {
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
    change24h?: number;
    change7d?: number;
  };
  onSkinClick?: (skinId: number) => void;
  onSkinAdd?: (skinId: number) => void;
  onToggleWatchlist?: (skinId: number) => void;
  isInWatchlist?: boolean;
  isInPortfolio?: boolean;
  className?: string;
  viewMode?: 'grid' | 'list';
  showHoverEffects?: boolean;
}

export function EnhancedSkinCard({
  skin,
  onSkinClick,
  onSkinAdd,
  onToggleWatchlist,
  isInWatchlist = false,
  isInPortfolio = false,
  className = "",
  viewMode = 'grid',
  showHoverEffects = true
}: EnhancedSkinCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getRarityColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'covert': return 'text-red-500 border-red-500/30 bg-red-500/10';
      case 'classified': return 'text-pink-500 border-pink-500/30 bg-pink-500/10';
      case 'restricted': return 'text-brand-purple-600 border-brand-purple-600/30 bg-brand-purple-600/10';
      case 'mil-spec': return 'text-brand-slate-500 border-brand-slate-500/30 bg-brand-slate-500/10';
      case 'industrial': return 'text-cyan-500 border-cyan-500/30 bg-cyan-500/10';
      case 'consumer': return 'text-brand-slate-400 border-brand-slate-400/30 bg-brand-slate-400/10';
      default: return 'text-brand-slate-400 border-brand-slate-400/30 bg-brand-slate-400/10';
    }
  };

  const getWearColor = (wear?: string) => {
    switch (wear?.toLowerCase()) {
      case 'fn': return 'text-brand-celadon-500 bg-brand-celadon-500/10 border-brand-celadon-500/30';
      case 'mw': return 'text-brand-celadon-400 bg-brand-celadon-400/10 border-brand-celadon-400/30';
      case 'ft': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'ww': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'bs': return 'text-red-500 bg-red-500/10 border-red-500/30';
      default: return 'text-brand-slate-400 bg-brand-slate-400/10 border-brand-slate-400/30';
    }
  };

  const getPriceChangeColor = (change?: number) => {
    if (!change) return 'text-brand-slate-400';
    return change >= 0 ? 'text-brand-celadon-500' : 'text-red-500';
  };

  const getPriceChangeIcon = (change?: number) => {
    if (!change) return null;
    return change >= 0 ? 
      <TrendingUp className="h-3 w-3" /> : 
      <TrendingDown className="h-3 w-3" />;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCardClick = () => {
    onSkinClick?.(skin.id);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSkinAdd?.(skin.id);
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWatchlist?.(skin.id);
  };

  if (viewMode === 'list') {
    return (
      <Card 
        className={cn(
          "group cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-slate-500/10",
          "border-slate-700/50 hover:border-slate-600/50",
          "bg-slate-800/30 hover:bg-slate-700/40",
          "backdrop-blur-sm",
          showHoverEffects && "hover:scale-[1.02] hover:-translate-y-1",
          className
        )}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Image */}
            <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-700/50">
              {!imageError && skin.imageUrl ? (
                <Image
                  src={skin.imageUrl}
                  alt={skin.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-700">
                  <span className="text-slate-400 text-xs font-bold">CS2</span>
                </div>
              )}
              
              {/* Rarity indicator */}
              {skin.rarity && (
                <div className={cn(
                  "absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-medium border",
                  getRarityColor(skin.rarity)
                )}>
                  {skin.rarity.charAt(0)}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
                    {skin.name}
                  </h3>
                  <p className="text-sm text-slate-400 truncate">
                    {skin.weaponType} {skin.wear && `• ${skin.wear.toUpperCase()}`}
                  </p>
                </div>
                
                {/* Price */}
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    {formatUSD(skin.priceLatest || skin.priceMedian || skin.priceAvg || 0)}
                  </div>
                  {skin.change24h !== undefined && (
                    <div className={cn(
                      "flex items-center gap-1 text-sm",
                      getPriceChangeColor(skin.change24h)
                    )}>
                      {getPriceChangeIcon(skin.change24h)}
                      <span>{safeToFixed(skin.change24h, 1)}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mt-2">
                {skin.isStattrak && (
                  <Badge variant="outline" className="text-orange-400 border-orange-400/30 bg-orange-400/10 text-xs">
                    StatTrak™
                  </Badge>
                )}
                {skin.isStar && (
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 bg-yellow-400/10 text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Special
                  </Badge>
                )}
                {skin.rarity && (
                  <Badge variant="outline" className={cn("text-xs", getRarityColor(skin.rarity))}>
                    {skin.rarity}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWatchlistClick}
                className={cn(
                  "h-8 w-8 p-0 transition-all duration-200",
                  isInWatchlist 
                    ? "text-red-400 hover:text-red-300 hover:bg-red-400/10" 
                    : "text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                )}
              >
                <Heart className={cn("h-4 w-4", isInWatchlist && "fill-current")} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddClick}
                className="h-8 w-8 p-0 text-slate-400 hover:text-brand-green hover:bg-brand-green/10 transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card
      data-testid="skin-card"
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-slate-500/10",
        "border-slate-700/50 hover:border-slate-600/50",
        "bg-slate-800/30 hover:bg-slate-700/40",
        "backdrop-blur-sm",
        showHoverEffects && "hover:scale-105 hover:-translate-y-2",
        className
      )}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-slate-700/50">
          {!imageError && skin.imageUrl ? (
            <Image
              src={skin.imageUrl}
              alt={skin.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-700">
              <span className="text-slate-400 text-2xl font-bold">CS2</span>
            </div>
          )}
          
          {/* Overlay with effects */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Rarity indicator */}
          {skin.rarity && (
            <div className={cn(
              "absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium border backdrop-blur-sm",
              getRarityColor(skin.rarity)
            )}>
              {skin.rarity.charAt(0)}
            </div>
          )}
          
          {/* Special badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {skin.isStattrak && (
              <Badge variant="outline" className="text-orange-400 border-orange-400/50 bg-orange-400/20 backdrop-blur-sm text-xs">
                ST
              </Badge>
            )}
            {skin.isStar && (
              <Badge variant="outline" className="text-yellow-400 border-yellow-400/50 bg-yellow-400/20 backdrop-blur-sm text-xs">
                <Star className="h-3 w-3" />
              </Badge>
            )}
          </div>
          
          {/* Hover actions */}
          <div className={cn(
            "absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300",
            "bg-black/40 backdrop-blur-sm"
          )}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleWatchlistClick}
              className={cn(
                "h-8 px-3 transition-all duration-200",
                isInWatchlist 
                  ? "bg-red-500 hover:bg-red-600 text-white" 
                  : "bg-white/20 hover:bg-red-500/20 text-white hover:text-red-300"
              )}
            >
              <Heart className={cn("h-4 w-4 mr-1", isInWatchlist && "fill-current")} />
              {isInWatchlist ? 'Saved' : 'Save'}
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddClick}
              className="h-8 px-3 bg-white/20 hover:bg-purple-500/20 text-white hover:text-purple-300 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <div className="space-y-1">
            <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
              {skin.name}
            </h3>
            <p className="text-sm text-slate-400 truncate">
              {skin.weaponType} {skin.wear && `• ${skin.wear.toUpperCase()}`}
            </p>
          </div>
          
          {/* Price and change */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-white">
                {formatUSD(skin.priceAvg)}
              </div>
              {skin.change24h !== undefined && (
                <div className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  getPriceChangeColor(skin.change24h)
                )}>
                  {getPriceChangeIcon(skin.change24h)}
                  <span>{safeToFixed(skin.change24h, 1)}%</span>
                </div>
              )}
            </div>
            
            {skin.change7d !== undefined && (
              <div className="text-xs text-slate-400">
                7d: <span className={getPriceChangeColor(skin.change7d)}>
                  {safeToFixed(skin.change7d, 1)}%
                </span>
              </div>
            )}
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            {skin.sold24h && (
              <div className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                <span>{skin.sold24h} sold</span>
              </div>
            )}
            {skin.offerVolume && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span>{skin.offerVolume} offers</span>
              </div>
            )}
          </div>
          
          {/* Wear badge */}
          {skin.wear && (
            <Badge variant="outline" className={cn("w-fit text-xs", getWearColor(skin.wear))}>
              {skin.wear.toUpperCase()}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
