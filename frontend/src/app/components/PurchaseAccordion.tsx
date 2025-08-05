import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";

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
};

export default function PurchaseAccordion({ purchases, total, avgPrice, performance }: Props) {
  const [open, setOpen] = useState(false);
  const totalInvested = purchases.reduce((sum, p) => sum + (p.amount * p.buyPrice), 0);
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

  return (
    <div className="bg-zinc-900 rounded-2xl shadow-lg my-4 p-4 w-full max-w-lg mx-auto">
      {/* Kompakt-Stats Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-2">
        {typeof total === "number" && (
          <div>
            <span className="font-bold text-white">In Portfolio:</span>{" "}
            <span className="font-mono text-emerald-400">{total}</span>
          </div>
        )}
        {typeof avgPrice === "number" && (
          <div>
            <span className="text-zinc-400">Ø Buy:</span>{" "}
            <span className="font-mono">{avgPrice.toFixed(2)}$</span>
          </div>
        )}
        {typeof performance === "number" && (
          <div>
            <span className={performance > 0 ? "text-emerald-400" : "text-red-400"}>
              {performance > 0 ? "+" : ""}
              {performance.toFixed(1)}%
            </span>
          </div>
        )}
        <div>
            <span className="text-zinc-400">Value:</span>{" "}
            <span className="font-mono">{totalInvested.toFixed(2)} $</span>
        </div>

        {/* Performance in %*/}
        <div className="flex gap-2 items-center">
            <Tooltip.Provider>
                <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                    <span
                        className={
                        `
                            px-2 py-0.5 rounded-full font-mono text-xs font-semibold
                            ${performance && performance > 0 ? "bg-emerald-900 text-emerald-300" : "bg-red-900 text-red-300"}
                        `
                        }
                    >
                        {typeof performance === "number"
                            ? `${performance > 0 ? "+" : ""}${performance.toFixed(1)}%`
                            : "0%"
                        }
                    </span>
                    </Tooltip.Trigger>
                    <Tooltip.Content
                    className="rounded bg-zinc-800 px-2 py-1 text-xs text-white shadow"
                    side="top"
                    >
                    Performance = (current market price – avg buy price) / avg buy price
                    </Tooltip.Content>
                </Tooltip.Root>
            </Tooltip.Provider>
        </div>

        {/* Toggle Button */}
        <button
          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition text-sm font-medium"
          onClick={() => setOpen(v => !v)}
        >
          {open ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
          {open ? "Hide purchases" : "Show purchases"}
        </button>
      </div>


      {/* Accordion Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? "max-h-[600px]" : "max-h-0"}`}
      >

        {/* Sortieren Icon */}
        <thead>
            <tr>
                <th
                className="cursor-pointer"
                onClick={() => {
                    setTableSort("date");
                    setTableSortDir(tableSort === "date" && tableSortDir === "desc" ? "asc" : "desc");
                }}
                >
                Date
                {tableSort === "date" && (tableSortDir === "asc" ? " ↑" : " ↓")}
                </th>
                <th
                className="cursor-pointer"
                onClick={() => {
                    setTableSort("amount");
                    setTableSortDir(tableSort === "amount" && tableSortDir === "desc" ? "asc" : "desc");
                }}
                >
                Amount
                {tableSort === "amount" && (tableSortDir === "asc" ? " ↑" : " ↓")}
                </th>
                <th
                className="cursor-pointer"
                onClick={() => {
                    setTableSort("price");
                    setTableSortDir(tableSort === "price" && tableSortDir === "desc" ? "asc" : "desc");
                }}
                >
                Price/Unit ($)
                {tableSort === "price" && (tableSortDir === "asc" ? " ↑" : " ↓")}
                </th>
                <th>Total ($)</th>
            </tr>
        </thead>
        
        {open && (
          <div className="mt-3">
            <table className="w-full text-xs bg-zinc-800 rounded-xl">
              <thead>
                <tr>
                  <th className="text-left py-1 px-2">Date</th>
                  <th className="text-right py-1 px-2">Amount</th>
                  <th className="text-right py-1 px-2">Price/Unit ($)</th>
                  <th className="text-right py-1 px-2">Total ($)</th>
                </tr>
              </thead>
              <tbody>
                    {sortedPurchases.map((p) => (
                        <tr key={p.id}>
                            <td className="py-1 px-2">{new Date(p.buyDate).toLocaleDateString()}</td>
                            <td className="py-1 px-2 text-right">{p.amount}</td>
                            <td className="py-1 px-2 text-right">{p.buyPrice?.toFixed(2) ?? "-"}</td>
                            <td className="py-1 px-2 text-right">{(p.amount * p.buyPrice).toFixed(2)}</td>
                        </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
