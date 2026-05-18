'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { User2, Calendar, Star, Eye, AlertTriangle } from 'lucide-react';
import { apiUrl, fetchJson } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { safeToFixed } from '@/lib/num';
import { useCurrency } from '@/contexts/CurrencyContext';

type ProfileLite = {
  displayName?: string;
  email?: string;
  createdAt?: string;
};

type KPIData = {
  portfolioCount: number;
  portfolioValue: number;
  portfolioChange24h: number;
  portfolioChange7d: number;
  totalInvested: number;
  unrealizedPL: number;
  watchlistCount: number;
  activeAlerts: number;
  lastUpdated?: string;
  volatility?: number;
  maxDrawdown?: number;
  hasEnoughRiskData?: boolean;
};

export function ProfileHeader() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { format } = useCurrency();
  const [profile, setProfile] = useState<ProfileLite | null>(null);
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;
    (async () => {
      try {
        const token = await getToken({ template: 'backend' });
        const headers = { ...(token && { Authorization: `Bearer ${token}` }) };

        const [profileRes, kpiRes] = await Promise.allSettled([
          fetchJson(apiUrl('/api/v1/users/me'), { headers }),
          fetchJson(apiUrl('/api/v1/portfolio/kpis'), { headers }),
        ]);

        if (profileRes.status === 'fulfilled') {
          setProfile({
            displayName: profileRes.value.displayName,
            email: profileRes.value.email,
            createdAt: profileRes.value.createdAt,
          });
        }
        if (kpiRes.status === 'fulfilled') {
          setKpi({
            portfolioCount: kpiRes.value.portfolioCount || 0,
            portfolioValue: kpiRes.value.portfolioValue || 0,
            portfolioChange24h: kpiRes.value.portfolioChange24h || 0,
            portfolioChange7d: kpiRes.value.portfolioChange7d || 0,
            totalInvested: kpiRes.value.totalInvested || 0,
            unrealizedPL: kpiRes.value.unrealizedPL || 0,
            watchlistCount: kpiRes.value.watchlistCount || 0,
            activeAlerts: kpiRes.value.activeAlerts || 0,
            lastUpdated: kpiRes.value.lastUpdated,
            volatility: kpiRes.value.volatility,
            maxDrawdown: kpiRes.value.maxDrawdown,
            hasEnoughRiskData: kpiRes.value.hasEnoughRiskData,
          });
        }
      } catch (err) {
        console.error('ProfileHeader load failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, user, getToken]);

  const displayName = profile?.displayName || user?.firstName || 'User';
  const email = profile?.email || user?.primaryEmailAddress?.emailAddress || '';
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString()
    : user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString()
      : 'Recently';

  return (
    <div className="card-brand card-enhanced mb-6 p-6">
      {/* Avatar + Basic info */}
      <div className="flex items-center gap-4 mb-6">
        <span className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white shadow-lg">
          <User2 className="w-8 h-8" />
        </span>
        <div>
          <div className="text-xl font-bold">{displayName}</div>
          <div className="text-zinc-400">{email}</div>
          <div className="text-sm text-zinc-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Member since {memberSince}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="card-enhanced">
          <CardContent className="p-4 text-center">
            <Star className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
            <div className="text-lg font-bold">{loading ? '—' : (kpi?.portfolioCount ?? 0)}</div>
            <div className="text-xs text-muted-foreground">Portfolio Skins</div>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-green-400">
              {loading ? '—' : format(kpi?.portfolioValue ?? 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Value</div>
            {kpi && kpi.portfolioChange24h !== 0 && (
              <Badge
                className={`text-xs mt-1 ${
                  kpi.portfolioChange24h > 0
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}
              >
                {kpi.portfolioChange24h > 0 ? '+' : ''}
                {safeToFixed(kpi.portfolioChange24h, 1)}% 24h
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-blue-400">
              {loading ? '—' : format(kpi?.totalInvested ?? 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Invested</div>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-purple-400">
              {loading ? '—' : format(kpi?.unrealizedPL ?? 0)}
            </div>
            <div className="text-xs text-muted-foreground">Unrealized P/L</div>
            {kpi && kpi.portfolioChange7d !== 0 && (
              <Badge
                className={`text-xs mt-1 ${
                  kpi.portfolioChange7d > 0
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}
              >
                {kpi.portfolioChange7d > 0 ? '+' : ''}
                {safeToFixed(kpi.portfolioChange7d, 1)}% 7d
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardContent className="p-4 text-center">
            <Eye className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <div className="text-lg font-bold">{loading ? '—' : (kpi?.watchlistCount ?? 0)}</div>
            <div className="text-xs text-muted-foreground">Watchlist</div>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <div className="text-lg font-bold">{loading ? '—' : (kpi?.activeAlerts ?? 0)}</div>
            <div className="text-xs text-muted-foreground">Active Alerts</div>
          </CardContent>
        </Card>
      </div>

      {/* Risk metrics */}
      {kpi?.hasEnoughRiskData && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-3 text-zinc-300 uppercase tracking-wide">
            Risk Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-800/60 rounded-lg p-4">
              <div className="text-xs text-zinc-400 mb-1">30-Day Volatility</div>
              <div className="text-xl font-bold text-orange-400">
                {kpi.volatility?.toFixed(2)}%
              </div>
              <div className="text-xs text-zinc-500">Daily return volatility</div>
            </div>
            <div className="bg-zinc-800/60 rounded-lg p-4">
              <div className="text-xs text-zinc-400 mb-1">Max Drawdown (90d)</div>
              <div className="text-xl font-bold text-red-400">
                {kpi.maxDrawdown?.toFixed(2)}%
              </div>
              <div className="text-xs text-zinc-500">Peak to trough decline</div>
            </div>
          </div>
        </div>
      )}

      {kpi?.lastUpdated && (
        <div className="mt-4 text-center text-xs text-zinc-500">
          Last updated: {new Date(kpi.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}
