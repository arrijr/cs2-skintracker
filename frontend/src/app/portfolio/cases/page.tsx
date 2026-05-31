// /frontend/src/app/portfolio/cases/page.tsx — [Frontend]
// {/* Case Portfolio Page - Manage case investments */}
"use client";
import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { apiUrl, fetchJson } from "@/lib/api";
import { formatUSD, safeToFixed } from "@/lib/num";
import Breadcrumbs from "@/components/Breadcrumbs";
import { AppShell } from "@/components/layout/AppShell";

interface CasePortfolioEntry {
  id: number;
  amount: number;
  buyPrice: number;
  buyDate: string;
  currentValue: number;
  totalValue: number;
  totalCost: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  case: {
    id: number;
    name: string;
    imageUrl?: string;
    price?: number;
    marketCap?: number;
    remaining?: number;
    timeToExtinction?: number;
    priceChange24h?: number;
    isDiscontinued: boolean;
  };
}

interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  totalUnrealizedPL: number;
  totalUnrealizedPLPercent: number;
  totalCases: number;
  totalAmount: number;
}

export default function CasePortfolioPage() {
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [portfolio, setPortfolio] = useState<CasePortfolioEntry[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken({ template: "backend" });
      const data = await fetchJson<{ portfolio: CasePortfolioEntry[]; stats: PortfolioStats }>(
        apiUrl('/api/v1/case-portfolio'),
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      setPortfolio(data.portfolio ?? []);
      setStats(data.stats ?? null);
    } catch (err) {
      setError('Failed to load case portfolio');
      console.error('Error fetching case portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      setError('Sign in to view your case portfolio');
      return;
    }
    fetchPortfolio();
  }, [isLoaded, isSignedIn, getToken]);

  async function handleRemoveCase(caseId: number, caseName: string) {
    if (!confirm(`Remove ${caseName} from your case portfolio?`)) return;
    try {
      const token = await getToken({ template: "backend" });
      await fetchJson(apiUrl(`/api/v1/case-portfolio/${caseId}`), {
        method: "DELETE",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      toast.success(`Removed ${caseName}`);
      await fetchPortfolio();
    } catch (e: any) {
      console.error("Failed to remove case from portfolio:", e);
      toast.error(e?.message || "Failed to remove case from portfolio");
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };


  const getPLColor = (pl: number) => {
    if (pl > 0) return 'text-green-400';
    if (pl < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  const getPLIcon = (pl: number) => {
    if (pl > 0) return <TrendingUp className="w-4 h-4" />;
    if (pl < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  if (loading) {
    return (
      <AppShell eyebrow="Portfolio" title="Cases" description="Loading…" maxWidth="7xl">
        <Breadcrumbs
          items={[
            { label: "Portfolio", href: "/portfolio" },
            { label: "Cases" },
          ]}
          className="mb-6"
        />
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-800/40 border border-slate-700/50" />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-slate-800/40 border border-slate-700/50" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell eyebrow="Portfolio" title="Cases" maxWidth="7xl">
        <Breadcrumbs
          items={[
            { label: "Portfolio", href: "/portfolio" },
            { label: "Cases" },
          ]}
          className="mb-6"
        />
        <Card className="bg-slate-900/70 backdrop-blur border border-red-500/30 rounded-2xl">
          <CardContent className="p-6 text-center">
            <div className="text-red-400 mb-2">Error loading case portfolio</div>
            <div className="text-slate-400">{error}</div>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow="Portfolio"
      title="Cases"
      description="Track your case investments and performance"
      maxWidth="7xl"
    >
      <Breadcrumbs
        items={[
          { label: "Portfolio", href: "/portfolio" },
          { label: "Cases" },
        ]}
        className="mb-6"
      />

      <div className="space-y-6">
        {/* Portfolio Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Value</p>
                    <p className="text-2xl font-bold text-white">
                      {formatUSD(stats.totalValue)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Cost</p>
                    <p className="text-2xl font-bold text-white">
                      {formatUSD(stats.totalCost)}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Unrealized P&L</p>
                    <div className={`flex items-center gap-1 ${getPLColor(stats.totalUnrealizedPL)}`}>
                      {getPLIcon(stats.totalUnrealizedPL)}
                      <p className="text-2xl font-bold">
                        {formatUSD(stats.totalUnrealizedPL)}
                      </p>
                    </div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                </div>
                <div className={`text-sm ${getPLColor(stats.totalUnrealizedPL)}`}>
                  {stats.totalUnrealizedPLPercent > 0 ? '+' : ''}{safeToFixed(stats.totalUnrealizedPLPercent, 2)}%
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Cases</p>
                    <p className="text-2xl font-bold text-white">
                      {stats.totalCases}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-orange-400" />
                </div>
                <div className="text-sm text-slate-400">
                  {stats.totalAmount} units
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Portfolio Entries */}
        <Card className="bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Your Cases ({portfolio.length})
              </div>
              <Button asChild>
                <Link href="/cases">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Cases
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {portfolio.length > 0 ? (
              <div className="space-y-4">
                {portfolio.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-700 rounded flex items-center justify-center">
                          {entry.case.imageUrl ? (
                            <img 
                              src={entry.case.imageUrl} 
                              alt={entry.case.name}
                              className="w-10 h-10 object-contain"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-white">{entry.case.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {entry.amount} units
                            </Badge>
                            {entry.case.isDiscontinued && (
                              <Badge variant="destructive" className="text-xs">
                                Discontinued
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-medium text-white">
                          {formatUSD(entry.totalValue)}
                        </div>
                        <div className={`flex items-center gap-1 ${getPLColor(entry.unrealizedPL)}`}>
                          {getPLIcon(entry.unrealizedPL)}
                          <span className="text-sm">
                            {formatUSD(entry.unrealizedPL)} ({entry.unrealizedPLPercent > 0 ? '+' : ''}{safeToFixed(entry.unrealizedPLPercent, 2)}%)
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          Avg: {formatUSD(entry.buyPrice)} • Current: {formatUSD(entry.currentValue)}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {/* TODO: wire Edit to a case-portfolio edit modal (backend PATCH /case-portfolio/:caseId already exists). Hidden until modal ships. */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveCase(entry.case.id, entry.case.name)}
                          aria-label={`Remove ${entry.case.name}`}
                          title="Remove from portfolio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-medium mb-2 text-white">No cases in portfolio</h3>
                <p className="text-slate-400 mb-4">
                  Start building your case portfolio by adding cases
                </p>
                <Button asChild>
                  <Link href="/cases">
                    <Plus className="w-4 h-4 mr-2" />
                    Browse Cases
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
