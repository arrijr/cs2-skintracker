"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import SkinSearchBar from "../components/SkinSearchBar";
import { isAdmin as checkIsAdmin, getCurrentUser } from "@/lib/auth";

export default function NavBar() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  // Check if user is admin using hardened auth utilities
  useEffect(() => {
    if (!isLoaded || !user) {
      setIsAdmin(false);
      setAdminCheckComplete(true);
      return;
    }

    try {
      console.log("🔍 Checking admin status using auth utilities...");
      
      // Use centralized auth function
      const adminStatus = checkIsAdmin();
      console.log("🔍 Admin status:", adminStatus);
      
      setIsAdmin(adminStatus);
      setAdminCheckComplete(true);
      
      console.log("🏁 Admin check complete, isAdmin:", adminStatus);
    } catch (err) {
      console.error("🚨 Admin check error:", err);
      setIsAdmin(false);
      setAdminCheckComplete(true);
    }
  }, [isLoaded, user]);

  return (
    <header className="bg-neutral-950 py-4 sticky top-0 shadow mb-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4">
        {/* Links und Logo (ganz links) */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-white font-extrabold text-xl tracking-tight">
            {/* Optional: <img src="/logo.svg" className="w-7 h-7" /> */}
            SKIN<span className="text-green-400">TRACKER</span>
          </Link>
          {/* Navigation */}
          <Link href="/" className="text-blue-400 hover:text-blue-300 transition">Home</Link>
          <Link href="/skins" className="text-blue-400 hover:text-blue-300 transition">Skins</Link>
          <Link href="/watchlist" className="text-blue-400 hover:text-blue-300 transition">Watchlist</Link>
          <Link href="/portfolio" className="text-blue-400 hover:text-blue-300 transition">Portfolio</Link>
        </div>

        {/* Zentrale Suchleiste */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-lg">
            <SkinSearchBar
              onSelect={(skinId) => router.push(`/skins/${skinId}`)}
            />
          </div>
        </div>

        {/* Profile-Link ganz rechts */}
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-blue-400 hover:text-blue-300 transition">Profile</Link>
          {adminCheckComplete && isAdmin && (
            <Link href="/admin" className="text-amber-400 hover:text-amber-300 transition">Admin</Link>
          )}
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <span className="text-xs text-gray-500">
              Admin: {isAdmin ? '✅' : '❌'} ({adminCheckComplete ? 'checked' : 'checking'})
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
