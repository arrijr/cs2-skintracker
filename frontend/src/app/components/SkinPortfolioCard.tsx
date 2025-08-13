// /frontend/src/app/portfolio/SkinPortfolioCard.tsx
import Image from "next/image";
import PurchaseAccordion from "./PurchaseAccordion";

type Purchase = {
  id: number;
  amount: number;
  buyPrice: number;
  buyDate: string;
};

type Skin = {
  name: string;
  marketHashName?: string;
  market_hash_name?: string;
  imageUrl?: string;
  image_url?: string;
  itemimage?: string;
  itemImage?: string;
};

type SkinPortfolioItem = {
  skin: Skin;
  amount: number;
  avgPrice: number;
  performance: number;
  purchases: Purchase[];
};

export default function SkinPortfolioCard({ item }: { item: SkinPortfolioItem }) {
  // {/* Image fallback: itemimage -> image_url -> imageUrl -> placeholder */}
  const img =
    item.skin.itemimage ||
    item.skin.itemImage ||
    item.skin.image_url ||
    item.skin.imageUrl ||
    "/placeholder-skin.png";

  const mhn = item.skin.market_hash_name || item.skin.marketHashName;

  return (
    <div className="bg-zinc-900 rounded-xl shadow p-4 flex flex-col">
      {/* Skin Image */}
      <div className="relative w-28 h-28 mx-auto mb-2 overflow-hidden rounded-xl">
        <Image src={img} alt={item.skin.name} fill className="object-cover" />
      </div>

      {/* Title */}
      <div className="text-lg font-bold text-center mb-1">{item.skin.name}</div>
      <div className="text-center text-sm text-zinc-400 mb-2">{mhn}</div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm mb-2">
        <span>Qty: <b>{item.amount}</b></span>
        <span>Ø Buy: <b>{item.avgPrice.toFixed(2)}$</b></span>
        <span className={item.performance > 0 ? "text-emerald-400" : "text-red-400"}>
          {item.performance > 0 ? "+" : ""}{item.performance.toFixed(1)}%
        </span>
      </div>

      {/* Purchases */}
      <PurchaseAccordion purchases={item.purchases} />
    </div>
  );
}
