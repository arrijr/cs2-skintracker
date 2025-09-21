// /frontend/src/app/dashboard/components/AlertsBox.tsx — [Frontend]
// {/* Enhanced Alerts & Watchlist Box with Near Alerts and Quick Add */}
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertCircle, 
  Heart, 
  Plus, 
  RefreshCw,
  Eye,
  Bell,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { formatUSD, safeToFixed } from "@/lib/num";

interface WatchlistItem {
  id: number;
  skin: {
    id: number;
    name: string;
    imageUrl: string;
    priceLatest: number;
    priceChange24h: number;
  };
  priceAlert?: number;
  isNearAlert?: boolean;
}

interface AlertsBoxProps {
  watchlist: WatchlistItem[];
  activeAlerts: number;
  nearAlerts: number;
  lastUpdated?: string;
  onRefresh?: () => void;
  onAddAlert?: () => void;
  onViewAll?: () => void;
  isLoading?: boolean;
}

export default function AlertsBox({ 
  watchlist,
  activeAlerts = 0,
  nearAlerts = 0,
  lastUpdated, 
  onRefresh,
  onAddAlert,
  onViewAll,
  isLoading = false 
}: AlertsBoxProps) {
  if (isLoading) {
    return (
      <Card className="card-brand">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-brand-orange" />
              Alerts & Watchlist
            </CardTitle>
            <Skeleton className="h-8 w-8" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-brand card-enhanced hover-lift">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <AlertCircle className="h-4 w-4 text-brand-orange" />
              Alerts & Watchlist
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
      <CardContent className="space-y-4">
        {/* Alerts Summary */}
        <div className="space-y-3">
          {/* Active Alerts */}
          <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Active Alerts</span>
              <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                {activeAlerts} active
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Price alerts monitoring your watchlist
            </p>
          </div>

          {/* Near Alerts */}
          {nearAlerts > 0 && (
            <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Near Threshold</span>
                <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                  {nearAlerts} near
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Skins within ±3% of your alert price
              </p>
            </div>
          )}

          {/* Quick Add Alert */}
          <Button 
            onClick={onAddAlert}
            variant="outline" 
            size="sm" 
            className="w-full border-brand-blue/30 text-brand-blue hover:bg-brand-blue/10 btn-enhanced"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Alert
          </Button>
        </div>

        {/* Watchlist Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Watchlist Preview</h4>
            {onViewAll && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onViewAll}
                className="text-xs h-6 px-2"
              >
                View All
                <Eye className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>

          {watchlist.length > 0 ? (
            <div className="space-y-2">
              {watchlist.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-all duration-200 hover-scale">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.skin.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatUSD(item.skin.priceLatest)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {item.skin.priceChange24h >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-400" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      )}
                      <span className={`text-xs font-semibold ${
                        item.skin.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {item.skin.priceChange24h >= 0 ? '+' : ''}{safeToFixed(item.skin.priceChange24h, 1)}%
                      </span>
                    </div>
                    {item.isNearAlert && (
                      <Badge variant="outline" className="text-xs mt-1 border-yellow-500/30 text-yellow-400">
                        Near Alert
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground space-y-3">
              <div className="space-y-2">
                <Heart className="h-10 w-10 mx-auto opacity-50" />
                <h4 className="font-medium">No Watchlist Items</h4>
                <p className="text-sm max-w-xs">
                  Add skins to your watchlist to track price changes and set alerts.
                </p>
              </div>
              <Button 
                onClick={() => window.location.href = '/skins'}
                variant="outline" 
                size="sm"
                className="border-brand-blue/30 text-brand-blue hover:bg-brand-blue/10"
              >
                <Eye className="h-4 w-4 mr-2" />
                Browse Skins
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
