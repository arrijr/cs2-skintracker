import PurchaseAccordion from "./PurchaseAccordion";

type Purchase = {
  id: number;
  amount: number;
  buyPrice: number;
  buyDate: string;
};

type SkinPortfolioItem = {
  skin: {
    imageUrl: string;
    name: string;
    marketHashName: string;
  };
  amount: number;
  avgPrice: number;
  performance: number;
  purchases: Purchase[];
};

export default function SkinPortfolioCard({ item }: { item: SkinPortfolioItem }) {
  // Kompakte Werteanzeige + Kaufhistorie-Accordion
  return (
    <div className="bg-zinc-900 rounded-xl shadow p-4 flex flex-col">
      <img
        src={item.skin.imageUrl}
        alt={item.skin.name}
        className="w-28 mx-auto mb-2 rounded-xl"
      />
      <div className="text-lg font-bold text-center mb-1">
        {item.skin.name}
      </div>
      <div className="text-center text-sm text-zinc-400 mb-2">
        {item.skin.marketHashName}
      </div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span>Qty: <b>{item.amount}</b></span>
        <span>Ø Buy: <b>{item.avgPrice.toFixed(2)}€</b></span>
        <span className={item.performance > 0 ? "text-emerald-400" : "text-red-400"}>
          {item.performance > 0 ? "+" : ""}{item.performance.toFixed(1)}%
        </span>
      </div>
      {/* Accordion */}
      <PurchaseAccordion purchases={item.purchases} />
    </div>
  );
}
