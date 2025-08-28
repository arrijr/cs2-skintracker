"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import SkinSearchBar from "../components/SkinSearchBar";

export default function NavBar() {
  const router = useRouter();
  const { token } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!token) {
      setIsAdmin(false);
      setAdminCheckComplete(true);
      return;
    }

    const checkAdminStatus = async () => {
      try {
        console.log("🔍 Checking admin status...");
        console.log("🔑 Token:", token.substring(0, 20) + "...");
        
        // Use the correct backend URL
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        console.log("🌐 Backend URL:", backendUrl);
        
        const response = await fetch(`${backendUrl}/api/v1/admin/health`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log("📡 Admin check response:", response.status, response.ok);
        console.log("📋 Response headers:", Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          console.log("✅ User is admin - setting isAdmin = true");
          setIsAdmin(true);
        } else if (response.status === 500) {
          console.log("⚠️ Backend error (500) - trying fallback check...");
          
          // Fallback: Check if user has admin role in token or localStorage
          try {
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            console.log("🔍 Token data:", tokenData);
            
            // Check if user has admin role in token
            if (tokenData.role === 'admin') {
              console.log("✅ Admin role found in token - setting isAdmin = true");
              setIsAdmin(true);
            } else {
              console.log("❌ No admin role in token - setting isAdmin = false");
              setIsAdmin(false);
            }
          } catch (fallbackErr) {
            console.error("🚨 Fallback check failed:", fallbackErr);
            setIsAdmin(false);
          }
        } else {
          console.log("❌ User is not admin - setting isAdmin = false");
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("🚨 Admin check error:", err);
        setIsAdmin(false);
      } finally {
        setAdminCheckComplete(true);
        console.log("🏁 Admin check complete, isAdmin:", isAdmin);
      }
    };

    // Delay check slightly to ensure token is properly set
    const timer = setTimeout(checkAdminStatus, 500);
    return () => clearTimeout(timer);
  }, [token]);

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
