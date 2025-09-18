// frontend/src/components/CaseSection.tsx — [Frontend]
// {/* Case Section Component - shows the case of a skin + grid of all skins from that case */}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Package } from "lucide-react";
import { apiUrl, fetchJson } from "@/lib/api";
import { formatUSD } from "@/lib/num";

interface Case {
  id: number;
  name: string;
  imageUrl: string;
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

interface CaseSectionProps {
  skinId: number;
}

export function CaseSection({ skinId }: CaseSectionProps) {
  const [caseInfo, setCaseInfo] = useState<Case | null>(null);
  const [caseSkins, setCaseSkins] = useState<CaseSkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCaseInfo() {
      if (!skinId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // First, get the case for this skin
        const caseResponse = await fetchJson(apiUrl(`/api/v1/skins/${skinId}/case-info`));
        
        if (!caseResponse.case) {
          // No case found for this skin
          setCaseInfo(null);
          setCaseSkins([]);
          return;
        }
        
        setCaseInfo(caseResponse.case);
        
        // Then, get all skins from this case
        const skinsResponse = await fetchJson(apiUrl(`/api/v1/cases/${encodeURIComponent(caseResponse.case.name)}/skins`));
        setCaseSkins(skinsResponse.skins || []);
        
      } catch (err) {
        console.error("Failed to load case info:", err);
        setError("Failed to load case information");
      } finally {
        setLoading(false);
      }
    }
    
    loadCaseInfo();
  }, [skinId]);

  if (loading) {
    return (
      <div className="mb-8">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !caseInfo) {
    return null; // Don't render anything if no case or error
  }

  return (
    <div className="mb-8">
      {/* Case Section Card — shows case info and link */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            {/* Case Icon and Name */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted/30 shadow-lg">
                <Image
                  src={caseInfo.imageUrl || "/images/placeholder-case.png"}
                  alt={caseInfo.name}
                  fill
                  className="object-contain p-2"
                />
              </div>
              <div>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <span className="text-3xl">📦</span>
                  {caseInfo.name}
                </CardTitle>
                {caseInfo.skinCount > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-sm font-medium">
                      {caseInfo.skinCount} skins
                    </Badge>
                    <span className="text-sm text-muted-foreground">in this case</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="default" size="sm" asChild className="shadow-md">
                <Link href={`/cases/${encodeURIComponent(caseInfo.name)}`}>
                  View Case
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="shadow-md">
                <a 
                  href={`https://steamcommunity.com/market/search?q=${encodeURIComponent(caseInfo.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Steam
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Case Skins Grid — all skins contained in this case */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {caseSkins.slice(0, 12).map((skin) => (
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
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          {/* Case Section States: loading / empty / error */}
          {caseSkins.length > 12 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Showing 12 of {caseSkins.length} skins in this case
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
