"use client";
import Image from "next/image";

type Props = {
  open: boolean;
  onClose: () => void;
  skin: {
    id: number;
    name: string;
    imageUrl: string;
    price: number;
    marketHashName: string;
  } | null;
  onAdd: () => void;
};

export default function SkinDetailModal({ open, onClose, skin, onAdd }: Props) {
  if (!open || !skin) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-900 rounded-xl p-6 shadow-xl max-w-sm w-full relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center text-xl hover:bg-gray-600"
        >
          ×
        </button>
        <Image src={skin.imageUrl} alt={skin.name} width={180} height={180} className="rounded mx-auto mb-4" />
        <div className="text-lg font-bold text-center mb-2">{skin.name}</div>
        <div className="text-center text-gray-400 mb-4">{skin.marketHashName}</div>
        <div className="text-center font-semibold text-2xl mb-4">
          {skin.price.toLocaleString("en-US", { style: "currency", currency: "USD" })}
        </div>
        {/* Später Preischart hier */}
        <button
          onClick={onAdd}
          className="w-full py-2 mt-2 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
        >
          Zum Portfolio hinzufügen
        </button>
      </div>
    </div>
  );
}
