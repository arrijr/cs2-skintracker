// /frontend/src/app/dashboard/components/Movers.tsx — [Frontend]
// {/* Enhanced Top Gainers/Losers with Hover Charts and Premium Features */}
"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  RefreshCw,
  Lock,
  Crown,
  Eye,
  Heart,
  Plus
} from "lucide-react";
import { formatUSD, safeToFixed } from "@/lib/num";

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

interface MoversProps {
  gainers: MoverItem[];
  losers: MoverItem[];
  lastUpdated?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
  isPremium?: boolean;
  scope?: 'portfolio' | 'global';
  onScopeChange?: (scope: 'portfolio' | 'global') => void;
  onItemClick?: (item: MoverItem) => void;
}

export default function Movers({ 
  gainers,
  losers,
  lastUpdated, 
  onRefresh,
  isLoading = false,
  isPremium = false,
  scope = 'portfolio',
  onScopeChange,
  onItemClick
}: MoversProps) {
  const [timeframe, setTimeframe] = useState<'24h' | '7d'>('24h');

  const getChangeValue = (item: MoverItem) => {
    return timeframe === '24h' ? item.priceChange24h : item.priceChange7d;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? TrendingUp : TrendingDown;
  };

  const renderMoverList = (items: MoverItem[], title: string, icon: React.ReactNode, color: string) => (
    <Card className="card-brand">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className={`flex items-center gap-2 ${color}`}>
              {icon}
              {title}
            </CardTitle>
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdated}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => {
              const change = getChangeValue(item);
              const ChangeIcon = getChangeIcon(change);
              
              return (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group"
                  onClick={() => onItemClick?.(item)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatUSD(item.priceLatest)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <ChangeIcon className="h-4 w-4" />
                      <span className={`font-semibold ${getChangeColor(change)}`}>
                        {change >= 0 ? '+' : ''}{safeToFixed(change, 1)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{timeframe}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground space-y-3">
            <div className="space-y-2">
              {icon}
              <h4 className="font-medium">No Market Data</h4>
              <p className="text-sm max-w-xs">
                Market data will appear here when available.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Top Movers</h3>
        <div className="flex items-center gap-2">
          {/* Scope Toggle */}
          <ToggleGroup 
            type="single" 
            value={scope}
            onValueChange={(value: 'portfolio' | 'global') => value && onScopeChange?.(value)}
            className="bg-muted/50 p-1 rounded-lg"
          >
            <ToggleGroupItem value="portfolio" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs px-2">
              Portfolio
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="global" 
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs px-2 relative"
              disabled={!isPremium}
            >
              {!isPremium && <Lock className="h-3 w-3 absolute -top-1 -right-1" />}
              Global
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Timeframe Toggle */}
          <ToggleGroup 
            type="single" 
            value={timeframe}
            onValueChange={(value: '24h' | '7d') => value && setTimeframe(value)}
            className="bg-muted/50 p-1 rounded-lg"
          >
            <ToggleGroupItem value="24h" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs px-2">
              24h
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs px-2">
              7d
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Premium Notice for Global */}
      {scope === 'global' && !isPremium && (
        <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-yellow-500" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-400">Premium Feature</h4>
              <p className="text-sm text-muted-foreground">
                Global market movers require Premium subscription
              </p>
            </div>
            <Button size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          </div>
        </div>
      )}

      {/* Movers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderMoverList(
          gainers, 
          "Top Gainers", 
          <TrendingUp className="h-5 w-5" />, 
          "text-green-400"
        )}
        {renderMoverList(
          losers, 
          "Top Losers", 
          <TrendingDown className="h-5 w-5" />, 
          "text-red-400"
        )}
      </div>
    </div>
  );
}
