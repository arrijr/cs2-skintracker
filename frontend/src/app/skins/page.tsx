"use client";
import SkinGrid from "./SkinGrid";
import SkinSearchBar from "./SkinSearchBar";
import { useState } from "react";
import { getAllSkins } from "../api/skins";
import Link from "next/link";
type Skin = {
  id: number;
  name: string;
  imageUrl: string;
  // Weitere Felder je nach DB möglich
};

export default function SkinsPage() {
  const [skins, setSkins] = useState<Skin[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllSkins()
      .then(setSkins)
      .finally(() => setLoading(false));
  }, []);

  const filteredSkins = filter
    ? skins.filter(skin =>
        skin.name.toLowerCase().includes(filter.toLowerCase())
      )
    : skins;

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6 text-white">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">
        CS2 Skins – Browse & Discover
      </h1>
      <div className="max-w-6xl mx-auto">
        <SkinSearchBar onSelect={setFilter} />
        {loading ? (
          <div className="py-10 text-center">Loading skins...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 py-4">
            {filteredSkins.map((skin) => (
              <Link
                href={`/skins/${skin.id}`}
                key={skin.id}
                className="bg-neutral-900 rounded-xl shadow-md hover:bg-neutral-800 transition flex flex-col items-center p-2 sm:p-3"
              >
                <img
                  src={skin.imageUrl}
                  alt={skin.name}
                  className="mb-2 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain rounded"
                />
                <div className="font-semibold text-center">{skin.name}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}