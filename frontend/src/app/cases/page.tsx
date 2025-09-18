// frontend/src/app/cases/page.tsx — [Frontend]
// {/* Cases Overview Page - Show all available cases/collections */}
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, BarChart3, DollarSign } from "lucide-react";
import { apiUrl, fetchJson } from "@/lib/api";
import { formatUSD } from "@/lib/num";

interface Case {
  id: string;
  name: string;
  originalWeaponType: string;
  skinCount: number;
}

interface CasesResponse {
  cases: Case[];
  total: number;
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCases() {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchJson(apiUrl("/api/v1/cases"));
        setCases(data.cases || []);
      } catch (err) {
        console.error("Failed to load cases:", err);
        setError("Failed to load cases");
      } finally {
        setLoading(false);
      }
    }
    
    loadCases();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Cases</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">CS2 Cases & Collections</h1>
        <p className="text-muted-foreground">
          Explore all available cases and collections in Counter-Strike 2
        </p>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((caseItem) => (
          <Link 
            key={caseItem.id} 
            href={`/cases/${encodeURIComponent(caseItem.id)}`}
            className="group"
          >
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 group-hover:scale-105 border-2 hover:border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📦</span>
                  <div className="flex-1">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {caseItem.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {caseItem.originalWeaponType}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {caseItem.skinCount} skins
                    </span>
                  </div>
                  <Badge variant="secondary">
                    View Collection
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {cases.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Cases Found</h3>
          <p className="text-muted-foreground">
            No cases or collections are currently available.
          </p>
        </div>
      )}
    </div>
  );
}
