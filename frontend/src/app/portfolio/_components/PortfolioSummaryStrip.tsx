"use client";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SumCard {
  label: string;
  value: string;
  sub?: string;
  subTone?: "pos" | "neg" | "neutral";
  big?: boolean;
}

export function PortfolioSummaryStrip({ cards }: { cards: SumCard[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-3.5 mb-4">
      {cards.map((c, i) => (
        <Card key={i} className="bg-slate-900/70 backdrop-blur border-slate-700/30 rounded-2xl">
          <CardContent className="px-5 py-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-1.5">{c.label}</div>
            <div
              className={cn(
                "font-display font-semibold text-white tabular-nums tracking-[-0.02em]",
                c.big ? "text-3xl" : "text-2xl"
              )}
            >
              {c.value}
            </div>
            {c.sub && (
              <div
                className={cn(
                  "font-mono text-xs mt-1",
                  c.subTone === "pos" && "text-emerald-400",
                  c.subTone === "neg" && "text-rose-400",
                  (!c.subTone || c.subTone === "neutral") && "text-slate-500"
                )}
              >
                {c.sub}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
