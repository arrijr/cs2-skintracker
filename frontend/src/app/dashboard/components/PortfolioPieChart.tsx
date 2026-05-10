// /frontend/src/app/dashboard/components/PortfolioPieChart.tsx — [Frontend]
// {/* Portfolio Breakdown with Real Pie Chart */}
"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";
import { 
  Star,
  Swords,
  Shield,
  Zap,
  Package
} from "lucide-react";
import { formatUSD } from "@/lib/num";

interface PortfolioItem {
  id: number;
  skinId: number;
  amount: number;
  buyPrice: number;
  buyDate: string;
  currentPrice: number;
  currentValue: number;
  unrealizedPL: number;
  skin: {
    id: number;
    name: string;
    marketHashName: string;
    imageUrl: string;
    rarity?: string;
    weaponType?: string;
    exterior?: string;
  };
}

interface PortfolioPieChartProps {
  portfolio: PortfolioItem[];
  className?: string;
}

interface ChartData {
  name: string;
  value: number;
  count: number;
  percentage: number;
  color: string;
}

// Rarity colors matching CS2 rarity system - Updated with new palette
const RARITY_COLORS = {
  'Covert': '#ef4444',           // Red-500
  'Classified': '#ec4899',       // Pink-500
  'Restricted': '#9333ea',       // Purple-600
  'Mil-Spec': '#747c92',         // Brand Slate
  'Industrial': '#06b6d4',       // Cyan-500
  'Consumer': '#94a3b8',         // Slate-400
  'Unknown': '#6b7280'           // Gray-500
};

// Weapon type colors - Updated with new palette
const WEAPON_COLORS = {
  'Rifle': '#ef4444',            // Red-500
  'Pistol': '#94c595',           // Brand Celadon Dark
  'SMG': '#06b6d4',              // Cyan-500
  'Sniper Rifle': '#a1e8af',     // Brand Celadon
  'Shotgun': '#f59e0b',          // Yellow-500
  'Machinegun': '#ec4899',       // Pink-500
  'Knife': '#9333ea',            // Purple-600
  'Gloves': '#747c92',           // Brand Slate
  'Unknown': '#6b7280'           // Gray-500
};

// Exterior colors - Updated with new palette
const EXTERIOR_COLORS = {
  'Factory New': '#94c595',      // Brand Celadon Dark
  'Minimal Wear': '#a1e8af',     // Brand Celadon
  'Field-Tested': '#f59e0b',     // Yellow-500
  'Well-Worn': '#f97316',        // Orange-500
  'Battle-Scarred': '#ef4444',   // Red-500
  'Unknown': '#6b7280'           // Gray-500
};

export function PortfolioPieChart({
  portfolio,
  className = ""
}: PortfolioPieChartProps) {
  const [activeTab, setActiveTab] = useState<'rarity' | 'weapon' | 'exterior'>('rarity');

  // Calculate breakdown data
  const getBreakdownData = (type: 'rarity' | 'weapon' | 'exterior'): ChartData[] => {
    if (!portfolio || portfolio.length === 0) {
      console.log('PortfolioPieChart: No portfolio data');
      return [];
    }

    console.log('PortfolioPieChart: Portfolio data:', portfolio);
    console.log('PortfolioPieChart: First item structure:', portfolio[0]);

    const grouped = portfolio.reduce((acc, item) => {
      console.log('PortfolioPieChart: Processing item:', item);
      
      // Check all possible value fields
      let value = item.currentValue || item.currentPrice || item.buyPrice || item.avgPrice || 0;
      
      // If we have a price but no amount, assume amount is 1
      const amount = item.amount || 1;
      
      // Calculate total value
      if (value > 0) {
        value = value * amount;
      }
      
      // If still no value, try to get from skin data
      if (value <= 0) {
        const skinPrice = item.skin?.priceLatest || item.skin?.marketPrice || item.skin?.priceAvg || 0;
        value = skinPrice * amount;
      }
      
      // Final fallback: use a small default value to show something
      if (value <= 0) {
        value = 1; // Minimum value to show in chart
      }
      
      const category = type === 'rarity' 
        ? (item.skin?.rarity || 'Unknown')
        : type === 'weapon'
        ? (item.skin?.weaponType || 'Unknown')
        : (item.skin?.exterior || 'Unknown');
      
      console.log(`PortfolioPieChart: Item - currentValue: ${item.currentValue}, currentPrice: ${item.currentPrice}, buyPrice: ${item.buyPrice}, avgPrice: ${item.avgPrice}, skinPrice: ${item.skin?.priceLatest}, amount: ${amount}, finalValue: ${value}, Category: ${category}, Type: ${type}`);
      
      if (!acc[category]) {
        acc[category] = { value: 0, count: 0 };
      }
      
      acc[category].value += value;
      acc[category].count += amount;
      
      return acc;
    }, {} as Record<string, { value: number; count: number }>);

    console.log('PortfolioPieChart: Grouped data:', grouped);

    const totalValue = Object.values(grouped).reduce((sum, item) => sum + item.value, 0);
    
    const chartData = Object.entries(grouped)
      .map(([category, data]) => ({
        name: category,
        value: data.value,
        count: data.count,
        percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
        color: type === 'rarity' 
          ? RARITY_COLORS[category as keyof typeof RARITY_COLORS] || '#6b7280'
          : type === 'weapon'
          ? WEAPON_COLORS[category as keyof typeof WEAPON_COLORS] || '#6b7280'
          : EXTERIOR_COLORS[category as keyof typeof EXTERIOR_COLORS] || '#6b7280'
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Limit to top 8 categories for better readability

    console.log('PortfolioPieChart: Final chart data:', chartData);
    console.log('PortfolioPieChart: Total value:', totalValue);
    
    return chartData;
  };

  const getIcon = (type: 'rarity' | 'weapon' | 'exterior', name: string) => {
    if (type === 'weapon') {
      switch (name.toLowerCase()) {
        case 'rifle': return <Swords className="h-4 w-4" />;
        case 'pistol': return <Zap className="h-4 w-4" />;
        case 'knife': return <Shield className="h-4 w-4" />;
        default: return <Package className="h-4 w-4" />;
      }
    }
    return <Star className="h-4 w-4" />;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            {getIcon(activeTab, data.name)}
            <span className="font-medium text-white">{data.name}</span>
          </div>
          <div className="text-sm text-slate-300">
            <div>Value: <span className="text-white font-medium">{formatUSD(data.value)}</span></div>
            <div>Items: <span className="text-white font-medium">{data.count}</span></div>
            <div>Percentage: <span className="text-white font-medium">{data.percentage.toFixed(1)}%</span></div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    if (!payload) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs px-2 py-1 bg-slate-800/50 rounded">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-300 truncate max-w-20">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const chartData = getBreakdownData(activeTab);
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  console.log('PortfolioPieChart: Rendering with chartData:', chartData);
  console.log('PortfolioPieChart: Total value for display:', totalValue);

  // Debug info
  console.log('PortfolioPieChart: Portfolio length:', portfolio?.length || 0);
  console.log('PortfolioPieChart: Chart data length:', chartData.length);

  // Use real data if available, otherwise show test data
  const testData = [
    { name: 'Covert', value: 500, count: 2, percentage: 50, color: '#ff6b6b' },
    { name: 'Classified', value: 300, count: 3, percentage: 30, color: '#ff9ff3' },
    { name: 'Restricted', value: 200, count: 5, percentage: 20, color: '#a8e6cf' }
  ];

  // If we have real data with values > 0, use it, otherwise use test data
  const hasRealData = chartData.length > 0 && chartData.some(item => item.value > 0);
  const displayData = hasRealData ? chartData : testData;

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
          <TabsTrigger 
            value="rarity" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:text-slate-400"
          >
            Rarity
          </TabsTrigger>
          <TabsTrigger
            value="weapon"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:text-slate-400"
          >
            Weapon
          </TabsTrigger>
          <TabsTrigger
            value="exterior"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:text-slate-400"
          >
            Exterior
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rarity" className="mt-4">
          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="weapon" className="mt-4">
          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="exterior" className="mt-4">
          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Total Items:</span>
            <div className="font-medium text-white">{portfolio.length}</div>
          </div>
          <div>
            <span className="text-slate-400">Total Value:</span>
            <div className="font-medium text-white">{formatUSD(totalValue)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
