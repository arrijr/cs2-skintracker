// /frontend/src/app/cases/page.tsx — [Frontend]
// {/* Case Overview Page - Comprehensive case statistics and market data */}
"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign,
  BarChart3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { caseToSlug } from "@/lib/strings";
import Breadcrumbs from "@/components/Breadcrumbs";
import { AppShell } from "@/components/layout/AppShell";

interface Case {
  id: number;
  name: string;
  imageUrl?: string;
  price: number;
  marketCap: number;
  remaining: number;
  dropped: number;
  unboxed: number;
  priceChange24h: number;
  priceChange7d: number;
  isDiscontinued: boolean;
  releaseDate: string;
  lastUpdated: string;
  timeToExtinction?: number;
}

type SortField = 'name' | 'price' | 'marketCap' | 'remaining' | 'priceChange24h' | 'timeToExtinction';
type SortDirection = 'asc' | 'desc';

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('timeToExtinction');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterDiscontinued, setFilterDiscontinued] = useState(true);
  const [priceRange, setPriceRange] = useState<{min: number, max: number}>({min: 0, max: 1000});
  const [extinctionRange, setExtinctionRange] = useState<{min: number, max: number}>({min: 0, max: 2000});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [userCasePortfolio, setUserCasePortfolio] = useState<number[]>([]);

  // Fetch cases data
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const data = await apiFetch('/api/v1/cases');
        setCases(data.cases || []);
      } catch (err) {
        setError('Failed to load cases data');
        console.error('Error fetching cases:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  // Fetch user's case portfolio
  useEffect(() => {
    const fetchUserPortfolio = async () => {
      try {
        const data = await apiFetch('/api/v1/case-portfolio');
        const caseIds = data.portfolio.map((entry: any) => entry.case.id);
        setUserCasePortfolio(caseIds);
      } catch (err) {
        // User might not be logged in, ignore error
        console.log('User not authenticated or no case portfolio');
      }
    };

    fetchUserPortfolio();
  }, []);

  // Filter and sort cases
  const filteredAndSortedCases = useMemo(() => {
    let filtered = cases.filter(caseItem => {
      const matchesSearch = caseItem.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDiscontinued = true; // Always show all cases for now
      const matchesPriceRange = caseItem.price ? 
        caseItem.price >= priceRange.min && caseItem.price <= priceRange.max : true;
      const matchesExtinctionRange = caseItem.timeToExtinction ? 
        caseItem.timeToExtinction >= extinctionRange.min && caseItem.timeToExtinction <= extinctionRange.max : true;
      
      return matchesSearch && matchesDiscontinued && matchesPriceRange && matchesExtinctionRange;
    });

    // Sort cases
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'name') {
        aValue = (aValue ?? '').toLowerCase();
        bValue = (bValue ?? '').toLowerCase();
      } else {
        // Numeric fields — push undefined/null to the end regardless of direction.
        // `timeToExtinction` in particular is optional on the Case type.
        aValue = aValue ?? Infinity;
        bValue = bValue ?? Infinity;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [cases, searchTerm, sortField, sortDirection, filterDiscontinued, priceRange, extinctionRange]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };


  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="w-3 h-3" />;
    if (change < 0) return <ArrowDown className="w-3 h-3" />;
    return null;
  };

  if (loading) {
    return (
      <AppShell eyebrow="Catalog" title="CS2 Cases" description="Loading…" maxWidth="7xl">
        <div className="space-y-4">
          <div className="h-12 rounded-lg bg-slate-800/40 border border-slate-700/50 animate-pulse" />
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-800/40 border border-slate-700/50 animate-pulse" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell eyebrow="Catalog" title="CS2 Cases" maxWidth="7xl">
        <Card className="border-red-500/50">
          <CardContent className="p-6 text-center">
            <div className="text-red-400 mb-2">Error loading cases</div>
            <div className="text-gray-400">{error}</div>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow="Catalog"
      title="CS2 Cases"
      description="Comprehensive case statistics and market data."
      maxWidth="7xl"
    >
      <div>
        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search cases..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Button
                  variant={filterDiscontinued ? "default" : "outline"}
                  onClick={() => setFilterDiscontinued(!filterDiscontinued)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  All Cases
                </Button>
                <Button
                  variant={showAdvancedFilters ? "default" : "outline"}
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Advanced
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Price Range (USD)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange(prev => ({...prev, min: Number(e.target.value) || 0}))}
                        className="w-24"
                      />
                      <span className="text-gray-400 self-center">to</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange(prev => ({...prev, max: Number(e.target.value) || 1000}))}
                        className="w-24"
                      />
                    </div>
                  </div>

                  {/* Extinction Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Time to Extinction (months)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={extinctionRange.min}
                        onChange={(e) => setExtinctionRange(prev => ({...prev, min: Number(e.target.value) || 0}))}
                        className="w-24"
                      />
                      <span className="text-gray-400 self-center">to</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={extinctionRange.max}
                        onChange={(e) => setExtinctionRange(prev => ({...prev, max: Number(e.target.value) || 200}))}
                        className="w-24"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cases Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Cases Overview ({filteredAndSortedCases.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th 
                      className="text-left py-3 px-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Case
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                      onClick={() => handleSort('remaining')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Remaining
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="text-right py-3 px-4">Dropped</th>
                    <th className="text-right py-3 px-4">Unboxed</th>
                    <th 
                      className="text-right py-3 px-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                      onClick={() => handleSort('price')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Price (USD)
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                      onClick={() => handleSort('marketCap')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Market Cap (USD)
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                      onClick={() => handleSort('priceChange24h')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        24h Change
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedCases.map((caseItem) => (
                    <tr 
                      key={caseItem.id} 
                      className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4">
                        <Link href={`/cases/${caseToSlug(caseItem.name)}`} className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                            {caseItem.imageUrl ? (
                              <img 
                                src={caseItem.imageUrl} 
                                alt={caseItem.name}
                                className="w-6 h-6 object-contain"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-white">{caseItem.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              {caseItem.isDiscontinued && (
                                <Badge variant="destructive" className="text-xs">
                                  Discontinued
                                </Badge>
                              )}
                              {userCasePortfolio.includes(caseItem.id) && (
                                <Badge variant="default" className="text-xs bg-green-600">
                                  In Portfolio
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="text-right py-4 px-4">
                        <span className="text-sm font-mono">
                          {formatNumber(caseItem.remaining)}
                        </span>
                      </td>
                      <td className="text-right py-4 px-4">
                        <span className="text-sm font-mono text-gray-400">
                          {formatNumber(caseItem.dropped)}
                        </span>
                      </td>
                      <td className="text-right py-4 px-4">
                        <span className="text-sm font-mono text-gray-400">
                          {formatNumber(caseItem.unboxed)}
                        </span>
                      </td>
                      <td className="text-right py-4 px-4">
                        <span className="font-medium">
                          {formatCurrency(caseItem.price)}
                        </span>
                      </td>
                      <td className="text-right py-4 px-4">
                        <span className="font-medium">
                          {formatCurrency(caseItem.marketCap)}
                        </span>
                      </td>
                      <td className="text-right py-4 px-4">
                        <div className={`flex items-center justify-end gap-1 ${getPriceChangeColor(caseItem.priceChange24h)}`}>
                          {getPriceChangeIcon(caseItem.priceChange24h)}
                          <span className="text-sm font-medium">
                            {caseItem.priceChange24h > 0 ? '+' : ''}{caseItem.priceChange24h.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAndSortedCases.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No cases found</h3>
                <p className="text-gray-400">
                  {searchTerm ? 'Try adjusting your search terms' : 'No cases available at the moment'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}