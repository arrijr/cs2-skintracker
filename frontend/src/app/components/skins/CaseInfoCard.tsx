// {/* Case Information Card */}
interface CaseInfo {
  name: string;
  price?: number;
  dropRate?: number;
  rarity?: string;
  imageUrl?: string;
  description?: string;
}

interface CaseInfoCardProps {
  caseInfo: CaseInfo;
}

export default function CaseInfoCard({ caseInfo }: CaseInfoCardProps) {
  if (!caseInfo) return null;

  return (
    <div className="w-full bg-neutral-800 rounded-xl shadow-md p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3 text-purple-400">📦 Case Information</h3>
      
      <div className="flex items-start space-x-4">
        {caseInfo.imageUrl && (
          <img 
            src={caseInfo.imageUrl} 
            alt={caseInfo.name}
            className="w-16 h-16 object-contain rounded bg-neutral-600 flex-shrink-0"
          />
        )}
        
        <div className="flex-1">
          <h4 className="font-semibold text-white mb-2">{caseInfo.name}</h4>
          
          {caseInfo.description && (
            <p className="text-gray-400 text-sm mb-3">{caseInfo.description}</p>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {caseInfo.price !== undefined && (
              <div>
                <div className="text-sm text-gray-400">Case Price</div>
                <div className="text-lg font-bold text-yellow-400">
                  ${caseInfo.price.toFixed(2)}
                </div>
              </div>
            )}
            
            {caseInfo.dropRate !== undefined && (
              <div>
                <div className="text-sm text-gray-400">Drop Rate</div>
                <div className="text-lg font-bold text-blue-400">
                  {caseInfo.dropRate.toFixed(2)}%
                </div>
              </div>
            )}
            
            {caseInfo.rarity && (
              <div className="col-span-2">
                <div className="text-sm text-gray-400">Rarity</div>
                <div className="text-md font-medium text-purple-400">
                  {caseInfo.rarity}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-500 text-center">
        This skin can be obtained from this case
      </div>
    </div>
  );
}
