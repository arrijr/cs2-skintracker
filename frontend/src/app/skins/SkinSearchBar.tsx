import { searchSkins } from "../api/api";
import React, { useState, useEffect } from "react";

type Skin = {
  id: number;
  name: string;
  marketHashName: string;
  imageUrl?: string;
  weaponType?: string;
  collection?: string;
  wear?: string;
};

type Props = {
  onSelect: (skin: Skin) => void;
};

export default function SkinSearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Skin[]>([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch skins if query has at least 2 characters
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    let cancel = false;
    setLoading(true);
    setError(null);

    searchSkins(query)
      .then((data) => {
        if (!cancel) setResults(data || []);
      })
      .catch(() => {
        if (!cancel) setError("Could not load skins.");
      })
      .finally(() => setLoading(false));
    return () => {
      cancel = true;
    };
  }, [query]);

  function handleSelect(skin: Skin) {
    setQuery(skin.name);
    setShow(false);
    setResults([]);
    onSelect(skin);
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Skin search input */}
      <input
        type="text"
        className="input-main w-full"
        placeholder="Search for a CS2 Skin…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShow(true);
        }}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 150)}
        autoComplete="off"
      />

      {/* Dropdown results */}
      {show && query.length >= 2 && (
        <ul className="absolute z-20 left-0 right-0 bg-zinc-900 border border-zinc-800 rounded-xl mt-1 max-h-60 overflow-y-auto shadow-lg">
          {loading && (
            <li className="px-4 py-2 text-xs text-gray-400">Loading…</li>
          )}
          {error && (
            <li className="px-4 py-2 text-xs text-red-500">{error}</li>
          )}
          {!loading && !error && results.length === 0 && (
            <li className="px-4 py-2 text-xs text-gray-400">No results</li>
          )}
          {results.map((skin) => (
            <li
              key={skin.id}
              className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-800 cursor-pointer transition"
              onMouseDown={() => handleSelect(skin)}
            >
              {skin.imageUrl && (
                <img
                  src={skin.imageUrl}
                  alt={skin.name}
                  className="w-8 h-8 object-cover rounded"
                />
              )}
              <div>
                <span className="font-medium">{skin.name}</span>
                {skin.wear && (
                  <span className="ml-2 text-xs text-zinc-400">{skin.wear}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
