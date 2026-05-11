"use client";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SteamConnectSection } from "./_components/SteamConnectSection";

export default function AccountPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  if (!isLoaded) return null;
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-300">Please sign in to access account settings.</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-950 text-white py-8">
      <div className="container mx-auto px-4 max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Account</h1>

        <Card className="bg-slate-900/60 backdrop-blur border border-slate-700/50">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-slate-300">
            <p><span className="text-slate-500">Email:</span> {user.primaryEmailAddress?.emailAddress}</p>
            <p><span className="text-slate-500">Member since:</span> {user.createdAt && new Date(user.createdAt).toLocaleDateString()}</p>
          </CardContent>
        </Card>

        <SteamConnectSection />
      </div>
    </div>
  );
}
