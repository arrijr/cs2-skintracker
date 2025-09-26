// /frontend/src/app/dashboard/components/PortfolioBreakdown.tsx — [Frontend]
// {/* Portfolio Breakdown - Donut/Bar Chart for Rarity/Weapon Type Allocation */}
"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  PieChart, 
  BarChart3, 
  Package, 
  RefreshCw,
  Filter
} from "lucide-react";
import { formatUSD } from "@/lib/num";
import InfoInfoTooltip from "@/components/ui/InfoInfoTooltip";

interface PortfolioItem {
  id: number;
  skinId: number;
  amount: number;
  currentValue: number;
  skin: {
    id: number;
    name: string;
    rarity: string;
    weaponType: string;
    imageUrl: string;
  };
}

interface BreakdownData {
  category: string;
  value: number;
  count: number;
  percentage: number;
  color: string;
}

interface PortfolioBreakdownProps {
  portfolio: PortfolioItem[];
  lastUpdated?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const RARITY_COLORS = {
  'Covert': '#ef4444',           // Red-500
  'Classified': '#ec4899',       // Pink-500
  'Restricted': '#9333ea',       // Purple-600
  'Mil-Spec': '#747c92',         // Brand Slate
  'Industrial': '#06b6d4',       // Cyan-500
  'Consumer': '#94a3b8'          // Slate-400
};

const WEAPON_COLORS = {
  'Rifles': '#ef4444',           // Red-500
  'Pistols': '#94c595',          // Brand Celadon Dark
  'SMGs': '#06b6d4',             // Cyan-500
  'Shotguns': '#a1e8af',         // Brand Celadon
  'Knives': '#f59e0b',           // Yellow-500
  'Gloves': '#9333ea',           // Purple-600
  'Other': '#6b7280'             // Gray-500
};

const EXTERIOR_COLORS = {
  'Factory New': '#94c595',      // Brand Celadon Dark
  'Minimal Wear': '#a1e8af',     // Brand Celadon
  'Field-Tested': '#f59e0b',     // Yellow-500
  'Well-Worn': '#f97316',        // Orange-500
  'Battle-Scarred': '#ef4444',   // Red-500
  'Other': '#6b7280'             // Gray-500
};

export default function PortfolioBreakdown({ 
  portfolio, 
  lastUpdated, 
  onRefresh, 
  isLoading = false 
}: PortfolioBreakdownProps) {
  const [breakdownType, setBreakdownType] = useState<'rarity' | 'weapon' | 'exterior'>('rarity');

  // Calculate breakdown data
  const getBreakdownData = (): BreakdownData[] => {
    if (!portfolio || portfolio.length === 0) return [];

    const grouped = portfolio.reduce((acc, item) => {
      console.log('Portfolio item:', item); // Debug log
      
      // Calculate value based on current market price
      const currentPrice = item.skin?.marketPrice || item.skin?.priceLatest || item.skin?.priceAvg || item.skin?.priceMedian || 0;
      const amount = item.amount || 0;
      const itemValue = currentPrice * amount;
      
      console.log('Current price:', currentPrice, 'Amount:', amount, 'Item value:', itemValue); // Debug log
      
      const category = breakdownType === 'rarity' 
        ? (item.skin?.rarity || 'Unknown')
        : breakdownType === 'weapon'
        ? (item.skin?.weaponType || 'Unknown')
        : (item.skin?.exterior || 'Unknown');
      
      console.log('Category:', category); // Debug log
      
      if (!acc[category]) {
        acc[category] = { value: 0, count: 0 };
      }
      
      acc[category].value += itemValue;
      acc[category].count += amount;
      
      return acc;
    }, {} as Record<string, { value: number; count: number }>);

    const totalValue = Object.values(grouped).reduce((sum, item) => sum + item.value, 0);
    
    return Object.entries(grouped).map(([category, data]) => ({
      category,
      value: data.value,
      count: data.count,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      color: breakdownType === 'rarity' 
        ? RARITY_COLORS[category as keyof typeof RARITY_COLORS] || '#6b7280'
        : breakdownType === 'weapon'
        ? WEAPON_COLORS[category as keyof typeof WEAPON_COLORS] || '#6b7280'
        : EXTERIOR_COLORS[category as keyof typeof EXTERIOR_COLORS] || '#6b7280'
    })).sort((a, b) => b.value - a.value);
  };

  const breakdownData = getBreakdownData();

  if (isLoading) {
    return (
      <Card className="card-brand">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-emerald-400" />
              Portfolio Breakdown
            </CardTitle>
            <Skeleton className="h-8 w-8" />
          </div>
        </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-brand card-enhanced hover-lift">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <InfoTooltip 
              content="Shows how your portfolio is distributed across different skin rarities or weapon types. Switch between 'Rarity' and 'Weapon' views to see different breakdowns."
              position="top"
            >
              <CardTitle className="flex items-center gap-2 text-base font-semibold cursor-help">
                <PieChart className="h-5 w-5 text-emerald-400" />
                Portfolio Breakdown
              </CardTitle>
            </InfoTooltip>
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
        {breakdownData.length > 0 ? (
          <div className="space-y-4">
            {/* Breakdown Type Toggle */}
            <ToggleGroup 
              type="single" 
              value={breakdownType}
              onValueChange={(value: 'rarity' | 'weapon' | 'exterior') => value && setBreakdownType(value)}
              className="bg-muted/50 p-1 rounded-lg"
            >
              <ToggleGroupItem value="rarity" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs px-2">
                Rarity
              </ToggleGroupItem>
              <ToggleGroupItem value="weapon" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs px-2">
                Weapon
              </ToggleGroupItem>
              <ToggleGroupItem value="exterior" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs px-2">
                Exterior
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Breakdown List */}
            <div className="space-y-3">
              {breakdownData.map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium">{item.category}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.count} {item.count === 1 ? 'item' : 'items'}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatUSD(item.value)}</p>
                      <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="progress-bar w-full h-2">
                    <div 
                      className="progress-fill h-2 rounded-full"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: item.color 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground space-y-4">
            <div className="space-y-2">
              <PieChart className="h-12 w-12 mx-auto opacity-50" />
              <h4 className="font-medium">No Portfolio Data</h4>
              <p className="text-sm max-w-xs">
                Add skins to your portfolio to see allocation breakdown by rarity or weapon type.
              </p>
            </div>
            <Button 
              onClick={() => window.location.href = '/skins'}
              variant="outline" 
              size="sm"
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              <Package className="h-4 w-4 mr-2" />
              Browse Skins
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
