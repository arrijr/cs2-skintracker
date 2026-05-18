"use client";
import Link from "next/link";
import { ChevronRight, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketEvent {
  id: string;
  date: string; // ISO date
  title: string;
  description: string;
  type: "tournament" | "patch" | "operation";
  href?: string;
}

interface MarketEventsProps {
  events?: MarketEvent[];
}

// Sample events when no real data — matches design intent (HLTV / blog / market)
const SAMPLE_EVENTS: MarketEvent[] = [
  {
    id: "e1",
    date: "2026-05-14",
    title: "IEM Cologne — Group Stage opens",
    description: "Sticker capsule release · price spike likely",
    type: "tournament",
  },
  {
    id: "e2",
    date: "2026-05-11",
    title: "CS2 Update 1.40 — Dust II returns to pool",
    description: "Map-tied skin demand historically rises 8–14%",
    type: "patch",
  },
  {
    id: "e3",
    date: "2026-05-08",
    title: "Operation Phoenix Bay teased",
    description: "New case rumored · watch for case dropoffs",
    type: "operation",
  },
];

const TAG_CLASS: Record<MarketEvent["type"], string> = {
  tournament: "bg-purple-500/[0.14] text-purple-300 border-purple-500/30",
  patch: "bg-emerald-500/10 text-emerald-400 border-emerald-500/28",
  operation: "bg-amber-500/10 text-amber-300 border-amber-500/30",
};
const TAG_LABEL: Record<MarketEvent["type"], string> = {
  tournament: "Tournament",
  patch: "Patch",
  operation: "Operation",
};

export default function MarketEvents({ events }: MarketEventsProps) {
  const data = (events && events.length > 0) ? events : SAMPLE_EVENTS;

  return (
    <div className="card-style bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base font-semibold text-white flex items-center gap-2">
          <Globe className="h-4 w-4 text-purple-300" aria-hidden="true" /> Market events
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 ml-1">· this week</span>
        </h3>
        <Link href="/blog" className="text-xs font-semibold text-purple-300 hover:underline">
          All events →
        </Link>
      </div>

      <ul className="flex flex-col gap-2.5">
        {data.map((e) => {
          const d = new Date(e.date);
          const day = String(d.getDate()).padStart(2, "0");
          const mon = d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
          const inner = (
            <>
              <div className="w-11 h-11 rounded-[9px] flex flex-col items-center justify-center border border-slate-700/40" style={{ background: "rgba(7,9,14,0.5)" }} aria-hidden="true">
                <div className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-slate-400">{mon}</div>
                <div className="font-display text-base font-bold text-white leading-none">{day}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-white mb-1 truncate">{e.title}</div>
                <div className="flex items-center gap-2 text-[11.5px] text-slate-400 flex-wrap">
                  <span className={cn("text-[9.5px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded border", TAG_CLASS[e.type])}>
                    {TAG_LABEL[e.type]}
                  </span>
                  <span>{e.description}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-600 flex-shrink-0" aria-hidden="true" />
            </>
          );
          const className =
            "grid grid-cols-[44px_1fr_auto] gap-3.5 items-center p-3 rounded-[11px] border border-slate-700/30 transition-all hover:border-slate-600/50 hover:translate-x-0.5 hover:bg-slate-800/40";
          return (
            <li key={e.id}>
              {e.href ? (
                <Link href={e.href} className={className} style={{ background: "rgba(15,19,28,0.5)" }}>
                  {inner}
                </Link>
              ) : (
                <div className={className} style={{ background: "rgba(15,19,28,0.5)" }}>
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 pt-3 border-t border-dashed border-slate-700/40 flex items-center justify-between">
        <span className="text-[11.5px] text-slate-600">Sources: HLTV · CS2 blog · Steam Market</span>
        <Link href="/account" className="text-xs font-semibold text-purple-300 hover:underline">
          Subscribe to digest →
        </Link>
      </div>
    </div>
  );
}
