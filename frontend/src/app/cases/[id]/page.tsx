// frontend/src/app/cases/[id]/page.tsx — [Frontend]
// {/* Case Detail Page — list all skins in this case with basic filters */}

"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink, Package, BarChart3, DollarSign } from "lucide-react";
import { apiUrl, fetchJson } from "@/lib/api";
import { formatUSD } from "@/lib/num";

interface Case {
  id: number;
  name: string;
  imageUrl: string;
  weaponType: string;
  skinCount: number;
}

interface CaseSkin {
  id: number;
  name: string;
  wear: string;
  rarity: string;
  quality: string;
  isStattrak: boolean;
  isStar: boolean;
  priceAvg: number;
  priceMedian: number;
  priceLatest: number;
  imageUrl: string;
  weaponType: string;
  sold24h: number;
  offerVolume: number;
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  
  const [caseInfo, setCaseInfo] = useState<Case | null>(null);
  const [caseSkins, setCaseSkins] = useState<CaseSkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCaseInfo() {
      if (!caseId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Load case information
        const caseData = await fetchJson(apiUrl(`/api/v1/cases/${encodeURIComponent(caseId)}`));
        setCaseInfo(caseData);
        
        // Load case skins
        const skinsData = await fetchJson(apiUrl(`/api/v1/cases/${encodeURIComponent(caseId)}/skins`));
        setCaseSkins(skinsData.skins || []);
        
      } catch (err) {
        console.error("Failed to load case info:", err);
        setError("Failed to load case information");
      } finally {
        setLoading(false);
      }
    }
    
    loadCaseInfo();
  }, [caseId]);

  const handleBackToResults = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-32 mb-4" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !caseInfo) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Case Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {error || "The requested case could not be found."}
          </p>
          <Button onClick={handleBackToResults}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Calculate case statistics
  const totalValue = caseSkins.reduce((sum, skin) => {
    const price = skin.priceAvg || skin.priceMedian || skin.priceLatest || 0;
    return sum + price;
  }, 0);
  
  const avgPrice = caseSkins.length > 0 ? totalValue / caseSkins.length : 0;
  
  const rarityCounts = caseSkins.reduce((counts, skin) => {
    const rarity = skin.rarity || 'Unknown';
    counts[rarity] = (counts[rarity] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      {/* Case Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToResults}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to results
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Case Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted/20">
                <Image
                  src={caseInfo.imageUrl || "/images/placeholder-case.png"}
                  alt={caseInfo.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Package className="h-8 w-8" />
                  {caseInfo.name}
                </h1>
                <p className="text-muted-foreground">
                  {caseInfo.skinCount} skins in this case
                </p>
              </div>
            </div>

            {/* Case Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{caseSkins.length}</p>
                  <p className="text-sm text-muted-foreground">Total Skins</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{formatUSD(totalValue)}</p>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{formatUSD(avgPrice)}</p>
                  <p className="text-sm text-muted-foreground">Avg Price</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="h-6 w-6 mx-auto mb-2 bg-gradient-to-r from-red-500 to-purple-500 rounded"></div>
                  <p className="text-2xl font-bold">{Object.keys(rarityCounts).length}</p>
                  <p className="text-sm text-muted-foreground">Rarities</p>
                </CardContent>
              </Card>
            </div>

            {/* Rarity Breakdown */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Rarity Breakdown</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(rarityCounts).map(([rarity, count]) => (
                  <Badge 
                    key={rarity}
                    variant="outline"
                    className={`${
                      rarity === 'Covert' ? 'border-red-500 text-red-500' :
                      rarity === 'Classified' ? 'border-purple-500 text-purple-500' :
                      rarity === 'Restricted' ? 'border-pink-500 text-pink-500' :
                      rarity === 'Mil-Spec' ? 'border-blue-500 text-blue-500' :
                      'border-gray-500 text-gray-500'
                    }`}
                  >
                    {rarity}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a 
                  href={`https://steamcommunity.com/market/search?q=${encodeURIComponent(caseInfo.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open on Steam
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Skins Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">All Skins in Case</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {caseSkins.map((skin) => (
            <Link 
              key={skin.id} 
              href={`/skins/${skin.id}`}
              className="group"
            >
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 group-hover:scale-105 border-2 hover:border-primary/20">
                <CardContent className="p-3">
                  <div className="aspect-square relative mb-2 bg-muted/20 rounded-lg overflow-hidden">
                    <Image
                      src={skin.imageUrl || "/images/placeholder-skin.png"}
                      alt={skin.name}
                      fill
                      className="object-contain group-hover:scale-110 transition-transform duration-200"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    />
                    {/* Case Badge */}
                    <Badge 
                      variant="secondary" 
                      className="absolute top-1 left-1 text-xs px-1 py-0"
                    >
                      Case
                    </Badge>
                  </div>
                  <h3 className="font-medium text-xs truncate mb-1 group-hover:text-primary transition-colors">
                    {skin.name}
                  </h3>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-primary font-bold text-sm">
                        {formatUSD(skin.priceAvg || skin.priceMedian || skin.priceLatest)}
                      </p>
                      <div className="flex gap-1">
                        {skin.isStattrak && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">ST</Badge>
                        )}
                        {skin.isStar && (
                          <Badge variant="outline" className="text-xs px-1 py-0">★</Badge>
                        )}
                      </div>
                    </div>
                    {skin.wear && (
                      <p className="text-xs text-muted-foreground truncate">
                        {skin.wear}
                      </p>
                    )}
                    {skin.rarity && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-1 py-0 ${
                          skin.rarity === 'Covert' ? 'border-red-500 text-red-500' :
                          skin.rarity === 'Classified' ? 'border-purple-500 text-purple-500' :
                          skin.rarity === 'Restricted' ? 'border-pink-500 text-pink-500' :
                          skin.rarity === 'Mil-Spec' ? 'border-blue-500 text-blue-500' :
                          'border-gray-500 text-gray-500'
                        }`}
                      >
                        {skin.rarity}
                      </Badge>
                    )}
                    {(skin.sold24h > 0 || skin.offerVolume > 0) && (
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {skin.sold24h > 0 && <span>{skin.sold24h} sold</span>}
                        {skin.offerVolume > 0 && <span>{skin.offerVolume} offers</span>}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
