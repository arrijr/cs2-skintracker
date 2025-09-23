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
  amount: number;
  avgPrice: number;
  skin: {
    id: number;
    name: string;
    imageUrl?: string;
    weaponType?: string;
    rarity?: string;
    wear?: string;
    priceLatest?: number;
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
    if (!portfolio || portfolio.length === 0) return [];

    const grouped = portfolio.reduce((acc, item) => {
      const value = (item.skin.priceLatest || 0) * item.amount;
      const category = type === 'rarity' 
        ? (item.skin.rarity || 'Unknown')
        : type === 'weapon'
        ? (item.skin.weaponType || 'Unknown')
        : (item.skin.wear || 'Unknown');
      
      if (!acc[category]) {
        acc[category] = { value: 0, count: 0 };
      }
      
      acc[category].value += value;
      acc[category].count += item.amount;
      
      return acc;
    }, {} as Record<string, { value: number; count: number }>);

    const totalValue = Object.values(grouped).reduce((sum, item) => sum + item.value, 0);
    
    return Object.entries(grouped)
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

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-slate-400 mb-4">
          <PieChart className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Data Available</h3>
        <p className="text-sm text-slate-400">
          Your skins will show here once you add them to your portfolio
        </p>
      </div>
    );
  }

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
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
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
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
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
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
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
