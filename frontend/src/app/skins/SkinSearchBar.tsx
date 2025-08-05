import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import axios from "axios";

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

  // Fetch Skins, wenn query mindestens 2 Zeichen
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    let cancel = false;
    axios
      .get(`http://localhost:5000/api/v1/skins/search?query=${encodeURIComponent(query)}`)
      .then((res) => {
        if (!cancel) setResults(res.data || []);
      });
    return () => {
      cancel = true;
    };
  }, [query]);

  // Skin auswählen → Callback an Parent
  function handleSelect(skin: Skin) {
    setQuery(skin.name);
    setShow(false);
    setResults([]);
    onSelect(skin);
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Skin-Sucheingabe */}
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
      />

      {/* Dropdown-Ergebnisse */}
      {show && results.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 bg-zinc-900 border border-zinc-800 rounded-xl mt-1 max-h-60 overflow-y-auto shadow-lg">
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