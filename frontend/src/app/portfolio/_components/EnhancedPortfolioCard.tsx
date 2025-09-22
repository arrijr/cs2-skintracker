// /frontend/src/app/portfolio/_components/EnhancedPortfolioCard.tsx — [Frontend]
// {/* Enhanced Portfolio Card following Design System */}
"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Eye,
  DollarSign,
  BarChart3,
  Calendar,
  Package,
  Heart,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { formatUSD, safeToFixed } from "@/lib/num";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface EnhancedPortfolioCardProps {
  entry: {
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
  };
  onDataChange?: () => void;
  className?: string;
  viewMode?: 'grid' | 'list';
  showHoverEffects?: boolean;
}

export function EnhancedPortfolioCard({
  entry,
  onDataChange,
  className = "",
  viewMode = 'grid',
  showHoverEffects = true
}: EnhancedPortfolioCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { skin, amount, buyPrice, avgPrice, purchases } = entry;
  const currentPrice = skin.marketPrice || 0;
  const totalValue = currentPrice * amount;
  const totalInvested = avgPrice * amount;
  const unrealizedPL = totalValue - totalInvested;
  const plPercentage = totalInvested > 0 ? (unrealizedPL / totalInvested) * 100 : 0;

  const getRarityColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'covert': return 'text-red-400 border-red-400/30 bg-red-400/10';
      case 'classified': return 'text-pink-400 border-pink-400/30 bg-pink-400/10';
      case 'restricted': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
      case 'mil-spec': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      case 'industrial': return 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10';
      case 'consumer': return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
      default: return 'text-slate-400 border-slate-400/30 bg-slate-400/10';
    }
  };

  const getWearColor = (wear?: string) => {
    switch (wear?.toLowerCase()) {
      case 'fn': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'mw': return 'text-lime-400 bg-lime-400/10 border-lime-400/30';
      case 'ft': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'ww': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'bs': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    }
  };

  const getPLColor = (pl: number) => {
    return pl >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getPLIcon = (pl: number) => {
    return pl >= 0 ? 
      <TrendingUp className="h-3 w-3" /> : 
      <TrendingDown className="h-3 w-3" />;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCardClick = () => {
    setShowDetails(!showDetails);
  };

  if (viewMode === 'list') {
    return (
      <Card 
        className={cn(
          "card-enhanced group cursor-pointer",
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
              {!imageError && (skin.imageUrl || skin.itemimage) ? (
                <Image
                  src={skin.imageUrl || skin.itemimage || ''}
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
                  <h3 className="font-semibold text-white truncate group-hover:text-brand-green transition-colors">
                    {skin.name}
                  </h3>
                  <p className="text-sm text-slate-400 truncate">
                    {skin.weaponType} {skin.wear && `• ${skin.wear.toUpperCase()}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {amount}x
                    </Badge>
                    {skin.rarity && (
                      <Badge variant="outline" className={cn("text-xs", getRarityColor(skin.rarity))}>
                        {skin.rarity}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Value and P/L */}
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    {formatUSD(totalValue)}
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-sm",
                    getPLColor(unrealizedPL)
                  )}>
                    {getPLIcon(unrealizedPL)}
                    <span>{safeToFixed(plPercentage, 1)}%</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatUSD(unrealizedPL)}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 w-8 p-0 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 transition-all duration-200"
              >
                <Link href={`/skins/${skin.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
              >
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Details Section */}
          {showDetails && (
            <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Avg Price:</span>
                  <div className="font-medium text-white">{formatUSD(avgPrice)}</div>
                </div>
                <div>
                  <span className="text-slate-400">Current Price:</span>
                  <div className="font-medium text-white">{formatUSD(currentPrice)}</div>
                </div>
                <div>
                  <span className="text-slate-400">Total Invested:</span>
                  <div className="font-medium text-white">{formatUSD(totalInvested)}</div>
                </div>
                <div>
                  <span className="text-slate-400">Purchases:</span>
                  <div className="font-medium text-white">{purchases.length}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card 
      className={cn(
        "card-enhanced group cursor-pointer",
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
          {!imageError && (skin.imageUrl || skin.itemimage) ? (
            <Image
              src={skin.imageUrl || skin.itemimage || ''}
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
          
          {/* Amount badge */}
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="bg-black/50 border-white/30 text-white backdrop-blur-sm text-xs">
              {amount}x
            </Badge>
          </div>
          
          {/* P/L indicator */}
          <div className="absolute bottom-2 right-2">
            <Badge 
              variant="outline" 
              className={cn(
                "backdrop-blur-sm text-xs font-medium",
                unrealizedPL >= 0 
                  ? "bg-green-500/20 border-green-500/50 text-green-400" 
                  : "bg-red-500/20 border-red-500/50 text-red-400"
              )}
            >
              {unrealizedPL >= 0 ? '+' : ''}{safeToFixed(plPercentage, 1)}%
            </Badge>
          </div>
          
          {/* Hover actions */}
          <div className={cn(
            "absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300",
            "bg-black/40 backdrop-blur-sm"
          )}>
            <Button
              variant="secondary"
              size="sm"
              asChild
              className="h-8 px-3 bg-white/20 hover:bg-brand-blue/20 text-white hover:text-brand-blue transition-all duration-200"
            >
              <Link href={`/skins/${skin.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <div className="space-y-1">
            <h3 className="font-semibold text-white truncate group-hover:text-brand-green transition-colors">
              {skin.name}
            </h3>
            <p className="text-sm text-slate-400 truncate">
              {skin.weaponType} {skin.wear && `• ${skin.wear.toUpperCase()}`}
            </p>
          </div>
          
          {/* Value and P/L */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-white">
                {formatUSD(totalValue)}
              </div>
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                getPLColor(unrealizedPL)
              )}>
                {getPLIcon(unrealizedPL)}
                <span>{safeToFixed(plPercentage, 1)}%</span>
              </div>
            </div>
            
            <div className="text-xs text-slate-400">
              P/L: <span className={getPLColor(unrealizedPL)}>
                {formatUSD(unrealizedPL)}
              </span>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>{formatUSD(avgPrice)} avg</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              <span>{purchases.length} buys</span>
            </div>
          </div>
          
          {/* Badges */}
          <div className="flex items-center gap-2">
            {skin.wear && (
              <Badge variant="outline" className={cn("w-fit text-xs", getWearColor(skin.wear))}>
                {skin.wear.toUpperCase()}
              </Badge>
            )}
            {skin.rarity && (
              <Badge variant="outline" className={cn("w-fit text-xs", getRarityColor(skin.rarity))}>
                {skin.rarity}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
