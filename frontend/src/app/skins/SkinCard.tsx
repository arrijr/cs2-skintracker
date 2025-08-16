"use client";

import Image from "next/image";
import Link from "next/link";

type Props = {
  /* Numeric skin id for the detail page link */
  id: number | null | undefined;
  name: string;
  imageUrl?: string | null;
  price?: number | null;
  /* Click on the floating + button */
  onAdd?: () => void;
  /* Optional: extra click handler when the card body is clicked */
  onClick?: () => void;
};

export default function SkinCard({
  id,
  name,
  imageUrl,
  price,
  onAdd,
  onClick,
}: Props) {
  // {/* Normalized values */}
  const canLink = typeof id === "number" && Number.isFinite(id);
  const href = canLink ? `/skins/${Number(id)}` : "#";

  // {/* Image fallback → public/images/placeholder-skin.png */}
  const img =
    imageUrl && imageUrl.trim().length > 0
      ? imageUrl
      : "/images/placeholder-skin.png";

  // {/* Price formatter ($ as requested) */}
  const priceLabel =
    typeof price === "number"
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(price)
      : "-";

  return (
    <div className="relative bg-gray-900 rounded-xl shadow p-3 flex flex-col items-center transition hover:scale-105">
      {/* Card Link */}
      <Link
        href={href}
        className="w-full flex flex-col items-center"
        onClick={(e) => {
          if (!canLink) {
            e.preventDefault();
            console.warn("[SkinCard] missing/invalid id for link:", id, name);
          }
          onClick?.();
        }}
      >
        {/* Product Image */}
        <Image
          src={img}
          alt={name}
          width={110}
          height={110}
          className="rounded mb-2 object-cover"
        />

        {/* Title */}
        <div className="font-semibold text-sm text-center">{name}</div>

        {/* Price */}
        <div className="text-xs text-gray-400 mt-1 mb-2">{priceLabel}</div>
      </Link>

      {/* Plus Button (Add) */}
      <button
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-lg hover:bg-emerald-700 transition"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation(); // don't trigger Link navigation
          onAdd?.();
        }}
        title="Add to portfolio"
        aria-label="Add to portfolio"
      >
        +
      </button>
    </div>
  );
}
