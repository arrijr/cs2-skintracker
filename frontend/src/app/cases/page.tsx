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
  Clock, 
  DollarSign,
  BarChart3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";

interface Case {
  id: number;
  name: string;
  imageUrl?: string;
  price: number;
  marketCap: number;
  remaining: number;
  dropped: number;
  unboxed: number;
  timeToExtinction: number; // in months
  priceChange24h: number;
  priceChange7d: number;
  isDiscontinued: boolean;
  releaseDate: string;
  lastUpdated: string;
}

type SortField = 'name' | 'price' | 'marketCap' | 'timeToExtinction' | 'remaining' | 'priceChange24h';
type SortDirection = 'asc' | 'desc';

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('timeToExtinction');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterDiscontinued, setFilterDiscontinued] = useState(false);

  // Fetch cases data
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const data = await apiFetch('/api/cases');
        setCases(data);
      } catch (err) {
        setError('Failed to load cases data');
        console.error('Error fetching cases:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  // Filter and sort cases
  const filteredAndSortedCases = useMemo(() => {
    let filtered = cases.filter(caseItem => {
      const matchesSearch = caseItem.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDiscontinued = filterDiscontinued ? caseItem.isDiscontinued : !caseItem.isDiscontinued;
      return matchesSearch && matchesDiscontinued;
    });

    // Sort cases
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'name') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [cases, searchTerm, sortField, sortDirection, filterDiscontinued]);

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

  const formatTimeToExtinction = (months: number) => {
    if (months < 1) {
      return '< 1 mo';
    } else if (months < 12) {
      return `~${months.toFixed(1)} mo`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      return `~${years}y ${remainingMonths.toFixed(0)}mo`;
    }
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
      <div className="dashboard-bg text-white p-2 sm:p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-gray-700 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-bg text-white p-2 sm:p-4">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-500/50">
            <CardContent className="p-6 text-center">
              <div className="text-red-400 mb-2">Error loading cases</div>
              <div className="text-gray-400">{error}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-bg text-white p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: "Cases" }
          ]} 
          className="mb-6"
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">CS2 Cases</h1>
          <p className="text-lg text-gray-400">
            Comprehensive case statistics and market data
          </p>
        </div>

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
                  {filterDiscontinued ? 'Discontinued' : 'Active'}
                </Button>
              </div>
            </div>
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
                      onClick={() => handleSort('timeToExtinction')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Time to Extinction
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
                        <Link href={`/cases/${caseItem.id}`} className="flex items-center gap-3">
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
                            {caseItem.isDiscontinued && (
                              <Badge variant="destructive" className="text-xs">
                                Discontinued
                              </Badge>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="text-right py-4 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">
                            {formatTimeToExtinction(caseItem.timeToExtinction)}
                          </span>
                        </div>
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
    </div>
  );
}