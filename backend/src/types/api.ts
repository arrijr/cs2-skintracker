// Backend API Response Types
// Diese Datei definiert die exakten API Response Formate

export interface SkinsApiResponse {
  items: Skin[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Skin {
  id: number;
  name: string;
  marketHashName: string;
  imageUrl: string;
  weaponType: string;
  collection: string;
  wear: string;
  rarity: string;
  quality: string;
  isStattrak: boolean;
  isStar: boolean;
  itemType: string;
  itemName: string;
  itemGroup: string;
  priceLatest: number | null;
  priceMedian: number | null;
  priceAvg: number | null;
  priceMin: number | null;
  priceMax: number | null;
  sold24h: number | null;
  sold7d: number | null;
  sold30d: number | null;
  priceUpdatedAt: string | null;
  unstable: boolean | null;
  unstableReason: string | null;
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}
