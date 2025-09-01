// {/* Case Information Card */}
import { formatUSD, safeToFixed } from "@/lib/num";

interface CaseSkin {
  id: number;
  name: string;
  wear: string | null;
  rarity: string | null;
  quality: string | null;
  isStattrak: boolean | null;
  priceLatest: number | string | null;
  imageUrl: string | null;
}

interface CaseInfo {
  caseName: string;
  skins: CaseSkin[];
  totalSkins: number;
}

interface CaseInfoCardProps {
  caseInfo: CaseInfo;
}

export default function CaseInfoCard({ caseInfo }: CaseInfoCardProps) {
  if (!caseInfo) return null;

  return (
    <div className="w-full bg-neutral-800 rounded-xl shadow-md p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3 text-purple-400">📦 Case Information</h3>
      
      <div className="mb-3">
        <h4 className="font-semibold text-white mb-2">{caseInfo.caseName}</h4>
        <p className="text-gray-400 text-sm">Contains {caseInfo.totalSkins} skins</p>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {caseInfo.skins.map((skin) => (
          <div key={skin.id} className="flex items-center justify-between p-2 rounded bg-neutral-700/50">
            <div className="flex items-center space-x-3">
              {skin.imageUrl && (
                <img 
                  src={skin.imageUrl} 
                  alt={skin.name}
                  className="w-8 h-8 object-contain rounded bg-neutral-600"
                />
              )}
              <div>
                <div className="font-medium text-white text-sm">{skin.name}</div>
                <div className="text-xs text-gray-400">
                  {skin.wear || "Unknown"} • {skin.rarity || "Unknown"}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-bold text-emerald-400">
                {formatUSD(skin.priceLatest)}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-gray-500 text-center">
        All skins available in this case
      </div>
    </div>
  );
}
