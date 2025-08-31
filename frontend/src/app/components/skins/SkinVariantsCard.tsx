// {/* Skin Variants Comparison Card */}
interface SkinVariant {
  id: number;
  name: string;
  wear: string;
  rarity: string;
  price: number;
  imageUrl?: string;
}

interface SkinVariantsCardProps {
  variants: SkinVariant[];
  currentSkinId: number;
}

export default function SkinVariantsCard({ variants, currentSkinId }: SkinVariantsCardProps) {
  if (!variants || variants.length === 0) return null;

  // Sort variants by price (lowest to highest)
  const sortedVariants = [...variants].sort((a, b) => a.price - b.price);

  return (
    <div className="w-full bg-neutral-800 rounded-xl shadow-md p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3 text-blue-400">🔄 Skin Variants</h3>
      
      <div className="space-y-3">
        {sortedVariants.map((variant) => (
          <div 
            key={variant.id}
            className={`flex items-center justify-between p-3 rounded-lg border-2 ${
              variant.id === currentSkinId 
                ? 'border-emerald-500 bg-emerald-900/20' 
                : 'border-neutral-600 bg-neutral-700/50'
            }`}
          >
            <div className="flex items-center space-x-3">
              {variant.imageUrl && (
                <img 
                  src={variant.imageUrl} 
                  alt={variant.name}
                  className="w-12 h-12 object-contain rounded bg-neutral-600"
                />
              )}
              <div>
                <div className="font-medium text-white">{variant.wear}</div>
                <div className="text-sm text-gray-400">{variant.rarity}</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-400">
                ${variant.price.toFixed(2)}
              </div>
              {variant.id === currentSkinId && (
                <div className="text-xs text-emerald-400 font-medium">Current</div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-sm text-gray-400 text-center">
        {variants.length} variant{variants.length !== 1 ? 's' : ''} available
      </div>
    </div>
  );
}
