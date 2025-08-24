// frontend/src/app/skins/page.tsx — [Frontend]
// {/* Modern Skin Browse Page with Filters & Pagination */}
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getFilterOptions, browseSkins, getSkinCategories } from "@/lib/api";

// {/* Types */}
type Skin = {
  id: number;
  name: string;
  marketHashName: string;
  imageUrl?: string;
  weaponType?: string;
  wear?: string;
  rarity?: string;
  quality?: string;
  isStattrak?: boolean;
  isStar?: boolean;
  priceMedian?: number;
  priceAvg?: number;
};

interface FilterOptions {
  wears: string[];
  rarities: string[];
  qualities: string[];
  categories: Record<string, { count: number; weaponTypes: string[] }>;
}

type Filters = {
  search: string;
  minPrice: string;
  maxPrice: string;
  wear: string;
  rarity: string;
  quality: string;
  isStattrak: boolean;
  isStar: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  category?: string;
};

// Standard CS2 categories like skinbid.com
const CS2_CATEGORIES = {
  knives: { name: "Knives", color: "bg-red-500" },
  gloves: { name: "Gloves", color: "bg-orange-500" },
  pistols: { name: "Pistols", color: "bg-yellow-500" },
  smgs: { name: "SMGs", color: "bg-green-500" },
  rifles: { name: "Rifles", color: "bg-blue-500" },
  shotguns: { name: "Shotguns", color: "bg-purple-500" },
  machineGuns: { name: "Machine Guns", color: "bg-pink-500" },
  stickers: { name: "Stickers", color: "bg-indigo-500" },
  agents: { name: "Agents", color: "bg-teal-500" },
  cases: { name: "Cases", color: "bg-gray-500" },
  charms: { name: "Charms", color: "bg-amber-500" }
};

const RARITY_COLORS = {
  'Consumer Grade': 'text-gray-400',
  'Industrial Grade': 'text-blue-400',
  'Mil-Spec': 'text-blue-500',
  'Restricted': 'text-purple-400',
  'Classified': 'text-pink-400',
  'Covert': 'text-red-400',
  'Contraband': 'text-yellow-400',
};

export default function SkinsPage() {
  const [skins, setSkins] = useState<Skin[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    wears: [],
    rarities: [],
    qualities: [],
    categories: {}
  });
  const [filters, setFilters] = useState<Filters>({
    search: "",
    minPrice: "",
    maxPrice: "",
    wear: "",
    rarity: "",
    quality: "",
    isStattrak: false,
    isStar: false,
    sortBy: "name",
    sortOrder: "asc",
    category: undefined
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  // {/* Load filter options on mount */}
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [filtersResponse, categoriesResponse] = await Promise.all([
          getFilterOptions(),
          getSkinCategories()
        ]);
        
        if (filtersResponse.ok) {
          setFilterOptions(prev => ({
            ...prev,
            wears: filtersResponse.wears || [],
            rarities: filtersResponse.rarities || [],
            qualities: filtersResponse.qualities || []
          }));
        }
        
        if (categoriesResponse.ok) {
          setFilterOptions(prev => ({
            ...prev,
            categories: categoriesResponse.categories || {}
          }));
        }
      } catch (error) {
        console.error("Failed to load filter options:", error);
      }
    };

    loadFilterOptions();
  }, []);

  // {/* Load skins when filters change */}
  useEffect(() => {
    const loadSkins = async () => {
      try {
        setLoading(true);
        
        // Convert string filters to proper types for API
        const apiFilters = {
          page: pagination.page,
          limit: pagination.limit,
          search: filters.search || undefined,
          minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
          maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
          wear: filters.wear || undefined,
          rarity: filters.rarity || undefined,
          quality: filters.quality || undefined,
          isStattrak: filters.isStattrak || undefined,
          isStar: filters.isStar || undefined,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          category: filters.category
        };
        
        const response = await browseSkins(apiFilters);
        
        if (response.ok) {
          setSkins(response.skins || []);
          setPagination(prev => ({
            ...prev,
            ...response.pagination,
          }));
          console.log(`[DEBUG] Loaded ${response.skins?.length || 0} skins for filters:`, apiFilters);
        } else {
          console.error("Failed to load skins:", response.error);
        }
      } catch (error) {
        console.error("Error loading skins:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSkins();
  }, [filters, pagination.page]);

  function updateFilters(newFilters: Partial<Filters>) {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
  }

  function clearFilters() {
    setFilters({
      search: "",
      minPrice: "",
      maxPrice: "",
      wear: "",
      rarity: "",
      quality: "",
      isStattrak: false,
      isStar: false,
      sortBy: "name",
      sortOrder: "asc",
      category: undefined
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }

  function formatPrice(price?: number) {
    return price ? `$${price.toFixed(2)}` : '—';
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4 text-center">CS2 Skins Browse</h1>
        
        {/* Weapon Category Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {Object.entries(CS2_CATEGORIES).map(([key, category]) => {
              const isActive = filters.category === key;
              
              return (
                <button
                  key={key}
                  onClick={() => updateFilters({ category: isActive ? undefined : key })}
                  className={`px-4 py-2 rounded-lg transition-all font-medium ${
                    isActive 
                      ? `${category.color} text-white shadow-lg` 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <div className={`w-80 bg-neutral-900 rounded-xl p-6 h-fit ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Clear All
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value || undefined })}
              placeholder="Search skins..."
              className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Price Range */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Price Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={filters.minPrice || ''}
                onChange={(e) => updateFilters({ minPrice: e.target.value || undefined })}
                placeholder="Min $"
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 focus:border-blue-500 focus:outline-none"
              />
              <input
                type="number"
                value={filters.maxPrice || ''}
                onChange={(e) => updateFilters({ maxPrice: e.target.value || undefined })}
                placeholder="Max $"
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Wear */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Wear</label>
            <select
              value={filters.wear || ''}
              onChange={(e) => updateFilters({ wear: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Wear</option>
              {filterOptions.wears.map(wear => (
                <option key={wear} value={wear}>{wear}</option>
              ))}
            </select>
          </div>

          {/* Rarity */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Rarity</label>
            <select
              value={filters.rarity || ''}
              onChange={(e) => updateFilters({ rarity: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Rarities</option>
              {filterOptions.rarities.map(rarity => (
                <option key={rarity} value={rarity}>{rarity}</option>
              ))}
            </select>
          </div>

          {/* Quality */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Quality</label>
            <select
              value={filters.quality || ''}
              onChange={(e) => updateFilters({ quality: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Qualities</option>
              {filterOptions.qualities.map(quality => (
                <option key={quality} value={quality}>{quality}</option>
              ))}
            </select>
          </div>

          {/* Special */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Special</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.isStattrak === true}
                  onChange={(e) => updateFilters({ isStattrak: e.target.checked ? true : undefined })}
                  className="mr-2 rounded"
                />
                StatTrak™
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.isStar === true}
                  onChange={(e) => updateFilters({ isStar: e.target.checked ? true : undefined })}
                  className="mr-2 rounded"
                />
                ★ Special (Knives/Gloves)
              </label>
            </div>
          </div>

          {/* Sort */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={`${filters.sortBy}_${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('_');
                updateFilters({ sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
              }}
              className="w-full px-3 py-2 bg-neutral-800 rounded-lg border border-neutral-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="price_desc">Price High-Low</option>
              <option value="price_asc">Price Low-High</option>
              <option value="rarity_asc">Rarity Low-High</option>
              <option value="rarity_desc">Rarity High-Low</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Mobile Filter Toggle & Results Info */}
          <div className="flex justify-between items-center mb-4 lg:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Filters {showFilters ? '✕' : '☰'}
            </button>
          </div>

          {/* Results Info */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-neutral-400">
              {loading ? 'Loading...' : `${pagination.total} skins found`}
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-20">
              <div className="text-xl text-neutral-400">Loading skins...</div>
            </div>
          )}

          {/* No Results */}
          {!loading && skins.length === 0 && (
            <div className="text-center py-20">
              <div className="text-xl text-neutral-400 mb-4">No skins found</div>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Skins Grid */}
          {!loading && skins.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {skins.map((skin) => {
                  const img = skin.imageUrl || "/images/placeholder-skin.png";
                  const price = skin.priceMedian || skin.priceAvg;
                  const rarityColor = RARITY_COLORS[skin.rarity as keyof typeof RARITY_COLORS] || 'text-gray-400';
                  
                  return (
                    <Link
                      href={`/skins/${skin.id}`}
                      key={skin.id}
                      className="bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-all duration-200 hover:scale-105 group"
                    >
                      <div className="p-4">
                        {/* Image */}
                        <div className="relative mb-3">
                          <Image
                            src={img}
                            alt={skin.name}
                            width={120}
                            height={120}
                            className="w-full h-24 object-contain rounded"
                          />
                          {skin.isStattrak && (
                            <div className="absolute top-1 right-1 bg-orange-600 text-xs px-1 py-0.5 rounded">
                              ST™
                            </div>
                          )}
                          {skin.isStar && (
                            <div className="absolute top-1 left-1 text-yellow-400">
                              ★
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="space-y-1">
                          <h3 className="font-medium text-sm leading-tight group-hover:text-blue-400 transition-colors">
                            {skin.name}
                          </h3>
                          
                          {skin.rarity && (
                            <p className={`text-xs ${rarityColor}`}>
                              {skin.rarity}
                            </p>
                          )}
                          
                          {skin.wear && (
                            <p className="text-xs text-neutral-500">
                              {skin.wear}
                            </p>
                          )}
                          
                          <p className="text-sm font-semibold text-green-400">
                            {formatPrice(price)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 bg-neutral-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700"
                  >
                    ←
                  </button>
                  
                  <span className="text-sm text-neutral-400">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-2 bg-neutral-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700"
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}