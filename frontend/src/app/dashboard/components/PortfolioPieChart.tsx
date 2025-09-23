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

// Rarity colors matching CS2 rarity system
const RARITY_COLORS = {
  'Covert': '#ff6b6b',
  'Classified': '#ff9ff3',
  'Restricted': '#a8e6cf',
  'Mil-Spec': '#74c0fc',
  'Industrial': '#ffd93d',
  'Consumer': '#6c757d',
  'Unknown': '#6b7280'
};

// Weapon type colors
const WEAPON_COLORS = {
  'Rifle': '#ff6b6b',
  'Pistol': '#4ecdc4',
  'SMG': '#45b7d1',
  'Sniper Rifle': '#96ceb4',
  'Shotgun': '#feca57',
  'Machinegun': '#ff9ff3',
  'Knife': '#a8e6cf',
  'Gloves': '#74c0fc',
  'Unknown': '#6b7280'
};

// Exterior colors
const EXTERIOR_COLORS = {
  'Factory New': '#4ecdc4',
  'Minimal Wear': '#45b7d1',
  'Field-Tested': '#96ceb4',
  'Well-Worn': '#feca57',
  'Battle-Scarred': '#ff6b6b',
  'Unknown': '#6b7280'
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

    const grouped = portfolio.reduce((acc, item) => {
      // Use currentValue if available, otherwise calculate from currentPrice
      const value = item.currentValue || (item.currentPrice * item.amount);
      const category = type === 'rarity' 
        ? (item.skin.rarity || 'Unknown')
        : type === 'weapon'
        ? (item.skin.weaponType || 'Unknown')
        : (item.skin.exterior || 'Unknown');
      
      console.log(`PortfolioPieChart: Item ${item.id} - Value: ${value}, Category: ${category}, Type: ${type}`);
      
      if (!acc[category]) {
        acc[category] = { value: 0, count: 0 };
      }
      
      acc[category].value += value;
      acc[category].count += item.amount;
      
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

  // Always show test data for now to verify chart works
  const testData = [
    { name: 'Covert', value: 500, count: 2, percentage: 50, color: '#ff6b6b' },
    { name: 'Classified', value: 300, count: 3, percentage: 30, color: '#ff9ff3' },
    { name: 'Restricted', value: 200, count: 5, percentage: 20, color: '#a8e6cf' }
  ];

  const displayData = testData; // Force test data for now

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
          <TabsTrigger 
            value="rarity" 
            className="data-[state=active]:bg-brand-blue data-[state=active]:text-white data-[state=inactive]:text-slate-400"
          >
            Rarity
          </TabsTrigger>
          <TabsTrigger 
            value="weapon"
            className="data-[state=active]:bg-brand-blue data-[state=active]:text-white data-[state=inactive]:text-slate-400"
          >
            Weapon
          </TabsTrigger>
          <TabsTrigger 
            value="exterior"
            className="data-[state=active]:bg-brand-blue data-[state=active]:text-white data-[state=inactive]:text-slate-400"
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
