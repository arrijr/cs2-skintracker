import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { deletePortfolioEntry } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";

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
  onTransactionChange: () => void; // Callback to refresh portfolio data
};

export default function PurchaseAccordion({ purchases, onTransactionChange }: Omit<Props, 'total' | 'avgPrice' | 'performance'>) {
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const { getToken } = useAuth();

  if (!purchases || purchases.length === 0) {
    return (
      <div className="p-4 border-t border-zinc-800 text-center text-xs text-zinc-400">
        No individual purchases recorded.
      </div>
    );
  }

  return (
      <div className="p-4 border-t border-zinc-800">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
            <thead>
            <tr className="text-zinc-400">
                <th className="text-left py-1 px-2">Date</th>
                <th className="text-right py-1 px-2">Amount</th>
                <th className="text-right py-1 px-2">Price/Unit ($)</th>
                <th className="text-right py-1 px-2">Total ($)</th>
                <th className="text-right py-1 px-2">Actions</th>
            </tr>
            </thead>
            <tbody>
            {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-900">
                <td className="py-1 px-2">{new Date(p.buyDate).toLocaleDateString()}</td>
                <td className="py-1 px-2 text-right">{p.amount}</td>
                <td className="py-1 px-2 text-right">{p.buyPrice?.toFixed(2) ?? "-"}</td>
                <td className="py-1 px-2 text-right">{(p.amount * p.buyPrice).toFixed(2)}</td>
                <td className="py-1 px-2 text-right">
                    <button
                        onClick={async () => {
                            if (window.confirm("Are you sure you want to delete this purchase?")) {
                                setIsDeleting(p.id);
                                try {
                                    const token = await getToken({ template: "backend" });
                                    await deletePortfolioEntry(p.id, token || undefined);
                                    onTransactionChange(); // Refresh data on parent
                                } catch (e) {
                                    alert("Failed to delete entry.");
                                } finally {
                                    setIsDeleting(null);
                                }
                            }
                        }}
                        disabled={isDeleting === p.id}
                        className="p-1 text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                        {isDeleting === p.id ? "..." : <Trash2 size={14} />}
                    </button>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
      </div>
  );
}
