// frontend/src/app/skins/[weapon]/[slug]/_components/SkinDetailClient.tsx — [Frontend]
// Hi-Fi item detail client — adapted from claude.ai/design item-detail-hifi.html.
// Originally lived at /skins/[skinId]/page.tsx; now consumes a server-fetched
// `skin` prop (SSR) instead of doing its own client fetch.
"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser, useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Bell, Plus, Heart, ExternalLink, Star, ArrowLeft, Clock } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { apiUrl, fetchJson, getPortfolio, getWatchlist } from "@/lib/api";
import type { SkinDetail } from "@/lib/skins-server";
import { rarityToken } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { steamImageSrc } from "@/lib/image-proxy";
import { caseToSlug } from "@/lib/strings";
import { SkinPriceChart } from "@/app/skins/[skinId]/_components/SkinPriceChart";
import { WearFloatBar } from "@/app/skins/[skinId]/_components/WearFloatBar";
import { OrderBook } from "@/app/skins/[skinId]/_components/OrderBook";
import {
  RecentActivity,
  Stickers,
  PatternIndex,
  AlertBanner,
} from "@/app/skins/[skinId]/_components/SidebarWidgets";
import { CreateAlertModal } from "@/app/alerts/CreateAlertModal";
import { useAlerts } from "@/hooks/useAlerts";
import { analytics } from "@/lib/analytics";

// Wear label -> short code, used by the wear-thumb selector below.
const WEAR_SHORT: Record<string, string> = {
  "Factory New": "FN",
  "Minimal Wear": "MW",
  "Field-Tested": "FT",
  "Well-Worn": "WW",
  "Battle-Scarred": "BS",
};

// SkinDetail (server contract) is intentionally narrow — extend it with the
// optional fields the UI consumes. The server reader can populate any of
// these as they get wired up; missing fields just render as "—".
type Skin = SkinDetail & {
  itemimage?: string;
  itemImage?: string;
  image_url?: string;
  marketPrice?: number;
  float?: number;
  priceMedian24h?: number;
  priceMedian7d?: number;
  priceMedian30d?: number;
  isStar?: boolean;
  buyOrderPrice?: number;
  buyOrderVolume?: number;
  offerVolume?: number;
  hoursToSold?: number;
  history?: Array<{ date: string; price: number; quantity?: number }>;
  caseInfo?: { name: string; id: number };
};

type Range = "24h" | "7d" | "30d" | "90d" | "1y" | "all";

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const fmtEURSigned = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "always",
  }).format(n);

function getRarityChipClasses(rarity?: string | null) {
  const t = rarityToken(rarity);
  return cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-[0.18em] border", t.text, t.bg, t.border);
}

interface SkinDetailClientProps {
  skin: Skin;
  initialWear: string | null;
}

// Wear variant row returned by `/api/v1/skins/by-id/:id/variants`.
interface VariantRow {
  wear: string | null;
  slug: string | null;
  priceLatest: number | null;
}

export default function SkinDetailClient({ skin, initialWear }: SkinDetailClientProps) {
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();
  const { user: _user } = useUser();
  // initialWear is currently informational — wear-thumbs are read-only.
  // Captured here so future iterations can wire it into a selector without
  // a prop-shape change. Suppress unused warning meanwhile.
  void initialWear;

  const [range, setRange] = useState<Range>("30d");
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);
  const [portfolioIds, setPortfolioIds] = useState<number[]>([]);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const { alerts, createAlert } = useAlerts();
  const alertCountForThisSkin = alerts.filter((a: any) => a.skinId === skin.id).length;
  const [priceHistory, setPriceHistory] = useState<Array<{ date: string; price: number }> | null>(null);
  const [variantsByWear, setVariantsByWear] = useState<Record<string, VariantRow> | null>(null);

  // Sprint 2 SEO event — fire once per SSR landing render.
  useEffect(() => {
    if (!skin.slug || !skin.weaponSlug) return;
    analytics.track({
      name: "seo_landing_viewed",
      properties: { skinSlug: skin.slug, weaponSlug: skin.weaponSlug },
    });
    // Only re-fire if the user navigates to a different skin.
  }, [skin.slug, skin.weaponSlug]);

  // Load user lists. Backend returns raw arrays (no `{success, data}` envelope).
  // GET /watchlist     → [{ skinId, ... }, ...]
  // GET /portfolio     → [{ skin: { id }, ... }, ...]  (aggregated by skinId)
  // Previously this checked `w.success` / `p.success` which were always
  // undefined against the raw array, so `inWatchlist` / `inPortfolio` never
  // flipped — the buttons stayed labelled "Add to portfolio" / "Watchlist"
  // even after a successful POST, making the action look like a no-op to the
  // user.
  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken({ template: "backend" });
        const [w, p] = await Promise.all([
          getWatchlist(token ?? undefined),
          getPortfolio(token ?? undefined),
        ]);
        if (cancelled) return;
        if (Array.isArray(w)) {
          setWatchlistIds(
            w.map((it: any) => (typeof it?.skinId === "number" ? it.skinId : it?.skin?.id)).filter((v: any) => typeof v === "number")
          );
        }
        if (Array.isArray(p)) {
          setPortfolioIds(
            p.map((it: any) => (typeof it?.skinId === "number" ? it.skinId : it?.skin?.id)).filter((v: any) => typeof v === "number")
          );
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [isSignedIn, getToken]);

  // Fetch price history client-side. SSR `SkinDetail` does not embed history
  // (kept fast for Vercel Hobby 10s ceiling), so we fetch the dedicated
  // `/api/v1/skins/:id/history` endpoint here. Re-fetches when range changes.
  useEffect(() => {
    let cancelled = false;
    const days = range === "24h" ? 1
      : range === "7d" ? 7
      : range === "30d" ? 30
      : range === "90d" ? 90
      : range === "1y" ? 365
      : 9999;
    (async () => {
      try {
        const r = await fetch(apiUrl(`/skins/${skin.id}/history?days=${days}`));
        if (!r.ok) {
          if (!cancelled) setPriceHistory([]);
          return;
        }
        const json = await r.json();
        if (cancelled) return;
        const list = Array.isArray(json?.history)
          ? json.history
          : Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json)
              ? json
              : [];
        setPriceHistory(list);
      } catch {
        if (!cancelled) setPriceHistory([]);
      }
    })();
    return () => { cancelled = true; };
  }, [skin.id, range]);

  // Fetch wear variants for the hero thumbnail navigation. `WearComparisonTable`
  // does the same fetch further down the page — the duplicate request is
  // acceptable (5-min HTTP cache on backend) and lets the hero thumbnails act
  // as a quick wear switcher without waiting for the table to scroll into view.
  useEffect(() => {
    let cancelled = false;
    const baseId = skin.variantOf ?? skin.id;
    (async () => {
      try {
        const r = await fetch(apiUrl(`/skins/by-id/${baseId}/variants`));
        if (!r.ok) {
          if (!cancelled) setVariantsByWear({});
          return;
        }
        const list: VariantRow[] = await r.json();
        if (cancelled) return;
        // Pick the variant per wear that matches the current item's StatTrak
        // flag, so clicking FN from a StatTrak Field-Tested page lands on
        // StatTrak Factory New (not the non-ST sibling).
        const wantStattrak = !!skin.isStattrak;
        const map: Record<string, VariantRow> = {};
        for (const v of list) {
          if (!v.wear || !v.slug) continue;
          const looksStattrak = v.slug.startsWith("stattrak-") || v.slug.includes("stattrak");
          if (looksStattrak !== wantStattrak) continue;
          if (!map[v.wear]) map[v.wear] = v;
        }
        setVariantsByWear(map);
      } catch {
        if (!cancelled) setVariantsByWear({});
      }
    })();
    return () => { cancelled = true; };
  }, [skin.id, skin.variantOf, skin.isStattrak]);

  const skinImageUrl = useMemo(() => {
    return skin.imageUrl || skin.image_url || skin.itemImage || skin.itemimage || null;
  }, [skin]);

  const inWatchlist = watchlistIds.includes(skin.id);
  const inPortfolio = portfolioIds.includes(skin.id);

  // Derived price metrics
  const price = skin.marketPrice ?? skin.priceLatest ?? null;
  const prevPrice = skin.priceMedian24h ?? null;
  const delta24h = price != null && prevPrice != null ? price - prevPrice : null;
  const deltaPct24h = delta24h != null && prevPrice ? (delta24h / prevPrice) * 100 : null;

  const high30 = skin.priceMax ?? null;
  const low30 = skin.priceMin ?? null;
  const change30 =
    skin.priceMedian30d != null && price != null ? ((price - skin.priceMedian30d) / skin.priceMedian30d) * 100 : null;

  // Filter history by range. Prefers client-fetched `priceHistory` (real DB
  // rows from `/skins/:id/history`); falls back to any embedded SSR history
  // for forward-compat if the server reader ever starts populating it.
  const filteredHistory = useMemo(() => {
    const source = priceHistory ?? skin.history ?? [];
    if (source.length === 0) return [];
    const days = range === "24h" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : range === "1y" ? 365 : 9999;
    const cutoff = Date.now() - days * 86400000;
    return source.filter((h) => new Date(h.date).getTime() >= cutoff);
  }, [priceHistory, skin.history, range]);

  // Synthetic order book from buy/offer data (until backend exposes real book)
  const synthOrderBook = useMemo(() => {
    if (!price) return { buys: [], sells: [] };
    const spread = price * 0.012; // 1.2% baseline spread
    const buys = Array.from({ length: 6 }).map((_, i) => ({
      price: +(price - spread - i * price * 0.008).toFixed(2),
      qty: Math.round((skin.buyOrderVolume ? skin.buyOrderVolume / 10 : 12) * (1 + i * 0.35)),
    }));
    const sells = Array.from({ length: 6 }).map((_, i) => ({
      price: +(price + i * price * 0.008).toFixed(2),
      qty: Math.round((skin.offerVolume ? skin.offerVolume / 10 : 6) * (1 + i * 0.4)),
    }));
    return { buys, sells };
  }, [price, skin.buyOrderVolume, skin.offerVolume]);

  const handleAddWatchlist = useCallback(async () => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    try {
      const token = await getToken({ template: "backend" });
      const r = await fetchJson<{ success?: boolean; already?: boolean; error?: string }>(apiUrl("/watchlist"), {
        method: "POST",
        body: JSON.stringify({ skinId: skin.id }),
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      if (r?.success) {
        setWatchlistIds((p) => (p.includes(skin.id) ? p : [...p, skin.id]));
        toast.success(r.already ? "Already in watchlist" : "Added to watchlist");
      } else toast.error(r?.error || "Failed");
    } catch {
      toast.error("Failed to add");
    }
  }, [skin, isSignedIn, router, getToken]);

  const handleAddPortfolio = useCallback(async () => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    const buyPrice = skin.priceMedian ?? skin.priceLatest ?? null;
    if (buyPrice == null || buyPrice <= 0) {
      toast.error("Cannot add — this skin has no price data yet");
      return;
    }
    try {
      const token = await getToken({ template: "backend" });
      const r = await fetchJson<{ success?: boolean; id?: number; error?: string }>(apiUrl("/portfolio"), {
        method: "POST",
        body: JSON.stringify({
          skinId: skin.id,
          amount: 1,
          buyPrice,
          buyDate: new Date().toISOString(),
        }),
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      if (r?.success) {
        setPortfolioIds((p) => (p.includes(skin.id) ? p : [...p, skin.id]));
        toast.success("Added to portfolio");
      } else toast.error(r?.error || "Failed");
    } catch {
      toast.error("Failed to add");
    }
  }, [skin, isSignedIn, router, getToken]);

  const rarityClassName = getRarityChipClasses(skin.rarity);
  const rarityHex = rarityToken(skin.rarity).hex;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Atmospheric backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 15% 8%, rgba(168,85,247,0.18), transparent 60%), radial-gradient(ellipse 70% 50% at 92% 100%, rgba(236,72,153,0.10), transparent 65%), radial-gradient(ellipse 50% 40% at 70% 30%, rgba(76,86,140,0.15), transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(120,130,170,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(120,130,170,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 80%)",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 max-w-7xl py-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[12.5px] text-slate-400 mb-3" aria-label="Breadcrumb">
          <Link href="/skins" className="hover:text-white transition-colors">Skins</Link>
          <span className="text-slate-700">/</span>
          {skin.weaponType && (
            <>
              <Link href={`/skins?weapon=${encodeURIComponent(skin.weaponType)}`} className="hover:text-white transition-colors">
                {skin.weaponType}
              </Link>
              <span className="text-slate-700">/</span>
            </>
          )}
          <span className="text-white">
            {skin.name}
            {skin.wear && <span className="text-slate-400"> ({skin.wear})</span>}
          </span>
        </nav>

        {/* HERO */}
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-5 mt-3">
          {/* ART CARD */}
          <Card className="relative overflow-hidden bg-slate-900/70 backdrop-blur border-slate-700/40 p-7">
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse 70% 50% at 30% 30%, ${rarityHex}30, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(168,85,247,0.10), transparent 70%)`,
              }}
            />
            <div className="relative z-10 flex flex-col gap-5">
              {/* Tag strip */}
              <div className="flex items-center gap-2 flex-wrap">
                {skin.rarity && <span className={rarityClassName}>▲ {skin.rarity}</span>}
                {skin.isStattrak && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-[0.18em] border border-amber-500/40 bg-amber-500/12 text-amber-300">
                    <Star className="h-3 w-3" /> StatTrak™
                  </span>
                )}
                {skin.isStar && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-[0.18em] border border-amber-400/40 bg-amber-400/12 text-amber-300">
                    ★ Special
                  </span>
                )}
                {skin.collection && (
                  <span className="ml-auto text-xs text-slate-400">{skin.collection}</span>
                )}
              </div>

              {/* Art stage */}
              <div
                className="aspect-[16/9] rounded-2xl flex items-center justify-center p-6 relative overflow-hidden border"
                style={{
                  background: `radial-gradient(ellipse 60% 50% at 50% 60%, ${rarityHex}30, transparent 70%), linear-gradient(180deg, #1a0b0b 0%, #0a0508 100%)`,
                  borderColor: `${rarityHex}40`,
                }}
              >
                {skinImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={steamImageSrc(skinImageUrl) ?? skinImageUrl}
                    alt={skin.name}
                    className="max-h-full max-w-full object-contain"
                    style={{ filter: `drop-shadow(0 12px 28px ${rarityHex}50)` }}
                  />
                ) : (
                  <span className="font-mono text-slate-600 text-sm tracking-widest">NO IMAGE</span>
                )}
              </div>

              {/* Wear thumbnails. Click navigates to the same skin at a
                  different wear via `/skins/by-id/:id/variants`. Disabled
                  (rendered as div) when the variant doesn't exist for the
                  current StatTrak flag. */}
              {skin.wear && (
                <div className="flex gap-2">
                  {(["FN", "MW", "FT", "WW", "BS"] as const).map((w) => {
                    const active = WEAR_SHORT[skin.wear ?? ""] === w;
                    const longName = Object.entries(WEAR_SHORT).find(([, s]) => s === w)?.[0];
                    const variant = longName && variantsByWear ? variantsByWear[longName] : undefined;
                    const hasTarget = !active && !!variant?.slug;
                    const className = cn(
                      "w-16 h-12 rounded-lg border flex items-center justify-center text-[10px] font-bold transition-colors",
                      active
                        ? "border-purple-500/50 text-white cursor-default"
                        : hasTarget
                          ? "border-slate-700/50 text-slate-400 hover:border-purple-500/40 hover:text-white cursor-pointer"
                          : "border-slate-800/50 text-slate-600 cursor-not-allowed opacity-60"
                    );
                    const style = active ? { boxShadow: "0 0 0 1px rgba(168,85,247,0.4)" } : undefined;
                    if (hasTarget && variant?.slug) {
                      return (
                        <Link
                          key={w}
                          href={`/skins/${skin.weaponSlug}/${variant.slug}`}
                          aria-label={`View ${longName}`}
                          className={className}
                          style={style}
                        >
                          {w}
                        </Link>
                      );
                    }
                    return (
                      <div
                        key={w}
                        aria-label={longName ? `${longName} (unavailable)` : w}
                        className={className}
                        style={style}
                      >
                        {w}
                      </div>
                    );
                  })}
                  <div className="flex-1" />
                  {skin.isStattrak && (
                    <div
                      className="w-16 h-12 rounded-lg border border-amber-400/30 bg-amber-400/[0.06] text-amber-300 flex items-center justify-center text-[10px] font-bold"
                    >
                      ★ ST
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* META CARD */}
          <Card className="bg-slate-900/70 backdrop-blur border-slate-700/40 p-7 flex flex-col gap-5">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-semibold leading-tight tracking-tight text-white">
                {skin.isStattrak && <span className="text-amber-400">StatTrak™ </span>}
                {skin.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[13.5px] text-slate-400">
                {skin.wear && <span>{skin.wear}</span>}
                {skin.float != null && (
                  <>
                    <span className="w-0.5 h-0.5 rounded-full bg-slate-600" />
                    <span className="font-mono">Float {skin.float.toFixed(4)}</span>
                  </>
                )}
                {skin.collection && (
                  <>
                    <span className="w-0.5 h-0.5 rounded-full bg-slate-600" />
                    <span>{skin.collection}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-4 py-4 border-y border-slate-700/40">
              <span className="font-display text-3xl sm:text-5xl md:text-[3.5rem] font-bold leading-none tracking-tight tabular-nums">
                {price != null ? <>€{fmtEUR(price)}</> : "—"}
              </span>
              {deltaPct24h != null && (
                <div className="flex flex-col gap-1">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-mono font-bold text-sm border",
                      deltaPct24h >= 0
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    )}
                  >
                    {deltaPct24h >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {deltaPct24h >= 0 ? "+" : ""}{deltaPct24h.toFixed(2)}% 24h
                  </span>
                  {delta24h != null && (
                    <span className="font-mono text-[11.5px] text-slate-400 tabular-nums">
                      {fmtEURSigned(delta24h)}€ since yesterday
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Stat tiles. `offerVolume` = current Steam Market listings count
                (Stückzahl auf dem Markt), fed by the daily steamListingCounts
                cron. `sold24h` is the 24h trade count from priceoverview.
                `high30` derives from PriceHistory MAX over the last 30 days. */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <StatTile label="Median" value={skin.priceMedian != null ? `€${fmtEUR(skin.priceMedian)}` : "—"} />
              <StatTile label="30D high" value={high30 != null ? `€${fmtEUR(high30)}` : "—"} sub="all-time tracked" />
              <StatTile
                label="Sold 24h"
                value={skin.sold24h != null ? skin.sold24h.toLocaleString("en-GB") : "—"}
                sub="trades"
              />
              <StatTile
                label="On market"
                value={skin.offerVolume != null ? skin.offerVolume.toLocaleString("en-GB") : "—"}
                sub="listings"
              />
            </div>

            {/* CTA row */}
            <div className="flex gap-2">
              <Button
                onClick={handleAddPortfolio}
                disabled={inPortfolio === true}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2 min-h-[44px]"
              >
                <Plus className="h-4 w-4" /> {inPortfolio ? "In portfolio" : "Add to portfolio"}
              </Button>
              <Button
                onClick={handleAddWatchlist}
                variant="outline"
                disabled={inWatchlist === true}
                className="flex-1 border-slate-700/50 text-slate-300 hover:text-white gap-2 min-h-[44px]"
              >
                <Heart className={cn("h-4 w-4", inWatchlist && "fill-rose-400 text-rose-400")} />
                {inWatchlist ? "Watching" : "Watchlist"}
              </Button>
              <Button
                onClick={() => {
                  if (!isSignedIn) { router.push("/sign-in"); return; }
                  setAlertModalOpen(true);
                }}
                variant="outline"
                className="border-slate-700/50 text-slate-300 hover:text-white gap-2 min-h-[44px]"
              >
                <Bell className="h-4 w-4" /> Alert
              </Button>
            </div>

            <CreateAlertModal
              onCreate={async (data) => {
                await createAlert(data);
                toast.success("Alert created");
              }}
              defaultSkinId={skin.id}
              defaultSkinName={skin.name}
              defaultPrice={skin.priceMedian ?? skin.priceLatest ?? 0}
              defaultPriceMin={skin.priceMin ?? null}
              open={alertModalOpen}
              onOpenChange={setAlertModalOpen}
              showTrigger={false}
            />

            {skin.marketHashName && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-slate-300 self-start gap-2 -mt-2"
              >
                <a
                  href={`https://steamcommunity.com/market/listings/730/${encodeURIComponent(skin.marketHashName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open on Steam Market
                </a>
              </Button>
            )}
          </Card>
        </div>

        {/* BODY */}
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5 mt-5">
          {/* LEFT: chart + wear + order book */}
          <div className="flex flex-col gap-5">
            {/* Chart card */}
            <Card className="bg-slate-900/70 backdrop-blur border-slate-700/40 p-5">
              <div className="flex justify-between items-end gap-4 mb-4">
                <div>
                  <h3 className="font-display text-base font-semibold text-white">Price history</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {skin.wear ?? ""}{skin.wear && skin.isStattrak ? " · " : ""}{skin.isStattrak ? "StatTrak™ " : ""}· Steam Market median
                  </p>
                </div>
                <ToggleGroup
                  type="single"
                  value={range}
                  onValueChange={(v) => v && setRange(v as Range)}
                  className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-1"
                >
                  {(["24h", "7d", "30d", "90d", "1y", "all"] as Range[]).map((r) => (
                    <ToggleGroupItem
                      key={r}
                      value={r}
                      className="text-xs px-2.5 py-1 rounded-md min-h-[28px] data-[state=on]:bg-gradient-to-r data-[state=on]:from-purple-500 data-[state=on]:to-pink-500 data-[state=on]:text-white text-slate-400"
                    >
                      {r === "all" ? "All" : r.toUpperCase()}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="flex flex-wrap gap-5 mb-3">
                <ChartMeta label={`${range.toUpperCase()} high`} value={high30 != null ? `€${fmtEUR(high30)}` : "—"} />
                <ChartMeta label={`${range.toUpperCase()} low`} value={low30 != null ? `€${fmtEUR(low30)}` : "—"} />
                <ChartMeta
                  label={`${range.toUpperCase()} change`}
                  value={change30 != null ? `${change30 >= 0 ? "+" : ""}${change30.toFixed(1)}%` : "—"}
                  tone={change30 != null ? (change30 >= 0 ? "pos" : "neg") : undefined}
                />
                {/* TODO: re-enable when backend supplies real volatility metric */}
                {/* <ChartMeta label="Volatility" value={"Medium"} /> */}
                <ChartMeta
                  label="All-time high"
                  value={high30 != null ? `€${fmtEUR(high30)}` : "—"}
                />
              </div>

              <div className="mt-4 pb-6">
                {filteredHistory.length > 0 ? (
                  <SkinPriceChart data={filteredHistory.map((h) => ({ date: h.date, price: h.price }))} />
                ) : (
                  <EmptyState
                    icon={Clock}
                    title="Price not yet tracked"
                    description="We're fetching prices from Steam Market in waves. Check back in a few hours — your skin will appear here once a refresh completes."
                    className="border-slate-800/60 bg-slate-950/40"
                  />
                )}
              </div>
            </Card>

            {/* Wear + float */}
            <Card className="bg-slate-900/70 backdrop-blur border-slate-700/40 p-5">
              <h3 className="font-display text-base font-semibold text-white mb-3">Wear & float</h3>
              <WearFloatBar float={skin.float} wear={skin.wear} />
            </Card>

            {/* Order book */}
            <Card className="bg-slate-900/70 backdrop-blur border-slate-700/40 p-5">
              <h3 className="font-display text-base font-semibold text-white mb-3 flex items-center gap-2">
                Order book
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-400/80">
                  (demo data)
                </span>
              </h3>
              <OrderBook
                buys={synthOrderBook.buys}
                sells={synthOrderBook.sells}
                last={price}
              />
            </Card>
          </div>

          {/* RIGHT: sidebar — real-data widgets only.
              RecentActivity / Stickers / PatternIndex remain commented out
              until backend supplies that data (Phase 2 / Steam-listing API).
              AlertBanner and Case-Link both reference live data and are
              promoted here from the body-footer to fill the sidebar column. */}
          <div className="flex flex-col gap-5">
            {/* User's alert count for this specific skin. Component renders a
                CTA when count===0, a "X alerts active" badge otherwise. */}
            <AlertBanner count={alertCountForThisSkin} />

            {/* Case-link card — shown only when this skin originates from a
                Case (skin.caseInfo populated). Was previously a body-footer,
                moved here so the sidebar column isn't empty. */}
            {skin.caseInfo && (
              <Link
                href={`/cases/${caseToSlug(skin.caseInfo.name)}`}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-900/70 backdrop-blur border border-slate-700/40 hover:border-slate-600/60 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {skin.caseInfo.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{skin.caseInfo.name}</div>
                    <div className="text-xs text-slate-400">Source case</div>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors flex-shrink-0" />
              </Link>
            )}

            {/* Quick links — view variants table, view multi-source pricing.
                Both live in the body below, but a sidebar shortcut helps
                long-scroll users on mobile + desktop. */}
            <Card className="bg-slate-900/70 backdrop-blur border-slate-700/40 p-5">
              <h3 className="font-display text-sm font-semibold text-white mb-3">Compare</h3>
              <div className="flex flex-col gap-2">
                <a
                  href="#wears"
                  className="text-xs text-slate-400 hover:text-fuchsia-400 transition-colors flex items-center gap-2"
                >
                  → All wear variants (FN · MW · FT · WW · BS)
                </a>
                <a
                  href="#prices"
                  className="text-xs text-slate-400 hover:text-fuchsia-400 transition-colors flex items-center gap-2"
                >
                  → Cross-market prices (Steam · Skinport · CSFloat)
                </a>
                {skin.marketHashName && (
                  <a
                    href={`https://steamcommunity.com/market/listings/730/${encodeURIComponent(skin.marketHashName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-fuchsia-400 transition-colors flex items-center gap-2"
                  >
                    → Open on Steam Market ↗
                  </a>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Small helpers */
function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/40">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1.5">{label}</div>
      <div className="font-mono font-bold text-sm text-white tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function ChartMeta({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">{label}</span>
      <span
        className={cn(
          "font-mono text-[13px] font-semibold tabular-nums",
          tone === "pos" ? "text-emerald-400" : tone === "neg" ? "text-rose-400" : "text-slate-300"
        )}
      >
        {value}
      </span>
    </div>
  );
}
