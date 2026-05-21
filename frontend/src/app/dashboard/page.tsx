// /frontend/src/app/dashboard/page.tsx — [Frontend]
// Hi-fi dashboard adapted from claude.ai/design dashboard-hifi.html.
// Layout: Hero · CTA strip · 4 KPI cards · (2/1) Movers + Allocation · (1/1) Holdings + Pulse · Events full-width.
"use client";
import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { useUserRole } from "@/hooks/useUserRole";
import { useSteamConnection } from "@/hooks/useSteamConnection";
import { useAlerts } from "@/hooks/useAlerts";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/empty-state";
import { EmptyCrate } from "@/components/ui/empty-illustrations";
import { KPICard } from "@/components/ui/kpi-card";
import { Package, Euro, TrendingUp, Bell, Crosshair } from "lucide-react";
import { formatEUR } from "@/lib/num";

import { PortfolioHero, type RangeKey } from "./components/PortfolioHero";
import { QuickActions } from "./components/QuickActions";
import { YourTopMovers } from "./components/YourTopMovers";
import { TopHoldings } from "./components/TopHoldings";
import { AllocationDonut } from "./components/AllocationDonut";
import MarketPulse from "./components/MarketPulse";
import MarketEvents from "./components/MarketEvents";

export default function Dashboard() {
  const { isSignedIn, isLoaded } = useUser();
  const { portfolio, history, kpis, mutate } = usePortfolioData();
  const { isPremium } = useUserRole();
  const { status: steamStatus } = useSteamConnection();
  const { alerts } = useAlerts();

  const [range, setRange] = useState<RangeKey>("24h");
  const [moverTimeframe, setMoverTimeframe] = useState<"24h" | "7d">("24h");

  // All hooks must run before any conditional return (rules of hooks).
  const valueSpark = useMemo(() => {
    if (!history || history.length < 2) return undefined;
    const tail = history.slice(-13);
    return tail.map((h) => h.value);
  }, [history]);

  // Backend returns { skin: {...}, purchases, amount, avgPrice }. Flatten so the
  // dashboard panels (AllocationDonut, YourTopMovers, TopHoldings) can read fields
  // off the top level the way their PortfolioItem props expect.
  const flatPortfolio = useMemo(
    () =>
      (portfolio ?? []).map((p: any) => ({
        id: p.skin?.id,
        skinId: p.skin?.id,
        name: p.skin?.name,
        slug: p.skin?.slug ?? null,
        weaponSlug: p.skin?.weaponSlug ?? null,
        imageUrl: p.skin?.imageUrl,
        rarity: p.skin?.rarity,
        weaponType: p.skin?.weaponType,
        wear: p.skin?.exterior,
        amount: p.amount,
        marketPrice: p.skin?.marketPrice ?? null,
        priceChange24h: p.skin?.priceChange24h ?? null,
        priceChange7d: p.skin?.priceChange7d ?? null,
      })),
    [portfolio]
  );

  const weaponCount = useMemo(() => {
    return new Set(flatPortfolio.map((p) => p.weaponType).filter(Boolean)).size;
  }, [flatPortfolio]);

  const rarityCount = useMemo(() => {
    return new Set(flatPortfolio.map((p) => p.rarity).filter(Boolean)).size;
  }, [flatPortfolio]);

  const handleRefresh = async () => {
    await mutate();
  };

  if (!isLoaded) {
    return (
      <AppShell eyebrow="Overview" title="Dashboard" description="Loading…">
        <div className="space-y-6">
          <div className="h-80 rounded-2xl bg-slate-800/40 border border-slate-700/50 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-800/40 border border-slate-700/50 animate-pulse" />
            ))}
          </div>
          <div className="h-48 rounded-2xl bg-slate-800/40 border border-slate-700/50 animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (!isSignedIn) {
    return (
      <AppShell eyebrow="Overview" title="Dashboard">
        <p className="text-slate-300">Please sign in to view your dashboard.</p>
      </AppShell>
    );
  }

  const totalValue = kpis?.portfolioValue || 0;
  const change24h = kpis?.portfolioChange24h || 0;
  const change7d = kpis?.portfolioChange7d || 0;
  const totalInvested = kpis?.totalInvested || 0;
  const unrealizedPL = totalValue - totalInvested;
  const plPercentage = totalInvested > 0 ? (unrealizedPL / totalInvested) * 100 : 0;
  const portfolioCount = portfolio?.length || 0;
  const activeAlerts = alerts?.filter((a: any) => a.isActive).length || 0;

  const deltas: Partial<Record<RangeKey, number>> = {
    "24h": change24h,
    "7d": change7d,
    "30d": (kpis as any)?.portfolioChange30d ?? 0,
    "90d": (kpis as any)?.portfolioChange90d ?? 0,
    "1y": (kpis as any)?.portfolioChange1y ?? 0,
    all: plPercentage,
  };

  const isEmpty = !portfolio || portfolio.length === 0;

  const lastSyncLabel = kpis?.lastUpdated
    ? `${Math.max(1, Math.round((Date.now() - new Date(kpis.lastUpdated).getTime()) / 1000))}s ago`
    : null;

  return (
    <AppShell
      eyebrow="Overview"
      title="Dashboard"
      description="Your CS2 portfolio at a glance."
    >
      {isEmpty ? (
        <EmptyState
          illustration={<EmptyCrate size={120} />}
          title="Your portfolio is empty"
          description="Connect Steam to import your CS2 inventory in seconds — or add skins manually."
          primaryCta={{ label: "Connect Steam", href: "/account" }}
          secondaryCta={{ label: "Browse skins", href: "/skins" }}
        />
      ) : (
        <div className="space-y-6">
          {/* HERO */}
          <PortfolioHero
            totalValue={totalValue}
            deltas={deltas}
            history={history || []}
            range={range}
            onRangeChange={setRange}
          />

          {/* CTA ROW */}
          <QuickActions
            steamConnected={steamStatus?.connected}
            isPremium={isPremium}
            onRefresh={handleRefresh}
            lastSyncLabel={lastSyncLabel}
          />

          {/* 4 KPI CARDS with icon badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <KPICard
              label="Cost basis"
              value={formatEUR(totalInvested)}
              icon={<Euro className="h-4 w-4" />}
              tone="neutral"
              sub={portfolioCount > 0 ? `avg buy · ${portfolioCount} ${portfolioCount === 1 ? "lot" : "lots"}` : undefined}
            />
            <KPICard
              label="Unrealized P/L"
              value={formatEUR(unrealizedPL)}
              icon={<TrendingUp className="h-4 w-4" />}
              tone="pos"
              delta={Math.abs(plPercentage) <= 999 ? plPercentage : undefined}
              deltaLabel="all-time"
              spark={valueSpark}
            />
            <KPICard
              label={portfolioCount === 1 ? "Skin tracked" : "Skins tracked"}
              value={String(portfolioCount)}
              icon={<Crosshair className="h-4 w-4" />}
              tone="acc"
              sub={
                weaponCount > 0
                  ? `across ${weaponCount} ${weaponCount === 1 ? "weapon" : "weapons"} · ${rarityCount} ${rarityCount === 1 ? "rarity" : "rarities"}`
                  : undefined
              }
            />
            <KPICard
              label="Active alerts"
              value={String(activeAlerts)}
              icon={<Bell className="h-4 w-4" />}
              tone="gold"
              sub={activeAlerts > 0 ? "price + volume triggers" : "Set your first alert"}
            />
          </div>

          {/* MOVERS + ALLOCATION (2:1) */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 items-start">
            <YourTopMovers
              portfolio={flatPortfolio}
              timeframe={moverTimeframe}
              onTimeframeChange={setMoverTimeframe}
            />
            <AllocationDonut portfolio={flatPortfolio} />
          </div>

          {/* HOLDINGS + PULSE (1:1) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <TopHoldings portfolio={flatPortfolio} totalValue={totalValue} />
            <MarketPulse isPremium={isPremium} />
          </div>

          {/* EVENTS — full width */}
          <MarketEvents />
        </div>
      )}
    </AppShell>
  );
}
