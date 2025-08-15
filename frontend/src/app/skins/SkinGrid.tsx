"use client";

import { useState } from "react";
import SkinCard from "./SkinCard";
import SkinDetailModal from "./SkinDetailModal";
import { dummySkins } from "./dummySkins";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/http";

type Props = { filter?: string | null };

export default function SkinGrid({ filter }: Props) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);

  // {/* Add to Portfolio from grid */}
  async function handleAdd(skin: (typeof dummySkins)[number]) {
    if (!user || !token) {
      router.push("/login");
      return;
    }
    try {
      await apiFetch(`/api/v1/portfolio`, {
        method: "POST",
        body: JSON.stringify({
          skinId: skin.id,
          amount: 1,
          buyPrice: skin.price,
          buyDate: new Date().toISOString().slice(0, 10),
        }),
      });
      alert(`Skin "${skin.name}" added to your portfolio!`);
    } catch (e) {
      console.error("[SkinGrid] add to portfolio failed:", e);
      alert("Failed to add to portfolio!");
    }
  }

  // {/* Filtered list */}
  const skins = !filter
    ? dummySkins
    : dummySkins.filter((s) => s.name === filter);

  const selectedSkin = skins.find((s) => s.id === selected) || null;

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 py-8">
        {skins.map((skin) => (
          <SkinCard
            key={skin.id}
            id={skin.id}                           {/* <-- wichtig: ID für Detail-Link */}
            name={skin.name}
            imageUrl={skin.imageUrl}
            price={skin.price}
            onAdd={() => handleAdd(skin)}
            // Hinweis: Wenn deine SkinCard per <Link> navigiert,
            // öffnet onClick zusätzlich dein Modal. Wenn du NUR Modal willst,
            // erweitere SkinCard um eine "disableLink" Prop und verhindere dort die Navigation.
            onClick={() => setSelected(skin.id)}
          />
        ))}

        {skins.length === 0 && (
          <div className="col-span-full text-center text-gray-400 mt-8">
            No skins found.
          </div>
        )}
      </div>

      {/* Modal */}
      <SkinDetailModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        skin={selectedSkin}
        onAdd={() => {
          if (selectedSkin) handleAdd(selectedSkin);
        }}
      />
    </>
  );
}
