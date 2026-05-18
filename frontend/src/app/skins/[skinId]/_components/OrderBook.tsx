"use client";
import { cn } from "@/lib/utils";

interface Order {
  price: number;
  qty: number;
}

interface OrderBookProps {
  buys?: Order[];
  sells?: Order[];
  /** Last traded price */
  last?: number | null;
  currency?: string;
}

const fmt = (n: number) => new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtInt = (n: number) => new Intl.NumberFormat("en-GB").format(Math.round(n));

/**
 * Buy/Sell order book with depth gradient backgrounds.
 * Adapted from item-detail-hifi.html.
 */
export function OrderBook({ buys = [], sells = [], last, currency = "€" }: OrderBookProps) {
  const buysSorted = [...buys].sort((a, b) => b.price - a.price);
  const sellsSorted = [...sells].sort((a, b) => a.price - b.price);
  const maxBuyQty = Math.max(1, ...buysSorted.map((o) => o.qty));
  const maxSellQty = Math.max(1, ...sellsSorted.map((o) => o.qty));

  const bestBid = buysSorted[0]?.price;
  const bestAsk = sellsSorted[0]?.price;
  const spread = bestBid && bestAsk ? bestAsk - bestBid : null;
  const spreadPct = spread && bestBid ? (spread / bestBid) * 100 : null;
  const mid = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : null;

  if (buysSorted.length === 0 && sellsSorted.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-slate-500">
        No order book data available yet.
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-5">
        <Side
          rows={buysSorted}
          max={maxBuyQty}
          side="buy"
          currency={currency}
        />
        <Side
          rows={sellsSorted}
          max={maxSellQty}
          side="sell"
          currency={currency}
        />
      </div>

      <div className="mt-3 pt-3 pb-3 border-y border-dashed border-slate-700/50 flex justify-between font-mono text-xs">
        <span>
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 mr-2">Spread</span>
          <span className="font-bold text-white">
            {spread !== null ? `${currency}${fmt(spread)}` : "—"}
            {spreadPct !== null && <span className="text-slate-500"> ({spreadPct.toFixed(2)}%)</span>}
          </span>
        </span>
        <span>
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 mr-2">Mid</span>
          <span className="font-bold text-white">{mid !== null ? `${currency}${fmt(mid)}` : "—"}</span>
        </span>
        {last !== null && last !== undefined && (
          <span>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 mr-2">Last</span>
            <span className="font-bold text-white">{currency}{fmt(last)}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function Side({
  rows,
  max,
  side,
  currency,
}: {
  rows: Order[];
  max: number;
  side: "buy" | "sell";
  currency: string;
}) {
  const isBuy = side === "buy";
  return (
    <div>
      <h5 className={cn(
        "flex justify-between text-[11px] font-bold uppercase tracking-[0.16em] mb-2.5",
        isBuy ? "text-emerald-400" : "text-rose-400"
      )}>
        <span>{isBuy ? "Buy orders" : "Sell orders"}</span>
        <span className="text-slate-500 font-normal tracking-normal text-[10px]">Qty · Total</span>
      </h5>
      <div className="space-y-0.5">
        {rows.slice(0, 6).map((o, i) => {
          const depth = o.qty / max;
          return (
            <div
              key={i}
              className={cn(
                "relative grid grid-cols-[1fr_auto_60px] gap-2 px-2 py-1 font-mono text-[11.5px] items-center rounded"
              )}
            >
              <div
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 rounded pointer-events-none",
                  isBuy
                    ? "bg-gradient-to-r from-emerald-500/15 to-transparent"
                    : "bg-gradient-to-r from-rose-500/15 to-transparent"
                )}
                style={{ opacity: depth }}
              />
              <span className={cn(
                "relative z-10 font-bold tabular-nums",
                isBuy ? "text-emerald-400" : "text-rose-400"
              )}>
                {currency}{fmt(o.price)}
              </span>
              <span className="relative z-10 text-slate-400 tabular-nums text-right">{fmtInt(o.qty)}</span>
              <span className="relative z-10 text-slate-500 tabular-nums text-right text-[10.5px]">
                {currency}{fmtInt(o.price * o.qty)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
