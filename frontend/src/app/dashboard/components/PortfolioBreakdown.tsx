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
import Tooltip from "@/components/ui/Tooltip";

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
  'Covert': '#ff6b6b',
  'Classified': '#4ecdc4', 
  'Restricted': '#45b7d1',
  'Mil-Spec': '#96ceb4',
  'Industrial': '#feca57',
  'Consumer': '#a55eea'
};

const WEAPON_COLORS = {
  'Rifles': '#ff6b6b',
  'Pistols': '#4ecdc4',
  'SMGs': '#45b7d1', 
  'Shotguns': '#96ceb4',
  'Knives': '#feca57',
  'Gloves': '#a55eea',
  'Other': '#a55eea'
};

export default function PortfolioBreakdown({ 
  portfolio, 
  lastUpdated, 
  onRefresh, 
  isLoading = false 
}: PortfolioBreakdownProps) {
  const [breakdownType, setBreakdownType] = useState<'rarity' | 'weapon'>('rarity');

  // Calculate breakdown data
  const getBreakdownData = (): BreakdownData[] => {
    if (!portfolio || portfolio.length === 0) return [];

    const grouped = portfolio.reduce((acc, item) => {
      const category = breakdownType === 'rarity' 
        ? item.skin.rarity 
        : item.skin.weaponType;
      
      if (!acc[category]) {
        acc[category] = { value: 0, count: 0 };
      }
      
      acc[category].value += item.currentValue;
      acc[category].count += item.amount;
      
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
        : WEAPON_COLORS[category as keyof typeof WEAPON_COLORS] || '#6b7280'
    })).sort((a, b) => b.value - a.value);
  };

  const breakdownData = getBreakdownData();

  if (isLoading) {
    return (
      <Card className="card-brand">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-brand-blue" />
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
            <Tooltip 
              content="Shows how your portfolio is distributed across different skin rarities or weapon types. Switch between 'Rarity' and 'Weapon' views to see different breakdowns."
              position="top"
            >
              <CardTitle className="flex items-center gap-2 text-base font-semibold cursor-help">
                <PieChart className="h-5 w-5 text-brand-blue" />
                Portfolio Breakdown
              </CardTitle>
            </Tooltip>
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
              onValueChange={(value: 'rarity' | 'weapon') => value && setBreakdownType(value)}
              className="bg-muted/50 p-1 rounded-lg"
            >
              <ToggleGroupItem value="rarity" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs px-2">
                Rarity
              </ToggleGroupItem>
              <ToggleGroupItem value="weapon" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs px-2">
                Weapon
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
              className="border-brand-blue/30 text-brand-blue hover:bg-brand-blue/10"
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
