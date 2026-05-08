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
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <p className="text-center text-gray-600">Melden Sie sich an, um Ihr Portfolio zu sehen.</p>
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
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-900">Fehler beim Laden</p>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!portfolio || portfolio.positionCount === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
          <Wallet className="w-12 h-12 mx-auto text-gray-300" />
          <div>
            <p className="font-semibold">Ihr Portfolio ist leer</p>
            <p className="text-sm text-gray-500">Fügen Sie Skins hinzu, um zu beginnen</p>
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
        {/* Total Value */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Gesamtwert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio.totalValue.toFixed(2)}€</div>
            <p className="text-xs text-gray-500 mt-1">Aktueller Marktwert</p>
          </CardContent>
        </Card>

        {/* Invested */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Investiert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio.totalInvested.toFixed(2)}€</div>
            <p className="text-xs text-gray-500 mt-1">Gesamtkaufpreis</p>
          </CardContent>
        </Card>

        {/* Unrealized P/L */}
        <Card className={isPositive ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Gewinn/Verlust</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex items-baseline gap-1 text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {portfolio.unrealizedPL.toFixed(2)}€
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {portfolio.unrealizedPLPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        {/* Positions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Positionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio.positionCount}</div>
            <p className="text-xs text-gray-500 mt-1">Unterschiedliche Skins</p>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Positionen</CardTitle>
          <CardDescription>Ihre gehaltenen Skins</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-semibold">Skin</th>
                  <th className="text-right py-2 px-2 font-semibold">Menge</th>
                  <th className="text-right py-2 px-2 font-semibold">Ø Kurs</th>
                  <th className="text-right py-2 px-2 font-semibold">Aktuell</th>
                  <th className="text-right py-2 px-2 font-semibold">Wert</th>
                  <th className="text-right py-2 px-2 font-semibold">P/L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((pos) => (
                  <tr key={pos.skinId} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium">{pos.skinName}</p>
                        <p className="text-xs text-gray-500">{pos.marketHashName}</p>
                      </div>
                    </td>
                    <td className="text-right py-3 px-2">{pos.amount}</td>
                    <td className="text-right py-3 px-2">{pos.avgBuyPrice.toFixed(2)}€</td>
                    <td className="text-right py-3 px-2">{pos.currentPrice.toFixed(2)}€</td>
                    <td className="text-right py-3 px-2 font-medium">{pos.totalValue.toFixed(2)}€</td>
                    <td className={`text-right py-3 px-2 font-medium ${pos.unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Research Tools
            </CardTitle>
            <CardDescription>Erweiterte Analysen für Ihr Portfolio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-purple-600">•</span>
                Volatilitätsanalyse (30/90 Tage)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-600">•</span>
                Rarity Scoring basierend auf Marktdaten
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-600">•</span>
                CSV-Export für deine Übersicht
              </li>
            </ul>
            <UpgradeModal tier="pro" triggerText="Zu Pro upgraden" />
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <p className="text-xs text-gray-500 text-right">
        Aktualisiert: {new Date(portfolio.lastUpdated).toLocaleString('de-DE')}
      </p>
    </div>
  );
}
