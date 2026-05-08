'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, BarChart3, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import UpgradeModal from './UpgradeModal';

interface ResearchItem {
  skinId: number;
  skinName: string;
  volatility: {
    volatility: number;
    volatilityLevel: string;
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
  };
  rarityScore: number;
  investmentRisk: string;
  scarcityRating: string;
}

interface ResearchData {
  userId: number;
  analysisDate: string;
  positionCount: number;
  research: ResearchItem[];
}

export default function ResearchPanel() {
  const { isSignedIn, getToken } = useUser();
  const { canAccessResearch, tier } = useSubscription();
  const [research, setResearch] = useState<ResearchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !canAccessResearch) {
      setIsLoading(false);
      return;
    }

    const fetchResearch = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/research/portfolio`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.status === 403) {
          // User doesn't have Pro tier
          setIsLoading(false);
          return;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setResearch(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch research:', err);
        setError(err instanceof Error ? err.message : 'Failed to load research data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResearch();
  }, [isSignedIn, canAccessResearch, getToken]);

  // Not Pro tier
  if (tier !== 'pro') {
    return (
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Research Tools - Pro Tier
          </CardTitle>
          <CardDescription>Erweiterte Portfolio-Analysen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Nutze professionelle Research-Tools, um dein Portfolio zu analysieren:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600" />
              <span>Volatilitätsanalyse für alle Positionen</span>
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600" />
              <span>Rarity-Scoring für Sammler-Items</span>
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600" />
              <span>Investitions-Recommendations</span>
            </li>
          </ul>
          <UpgradeModal tier="pro" triggerText="Zu Pro upgraden - 19,99€/Monat" />
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Research Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-900">Research laden fehlgeschlagen</p>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No data
  if (!research || research.research.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-gray-500">
          Keine Research-Daten verfügbar. Fügen Sie Positionen zu Ihrem Portfolio hinzu.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Research Analysis
        </CardTitle>
        <CardDescription>
          Volatilitäts- und Rarity-Analysen für Ihr Portfolio
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {research.research.map((item) => {
            const isHighVolatility = item.volatility.volatilityLevel === 'HIGHLY_VOLATILE' || item.volatility.volatilityLevel === 'VOLATILE';
            const isRare = item.rarityScore > 75;

            return (
              <div
                key={item.skinId}
                className="border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{item.skinName}</h3>
                    <p className="text-xs text-gray-500">{item.scarcityRating}</p>
                  </div>
                  <div className="flex gap-2">
                    {isHighVolatility && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Volatil
                      </Badge>
                    )}
                    {isRare && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        Selten
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Volatility */}
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-600">Volatilität (30d)</p>
                    <p className="font-semibold">{item.volatility.volatility.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Rarity Score</p>
                    <p className="font-semibold">{item.rarityScore}/100</p>
                  </div>
                </div>

                {/* Price Range */}
                <div className="bg-gray-50 rounded p-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">30-Tage Spanne:</span>
                    <span className="font-medium">
                      {item.volatility.minPrice.toFixed(2)}€ - {item.volatility.maxPrice.toFixed(2)}€
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Analysiert am: {new Date(research.analysisDate).toLocaleString('de-DE')}
        </p>
      </CardContent>
    </Card>
  );
}
