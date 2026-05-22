// /frontend/src/app/items/[id]/page.tsx — Market item detail (sticker / agent / patch / etc.)
// Hi-fi treatment to match /skins/[skinId] visual language — adapted for items that don't have wear/float/stickers.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { steamImageSrc } from "@/lib/image-proxy";
import { apiUrl } from "@/lib/api";

interface DetailItem {
  id: number;
  category: 'sticker' | 'agent' | 'patch' | 'graffiti' | 'music_kit' | 'collectible' | 'key';
  name: string;
  marketHashName: string;
  imageUrl: string | null;
  rarity: string | null;
  collection: string | null;
  priceLatest: number | null;
  priceMedian: number | null;
  volume24h: number | null;
  priceUpdatedAt: string | null;
  metadata: Record<string, unknown> | null;
}

const CATEGORY_LABELS: Record<DetailItem['category'], string> = {
  sticker: 'Sticker',
  agent: 'Agent',
  patch: 'Patch',
  graffiti: 'Graffiti',
  music_kit: 'Music Kit',
  collectible: 'Collectible',
  key: 'Key',
};

const CATEGORY_TINT: Record<DetailItem['category'], string> = {
  sticker: 'rgba(168,85,247,0.20)',
  agent: 'rgba(75,105,255,0.18)',
  patch: 'rgba(245,185,72,0.16)',
  graffiti: 'rgba(236,72,153,0.18)',
  music_kit: 'rgba(34,197,94,0.16)',
  collectible: 'rgba(245,185,72,0.20)',
  key: 'rgba(120,130,170,0.15)',
};

async function fetchItem(id: string): Promise<DetailItem | null> {
  try {
    const res = await fetch(apiUrl(`/api/v1/market-items/${encodeURIComponent(id)}`), { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as DetailItem;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const item = await fetchItem(id);
  if (!item) return { title: "Item not found — skintrackr.io" };
  return {
    title: `${item.name} — skintrackr.io`,
    description: `${CATEGORY_LABELS[item.category]} ${item.priceLatest != null ? `· €${item.priceLatest.toFixed(2)}` : ''}`.trim(),
  };
}

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default async function ItemDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await fetchItem(id);
  if (!item) notFound();

  const backHref = `/items?category=${item.category}`;
  const tint = CATEGORY_TINT[item.category];
  const deltaPct = item.priceLatest != null && item.priceMedian != null && item.priceMedian > 0
    ? ((item.priceLatest - item.priceMedian) / item.priceMedian) * 100
    : null;
  const isPos = (deltaPct ?? 0) >= 0;

  return (
    <AppShell eyebrow="Catalog" title={item.name} description={CATEGORY_LABELS[item.category]} maxWidth="7xl">
      <Button variant="ghost" asChild className="mb-5 text-slate-400 hover:text-white -ml-3">
        <Link href={backHref} className="inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to {CATEGORY_LABELS[item.category]}s
        </Link>
      </Button>

      <div className="grid lg:grid-cols-[1.15fr_1fr] gap-5">
        {/* ART CARD */}
        <Card className="relative overflow-hidden bg-slate-900/70 backdrop-blur border-slate-700/30 rounded-2xl p-5 sm:p-7">
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 70% 50% at 30% 30%, ${tint}, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(168,85,247,0.10), transparent 70%)`,
            }}
          />
          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-[0.18em] border"
                style={{
                  background: tint.replace("0.2", "0.14").replace("0.18", "0.14").replace("0.16", "0.14"),
                  borderColor: tint,
                  color: "#e2e8f0",
                }}
              >
                {CATEGORY_LABELS[item.category]}
              </span>
              {item.rarity && (
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-[0.18em] border border-amber-500/40 bg-amber-500/[0.12] text-amber-300"
                >
                  {item.rarity}
                </span>
              )}
              {item.collection && (
                <span className="ml-auto text-xs text-slate-400">{item.collection}</span>
              )}
            </div>

            <div
              className="aspect-[16/9] rounded-2xl flex items-center justify-center p-6 relative overflow-hidden border border-slate-700/40"
              style={{
                background: `radial-gradient(ellipse 60% 50% at 50% 60%, ${tint}, transparent 70%), linear-gradient(180deg, #1a0b1a 0%, #0a0508 100%)`,
              }}
            >
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={steamImageSrc(item.imageUrl) ?? item.imageUrl}
                  alt={item.name}
                  className="max-h-full max-w-full object-contain"
                  style={{ filter: `drop-shadow(0 12px 28px ${tint})` }}
                />
              ) : (
                <span className="font-mono text-slate-600 text-sm tracking-widest">NO IMAGE</span>
              )}
            </div>
          </div>
        </Card>

        {/* META CARD */}
        <Card className="bg-slate-900/70 backdrop-blur border-slate-700/30 rounded-2xl p-5 sm:p-7 flex flex-col gap-5">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold leading-tight tracking-tight text-white">
              {item.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-[13.5px] text-slate-400">
              <span>{CATEGORY_LABELS[item.category]}</span>
              {item.collection && (
                <>
                  <span className="w-0.5 h-0.5 rounded-full bg-slate-600" aria-hidden="true" />
                  <span>{item.collection}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 sm:gap-4 py-4 border-y border-slate-700/40">
            <span className="font-display text-4xl sm:text-5xl md:text-[3.5rem] font-bold leading-none tracking-tight tabular-nums">
              {item.priceLatest != null ? <>€{fmtEUR(item.priceLatest)}</> : "—"}
            </span>
            {deltaPct != null && deltaPct !== 0 && (
              <div className="flex flex-col gap-1">
                <span
                  className={
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-mono font-bold text-sm border " +
                    (isPos
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/30")
                  }
                >
                  {isPos ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {isPos ? "+" : ""}{deltaPct.toFixed(2)}% vs median
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <StatTile label="Median price" value={item.priceMedian != null ? `€${fmtEUR(item.priceMedian)}` : "—"} />
            <StatTile label="Volume 24h" value={item.volume24h != null ? String(item.volume24h) : "—"} sub="trades" />
            <StatTile label="Last update" value={item.priceUpdatedAt ? new Date(item.priceUpdatedAt).toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit" }) : "—"} sub={item.priceUpdatedAt ? new Date(item.priceUpdatedAt).toLocaleDateString("en-GB") : undefined} />
            <StatTile label="Category" value={CATEGORY_LABELS[item.category]} />
          </div>

          {item.marketHashName && (
            <Button asChild variant="outline" className="border-slate-700/50 text-slate-300 hover:text-white gap-2 mt-2">
              <a
                href={`https://steamcommunity.com/market/listings/730/${encodeURIComponent(item.marketHashName)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Open on Steam Market
              </a>
            </Button>
          )}

          <p className="text-xs text-slate-400 pt-2 border-t border-slate-700/40 break-words">
            Market hash name:{" "}
            <code className="bg-slate-900/70 border border-slate-700/30 px-2 py-1 rounded font-mono break-all">
              {item.marketHashName}
            </code>
          </p>
        </Card>
      </div>
    </AppShell>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/40">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1.5">{label}</div>
      <div className="font-mono font-bold text-sm text-white tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}
