import { useState } from "react";
import SkinSearchBar from "../skins/SkinSearchBar";
import { useAuth } from "../context/AuthContext";

export default function PortfolioAdd({ onAdded }: { onAdded?: () => void }) {
  const { token } = useAuth();
  const [selectedSkin, setSelectedSkin] = useState<any>(null);
  const [amount, setAmount] = useState<number>(1);
  const [buyPrice, setBuyPrice] = useState<number>();
  const [buyDate, setBuyDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!token || !selectedSkin || !amount || !buyPrice || !buyDate) {
      setError("All fields required!");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5000/api/v1/portfolio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          skinId: selectedSkin.id,
          amount,
          buyPrice,
          buyDate,
        }),
      });
      if (!res.ok) throw new Error("Failed to add skin to portfolio.");
      setSelectedSkin(null);
      setAmount(1);
      setBuyPrice(undefined);
      setBuyDate("");
      if (onAdded) onAdded();
    } catch (e: any) {
      setError(e.message || "Error adding to portfolio.");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center items-center mb-6">
      {/* Add Skin to Portfolio */}
      <SkinSearchBar onSelect={setSelectedSkin} />
      <input
        type="number"
        min={1}
        value={amount}
        placeholder="Amount"
        onChange={(e) => setAmount(Number(e.target.value))}
        className="input-main w-24"
      />
      <input
        type="number"
        min={0}
        step={0.01}
        value={buyPrice ?? ""}
        placeholder="Buy Price"
        onChange={(e) => setBuyPrice(Number(e.target.value))}
        className="input-main w-24"
      />
      <input
        type="date"
        value={buyDate}
        onChange={(e) => setBuyDate(e.target.value)}
        className="input-main w-36"
      />
      <button
        className="btn-main"
        onClick={handleAdd}
        disabled={loading || !selectedSkin}
        style={{ minWidth: 64 }}
      >
        {loading ? "Adding…" : "Add"}
      </button>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}
