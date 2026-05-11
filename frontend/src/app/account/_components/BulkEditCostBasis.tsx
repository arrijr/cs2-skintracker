"use client";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MatchedItem, CustomCostBasis } from "@/hooks/useSteamConnection";

interface Props {
  matchedSkinItems: MatchedItem[];
  value: CustomCostBasis[];
  onChange: (next: CustomCostBasis[]) => void;
  onBack: () => void;
  onSubmit: () => void;
  importing: boolean;
}

export function BulkEditCostBasis({ matchedSkinItems, value, onChange, onBack, onSubmit, importing }: Props) {
  const initialized = useMemo(() => {
    return matchedSkinItems.map(m => {
      const existing = value.find(v => v.skinId === m.skinId);
      return existing ?? { skinId: m.skinId!, buyPrice: null, buyDate: null };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedSkinItems]);

  useEffect(() => {
    if (value.length === 0 && initialized.length > 0) {
      onChange(initialized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(skinId: number, patch: Partial<CustomCostBasis>) {
    onChange(value.map(row => row.skinId === skinId ? { ...row, ...patch } : row));
  }

  function autofillFromHistory() {
    alert("Historical lookup will be added once we have older PriceHistory data. For now please enter manually.");
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="font-medium">Set cost basis ({matchedSkinItems.length} items)</p>
        <Button variant="outline" size="sm" onClick={autofillFromHistory} className="border-slate-700/50 text-slate-300">
          Auto-fill from history
        </Button>
      </div>

      <div className="max-h-[50vh] overflow-y-auto border border-slate-700/50 rounded">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/60 sticky top-0">
            <tr className="text-left text-slate-400">
              <th className="p-2">Skin</th>
              <th className="p-2 w-20">Qty</th>
              <th className="p-2 w-32">Buy Price (€)</th>
              <th className="p-2 w-40">Buy Date</th>
            </tr>
          </thead>
          <tbody>
            {matchedSkinItems.map(m => {
              const row = value.find(v => v.skinId === m.skinId);
              return (
                <tr key={m.skinId} className="border-t border-slate-700/50">
                  <td className="p-2 text-white">{m.name}</td>
                  <td className="p-2 text-slate-300">{m.amount}</td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={row?.buyPrice ?? ''}
                      onChange={e => update(m.skinId!, { buyPrice: e.target.value ? parseFloat(e.target.value) : null })}
                      className="bg-slate-800 border-slate-700 h-8"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="date"
                      value={row?.buyDate ? row.buyDate.toISOString().slice(0,10) : ''}
                      onChange={e => update(m.skinId!, { buyDate: e.target.value ? new Date(e.target.value) : null })}
                      className="bg-slate-800 border-slate-700 h-8"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onBack} className="border-slate-700/50">Back</Button>
        <Button onClick={onSubmit} disabled={importing} className="bg-gradient-to-r from-purple-500 to-pink-500">
          {importing ? 'Importing…' : 'Import'}
        </Button>
      </div>
    </div>
  );
}
