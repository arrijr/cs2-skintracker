import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatPriceUSD, formatDate, formatQuantity } from "@/lib/format";

type Purchase = {
  id: number;
  amount: number;
  buyPrice: number;
  buyDate: string;
};

type Props = {
  purchases: Purchase[];
  total?: number;
  avgPrice?: number;
  performance?: number | null;
  marketPrice?: number | null;
};

{/* Portfolio – Accordion of skins & purchases */}
export default function PurchaseAccordion({ purchases, total, avgPrice, performance, marketPrice }: Props) {
  const [open, setOpen] = useState(false);
  const [tableSort, setTableSort] = useState<"date" | "amount" | "price">("date");
  const [tableSortDir, setTableSortDir] = useState<"asc" | "desc">("desc");

  const sortedPurchases = [...purchases].sort((a, b) => {
    let cmp = 0;
    if (tableSort === "date") cmp = new Date(a.buyDate).getTime() - new Date(b.buyDate).getTime();
    if (tableSort === "amount") cmp = a.amount - b.amount;
    if (tableSort === "price") cmp = a.buyPrice - b.buyPrice;
    return tableSortDir === "asc" ? cmp : -cmp;
  });

  if (!purchases || purchases.length === 0) return null;

  const totalInvested = purchases.reduce((sum, p) => sum + (p.amount * p.buyPrice), 0);
  const currentValue = typeof marketPrice === "number" && typeof total === "number" 
    ? marketPrice * total 
    : null;
  const unrealizedPL = currentValue && totalInvested > 0 
    ? currentValue - totalInvested 
    : null;
  const unrealizedPLPercent = unrealizedPL && totalInvested > 0 
    ? (unrealizedPL / totalInvested) * 100 
    : null;

  return (
    <div className="mt-4">
      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
        <div>
          <div className="text-zinc-400 text-xs">Position Qty</div>
          <div className="font-mono">{formatQuantity(total)}</div>
        </div>
        <div>
          <div className="text-zinc-400 text-xs">Avg Cost</div>
          <div className="font-mono">{formatPriceUSD(avgPrice)}</div>
        </div>
        <div>
          <div className="text-zinc-400 text-xs">Current Value</div>
          <div className="font-mono">{formatPriceUSD(currentValue)}</div>
        </div>
        <div>
          <div className="text-zinc-400 text-xs">Unrealized P/L</div>
          <div className={`font-mono ${unrealizedPL ? (unrealizedPL >= 0 ? "text-emerald-400" : "text-red-400") : ""}`}>
            {unrealizedPL ? 
              `${unrealizedPL >= 0 ? "+" : ""}${formatPriceUSD(Math.abs(unrealizedPL))} (${unrealizedPLPercent?.toFixed(1)}%)` 
              : "-"
            }
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition text-sm font-medium w-full sm:w-auto"
        onClick={() => setOpen(v => !v)}
      >
        {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        {open ? "Hide" : "Show"} {purchases.length} purchase{purchases.length !== 1 ? "s" : ""}
      </button>

      {/* Accordion Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? "max-h-[600px]" : "max-h-0"}`}
      >
        {open && (
          <div className="mt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs bg-zinc-800 rounded-lg">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th 
                      className="text-left py-2 px-3 cursor-pointer hover:bg-zinc-700"
                      onClick={() => {
                        setTableSort("date");
                        setTableSortDir(tableSort === "date" && tableSortDir === "desc" ? "asc" : "desc");
                      }}
                    >
                      Date {tableSort === "date" && (tableSortDir === "asc" ? " ↑" : " ↓")}
                    </th>
                    <th 
                      className="text-right py-2 px-3 cursor-pointer hover:bg-zinc-700"
                      onClick={() => {
                        setTableSort("amount");
                        setTableSortDir(tableSort === "amount" && tableSortDir === "desc" ? "asc" : "desc");
                      }}
                    >
                      Qty {tableSort === "amount" && (tableSortDir === "asc" ? " ↑" : " ↓")}
                    </th>
                    <th 
                      className="text-right py-2 px-3 cursor-pointer hover:bg-zinc-700"
                      onClick={() => {
                        setTableSort("price");
                        setTableSortDir(tableSort === "price" && tableSortDir === "desc" ? "asc" : "desc");
                      }}
                    >
                      Unit Price {tableSort === "price" && (tableSortDir === "asc" ? " ↑" : " ↓")}
                    </th>
                    <th className="text-right py-2 px-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPurchases.map((p, index) => (
                    <tr key={p.id} className={index % 2 === 0 ? "bg-zinc-800" : "bg-zinc-750"}>
                      <td className="py-2 px-3">{formatDate(p.buyDate)}</td>
                      <td className="py-2 px-3 text-right">{formatQuantity(p.amount)}</td>
                      <td className="py-2 px-3 text-right">{formatPriceUSD(p.buyPrice)}</td>
                      <td className="py-2 px-3 text-right">{formatPriceUSD(p.amount * p.buyPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
