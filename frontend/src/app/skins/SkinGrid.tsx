"use client";
import { useState } from "react";
import SkinCard from "./SkinCard";
import SkinDetailModal from "./SkinDetailModal";
import { dummySkins } from "./dummySkins";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

type Props = {
  filter?: string | null;
};

export default function SkinGrid({ filter }: Props) {
  const { user } = useAuth();
  const router = useRouter();

  const [selected, setSelected] = useState<number | null>(null);

  function handleAdd(skin: typeof dummySkins[0]) {
    if (!user) {
      router.push("/login");
      return;
    }
    fetch("http://localhost:5000/api/v1/portfolio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({
        marketHashName: skin.marketHashName,
        amount: 1,
        buyPrice: skin.price,
        buyDate: new Date().toISOString().split("T")[0], // yyyy-mm-dd
      }),
    })
      .then(res => res.json())
      .then(() => {
        alert(`Skin "${skin.name}" wurde deinem Portfolio hinzugefügt!`);
      })
      .catch(() => {
        alert("Fehler beim Hinzufügen zum Portfolio!");
      });
  }

  const skins = !filter
    ? dummySkins
    : dummySkins.filter((skin) => skin.name === filter);

  const selectedSkin = skins.find((skin) => skin.id === selected) || null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 py-8">
        {skins.map((skin) => (
          <SkinCard
            key={skin.id}
            name={skin.name}
            imageUrl={skin.imageUrl}
            price={skin.price}
            onAdd={() => handleAdd(skin)}
            onClick={() => setSelected(skin.id)}
          />
        ))}
        {skins.length === 0 && (
          <div className="col-span-full text-center text-gray-400 mt-8">Kein Skin gefunden.</div>
        )}
      </div>
      <SkinDetailModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        skin={selectedSkin}
        onAdd={() => {
          if (selectedSkin) handleAdd(selectedSkin); // <-- hier!
        }}
      />
    </>
  );
}
