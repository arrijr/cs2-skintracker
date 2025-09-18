"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart3, TrendingUp, Calendar, Info } from "lucide-react";

// [COMPONENT] Historical Quantity (Listings) Bar Chart — shows daily active listings (and optional 24h volume)

interface QuantityData {
  date: string;
  activeListings: number;
  soldVolume24h: number | null;
  priceUsd: number | null;
}

interface QuantityBarChartProps {
  skinId: number;
  skinName: string;
  className?: string;
}

type Range = '7d' | '30d' | '90d' | '1y' | 'all';

const QuantityBarChart: React.FC<QuantityBarChartProps> = ({ 
  skinId, 
  skinName, 
  className = "" 
}) => {
  const [data, setData] = useState<QuantityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>('30d');
  const [showVolume, setShowVolume] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch quantity history data
  useEffect(() => {
    const fetchQuantityHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/skins/${skinId}/history/quantity?range=${range}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch quantity history: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result.data || []);
        setLastUpdated(new Date().toLocaleTimeString());
        
      } catch (err) {
        console.error('Error fetching quantity history:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (skinId) {
      fetchQuantityHistory();
    }
  }, [skinId, range]);

  // Calculate chart statistics
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const activeListings = data.map(d => d.activeListings);
    const volumes = data.map(d => d.soldVolume24h).filter(v => v !== null) as number[];

    return {
      maxListings: Math.max(...activeListings),
      minListings: Math.min(...activeListings),
      avgListings: Math.round(activeListings.reduce((a, b) => a + b, 0) / activeListings.length),
      maxVolume: volumes.length > 0 ? Math.max(...volumes) : 0,
      minVolume: volumes.length > 0 ? Math.min(...volumes) : 0,
      avgVolume: volumes.length > 0 ? Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length) : 0,
      hasVolume: volumes.length > 0
    };
  }, [data]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get bar height percentage
  const getBarHeight = (value: number, maxValue: number) => {
    if (maxValue === 0) return 0;
    return Math.max((value / maxValue) * 100, 2); // Minimum 2% height
  };

  // Get bar color based on value
  const getBarColor = (value: number, maxValue: number) => {
    const percentage = (value / maxValue) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Quantity History
            </CardTitle>
            <Skeleton className="h-8 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Quantity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load quantity data</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Quantity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No quantity data available</p>
            <p className="text-sm text-muted-foreground mt-1">
              Data will appear once market snapshots are collected
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Quantity History
          </CardTitle>
          
          {/* Quantity Range Toggle — 7D / 30D / 90D / 1Y / ALL */}
          <div className="flex items-center gap-4">
            <ToggleGroup 
              type="single" 
              value={range} 
              onValueChange={(value: Range) => value && setRange(value)}
              className="bg-muted/50 p-1 rounded-lg"
            >
              <ToggleGroupItem value="7d" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                7D
              </ToggleGroupItem>
              <ToggleGroupItem value="30d" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                30D
              </ToggleGroupItem>
              <ToggleGroupItem value="90d" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                90D
              </ToggleGroupItem>
              <ToggleGroupItem value="1y" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                1Y
              </ToggleGroupItem>
              <ToggleGroupItem value="all" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                ALL
              </ToggleGroupItem>
            </ToggleGroup>

            {stats?.hasVolume && (
              <ToggleGroup 
                type="single" 
                value={showVolume ? "volume" : "listings"} 
                onValueChange={(value) => setShowVolume(value === "volume")}
                className="bg-muted/50 p-1 rounded-lg"
              >
                <ToggleGroupItem value="listings" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  Listings
                </ToggleGroupItem>
                <ToggleGroupItem value="volume" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  Volume
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Max: {stats.maxListings.toLocaleString()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Avg: {stats.avgListings.toLocaleString()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Min: {stats.minListings.toLocaleString()}
              </Badge>
            </div>
            
            {stats.hasVolume && showVolume && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  Max Vol: {stats.maxVolume.toLocaleString()}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Avg Vol: {stats.avgVolume.toLocaleString()}
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Quantity Bar Chart — Active Listings per day */}
        <div className="space-y-4">
          {/* Chart Area */}
          <div className="relative">
            <div className="h-64 flex items-end justify-between gap-1 px-2">
              {data.map((item, index) => {
                const value = showVolume ? (item.soldVolume24h || 0) : item.activeListings;
                const maxValue = showVolume ? stats?.maxVolume || 1 : stats?.maxListings || 1;
                const height = getBarHeight(value, maxValue);
                const color = getBarColor(value, maxValue);
                
                return (
                  <TooltipProvider key={item.date}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`${color} rounded-t-sm transition-all duration-200 hover:opacity-80 cursor-pointer min-w-[8px] flex-1`}
                          style={{ height: `${height}%` }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-center">
                          <p className="font-semibold">{formatDate(item.date)}</p>
                          <p className="text-sm">
                            {showVolume ? 'Volume 24h' : 'Active Listings'}: {value.toLocaleString()}
                          </p>
                          {item.priceUsd && (
                            <p className="text-xs text-muted-foreground">
                              Price: ${item.priceUsd.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
            
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
              <span>{stats?.maxListings.toLocaleString()}</span>
              <span>{Math.round((stats?.maxListings || 0) * 0.5).toLocaleString()}</span>
              <span>0</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-sm" />
                <span>{showVolume ? '24h Volume' : 'Active Listings'}</span>
              </div>
              {stats?.hasVolume && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-muted-foreground rounded-sm" />
                  <span>Price (USD)</span>
                </div>
              )}
            </div>
            
            {lastUpdated && (
              <div className="flex items-center gap-1 text-xs">
                <Info className="h-3 w-3" />
                Last updated: {lastUpdated}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuantityBarChart;
