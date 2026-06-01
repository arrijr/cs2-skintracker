// frontend/src/app/portfolio/_components/PortfolioGroup.tsx
"use client";
import clsx from "clsx";
import { ChevronDown, ChevronRight } from "lucide-react";
import PortfolioSkinCard from "./PortfolioSkinCard";
import { formatEUR, formatPctSafe } from "@/lib/num";
import { NO_PRICE_KEY, type PortfolioGroupData } from "@/lib/portfolio-grouping";

type Props = {
  group: PortfolioGroupData;
  collapsed: boolean;
  onToggleCollapse: () => void;
  maxPositionValue: number;
  openSkinId: number | null;
  onToggleSkin: (skinId: number) => void;
  alertSkinIds: Set<number>;
  onDataChange: () => void;
};

export default function PortfolioGroup({
  group, collapsed, onToggleCollapse, maxPositionValue, openSkinId, onToggleSkin, alertSkinIds, onDataChange,
}: Props) {
  const isNoPrice = group.key === NO_PRICE_KEY;
  return (
    <div className={clsx("rounded-xl border border-slate-700/30 overflow-hidden mb-2.5", isNoPrice && "opacity-80")}>
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-expanded={!collapsed}
        aria-label={`${collapsed ? "Expand" : "Collapse"} ${group.label}`}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-slate-800/40 hover:bg-slate-800/70 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
      >
        {collapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        <span className="font-semibold text-slate-100">{group.label}</span>
        <span className="text-[11px] text-slate-400">{group.count} {group.count === 1 ? "item" : "items"}</span>
        <span className="ml-auto text-right">
          {isNoPrice ? (
            <span className="text-[11px] text-slate-500">excluded from P/L</span>
          ) : (
            <>
              <span className="font-bold text-slate-100 tabular-nums">{formatEUR(group.value)}</span>
              {group.pl !== null && (
                <span className={clsx("ml-2 text-[11px] font-semibold", group.pl >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {formatPctSafe(group.pl, 1)}
                </span>
              )}
            </>
          )}
        </span>
      </button>

      {!collapsed && (
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 bg-slate-800/40">
          {group.items.map((entry) => (
            <PortfolioSkinCard
              key={entry.skin.id}
              entry={entry}
              maxPositionValue={maxPositionValue}
              isOpen={openSkinId === entry.skin.id}
              onToggle={() => onToggleSkin(entry.skin.id)}
              hasAlert={alertSkinIds.has(entry.skin.id)}
              onDataChange={onDataChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
