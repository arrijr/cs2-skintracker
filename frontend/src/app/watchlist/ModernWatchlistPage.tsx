"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { fetchJson, apiUrl } from "@/lib/api";
import { formatUSD } from "@/lib/num";

type WatchlistItem = {
  id: number;
  skinId: number;
  priceAlert?: number | null;
  createdAt: string;
  skin: {
    id: number;
    name: string;
    itemimage?: string;
    itemImage?: string;
    image_url?: string;
    imageUrl?: string;
    market_hash_name?: string;
    marketHashName?: string;
  };
};

export default function ModernWatchlistPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // {/* Redirect to sign-in if not authenticated */}
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  // {/* Load Watchlist */}
  async function load() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Get JWT token for authentication
      const token = await getToken({ template: "backend" });
      
      const data = await fetchJson(apiUrl("/api/v1/watchlist"), {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      setItems(Array.isArray(data) ? (data as WatchlistItem[]) : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoaded && user) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  // {/* Update Price Alert (onBlur oder Clear) */}
  async function handleUpdateAlert(skinId: number, value: string) {
    if (!user) return;
    const priceAlert = value === "" ? null : Number(value);
    setUpdatingId(skinId);
    try {
      // Get JWT token for authentication
      const token = await getToken({ template: "backend" });
      
      await fetchJson(apiUrl(`/api/v1/watchlist/${skinId}`), {
        method: "PATCH",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ priceAlert }),
      });
      setItems((prev) =>
        prev.map((it) => (it.skinId === skinId ? { ...it, priceAlert } : it))
      );
    } catch (err: any) {
      setError(err?.message || "Failed to update alert");
    } finally {
      setUpdatingId(null);
    }
  }

  // {/* Remove Skin from Watchlist */}
  async function handleRemove(skinId: number) {
    if (!user) return;
    setUpdatingId(skinId);
    try {
      // Get JWT token for authentication
      const token = await getToken({ template: "backend" });
      
      await fetchJson(apiUrl(`/api/v1/watchlist/${skinId}`), {
        method: "DELETE",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      setItems((prev) => prev.filter((it) => it.skinId !== skinId));
    } catch (err: any) {
      setError(err?.message || "Failed to remove item");
    } finally {
      setUpdatingId(null);
    }
  }

  // {/* UI */}
  // Show loading state until Clerk auth is loaded and data is loaded
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Watchlist</h1>
              <p className="text-muted-foreground">
                Track skins you're interested in
              </p>
            </div>
            <Badge variant="secondary">
              {items.length} items
            </Badge>
          </div>

          {/* Error Banner */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <div className="text-destructive text-sm">{error}</div>
              </CardContent>
            </Card>
          )}

          {/* Watchlist Items */}
          {items.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground mb-4">
                  No items in your watchlist yet
                </div>
                <Button asChild>
                  <a href="/skins">Browse Skins</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Your Watchlist</CardTitle>
                <CardDescription>
                  Manage your price alerts and remove items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Skin</TableHead>
                      <TableHead>Price Alert</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Image
                              src={
                                item.skin.imageUrl ||
                                item.skin.image_url ||
                                item.skin.itemimage ||
                                item.skin.itemImage ||
                                "/images/placeholder-skin.png"
                              }
                              alt={item.skin.name}
                              width={40}
                              height={40}
                              className="rounded"
                            />
                            <div>
                              <div className="font-medium">{item.skin.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.skin.marketHashName || item.skin.market_hash_name}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="Set alert price"
                            value={item.priceAlert ?? ""}
                            onChange={(e) => handleUpdateAlert(item.skinId, e.target.value)}
                            onBlur={(e) => handleUpdateAlert(item.skinId, e.target.value)}
                            disabled={updatingId === item.skinId}
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updatingId === item.skinId}
                              >
                                {updatingId === item.skinId ? "..." : "Remove"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove from watchlist?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove "{item.skin.name}" from your watchlist.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemove(item.skinId)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
