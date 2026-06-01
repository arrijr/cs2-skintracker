"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiUrl, fetchJson } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/components/ui/tier-badge";
import { RefreshCw, Crown, Gamepad2, Bell, Database, AlertTriangle, CheckCircle } from "lucide-react";

interface Insights {
  tiers: {
    distribution: { free: number; lite: number; pro: number; untiered: number };
    totalUsers: number;
    premiumUsers: number;
    premiumPercentage: number;
  };
  steam: { connectedUsers: number; totalUsers: number; connectedPercentage: number; importedPortfolioRows: number };
  notifications: {
    activeAlerts: number;
    totalEvents: number;
    events24h: number;
    events7d: number;
    delivered7d: number;
    failed7d: number;
    unread7d: number;
  };
  pricing: {
    sources: { source: string; rows: number; lastFetch: string | null; staleHours: number | null }[];
    snapshotTotal: number;
    rows24h: number;
  };
  generatedAt: string;
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {sub && <div className="text-xs text-brand-celadon-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function InsightsPanel() {
  const { getToken } = useAuth();
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken({ template: "backend" });
      const res = await fetchJson<Insights>(apiUrl("/api/v1/admin/insights"), {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      setData(res);
    } catch {
      setError("Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Insights</h2>
        <Button onClick={load} disabled={loading} variant="outline" size="sm" className="btn-enhanced">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300">{error}</div>}
      {!data && loading && <div className="h-32 rounded-2xl bg-slate-800/40 border border-slate-700/50 animate-pulse" />}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tier distribution */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Crown className="w-4 h-4 text-fuchsia-400" /> Tier Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                {(["free", "lite", "pro"] as const).map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <TierBadge tier={t} />
                    <span className="text-lg font-bold tabular-nums">{data.tiers.distribution[t]}</span>
                  </div>
                ))}
                {data.tiers.distribution.untiered > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">untiered</Badge>
                    <span className="text-lg font-bold tabular-nums">{data.tiers.distribution.untiered}</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {data.tiers.premiumUsers} premium of {data.tiers.totalUsers} ({data.tiers.premiumPercentage}%)
              </div>
            </CardContent>
          </Card>

          {/* Steam adoption */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gamepad2 className="w-4 h-4 text-green-400" /> Steam Adoption
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Stat
                  label="Connected accounts"
                  value={data.steam.connectedUsers}
                  sub={`${data.steam.connectedPercentage}% of users`}
                />
                <Stat label="Imported holdings" value={data.steam.importedPortfolioRows.toLocaleString()} />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="w-4 h-4 text-blue-400" /> Notifications (7d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Stat label="Active alerts" value={data.notifications.activeAlerts} />
                <Stat label="Events 7d" value={data.notifications.events7d} sub={`${data.notifications.events24h} in 24h`} />
                <Stat label="Delivered" value={<span className="text-green-400">{data.notifications.delivered7d}</span>} />
                <Stat label="Failed" value={<span className={data.notifications.failed7d ? "text-red-400" : ""}>{data.notifications.failed7d}</span>} />
              </div>
              <div className="text-xs text-muted-foreground mt-3">
                {data.notifications.unread7d} unread • {data.notifications.totalEvents} total events all-time
              </div>
            </CardContent>
          </Card>

          {/* Price snapshot freshness */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="w-4 h-4 text-amber-400" /> Price Snapshots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.pricing.sources.map((s) => {
                  const stale = s.staleHours != null && s.staleHours >= 48;
                  return (
                    <div key={s.source} className="flex items-center justify-between text-sm border border-slate-700/50 rounded-lg px-3 py-2 bg-slate-800/30">
                      <span className="font-medium">{s.source}</span>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="tabular-nums">{s.rows.toLocaleString()} rows</span>
                        {s.staleHours != null && (
                          <span className={`flex items-center gap-1 ${stale ? "text-amber-400" : "text-green-400"}`}>
                            {stale ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                            {s.staleHours}h ago
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {data.pricing.sources.length === 0 && (
                  <div className="text-sm text-muted-foreground">No market snapshots recorded.</div>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-3">
                {data.pricing.snapshotTotal.toLocaleString()} total • {data.pricing.rows24h} in last 24h
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
