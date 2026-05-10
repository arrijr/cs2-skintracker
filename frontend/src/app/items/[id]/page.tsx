import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface DetailItem {
  id: number;
  category: 'sticker' | 'agent' | 'patch' | 'graffiti' | 'music_kit' | 'collectible' | 'key';
  name: string;
  marketHashName: string;
  imageUrl: string | null;
  rarity: string | null;
  collection: string | null;
  priceLatest: number | null;
  priceMedian: number | null;
  volume24h: number | null;
  priceUpdatedAt: string | null;
  metadata: Record<string, unknown> | null;
}

const CATEGORY_LABELS: Record<DetailItem['category'], string> = {
  sticker: 'Sticker',
  agent: 'Agent',
  patch: 'Patch',
  graffiti: 'Graffiti',
  music_kit: 'Music Kit',
  collectible: 'Collectible',
  key: 'Key',
};

async function fetchItem(id: string): Promise<DetailItem | null> {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  try {
    const res = await fetch(`${base}/api/v1/market-items/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as DetailItem;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const item = await fetchItem(id);
  if (!item) {
    return { title: "Item not found — skintrackr.com" };
  }
  return {
    title: `${item.name} — skintrackr.com`,
    description: `${CATEGORY_LABELS[item.category]} ${item.priceLatest != null ? `· €${item.priceLatest.toFixed(2)}` : ''}`.trim(),
  };
}

export default async function ItemDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await fetchItem(id);
  if (!item) notFound();

  const backHref = `/items?category=${item.category}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Button variant="ghost" asChild className="mb-6 text-slate-300 hover:text-white hover:bg-slate-900/50">
          <Link href={backHref} className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to {CATEGORY_LABELS[item.category]}s
          </Link>
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-slate-900/60 backdrop-blur border border-slate-700/50">
            <CardContent className="p-6">
              <div className="aspect-square bg-slate-800/40 rounded-md flex items-center justify-center overflow-hidden">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-slate-500">No image</span>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-purple-500/30 text-purple-300 bg-purple-500/10">
                {CATEGORY_LABELS[item.category]}
              </Badge>
              {item.rarity && (
                <Badge variant="outline" className="border-amber-500/30 text-amber-300 bg-amber-500/10">
                  {item.rarity}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold">{item.name}</h1>
            {item.collection && <p className="text-slate-400">From: {item.collection}</p>}

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Card className="bg-slate-900/60 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="text-slate-400 text-xs mb-1">Current price</div>
                  <div className="text-2xl font-bold text-white">
                    {item.priceLatest != null ? `€${item.priceLatest.toFixed(2)}` : '—'}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/60 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="text-slate-400 text-xs mb-1">Median price</div>
                  <div className="text-2xl font-bold text-white">
                    {item.priceMedian != null ? `€${item.priceMedian.toFixed(2)}` : '—'}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/60 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="text-slate-400 text-xs mb-1">24h volume</div>
                  <div className="text-2xl font-bold text-white">{item.volume24h ?? '—'}</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/60 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="text-slate-400 text-xs mb-1">Last updated</div>
                  <div className="text-sm font-medium text-white">
                    {item.priceUpdatedAt ? new Date(item.priceUpdatedAt).toLocaleString() : '—'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <p className="text-xs text-slate-500 pt-2">
              Market hash name: <code className="bg-slate-900/60 px-2 py-1 rounded">{item.marketHashName}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
