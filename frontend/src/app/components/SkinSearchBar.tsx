"use client";
import { useState } from "react";
import { api } from "@/lib/api";

type Props = { onSelect: (skinId: number) => void };

export default function SkinSearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    setError(null);
    setLoading(true);
    try {
      // {/* Search Skins */}
      const data = await api.searchSkins(query);
      setResults(data?.items ?? data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {/* Search Input */}
      <div className="flex gap-2">
        <input
          className="input-main flex-1"
          placeholder="Search skins…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn-main" onClick={handleSearch}>Search</button>
      </div>

      {/* Error */}
      {error && <div className="text-red-400 text-sm">{error}</div>}

      {/* Results */}
      <ul className="max-h-64 overflow-auto border border-zinc-800 rounded-lg">
        {loading && <li className="p-3 text-zinc-400">Loading…</li>}
        {!loading && results.map((s) => (
          <li
            key={s.id}
            className="p-3 hover:bg-zinc-800 cursor-pointer"
            onClick={() => onSelect(s.id)}
          >
            {/* Search Result Item */}
            <div className="flex justify-between">
              <span>{s.name}</span>
              <span className="text-zinc-400">${s.marketPrice?.toFixed?.(2) ?? "-"}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
