"use client";
import { Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ActivityEvent {
  kind: "buy" | "sell";
  label: string;
  meta: string;
  price: number;
}

interface RecentActivityProps {
  events?: ActivityEvent[];
  currency?: string;
}

const fmtPrice = (n: number, c: string) =>
  `${c}${new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;

export function RecentActivity({ events = [], currency = "€" }: RecentActivityProps) {
  if (events.length === 0) {
    return (
      <p className="text-center text-sm text-slate-400 py-4">
        No recent activity for this skin yet.
      </p>
    );
  }
  return (
    <>
      <ul className="divide-y divide-slate-700/40">
        {events.map((e, i) => (
          <li key={i} className="flex items-center gap-3 py-2.5">
            <div
              className={
                e.kind === "buy"
                  ? "w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  : "w-7 h-7 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center flex-shrink-0 font-bold text-sm"
              }
              aria-hidden="true"
            >
              {e.kind === "buy" ? "↘" : "↗"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] text-white font-semibold truncate">{e.label}</div>
              <div className="text-[11px] text-slate-400">{e.meta}</div>
            </div>
            <div className="font-mono text-[12.5px] font-bold text-white tabular-nums">
              {fmtPrice(e.price, currency)}
            </div>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" className="w-full mt-3 border-slate-700/50 text-slate-300 hover:text-white">
        See full history →
      </Button>
    </>
  );
}

interface Sticker {
  name: string;
  type?: string;
}

interface StickersProps {
  stickers?: Sticker[];
  totalValue?: number | null;
  currency?: string;
}

export function Stickers({ stickers = [], totalValue, currency = "€" }: StickersProps) {
  const slots = 4;
  const filled = stickers.slice(0, slots);
  const empty = Math.max(0, slots - filled.length);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-base font-semibold text-white">Stickers</h3>
        {totalValue !== null && totalValue !== undefined && totalValue > 0 && (
          <span className="text-xs text-slate-400 font-semibold">
            +{currency}{totalValue.toFixed(2)} sticker value
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {filled.map((s, i) => (
          <div
            key={i}
            className="aspect-square rounded-lg border border-slate-700/50 flex items-center justify-center text-center p-1 text-[10px] font-semibold text-slate-300 leading-tight"
            style={{
              background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(168,85,247,0.2), transparent 70%), rgba(7,9,14,0.5)",
            }}
            title={s.name}
          >
            {s.name}
            {s.type && <span className="block text-slate-400 mt-0.5">({s.type})</span>}
          </div>
        ))}
        {Array.from({ length: empty }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-lg border border-dashed border-slate-700/60 bg-slate-900/40 flex items-center justify-center text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600"
          >
            Empty
          </div>
        ))}
      </div>
    </>
  );
}

interface PatternTile {
  num: number;
  label: string;
  rare?: boolean;
}

interface PatternIndexProps {
  primary?: PatternTile;
  examples?: PatternTile[];
  note?: string;
}

export function PatternIndex({ primary, examples = [], note }: PatternIndexProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-base font-semibold text-white">Pattern index</h3>
        {primary && (
          <span className="text-xs font-semibold text-slate-400 font-mono">#{primary.num}</span>
        )}
      </div>
      {note && <p className="text-xs text-slate-400 mb-3">{note}</p>}
      {examples.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {examples.map((t, i) => (
            <div
              key={i}
              className={
                t.rare
                  ? "aspect-[1.4] rounded-lg p-2 flex flex-col justify-between text-[10px] border border-amber-500/40 bg-amber-500/[0.05]"
                  : "aspect-[1.4] rounded-lg p-2 flex flex-col justify-between text-[10px] border border-slate-700/40 bg-slate-900/40 hover:border-slate-600/50 transition-colors"
              }
            >
              <span
                className={
                  t.rare
                    ? "font-semibold uppercase tracking-wide text-amber-400"
                    : "font-semibold uppercase tracking-wide text-slate-400"
                }
              >
                {t.rare && "★ "}{t.label}
              </span>
              <span className="font-mono font-bold text-sm text-white tabular-nums">#{t.num}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

interface AlertBannerProps {
  count?: number;
  target?: number | null;
  currency?: string;
}

export function AlertBanner({ count = 0, target, currency = "€" }: AlertBannerProps) {
  if (count === 0) {
    return (
      <Link
        href="/alerts"
        className="block rounded-xl p-4 border border-slate-700/40 bg-slate-900/40 hover:border-slate-600/60 hover:bg-slate-900/60 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800/60 text-slate-400 flex items-center justify-center">
            <Bell className="h-4 w-4" />
          </div>
          <div className="flex-1 text-sm text-slate-400 group-hover:text-slate-300">
            No alerts set on this skin. <span className="text-white font-semibold">Set one →</span>
          </div>
        </div>
      </Link>
    );
  }
  return (
    <div
      className="rounded-xl p-4 border border-purple-500/30 flex items-center gap-3"
      style={{
        background: "linear-gradient(90deg, rgba(168,85,247,0.10), rgba(236,72,153,0.06))",
      }}
    >
      <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0">
        <Bell className="h-4 w-4" />
      </div>
      <div className="flex-1 text-sm text-slate-300">
        <strong className="text-white">You have {count} alert{count !== 1 ? "s" : ""}</strong>
        {target ? (
          <> on this skin — notify when price &gt; {currency}{target.toFixed(2)}</>
        ) : null}
      </div>
      <Button asChild variant="outline" size="sm" className="border-purple-500/40 text-purple-200 hover:bg-purple-500/20">
        <Link href="/alerts">Edit</Link>
      </Button>
    </div>
  );
}
