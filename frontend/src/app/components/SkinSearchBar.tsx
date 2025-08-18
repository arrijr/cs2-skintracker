"use client";

import { useEffect, useMemo, useState } from "react";
import { searchSkins } from "@/lib/api";

type Skin = {
  id: number;
  name: string;
  itemimage?: string;
  itemImage?: string;
  image_url?: string;
  imageUrl?: string;
  wear?: string;
};

type Props<T = number | Skin> = {
  /* onSelect: bekommt entweder die ID (Default) oder das Skin-Objekt – siehe selectMode/mapSelected */
  onSelect: (value: T) => void;
  /* 'id' = gibt nur die ID zurück (Default); 'skin' = gibt das Skin-Objekt zurück */
  selectMode?: "id" | "skin";
  /* optional: eigenes Mapping, falls du etwas anderes als ID/Skin brauchst */
  mapSelected?: (skin: Skin) => T;
  /* optional: Mindestlänge für Suche */
  minLength?: number;
  /* optional: Placeholder-Text */
  placeholder?: string;
};

export default function SkinSearchBar<T = number | Skin>({
  onSelect,
  selectMode = "id",
  mapSelected,
  minLength = 2,
  placeholder = "Search a skin…",
}: Props<T>) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Skin[]>([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // {/* Debounce */}
  const debouncedQ = useMemo(() => q.trim(), [q]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (debouncedQ.length < minLength) {
        setItems([]);
        setErr(null);
        return;
      }
      setLoading(true);
      setErr(null);
      try {
        const result = await searchSkins(debouncedQ);
        if (!cancelled) setItems(Array.isArray(result) ? (result as Skin[]) : []);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Search failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const t = setTimeout(run, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [debouncedQ, minLength]);

  function handleSelect(skin: Skin) {
    let value: any;
    if (mapSelected) value = mapSelected(skin);
    else value = selectMode === "id" ? skin.id : skin;
    onSelect(value as T);
    setQ(skin.name);
    setShow(false);
    setItems([]);
  }

  return (
    <div className="relative w-full max-w-md">
      {/* Skin Search Input */}
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setShow(true);
        }}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 150)}
        placeholder={placeholder}
        className="input-main w-full"
        autoComplete="off"
      />

      {/* Dropdown */}
      {show && q.trim().length >= minLength && (
        <ul className="absolute z-20 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-lg">
          {loading && <li className="px-4 py-2 text-xs text-zinc-400">Searching…</li>}
          {err && <li className="px-4 py-2 text-xs text-red-400">{err}</li>}
          {!loading && !err && items.length === 0 && (
            <li className="px-4 py-2 text-xs text-zinc-400">No results</li>
          )}
          {items.map((s) => {
            const img =
              s.itemimage ||
              s.itemImage ||
              s.image_url ||
              s.imageUrl ||
              "/images/placeholder-skin.png";
            return (
              <li
                key={s.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50 cursor-pointer"
                onMouseDown={() => handleSelect(s)}
              >
                <img src={img} alt={s.name} className="w-8 h-8 rounded object-cover" />
                <div className="truncate">
                  <span className="font-medium">{s.name}</span>
                  {s.wear && <span className="ml-2 text-xs text-zinc-400">{s.wear}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
