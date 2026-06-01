// frontend/src/app/portfolio/_components/PortfolioToolbar.tsx
"use client";
import clsx from "clsx";
import type { SortKey } from "@/lib/portfolio-grouping";

export type ToolbarState = {
  search: string;
  sortBy: SortKey;
  weapon: string | null;
  rarity: string | null;
  exterior: string | null;
  hideNoPrice: boolean;
};

type Props = {
  state: ToolbarState;
  onChange: (patch: Partial<ToolbarState>) => void;
  weapons: { key: string; count: number }[];
  rarities: string[];
  exteriors: string[];
  hasNoPrice: boolean;
};

const SELECT = "bg-slate-900/70 border border-slate-700/40 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500";

export default function PortfolioToolbar({ state, onChange, weapons, rarities, exteriors, hasNoPrice }: Props) {
  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Search skins…"
          value={state.search}
          onChange={(e) => onChange({ search: e.target.value })}
          className="flex-1 min-w-[160px] bg-slate-900/70 border border-slate-700/40 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <select aria-label="Sort by" value={state.sortBy} onChange={(e) => onChange({ sortBy: e.target.value as SortKey })} className={SELECT}>
          <option value="value">Sort: Value</option>
          <option value="performance">Sort: Performance</option>
          <option value="name">Sort: Name (A–Z)</option>
          <option value="recent">Sort: Most recent</option>
        </select>
        {rarities.length > 0 && (
          <select aria-label="Filter by rarity" value={state.rarity ?? ""} onChange={(e) => onChange({ rarity: e.target.value || null })} className={SELECT}>
            <option value="">Rarity</option>
            {rarities.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
        {exteriors.length > 0 && (
          <select aria-label="Filter by wear" value={state.exterior ?? ""} onChange={(e) => onChange({ exterior: e.target.value || null })} className={SELECT}>
            <option value="">Wear</option>
            {exteriors.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        )}
      </div>

      {weapons.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <Chip active={state.weapon === null} onClick={() => onChange({ weapon: null })}>All</Chip>
          {weapons.map((w) => (
            <Chip key={w.key} active={state.weapon === w.key} onClick={() => onChange({ weapon: state.weapon === w.key ? null : w.key })}>
              {w.key} <span className="opacity-60">{w.count}</span>
            </Chip>
          ))}
        </div>
      )}

      {hasNoPrice && (
        <label className="flex items-center gap-2 text-[12px] text-slate-400 select-none cursor-pointer">
          <input type="checkbox" checked={state.hideNoPrice} onChange={(e) => onChange({ hideNoPrice: e.target.checked })} className="accent-purple-500" />
          Hide items with no market price
        </label>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "text-[11px] px-3 py-1 rounded-full border transition-colors",
        active ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent"
               : "bg-slate-900/70 text-slate-400 border-slate-700/40 hover:border-slate-600/60",
      )}
    >
      {children}
    </button>
  );
}
