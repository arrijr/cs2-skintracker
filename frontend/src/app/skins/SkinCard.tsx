"use client";
import Image from "next/image";

type Props = {
  name: string;
  imageUrl: string;
  price: number;
  onAdd: () => void;
  onClick?: () => void;
};

export default function SkinCard({ name, imageUrl, price, onAdd, onClick }: Props) {
  return (
    <div
      className="relative bg-gray-900 rounded-xl shadow p-3 flex flex-col items-center transition hover:scale-105 cursor-pointer"
      onClick={onClick}
    >
      <Image src={imageUrl} alt={name} width={110} height={110} className="rounded mb-2" />
      <div className="font-semibold text-sm text-center">{name}</div>
      <div className="text-xs text-gray-400 mt-1 mb-2">
        {price.toLocaleString("en-US", { style: "currency", currency: "USD" })}
      </div>
      {/* Plus-Button oben rechts */}
      <button
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-lg hover:bg-emerald-700 transition"
        onClick={e => {
          e.stopPropagation();
          onAdd();
        }}
        title="Zum Portfolio hinzufügen"
      >
        +
      </button>
    </div>
  );
}