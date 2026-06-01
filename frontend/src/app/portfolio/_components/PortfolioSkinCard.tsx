// frontend/src/app/portfolio/_components/PortfolioSkinCard.tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { Bell } from "lucide-react";
import PurchaseAccordion from "../../components/PurchaseAccordion";
import { skinDetailHref } from "@/lib/skin-urls";
import { formatEUR, formatPctSafe } from "@/lib/num";
import { positionValue, entryPL, hasMarketPrice, type PortfolioEntry } from "@/lib/portfolio-grouping";

type Props = {
  entry: PortfolioEntry;
  maxPositionValue: number;
  isOpen: boolean;
  onToggle: () => void;
  hasAlert?: boolean;
  onDataChange: () => void;
};

export default function PortfolioSkinCard({ entry, maxPositionValue, isOpen, onToggle, hasAlert, onDataChange }: Props) {
  const { skin } = entry;
  const value = positionValue(entry);
  const pl = entryPL(entry);
  const priced = hasMarketPrice(entry);
  const href = skinDetailHref(skin);
  const img = skin.imageUrl || "/images/placeholder-skin.png";
  const weight = maxPositionValue > 0 ? Math.max(2, Math.round((value / maxPositionValue) * 100)) : 0;

  const plClass =
    pl === null ? "text-slate-400 bg-slate-700/50"
      : pl >= 0 ? "text-emerald-400 bg-emerald-500/10"
      : "text-red-400 bg-red-500/10";

  return (
    <div
      data-testid="skin-card"
      className={clsx(
        "rounded-xl border bg-slate-900/60 p-3 transition-all duration-200",
        isOpen ? "col-span-full border-purple-500/60" : "border-slate-700/40 hover:border-slate-600/60",
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? "Collapse" : "Expand"} ${skin.name} purchases`}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
        className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg"
      >
        <div className="flex items-center gap-2.5">
          <Image src={img} alt={skin.name} width={34} height={34} className="rounded-md w-[34px] h-[34px] object-cover flex-shrink-0" />
          {href ? (
            <Link href={href} onClick={(e) => e.stopPropagation()} className="font-semibold text-sm text-slate-100 hover:text-purple-300 truncate min-w-0">
              {skin.name}
            </Link>
          ) : (
            <span className="font-semibold text-sm text-slate-200 truncate min-w-0">{skin.name}</span>
          )}
          {hasAlert && <Bell className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" aria-label="Price alert set" />}
          <span className="ml-auto text-[10px] text-slate-400 bg-slate-800 rounded-full px-2 py-0.5 flex-shrink-0">{entry.amount}×</span>
        </div>

        <div className="flex items-baseline gap-2 mt-2.5">
          <span className="text-lg font-bold tabular-nums text-white">{priced ? formatEUR(value) : "—"}</span>
          <span className={clsx("text-[11px] font-semibold px-1.5 py-0.5 rounded-full", plClass)}>
            {pl === null ? "—" : formatPctSafe(pl, 1)}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Avg {formatEUR(entry.avgPrice)} · Market {priced ? formatEUR(skin.marketPrice) : "—"}
        </div>
        <div className="h-1 rounded-full bg-slate-700/60 mt-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${weight}%` }} />
        </div>
      </div>

      {isOpen && <PurchaseAccordion purchases={entry.purchases} onTransactionChange={onDataChange} />}
    </div>
  );
}
