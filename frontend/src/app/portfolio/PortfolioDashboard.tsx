'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  Target,
  AlertCircle
} from 'lucide-react';
import UpgradeModal from './UpgradeModal';
import { useSubscription } from '@/hooks/useSubscription';
import { KPICard } from '@/components/ui/kpi-card';
import { tokens } from '@/lib/design-tokens';

interface Position {
  skinId: number;
  skinName: string;
  marketHashName: string;
  imageUrl?: string;
  amount: number;
  avgBuyPrice: number;
  currentPrice: number;
  totalInvested: number;
  totalValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
}

interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  positionCount: number;
  positions: Position[];
  lastUpdated: string;
}

export default function PortfolioDashboard() {
  const { isSignedIn, getToken } = useUser();
  const { tier } = useSubscription();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    const fetchPortfolio = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/portfolio/summary`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setPortfolio(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch portfolio:', err);
        setError(err instanceof Error ? err.message : 'Failed to load portfolio');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, [isSignedIn, getToken]);

  if (!isSignedIn) {
    return (
      <Card className={`${tokens.bg.surface} ${tokens.border.default}`}>
        <CardContent className="pt-6">
          <p className={`text-center ${tokens.text.secondary}`}>Melden Sie sich an, um Ihr Portfolio zu sehen.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`${tokens.bg.surface} border-red-500/30`}>
        <CardContent className="pt-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-white">Fehler beim Laden</p>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!portfolio || portfolio.positionCount === 0) {
    return (
      <Card className={`${tokens.bg.surface} ${tokens.border.default}`}>
        <CardContent className="pt-6 text-center space-y-4">
          <Wallet className={`w-12 h-12 mx-auto ${tokens.text.muted}`} />
          <div>
            <p className={`font-semibold ${tokens.text.primary}`}>Ihr Portfolio ist leer</p>
            <p className={`text-sm ${tokens.text.muted}`}>Fügen Sie Skins hinzu, um zu beginnen</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = portfolio.unrealizedPL >= 0;

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Gesamtwert" value={`${portfolio.totalValue.toFixed(2)}€`} />
        <KPICard label="Investiert" value={`${portfolio.totalInvested.toFixed(2)}€`} />
        <KPICard
          label="Gewinn/Verlust"
          value={`${portfolio.unrealizedPL.toFixed(2)}€`}
          delta={portfolio.unrealizedPLPercent}
          icon={isPositive ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
        />
        <KPICard label="Positionen" value={String(portfolio.positionCount)} />
      </div>

      {/* Positions Table */}
      <Card className={`${tokens.bg.surface} ${tokens.border.default}`}>
        <CardHeader>
          <CardTitle className={tokens.text.primary}>Positionen</CardTitle>
          <CardDescription className={tokens.text.muted}>Ihre gehaltenen Skins</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className={`text-left py-2 px-2 font-semibold ${tokens.text.muted}`}>Skin</th>
                  <th className={`text-right py-2 px-2 font-semibold ${tokens.text.muted}`}>Menge</th>
                  <th className={`text-right py-2 px-2 font-semibold ${tokens.text.muted}`}>Ø Kurs</th>
                  <th className={`text-right py-2 px-2 font-semibold ${tokens.text.muted}`}>Aktuell</th>
                  <th className={`text-right py-2 px-2 font-semibold ${tokens.text.muted}`}>Wert</th>
                  <th className={`text-right py-2 px-2 font-semibold ${tokens.text.muted}`}>P/L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((pos) => (
                  <tr key={pos.skinId} className="border-b border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-2">
                      <div>
                        <p className={`font-medium ${tokens.text.primary}`}>{pos.skinName}</p>
                        <p className={`text-xs ${tokens.text.muted}`}>{pos.marketHashName}</p>
                      </div>
                    </td>
                    <td className={`text-right py-3 px-2 ${tokens.text.secondary}`}>{pos.amount}</td>
                    <td className={`text-right py-3 px-2 ${tokens.text.secondary}`}>{pos.avgBuyPrice.toFixed(2)}€</td>
                    <td className={`text-right py-3 px-2 ${tokens.text.secondary}`}>{pos.currentPrice.toFixed(2)}€</td>
                    <td className={`text-right py-3 px-2 font-medium ${tokens.text.primary}`}>{pos.totalValue.toFixed(2)}€</td>
                    <td className={`text-right py-3 px-2 font-medium ${pos.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pos.unrealizedPL.toFixed(2)}€
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pro Tier CTA */}
      {tier !== 'pro' && (
        <Card className="border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Research Tools
            </CardTitle>
            <CardDescription className={tokens.text.secondary}>Erweiterte Analysen für Ihr Portfolio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className={`space-y-2 text-sm ${tokens.text.secondary}`}>
              <li className="flex items-center gap-2">
                <span className="text-purple-400">•</span>
                Volatilitätsanalyse (30/90 Tage)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-400">•</span>
                Rarity Scoring basierend auf Marktdaten
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-400">•</span>
                CSV-Export für deine Übersicht
              </li>
            </ul>
            <UpgradeModal tier="pro" triggerText="Zu Pro upgraden" />
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <p className={`text-xs ${tokens.text.muted} text-right`}>
        Aktualisiert: {new Date(portfolio.lastUpdated).toLocaleString('de-DE')}
      </p>
    </div>
  );
}
