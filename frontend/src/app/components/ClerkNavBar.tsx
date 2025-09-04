"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useAuth, SignInButton, SignOutButton, UserButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import SkinSearchBar from "../components/SkinSearchBar";

export default function ClerkNavBar() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const { isLoaded } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin based on email
  useEffect(() => {
    if (isSignedIn && user?.emailAddresses?.[0]?.emailAddress) {
      const email = user.emailAddresses[0].emailAddress;
      setIsAdmin(email === 'test@test.de' || email === 'admin@example.com');
    } else {
      setIsAdmin(false);
    }
  }, [isSignedIn, user]);

  if (!isLoaded) {
    return (
      <header className="bg-neutral-950 py-4 sticky top-0 shadow mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-white font-extrabold text-xl tracking-tight">
              SKIN<span className="text-green-400">TRACKER</span>
            </Link>
            <Link href="/" className="text-blue-400 hover:text-blue-300 transition">Home</Link>
            <Link href="/skins" className="text-blue-400 hover:text-blue-300 transition">Skins</Link>
          </div>
          <div className="text-gray-400">Loading...</div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-neutral-950 py-4 sticky top-0 shadow mb-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4">
        {/* Links und Logo (ganz links) */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-white font-extrabold text-xl tracking-tight">
            SKIN<span className="text-green-400">TRACKER</span>
          </Link>
          {/* Navigation */}
          <Link href="/" className="text-blue-400 hover:text-blue-300 transition">Home</Link>
          <Link href="/skins" className="text-blue-400 hover:text-blue-300 transition">Skins</Link>
          {isSignedIn && (
            <>
              <Link href="/watchlist" className="text-blue-400 hover:text-blue-300 transition">Watchlist</Link>
              <Link href="/portfolio" className="text-blue-400 hover:text-blue-300 transition">Portfolio</Link>
            </>
          )}
        </div>

        {/* Zentrale Suchleiste */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-lg">
            <SkinSearchBar
              onSelect={(skinId) => router.push(`/skins/${skinId}`)}
            />
          </div>
        </div>

        {/* Auth-Links ganz rechts */}
        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <>
              <Link href="/profile" className="text-blue-400 hover:text-blue-300 transition">Profile</Link>
              {isAdmin && (
                <Link href="/admin" className="text-amber-400 hover:text-amber-300 transition">Admin</Link>
              )}
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <SignInButton mode="modal">
              <button className="text-blue-400 hover:text-blue-300 transition">
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
