'use client';

import React, { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, BarChart3, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import UpgradeModal from './UpgradeModal';
import { apiUrl } from '@/lib/api';

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
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
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
        const token = await getToken({ template: 'backend' });
        const res = await fetch(apiUrl('/api/v1/research/portfolio'), {
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
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5" />
            Research Tools - Pro Tier
          </CardTitle>
          <CardDescription className="text-slate-400">Erweiterte Portfolio-Analysen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-300">
            Nutze professionelle Research-Tools, um dein Portfolio zu analysieren:
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>VolatilitÃ¤tsanalyse fÃ¼r alle Positionen</span>
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Rarity-Scoring fÃ¼r Sammler-Items</span>
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Investitions-Recommendations</span>
            </li>
          </ul>
          <UpgradeModal tier="pro" triggerText="Zu Pro upgraden - 9,99€/Monat" />
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="bg-slate-900/70 backdrop-blur border-slate-700/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5" />
            Research Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 rounded-lg bg-slate-800/60" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="bg-red-500/10 border border-red-500/30 backdrop-blur">
        <CardContent className="pt-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-300">Research laden fehlgeschlagen</p>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No data
  if (!research || research.research.length === 0) {
    return (
      <Card className="bg-slate-900/70 backdrop-blur border-slate-700/30">
        <CardContent className="pt-6 text-center text-slate-400">
          Keine Research-Daten verfÃ¼gbar. FÃ¼gen Sie Positionen zu Ihrem Portfolio hinzu.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/70 backdrop-blur border-slate-700/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <BarChart3 className="w-5 h-5" />
          Research Analysis
        </CardTitle>
        <CardDescription className="text-slate-400">
          VolatilitÃ¤ts- und Rarity-Analysen fÃ¼r Ihr Portfolio
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
                className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 hover:border-slate-600 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{item.skinName}</h3>
                    <p className="text-xs text-slate-400">{item.scarcityRating}</p>
                  </div>
                  <div className="flex gap-2">
                    {isHighVolatility && (
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Volatil
                      </Badge>
                    )}
                    {isRare && (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                        Selten
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Volatility */}
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-slate-400">VolatilitÃ¤t (30d)</p>
                    <p className="font-semibold text-white">{item.volatility.volatility.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Rarity Score</p>
                    <p className="font-semibold text-white">{item.rarityScore}/100</p>
                  </div>
                </div>

                {/* Price Range */}
                <div className="bg-slate-900/60 border border-slate-700/50 rounded p-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">30-Tage Spanne:</span>
                    <span className="font-medium text-slate-300">
                      {item.volatility.minPrice.toFixed(2)}€ - {item.volatility.maxPrice.toFixed(2)}€
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-400 mt-4">
          Analysiert am: {new Date(research.analysisDate).toLocaleString('de-DE')}
        </p>
      </CardContent>
    </Card>
  );
}
