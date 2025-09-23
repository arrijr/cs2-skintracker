// /frontend/src/app/dashboard/components/EnhancedMovers.tsx — [Frontend]
// {/* Enhanced Movers with Hover Charts and Quick Preview */}
"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  ExternalLink,
  Eye,
  Heart,
  Plus,
  BarChart3,
  DollarSign,
  Package,
  RefreshCw
} from "lucide-react";
import { formatUSD, safeToFixed } from "@/lib/num";
import Image from "next/image";
import Link from "next/link";
import Tooltip from "@/components/ui/Tooltip";

interface MoverItem {
  id: number;
  name: string;
  imageUrl: string;
  priceLatest: number;
  priceChange24h: number;
  priceChange7d: number;
  volume24h?: number;
  listings?: number;
}

interface EnhancedMoversProps {
  type: 'gainers' | 'losers';
  data: MoverItem[];
  timeframe: '24h' | '7d';
  showHoverCharts?: boolean;
  showQuickPreview?: boolean;
  className?: string;
}

export function EnhancedMovers({
  type,
  data,
  timeframe,
  showHoverCharts = false,
  showQuickPreview = false,
  className = ""
}: EnhancedMoversProps) {
  const [hoveredItem, setHoveredItem] = useState<MoverItem | null>(null);
  const [showPreview, setShowPreview] = useState<MoverItem | null>(null);

  const getChangeColor = (change: number) => {
    if (Math.abs(change) < 1) return 'text-slate-400';
    if (Math.abs(change) < 3) return change >= 0 ? 'text-green-300' : 'text-red-300';
    if (Math.abs(change) < 5) return change >= 0 ? 'text-green-400' : 'text-red-400';
    return change >= 0 ? 'text-green-500' : 'text-red-500';
  };

  const getChangeBadgeClass = (change: number) => {
    if (Math.abs(change) < 1) return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    if (Math.abs(change) < 3) return change >= 0 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30';
    return change >= 0 ? 'bg-green-600/20 text-green-500 border-green-600/30' : 'bg-red-600/20 text-red-500 border-red-600/30';
  };

  const currentChange = timeframe === '24h' ? 'priceChange24h' : 'priceChange7d';
  const sortedData = [...data].sort((a, b) => {
    const aChange = a[currentChange as keyof MoverItem] as number;
    const bChange = b[currentChange as keyof MoverItem] as number;
    return type === 'gainers' ? bChange - aChange : aChange - bChange;
  });

  if (data.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-slate-400 mb-4">
          {type === 'gainers' ? (
            <TrendingUp className="h-12 w-12 mx-auto mb-2" />
          ) : (
            <TrendingDown className="h-12 w-12 mx-auto mb-2" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          No {type === 'gainers' ? 'Gainers' : 'Losers'} Found
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Check back later for market movements
        </p>
        <Button variant="outline" size="sm" className="btn-enhanced">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {sortedData.slice(0, 5).map((item, index) => {
        const change = item[currentChange as keyof MoverItem] as number;
        const isPositive = change >= 0;
        
        return (
          <div
            key={item.id}
            className="group relative"
            onMouseEnter={() => setHoveredItem(item)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <Card className="card-enhanced hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">#{index + 1}</span>
                  </div>

                  {/* Image */}
                  <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-slate-700/50">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-200"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white truncate group-hover:text-brand-green transition-colors">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-white">
                        {formatUSD(item.priceLatest)}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getChangeBadgeClass(change)}`}
                      >
                        {isPositive ? '+' : ''}{safeToFixed(change, 1)}%
                      </Badge>
                    </div>
                    {item.volume24h && (
                      <div className="text-xs text-slate-400 mt-1">
                        Vol: {item.volume24h.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-brand-blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPreview(item);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-brand-green"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add to watchlist
                      }}
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                    >
                      <Link href={`/skins/${item.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hover Chart */}
            {showHoverCharts && hoveredItem?.id === item.id && (
              <div className="absolute top-full left-0 right-0 z-10 mt-2 p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-xl">
                <div className="text-sm text-slate-300 mb-2">7d Price History</div>
                <div className="h-20 bg-slate-700/50 rounded flex items-center justify-center">
                  <span className="text-xs text-slate-400">Chart placeholder</span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Quick Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Quick Preview</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-700/50">
                    <Image
                      src={showPreview.imageUrl}
                      alt={showPreview.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{showPreview.name}</h4>
                    <div className="text-2xl font-bold text-white">
                      {formatUSD(showPreview.priceLatest)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">24h Change:</span>
                    <div className={`font-medium ${getChangeColor(showPreview.priceChange24h)}`}>
                      {showPreview.priceChange24h >= 0 ? '+' : ''}{safeToFixed(showPreview.priceChange24h, 1)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">7d Change:</span>
                    <div className={`font-medium ${getChangeColor(showPreview.priceChange7d)}`}>
                      {showPreview.priceChange7d >= 0 ? '+' : ''}{safeToFixed(showPreview.priceChange7d, 1)}%
                    </div>
                  </div>
                  {showPreview.volume24h && (
                    <div>
                      <span className="text-slate-400">Volume 24h:</span>
                      <div className="font-medium text-white">
                        {showPreview.volume24h.toLocaleString()}
                      </div>
                    </div>
                  )}
                  {showPreview.listings && (
                    <div>
                      <span className="text-slate-400">Listings:</span>
                      <div className="font-medium text-white">
                        {showPreview.listings}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 btn-enhanced">
                    <Heart className="h-4 w-4 mr-2" />
                    Add to Watchlist
                  </Button>
                  <Button size="sm" className="flex-1 btn-enhanced">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
