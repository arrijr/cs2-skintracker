"use client";
import { useState, useMemo } from "react";
import { DollarSign, TrendingUp, TrendingDown, FileText, BarChart3, Calculator, Calendar } from "lucide-react";
import Tooltip from "../components/Tooltip";

type PortfolioEntry = {
  id: number;
  amount: number;
  avgPrice: number;
  purchases: Array<{
    buyPrice: number;
    buyDate: string;
  }>;
  skin: {
    id: number;
    name: string;
    marketPrice?: number | null;
    weaponType?: string;
    rarity?: string;
  };
};

type Props = {
  portfolio: PortfolioEntry[];
  history: Array<{
    date: string;
    value: number;
  }>;
  isPremium?: boolean;
};

type TransactionType = "buy" | "sell";
type TimeRange = "1M" | "3M" | "6M" | "1Y" | "ALL";

interface Transaction {
  id: string;
  type: TransactionType;
  skinId: number;
  skinName: string;
  quantity: number;
  price: number;
  date: string;
  total: number;
}

interface TaxLot {
  skinId: number;
  skinName: string;
  quantity: number;
  costBasis: number;
  buyDate: string;
  holdingPeriod: number; // days
}

export default function TransactionAnalytics({ portfolio, history, isPremium = false }: Props) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("1Y");
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "tax" | "attribution">("overview");

  // Feature flag for transaction analytics
  const TRANSACTION_ANALYTICS_ENABLED = isPremium || process.env.NEXT_PUBLIC_PORTFOLIO_TRANSACTION_ANALYTICS === 'true';

  // Simulate transaction history (in real app, this would come from API)
  const transactions = useMemo(() => {
    const mockTransactions: Transaction[] = [];
    
    portfolio.forEach(entry => {
      // Add buy transactions
      entry.purchases.forEach((purchase, index) => {
        mockTransactions.push({
          id: `${entry.id}-buy-${index}`,
          type: "buy",
          skinId: entry.skin.id,
          skinName: entry.skin.name,
          quantity: 1,
          price: purchase.buyPrice,
          date: purchase.buyDate,
          total: purchase.buyPrice
        });
      });

      // Simulate some sell transactions
      if (Math.random() > 0.7) {
        const sellQuantity = Math.floor(Math.random() * entry.amount) + 1;
        const sellPrice = (entry.skin.marketPrice || entry.avgPrice) * (1 + (Math.random() - 0.5) * 0.2);
        
        mockTransactions.push({
          id: `${entry.id}-sell-${Date.now()}`,
          type: "sell",
          skinId: entry.skin.id,
          skinName: entry.skin.name,
          quantity: sellQuantity,
          price: sellPrice,
          date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          total: sellPrice * sellQuantity
        });
      }
    });

    return mockTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [portfolio]);

  // Calculate realized P/L
  const realizedPL = useMemo(() => {
    const sells = transactions.filter(t => t.type === "sell");
    let totalRealizedPL = 0;
    let totalCostBasis = 0;
    let totalProceeds = 0;

    sells.forEach(sell => {
      const buys = transactions.filter(t => 
        t.type === "buy" && 
        t.skinId === sell.skinId && 
        new Date(t.date) < new Date(sell.date)
      );

      // FIFO calculation
      let remainingQuantity = sell.quantity;
      let costBasis = 0;

      for (const buy of buys) {
        if (remainingQuantity <= 0) break;
        
        const quantityUsed = Math.min(remainingQuantity, buy.quantity);
        costBasis += quantityUsed * buy.price;
        remainingQuantity -= quantityUsed;
      }

      const proceeds = sell.quantity * sell.price;
      const pl = proceeds - costBasis;

      totalRealizedPL += pl;
      totalCostBasis += costBasis;
      totalProceeds += proceeds;
    });

    return {
      totalRealizedPL,
      totalCostBasis,
      totalProceeds,
      realizedPLPercent: totalCostBasis > 0 ? (totalRealizedPL / totalCostBasis) * 100 : 0
    };
  }, [transactions]);

  // Calculate tax lots
  const taxLots = useMemo(() => {
    const lots: TaxLot[] = [];
    
    portfolio.forEach(entry => {
      entry.purchases.forEach(purchase => {
        const holdingPeriod = Math.floor(
          (Date.now() - new Date(purchase.buyDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        lots.push({
          skinId: entry.skin.id,
          skinName: entry.skin.name,
          quantity: 1,
          costBasis: purchase.buyPrice,
          buyDate: purchase.buyDate,
          holdingPeriod
        });
      });
    });

    return lots;
  }, [portfolio]);

  // Performance attribution
  const performanceAttribution = useMemo(() => {
    if (!portfolio || portfolio.length === 0) return null;

    const attribution = portfolio.map(entry => {
      const marketValue = entry.skin.marketPrice || entry.avgPrice;
      const costValue = entry.avgPrice * entry.amount;
      const unrealizedPL = marketValue - costValue;
      const unrealizedPLPercent = costValue > 0 ? (unrealizedPL / costValue) * 100 : 0;

      return {
        skinId: entry.skin.id,
        skinName: entry.skin.name,
        weaponType: entry.skin.weaponType || "Unknown",
        quantity: entry.amount,
        costValue,
        marketValue,
        unrealizedPL,
        unrealizedPLPercent,
        weight: costValue / portfolio.reduce((sum, e) => sum + (e.avgPrice * e.amount), 0)
      };
    });

    return attribution.sort((a, b) => Math.abs(b.unrealizedPL) - Math.abs(a.unrealizedPL));
  }, [portfolio]);

  if (!TRANSACTION_ANALYTICS_ENABLED) {
    return (
      <div className="bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-white">Transaction Analytics</h3>
        <div className="text-center py-8">
          <div className="text-2xl mb-4">🔒</div>
          <h4 className="text-lg font-medium mb-2 text-white">Transaction Analytics Disabled</h4>
          <p className="text-sm text-slate-400 mb-4">
            Enable transaction analytics with NEXT_PUBLIC_PORTFOLIO_TRANSACTION_ANALYTICS=true
          </p>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl rounded-xl p-6 shadow-md">
        <div className="text-center py-8">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-purple-400" />
          <h4 className="text-xl font-medium mb-2 text-white">Unlock Transaction Analytics</h4>
          <p className="text-sm text-slate-400 mb-6">
            Get professional transaction insights: Realized P/L, tax reporting, and performance attribution.
          </p>
          <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all">
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl rounded-xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">Transaction Analytics</h3>
        <div className="flex items-center gap-2">
          <div className="text-xs bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 px-2 py-1 rounded">
            🔒 Premium Feature
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 mb-6">
        {(["1M", "3M", "6M", "1Y", "ALL"] as TimeRange[]).map(range => (
          <button
            key={range}
            onClick={() => setSelectedRange(range)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              selectedRange === range
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                : "bg-slate-800/60 text-slate-300 hover:border-slate-600 border border-slate-700/50"
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeTab === "overview"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-slate-800/60 text-slate-300 hover:border-slate-600 border border-slate-700/50"
          }`}
        >
          <BarChart3 className="inline w-4 h-4 mr-1" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeTab === "transactions"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-slate-800/60 text-slate-300 hover:border-slate-600 border border-slate-700/50"
          }`}
        >
          <FileText className="inline w-4 h-4 mr-1" />
          Transactions
        </button>
        <button
          onClick={() => setActiveTab("tax")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeTab === "tax"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-slate-800/60 text-slate-300 hover:border-slate-600 border border-slate-700/50"
          }`}
        >
          <Calculator className="inline w-4 h-4 mr-1" />
          Tax
        </button>
        <button
          onClick={() => setActiveTab("attribution")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeTab === "attribution"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-slate-800/60 text-slate-300 hover:border-slate-600 border border-slate-700/50"
          }`}
        >
          <TrendingUp className="inline w-4 h-4 mr-1" />
          Attribution
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Realized P/L Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className={`text-lg font-bold ${
                realizedPL.totalRealizedPL >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                ${realizedPL.totalRealizedPL.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400">Realized P/L</div>
            </div>
            
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-purple-400">
                ${realizedPL.totalCostBasis.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400">Total Cost Basis</div>
            </div>
            
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-purple-400">
                ${realizedPL.totalProceeds.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400">Total Proceeds</div>
            </div>
            
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className={`text-lg font-bold ${
                realizedPL.realizedPLPercent >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {realizedPL.realizedPLPercent.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-400">Realized P/L %</div>
            </div>
          </div>

          {/* Transaction Summary */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
            <h4 className="text-lg font-medium mb-4 text-white">Transaction Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-slate-400">Total Transactions</div>
                <div className="font-medium text-white">{transactions.length}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-400">Buy Transactions</div>
                <div className="font-medium text-green-400">
                  {transactions.filter(t => t.type === "buy").length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-slate-400">Sell Transactions</div>
                <div className="font-medium text-red-400">
                  {transactions.filter(t => t.type === "sell").length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-slate-400">Tax Lots</div>
                <div className="font-medium text-purple-400">{taxLots.length}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="space-y-3">
          <h4 className="text-lg font-medium mb-4">Transaction History</h4>
          {transactions.length > 0 ? (
            transactions.map(transaction => (
              <div
                key={transaction.id}
                className={`p-4 rounded-lg border ${
                  transaction.type === "buy" 
                    ? "border-green-500/30 bg-green-500/10"
                    : "border-red-500/30 bg-red-500/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      transaction.type === "buy" ? "bg-green-400" : "bg-red-400"
                    }`} />
                    <div>
                      <div className="font-medium">{transaction.skinName}</div>
                      <div className="text-sm text-slate-400">
                        {transaction.type.toUpperCase()} {transaction.quantity}x @ ${transaction.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${transaction.total.toFixed(2)}</div>
                    <div className="text-sm text-slate-400">
                      {new Date(transaction.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              No transactions found for the selected time range.
            </div>
          )}
        </div>
      )}

      {activeTab === "tax" && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium mb-4">Tax Lots & Cost Basis</h4>
          
          {/* Tax Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-purple-400">{taxLots.length}</div>
              <div className="text-xs text-slate-400">Total Tax Lots</div>
            </div>
            
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-green-400">
                ${taxLots.reduce((sum, lot) => sum + lot.costBasis, 0).toFixed(2)}
              </div>
              <div className="text-xs text-slate-400">Total Cost Basis</div>
            </div>
            
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-purple-400">
                {Math.round(taxLots.reduce((sum, lot) => sum + lot.holdingPeriod, 0) / taxLots.length)} days
              </div>
              <div className="text-xs text-slate-400">Avg Holding Period</div>
            </div>
            
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-yellow-400">
                {taxLots.filter(lot => lot.holdingPeriod > 365).length}
              </div>
              <div className="text-xs text-slate-400">Long-term Holdings</div>
            </div>
          </div>

          {/* Tax Lots Table */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-2">Skin</th>
                    <th className="text-left py-2">Quantity</th>
                    <th className="text-left py-2">Cost Basis</th>
                    <th className="text-left py-2">Buy Date</th>
                    <th className="text-left py-2">Holding Period</th>
                  </tr>
                </thead>
                <tbody>
                  {taxLots.map(lot => (
                    <tr key={`${lot.skinId}-${lot.buyDate}`} className="border-b border-slate-700/50/50">
                      <td className="py-2">{lot.skinName}</td>
                      <td className="py-2">{lot.quantity}</td>
                      <td className="py-2">${lot.costBasis.toFixed(2)}</td>
                      <td className="py-2">{new Date(lot.buyDate).toLocaleDateString()}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          lot.holdingPeriod > 365 
                            ? "bg-green-500/10 text-green-400 border border-green-500/30"
                            : "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                        }`}>
                          {lot.holdingPeriod} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "attribution" && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium mb-4">Performance Attribution</h4>
          
          {performanceAttribution ? (
            <div className="space-y-3">
              {performanceAttribution.slice(0, 10).map(item => (
                <div key={item.skinId} className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{item.skinName}</div>
                    <div className={`text-sm font-medium ${
                      item.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ${item.unrealizedPL.toFixed(2)} ({item.unrealizedPLPercent.toFixed(1)}%)
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <div>Weight: {(item.weight * 100).toFixed(1)}%</div>
                    <div>Qty: {item.quantity}x</div>
                    <div>Cost: ${item.costValue.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              No performance attribution data available.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
