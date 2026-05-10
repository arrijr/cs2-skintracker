// /frontend/src/app/dashboard/components/EnhancedPortfolioBreakdown.tsx — [Frontend]
// {/* Enhanced Portfolio Breakdown with Tabs and Better Visualization */}
"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  PieChart, 
  BarChart3, 
  Package,
  Star,
  Swords,
  Shield,
  Zap
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

interface EnhancedPortfolioBreakdownProps {
  portfolio: PortfolioItem[];
  className?: string;
}

export function EnhancedPortfolioBreakdown({
  portfolio,
  className = ""
}: EnhancedPortfolioBreakdownProps) {
  const [activeTab, setActiveTab] = useState<'rarity' | 'weapon' | 'exterior'>('rarity');

  // Calculate breakdown data
  const rarityBreakdown = portfolio.reduce((acc, item) => {
    const rarity = item.skin.rarity || 'Unknown';
    const value = (item.skin.priceLatest || 0) * item.amount;
    acc[rarity] = (acc[rarity] || 0) + value;
    return acc;
  }, {} as Record<string, number>);

  const weaponBreakdown = portfolio.reduce((acc, item) => {
    const weapon = item.skin.weaponType || 'Unknown';
    const value = (item.skin.priceLatest || 0) * item.amount;
    acc[weapon] = (acc[weapon] || 0) + value;
    return acc;
  }, {} as Record<string, number>);

  const exteriorBreakdown = portfolio.reduce((acc, item) => {
    const exterior = item.skin.wear || 'Unknown';
    const value = (item.skin.priceLatest || 0) * item.amount;
    acc[exterior] = (acc[exterior] || 0) + value;
    return acc;
  }, {} as Record<string, number>);

  const totalValue = Object.values(rarityBreakdown).reduce((sum, value) => sum + value, 0);

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'covert': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'classified': return 'text-pink-500 bg-pink-500/10 border-pink-500/30';
      case 'restricted': return 'text-brand-purple-600 bg-brand-purple-600/10 border-brand-purple-600/30';
      case 'mil-spec': return 'text-brand-slate-500 bg-brand-slate-500/10 border-brand-slate-500/30';
      case 'industrial': return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30';
      case 'consumer': return 'text-brand-slate-400 bg-brand-slate-400/10 border-brand-slate-400/30';
      default: return 'text-brand-slate-400 bg-brand-slate-400/10 border-brand-slate-400/30';
    }
  };

  const getWeaponIcon = (weapon: string) => {
    if (weapon.includes('AK') || weapon.includes('M4')) return <Swords className="h-4 w-4" />;
    if (weapon.includes('AWP')) return <Zap className="h-4 w-4" />;
    if (weapon.includes('Glock') || weapon.includes('USP')) return <Shield className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  };

  const getExteriorColor = (exterior: string) => {
    switch (exterior.toLowerCase()) {
      case 'factory new': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'minimal wear': return 'text-lime-400 bg-lime-400/10 border-lime-400/30';
      case 'field-tested': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'well-worn': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'battle-scarred': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    }
  };

  const renderBreakdown = (data: Record<string, number>, type: 'rarity' | 'weapon' | 'exterior') => {
    const sortedData = Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    if (sortedData.length === 0) {
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
      <div className="space-y-3">
        {sortedData.map(([key, value]) => {
          const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
          const count = portfolio.filter(item => {
            if (type === 'rarity') return (item.skin.rarity || 'Unknown') === key;
            if (type === 'weapon') return (item.skin.weaponType || 'Unknown') === key;
            return (item.skin.wear || 'Unknown') === key;
          }).length;

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {type === 'weapon' && getWeaponIcon(key)}
                  <span className="text-sm font-medium text-white">{key}</span>
                  <Badge variant="outline" className="text-xs">
                    {count} item{count !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">{formatUSD(value)}</div>
                  <div className="text-xs text-slate-400">{percentage.toFixed(1)}%</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    type === 'rarity' ? getRarityColor(key).split(' ')[0] : 
                    type === 'exterior' ? getExteriorColor(key).split(' ')[0] : 
                    'bg-purple-600'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
          {renderBreakdown(rarityBreakdown, 'rarity')}
        </TabsContent>

        <TabsContent value="weapon" className="mt-4">
          {renderBreakdown(weaponBreakdown, 'weapon')}
        </TabsContent>

        <TabsContent value="exterior" className="mt-4">
          {renderBreakdown(exteriorBreakdown, 'exterior')}
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
